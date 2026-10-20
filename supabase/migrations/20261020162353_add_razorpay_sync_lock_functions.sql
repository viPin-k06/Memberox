CREATE OR REPLACE FUNCTION public.acquire_razorpay_sync_lock(
  p_subscription_id text
)
RETURNS uuid
LANGUAGE plpgsql
SET search_path TO ''
AS $function$
DECLARE
  v_token uuid := gen_random_uuid();
  v_acquired_token uuid;
BEGIN
  IF NULLIF(btrim(p_subscription_id), '') IS NULL THEN
    RAISE EXCEPTION 'Missing subscription ID';
  END IF;

  UPDATE public.organization_subscriptions
  SET
    razorpay_sync_lock_token = v_token,
    razorpay_sync_lock_expires_at =
      NOW() + INTERVAL '2 minutes'
  WHERE razorpay_subscription_id = p_subscription_id
    AND (
      razorpay_sync_lock_token IS NULL
      OR razorpay_sync_lock_expires_at IS NULL
      OR razorpay_sync_lock_expires_at <= NOW()
    )
  RETURNING razorpay_sync_lock_token
  INTO v_acquired_token;

  RETURN v_acquired_token;
END;
$function$;

REVOKE ALL ON FUNCTION
  public.acquire_razorpay_sync_lock(text)
FROM PUBLIC, anon, authenticated;

GRANT EXECUTE ON FUNCTION
  public.acquire_razorpay_sync_lock(text)
TO service_role;

CREATE OR REPLACE FUNCTION public.release_razorpay_sync_lock(
  p_subscription_id text,
  p_lock_token uuid
)
RETURNS boolean
LANGUAGE plpgsql
SET search_path TO ''
AS $function$
BEGIN
  IF NULLIF(btrim(p_subscription_id), '') IS NULL
     OR p_lock_token IS NULL
  THEN
    RAISE EXCEPTION 'Missing lock release data';
  END IF;

  UPDATE public.organization_subscriptions
  SET
    razorpay_sync_lock_token = NULL,
    razorpay_sync_lock_expires_at = NULL
  WHERE razorpay_subscription_id = p_subscription_id
    AND razorpay_sync_lock_token = p_lock_token;

  RETURN FOUND;
END;
$function$;

REVOKE ALL ON FUNCTION
  public.release_razorpay_sync_lock(text, uuid)
FROM PUBLIC, anon, authenticated;

GRANT EXECUTE ON FUNCTION
  public.release_razorpay_sync_lock(text, uuid)
TO service_role;

CREATE OR REPLACE FUNCTION public.process_razorpay_sync_event_locked(
  p_event_id text,
  p_event_type text,
  p_subscription_id text,
  p_status text,
  p_period_start timestamptz,
  p_period_end timestamptz,
  p_cancel_at_period_end boolean,
  p_sync_started_at timestamptz,
  p_event_at timestamptz,
  p_lock_token uuid
)
RETURNS text
LANGUAGE plpgsql
SET search_path TO ''
AS $function$
DECLARE
  v_subscription public.organization_subscriptions%ROWTYPE;
  v_existing_event public.razorpay_webhook_events%ROWTYPE;
BEGIN
  IF NULLIF(btrim(p_event_id), '') IS NULL
     OR NULLIF(btrim(p_event_type), '') IS NULL
     OR NULLIF(btrim(p_subscription_id), '') IS NULL
     OR p_sync_started_at IS NULL
     OR p_event_at IS NULL
     OR p_lock_token IS NULL
  THEN
    RAISE EXCEPTION 'Missing required synchronization data';
  END IF;

  IF p_status IS NULL OR p_status NOT IN (
    'pending', 'active', 'past_due', 'cancelled', 'expired'
  ) THEN
    RAISE EXCEPTION 'Invalid subscription status';
  END IF;

  IF (p_period_start IS NULL) <> (p_period_end IS NULL)
  THEN
    RAISE EXCEPTION 'Incomplete billing period';
  END IF;

  IF p_period_start IS NOT NULL
     AND p_period_end <= p_period_start
  THEN
    RAISE EXCEPTION 'Invalid billing period';
  END IF;

  IF p_status = 'active' AND p_period_start IS NULL
  THEN
    RAISE EXCEPTION 'Active subscription requires billing period';
  END IF;

  SELECT *
  INTO v_subscription
  FROM public.organization_subscriptions
  WHERE razorpay_subscription_id = p_subscription_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Subscription not found';
  END IF;

  -- Fencing check: only the current, unexpired
  -- lease holder may apply subscription updates.
  IF v_subscription.razorpay_sync_lock_token
       IS DISTINCT FROM p_lock_token
     OR v_subscription.razorpay_sync_lock_expires_at
       IS NULL
     OR v_subscription.razorpay_sync_lock_expires_at
       <= clock_timestamp()
  THEN
    RAISE EXCEPTION 'Synchronization lease invalid or expired';
  END IF;

  INSERT INTO public.razorpay_webhook_events (
    event_id,
    event_type,
    razorpay_subscription_id
  )
  VALUES (
    p_event_id,
    p_event_type,
    p_subscription_id
  )
  ON CONFLICT (event_id) DO NOTHING;

  SELECT *
  INTO v_existing_event
  FROM public.razorpay_webhook_events
  WHERE event_id = p_event_id
  FOR UPDATE;

  IF v_existing_event.event_type IS DISTINCT FROM p_event_type
     OR v_existing_event.razorpay_subscription_id
       IS DISTINCT FROM p_subscription_id
  THEN
    RAISE EXCEPTION 'Conflicting webhook event ID';
  END IF;

  IF v_existing_event.processed_at IS NOT NULL THEN
    RETURN 'duplicate';
  END IF;

  IF v_subscription.last_razorpay_sync_at IS NOT NULL
     AND p_sync_started_at <=
       v_subscription.last_razorpay_sync_at
  THEN
    UPDATE public.razorpay_webhook_events
    SET processed_at = NOW()
    WHERE event_id = p_event_id;

    RETURN 'stale';
  END IF;

  UPDATE public.organization_subscriptions
  SET
    status = p_status,
    current_period_start = p_period_start,
    current_period_end = p_period_end,
    cancel_at_period_end = COALESCE(
      p_cancel_at_period_end,
      cancel_at_period_end
    ),
    last_razorpay_sync_at = p_sync_started_at,
    last_razorpay_event_at = p_event_at,
    updated_at = NOW()
  WHERE id = v_subscription.id;

  UPDATE public.razorpay_webhook_events
  SET processed_at = NOW()
  WHERE event_id = p_event_id;

  RETURN 'applied';
END;
$function$;

REVOKE ALL ON FUNCTION
  public.process_razorpay_sync_event_locked(
    text, text, text, text,
    timestamptz, timestamptz,
    boolean, timestamptz, timestamptz, uuid
  )
FROM PUBLIC, anon, authenticated;

GRANT EXECUTE ON FUNCTION
  public.process_razorpay_sync_event_locked(
    text, text, text, text,
    timestamptz, timestamptz,
    boolean, timestamptz, timestamptz, uuid
  )
TO service_role;
