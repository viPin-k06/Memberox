SET local check_function_bodies = off;

ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" REVOKE ALL ON SEQUENCES FROM "anon";

ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" REVOKE ALL ON SEQUENCES FROM "authenticated";

ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" REVOKE ALL ON SEQUENCES FROM "service_role";

ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" REVOKE ALL ON FUNCTIONS FROM "anon";

ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" REVOKE ALL ON FUNCTIONS FROM "authenticated";

ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" REVOKE ALL ON FUNCTIONS FROM "service_role";

ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" REVOKE ALL ON TABLES FROM "anon";

ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" REVOKE ALL ON TABLES FROM "authenticated";

ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" REVOKE ALL ON TABLES FROM "service_role";

CREATE TABLE "public"."email_reminder_logs" (
  "id"                    uuid                     NOT NULL DEFAULT gen_random_uuid(),
  "organization_id"       uuid                     NOT NULL,
  "member_id"             uuid                     NOT NULL,
  "membership_id"         uuid                     NOT NULL,
  "reminder_date"         date                     NOT NULL,
  "status"                text                     NOT NULL,
  "sent_at"               timestamp with time zone,
  "provider_message_id"   text,
  "created_at"            timestamp with time zone NOT NULL DEFAULT now(),
  "processing_mode"       text,
  "processing_started_at" timestamp with time zone,
  CONSTRAINT "email_reminder_logs_membership_id_reminder_date_key" UNIQUE (membership_id, reminder_date),
  CONSTRAINT "email_reminder_logs_pkey" PRIMARY KEY (id),
  CONSTRAINT "email_reminder_logs_processing_mode_check" CHECK ((processing_mode = ANY (ARRAY['simulate'::text, 'live'::text]))),
  CONSTRAINT "email_reminder_logs_status_check" CHECK ((status = ANY (ARRAY['processing'::text, 'simulated'::text, 'sent'::text, 'delivered'::text, 'failed'::text])))
);

ALTER TABLE "public"."email_reminder_logs"
  ENABLE ROW LEVEL SECURITY;

CREATE TABLE "public"."membership_plans" (
  "id"              uuid                     NOT NULL DEFAULT gen_random_uuid(),
  "organization_id" uuid                     NOT NULL,
  "name"            text                     NOT NULL,
  "monthly_price"   numeric(10,2)            NOT NULL,
  "is_active"       boolean                  NOT NULL DEFAULT true,
  "created_at"      timestamp with time zone NOT NULL DEFAULT now(),
  "description"     text                     NOT NULL DEFAULT ''::text,
  "duration_prices" jsonb                    NOT NULL DEFAULT '{}'::jsonb,
  CONSTRAINT "membership_plans_monthly_price_check" CHECK ((monthly_price >= (0)::numeric)),
  CONSTRAINT "membership_plans_organization_id_name_key" UNIQUE (organization_id, name),
  CONSTRAINT "membership_plans_pkey" PRIMARY KEY (id),
  CONSTRAINT "plans_id_organization_unique" UNIQUE (id, organization_id)
);

ALTER TABLE "public"."membership_plans"
  ENABLE ROW LEVEL SECURITY;

CREATE TABLE "public"."memberships" (
  "id"                   uuid                     NOT NULL DEFAULT gen_random_uuid(),
  "organization_id"      uuid                     NOT NULL,
  "member_id"            uuid                     NOT NULL,
  "plan_id"              uuid,
  "plan_name"            text                     NOT NULL,
  "duration_months"      integer                  NOT NULL,
  "fee"                  numeric(10,2)            NOT NULL,
  "start_date"           date                     NOT NULL,
  "expiry_date"          date                     NOT NULL,
  "previous_expiry_date" date,
  "renewal_start_type"   text                     NOT NULL DEFAULT 'joining'::text,
  "created_at"           timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT "memberships_duration_months_check" CHECK (((duration_months >= 1) AND (duration_months <= 12))),
  CONSTRAINT "memberships_fee_check" CHECK ((fee >= (0)::numeric)),
  CONSTRAINT "memberships_id_member_organization_unique" UNIQUE (id, member_id, organization_id),
  CONSTRAINT "memberships_pkey" PRIMARY KEY (id),
  CONSTRAINT "memberships_renewal_start_type_check" CHECK ((renewal_start_type = ANY (ARRAY['joining'::text, 'old_expiry'::text, 'payment_date'::text]))),
  CONSTRAINT "valid_membership_dates" CHECK ((expiry_date > start_date))
);

ALTER TABLE "public"."memberships"
  ENABLE ROW LEVEL SECURITY;

CREATE TABLE "public"."members" (
  "id"              uuid                     NOT NULL DEFAULT gen_random_uuid(),
  "organization_id" uuid                     NOT NULL,
  "name"            text                     NOT NULL,
  "mobile_number"   text                     NOT NULL,
  "email"           text,
  "created_at"      timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT "members_id_organization_unique" UNIQUE (id, organization_id),
  CONSTRAINT "members_organization_id_mobile_number_key" UNIQUE (organization_id, mobile_number),
  CONSTRAINT "members_pkey" PRIMARY KEY (id)
);

ALTER TABLE "public"."members"
  ENABLE ROW LEVEL SECURITY;

CREATE TABLE "public"."organization_subscriptions" (
  "id"                            uuid                     NOT NULL DEFAULT gen_random_uuid(),
  "organization_id"               uuid                     NOT NULL,
  "plan_id"                       text                     NOT NULL,
  "status"                        text                     NOT NULL DEFAULT 'pending'::text,
  "current_period_start"          timestamp with time zone,
  "current_period_end"            timestamp with time zone,
  "cancel_at_period_end"          boolean                  NOT NULL DEFAULT false,
  "razorpay_subscription_id"      text,
  "created_at"                    timestamp with time zone NOT NULL DEFAULT now(),
  "updated_at"                    timestamp with time zone NOT NULL DEFAULT now(),
  "last_razorpay_event_at"        timestamp with time zone,
  "last_razorpay_sync_at"         timestamp with time zone,
  "razorpay_sync_lock_token"      uuid,
  "razorpay_sync_lock_expires_at" timestamp with time zone,
  CONSTRAINT "organization_subscriptions_organization_id_key" UNIQUE (organization_id),
  CONSTRAINT "organization_subscriptions_pkey" PRIMARY KEY (id),
  CONSTRAINT "organization_subscriptions_razorpay_subscription_id_key" UNIQUE (razorpay_subscription_id),
  CONSTRAINT "organization_subscriptions_status_check" CHECK ((status = ANY (ARRAY['pending'::text, 'active'::text, 'past_due'::text, 'cancelled'::text, 'expired'::text]))),
  CONSTRAINT "valid_subscription_period" CHECK (((current_period_start IS NULL) OR (current_period_end IS NULL) OR (current_period_end > current_period_start)))
);

ALTER TABLE "public"."organization_subscriptions"
  ENABLE ROW LEVEL SECURITY;

CREATE TABLE "public"."organizations" (
  "id"                         uuid                     NOT NULL DEFAULT gen_random_uuid(),
  "owner_id"                   uuid                     NOT NULL,
  "name"                       text                     NOT NULL,
  "organization_type"          text                     NOT NULL,
  "phone"                      text,
  "address"                    text,
  "created_at"                 timestamp with time zone NOT NULL DEFAULT now(),
  "whatsapp_reminders_enabled" boolean                  NOT NULL DEFAULT false,
  "reminder_days_before"       integer                  NOT NULL DEFAULT 3,
  "email_reminders_enabled"    boolean                  NOT NULL DEFAULT false,
  CONSTRAINT "organizations_owner_id_key" UNIQUE (owner_id),
  CONSTRAINT "organizations_pkey" PRIMARY KEY (id),
  CONSTRAINT "organizations_reminder_days_check" CHECK ((reminder_days_before = ANY (ARRAY[1, 3, 5, 7])))
);

ALTER TABLE "public"."organizations"
  ENABLE ROW LEVEL SECURITY;

CREATE TABLE "public"."payments" (
  "id"              uuid                     NOT NULL DEFAULT gen_random_uuid(),
  "organization_id" uuid                     NOT NULL,
  "member_id"       uuid                     NOT NULL,
  "membership_id"   uuid                     NOT NULL,
  "amount"          numeric(10,2)            NOT NULL,
  "payment_date"    date                     NOT NULL,
  "payment_mode"    text                     NOT NULL,
  "payment_type"    text                     NOT NULL,
  "created_at"      timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT "payments_amount_check" CHECK ((amount > (0)::numeric)),
  CONSTRAINT "payments_payment_mode_check" CHECK ((payment_mode = ANY (ARRAY['Cash'::text, 'UPI'::text, 'Card'::text, 'Bank Transfer'::text]))),
  CONSTRAINT "payments_payment_type_check" CHECK ((payment_type = ANY (ARRAY['Joining'::text, 'Renewal'::text]))),
  CONSTRAINT "payments_pkey" PRIMARY KEY (id)
);

ALTER TABLE "public"."payments"
  ENABLE ROW LEVEL SECURITY;

CREATE TABLE "public"."profiles" (
  "id"         uuid                     NOT NULL,
  "full_name"  text,
  "phone"      text,
  "created_at" timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT "profiles_pkey" PRIMARY KEY (id)
);

ALTER TABLE "public"."profiles"
  ENABLE ROW LEVEL SECURITY;

CREATE TABLE "public"."razorpay_webhook_events" (
  "event_id"                 text                     NOT NULL,
  "event_type"               text                     NOT NULL,
  "razorpay_subscription_id" text,
  "received_at"              timestamp with time zone NOT NULL DEFAULT now(),
  "processed_at"             timestamp with time zone,
  CONSTRAINT "razorpay_webhook_events_pkey" PRIMARY KEY (event_id)
);

ALTER TABLE "public"."razorpay_webhook_events"
  ENABLE ROW LEVEL SECURITY;

CREATE TABLE "public"."subscription_payments" (
  "id"                  uuid                     NOT NULL DEFAULT gen_random_uuid(),
  "organization_id"     uuid                     NOT NULL,
  "subscription_id"     uuid                     NOT NULL,
  "amount_inr"          integer                  NOT NULL,
  "status"              text                     NOT NULL,
  "razorpay_payment_id" text,
  "paid_at"             timestamp with time zone,
  "created_at"          timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT "subscription_payments_amount_inr_check" CHECK ((amount_inr >= 0)),
  CONSTRAINT "subscription_payments_pkey" PRIMARY KEY (id),
  CONSTRAINT "subscription_payments_razorpay_payment_id_key" UNIQUE (razorpay_payment_id),
  CONSTRAINT "subscription_payments_status_check" CHECK ((status = ANY (ARRAY['created'::text, 'authorized'::text, 'captured'::text, 'failed'::text, 'refunded'::text])))
);

ALTER TABLE "public"."subscription_payments"
  ENABLE ROW LEVEL SECURITY;

CREATE TABLE "public"."subscription_plans" (
  "id"               text                     NOT NULL,
  "name"             text                     NOT NULL,
  "price_inr"        integer                  NOT NULL,
  "member_limit"     integer,
  "billing_interval" text                     NOT NULL DEFAULT 'month'::text,
  "created_at"       timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT "subscription_plans_billing_interval_check" CHECK ((billing_interval = 'month'::text)),
  CONSTRAINT "subscription_plans_member_limit_check" CHECK ((member_limit > 0)),
  CONSTRAINT "subscription_plans_pkey" PRIMARY KEY (id),
  CONSTRAINT "subscription_plans_price_inr_check" CHECK ((price_inr >= 0))
);

ALTER TABLE "public"."subscription_plans"
  ENABLE ROW LEVEL SECURITY;

CREATE TABLE "public"."whatsapp_reminder_logs" (
  "id"                  uuid                     NOT NULL DEFAULT gen_random_uuid(),
  "organization_id"     uuid                     NOT NULL,
  "member_id"           uuid                     NOT NULL,
  "membership_id"       uuid                     NOT NULL,
  "reminder_date"       date                     NOT NULL,
  "status"              text                     NOT NULL,
  "sent_at"             timestamp with time zone,
  "provider_message_id" text,
  "created_at"          timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT "whatsapp_reminder_logs_membership_id_reminder_date_key" UNIQUE (membership_id, reminder_date),
  CONSTRAINT "whatsapp_reminder_logs_pkey" PRIMARY KEY (id),
  CONSTRAINT "whatsapp_reminder_logs_status_check" CHECK ((status = ANY (ARRAY['sent'::text, 'delivered'::text, 'failed'::text])))
);

ALTER TABLE "public"."whatsapp_reminder_logs"
  ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.apply_razorpay_subscription_sync (
  p_subscription_id      text,
  p_status               text,
  p_period_start         timestamp with time zone,
  p_period_end           timestamp with time zone,
  p_cancel_at_period_end boolean,
  p_sync_started_at      timestamp with time zone
)
  RETURNS text
  LANGUAGE plpgsql
  SET search_path TO ''
  AS $function$
DECLARE
  v_subscription public.organization_subscriptions%ROWTYPE;
BEGIN
  IF p_subscription_id IS NULL
     OR btrim(p_subscription_id) = ''
     OR p_sync_started_at IS NULL
  THEN
    RAISE EXCEPTION 'Missing synchronization information';
  END IF;

  IF p_status IS NULL OR p_status NOT IN (
    'pending',
    'active',
    'past_due',
    'cancelled',
    'expired'
  ) THEN
    RAISE EXCEPTION 'Invalid subscription status';
  END IF;

  IF p_cancel_at_period_end IS NULL THEN
    RAISE EXCEPTION 'Cancellation flag is required';
  END IF;

  IF p_period_start IS NOT NULL
     AND p_period_end IS NOT NULL
     AND p_period_end <= p_period_start
  THEN
    RAISE EXCEPTION 'Invalid subscription period';
  END IF;

  SELECT *
  INTO v_subscription
  FROM public.organization_subscriptions
  WHERE razorpay_subscription_id = p_subscription_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Subscription not found';
  END IF;

  -- Prevent a lookup started earlier from
  -- overwriting a synchronization started later.
  IF v_subscription.last_razorpay_sync_at IS NOT NULL
     AND p_sync_started_at <=
         v_subscription.last_razorpay_sync_at
  THEN
    RETURN 'stale';
  END IF;

  UPDATE public.organization_subscriptions
  SET
    status = p_status,
    current_period_start = p_period_start,
    current_period_end = p_period_end,
    cancel_at_period_end = p_cancel_at_period_end,
    last_razorpay_sync_at = p_sync_started_at,
    updated_at = NOW()
  WHERE id = v_subscription.id;

  RETURN 'applied';
END;
$function$;

REVOKE ALL
  ON FUNCTION "public"."apply_razorpay_subscription_sync"(text, text, timestamp WITH time zone, timestamp WITH time zone, boolean, timestamp WITH time zone)
  FROM PUBLIC, "anon", "authenticated";

CREATE OR REPLACE FUNCTION public.handle_new_user()
  RETURNS TRIGGER
  LANGUAGE plpgsql
  SECURITY DEFINER
  SET search_path TO ''
  AS $function$
begin
  insert into public.profiles (id, full_name, phone)
  values (
    new.id,
    new.raw_user_meta_data ->> 'full_name',
    new.raw_user_meta_data ->> 'phone'
  );

  insert into public.organizations (
    owner_id,
    name,
    organization_type,
    phone
  )
  values (
    new.id,
    coalesce(
      nullif(trim(new.raw_user_meta_data ->> 'business_name'), ''),
      'My Business'
    ),
    coalesce(
      nullif(trim(new.raw_user_meta_data ->> 'organization_type'), ''),
      'other'
    ),
    new.raw_user_meta_data ->> 'phone'
  );

  return new;
end;
$function$;

REVOKE ALL ON FUNCTION "public"."handle_new_user"() FROM "anon", "authenticated", "service_role";

CREATE OR REPLACE FUNCTION public.process_razorpay_subscription_event (
  p_event_id             text,
  p_event_type           text,
  p_subscription_id      text,
  p_status               text,
  p_period_start         timestamp with time zone,
  p_period_end           timestamp with time zone,
  p_cancel_at_period_end boolean,
  p_event_at             timestamp with time zone
)
  RETURNS text
  LANGUAGE plpgsql
  SET search_path TO ''
  AS $function$
DECLARE
  v_subscription public.organization_subscriptions%ROWTYPE;
BEGIN
  -- Validate required information.
  IF p_event_id IS NULL OR btrim(p_event_id) = ''
     OR p_event_type IS NULL OR btrim(p_event_type) = ''
     OR p_subscription_id IS NULL OR btrim(p_subscription_id) = ''
     OR p_event_at IS NULL
  THEN
    RAISE EXCEPTION 'Missing required webhook information';
  END IF;

  -- Accept only supported local statuses.
  IF p_status IS NULL OR p_status NOT IN (
    'pending',
    'active',
    'past_due',
    'cancelled',
    'expired'
  ) THEN
    RAISE EXCEPTION 'Invalid subscription status';
  END IF;

  IF p_cancel_at_period_end IS NULL THEN
    RAISE EXCEPTION 'Cancellation flag is required';
  END IF;

  IF p_period_start IS NOT NULL
     AND p_period_end IS NOT NULL
     AND p_period_end <= p_period_start
  THEN
    RAISE EXCEPTION 'Invalid subscription period';
  END IF;

  -- Lock the matching subscription to prevent
  -- concurrent webhook updates from racing.
  SELECT *
  INTO v_subscription
  FROM public.organization_subscriptions
  WHERE razorpay_subscription_id = p_subscription_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Subscription not found';
  END IF;

  -- Duplicate webhook: already processed.
  IF EXISTS (
    SELECT 1
    FROM public.razorpay_webhook_events
    WHERE event_id = p_event_id
      AND processed_at IS NOT NULL
  ) THEN
    RETURN 'duplicate';
  END IF;

  -- Record the event, unless already recorded.
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

  -- Reject reuse of an event ID for different data.
  IF EXISTS (
    SELECT 1
    FROM public.razorpay_webhook_events
    WHERE event_id = p_event_id
      AND (
        event_type IS DISTINCT FROM p_event_type
        OR razorpay_subscription_id
           IS DISTINCT FROM p_subscription_id
      )
  ) THEN
    RAISE EXCEPTION 'Conflicting webhook event ID';
  END IF;

  -- Ignore events older than the latest applied event.
  IF v_subscription.last_razorpay_event_at IS NOT NULL
     AND p_event_at < v_subscription.last_razorpay_event_at
  THEN
    UPDATE public.razorpay_webhook_events
    SET processed_at = NOW()
    WHERE event_id = p_event_id;

    RETURN 'stale';
  END IF;

  -- Update the subscription.
  UPDATE public.organization_subscriptions
  SET
    status = p_status,
    current_period_start = p_period_start,
    current_period_end = p_period_end,
    cancel_at_period_end = p_cancel_at_period_end,
    last_razorpay_event_at = p_event_at,
    updated_at = NOW()
  WHERE id = v_subscription.id;

  -- Mark the event as processed.
  UPDATE public.razorpay_webhook_events
  SET processed_at = NOW()
  WHERE event_id = p_event_id;

  RETURN 'applied';
END;
$function$;

REVOKE ALL
  ON FUNCTION "public"."process_razorpay_subscription_event"(text, text, text, text, timestamp WITH time zone, timestamp WITH time zone, boolean, timestamp WITH time zone)
  FROM PUBLIC, "anon", "authenticated";

CREATE OR REPLACE FUNCTION public.process_razorpay_sync_event (
  p_event_id             text,
  p_event_type           text,
  p_subscription_id      text,
  p_status               text,
  p_period_start         timestamp with time zone,
  p_period_end           timestamp with time zone,
  p_cancel_at_period_end boolean,
  p_sync_started_at      timestamp with time zone,
  p_event_at             timestamp with time zone
)
  RETURNS text
  LANGUAGE plpgsql
  SET search_path TO ''
  AS $function$
DECLARE
  v_subscription public.organization_subscriptions%ROWTYPE;
  v_existing_event public.razorpay_webhook_events%ROWTYPE;
BEGIN
  -- Validate required identifiers and timestamps.
  IF NULLIF(btrim(p_event_id), '') IS NULL
     OR NULLIF(btrim(p_event_type), '') IS NULL
     OR NULLIF(btrim(p_subscription_id), '') IS NULL
     OR p_sync_started_at IS NULL
     OR p_event_at IS NULL
  THEN
    RAISE EXCEPTION 'Missing required synchronization data';
  END IF;

  -- Accept only supported local subscription statuses.
  IF p_status IS NULL OR p_status NOT IN (
    'pending',
    'active',
    'past_due',
    'cancelled',
    'expired'
  ) THEN
    RAISE EXCEPTION 'Invalid subscription status';
  END IF;

  -- Require complete, correctly ordered billing dates.
  IF (p_period_start IS NULL) <> (p_period_end IS NULL)
  THEN
    RAISE EXCEPTION 'Incomplete billing period';
  END IF;

  IF p_period_start IS NOT NULL
     AND p_period_end <= p_period_start
  THEN
    RAISE EXCEPTION 'Invalid billing period';
  END IF;

  -- Active subscriptions must have a billing period.
  IF p_status = 'active'
     AND p_period_start IS NULL
  THEN
    RAISE EXCEPTION 'Active subscription requires billing period';
  END IF;

  -- Serialize database updates for this subscription.
  SELECT *
  INTO v_subscription
  FROM public.organization_subscriptions
  WHERE razorpay_subscription_id = p_subscription_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Subscription not found';
  END IF;

  -- Reserve the webhook event ID.
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

  -- Prevent an event ID being reused for another event.
  IF v_existing_event.event_type IS DISTINCT FROM p_event_type
     OR v_existing_event.razorpay_subscription_id
        IS DISTINCT FROM p_subscription_id
  THEN
    RAISE EXCEPTION 'Conflicting webhook event ID';
  END IF;

  -- Already successfully handled.
  IF v_existing_event.processed_at IS NOT NULL THEN
    RETURN 'duplicate';
  END IF;

  -- Ignore a synchronization that started before
  -- or at the same time as the latest applied one.
  IF v_subscription.last_razorpay_sync_at IS NOT NULL
     AND p_sync_started_at <=
         v_subscription.last_razorpay_sync_at
  THEN
    UPDATE public.razorpay_webhook_events
    SET processed_at = NOW()
    WHERE event_id = p_event_id;

    RETURN 'stale';
  END IF;

  -- Apply the verified Razorpay subscription snapshot.
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

  -- Record successful processing in the same transaction.
  UPDATE public.razorpay_webhook_events
  SET processed_at = NOW()
  WHERE event_id = p_event_id;

  RETURN 'applied';
END;
$function$;

REVOKE ALL
  ON FUNCTION "public"."process_razorpay_sync_event"(text, text, text, text, timestamp WITH time zone, timestamp WITH time zone, boolean, timestamp WITH time zone, timestamp
    WITH time zone)
  FROM PUBLIC, "anon", "authenticated";

CREATE OR REPLACE FUNCTION public.rls_auto_enable()
  RETURNS event_trigger
  LANGUAGE plpgsql
  SECURITY DEFINER
  SET search_path TO 'pg_catalog'
  AS $function$
DECLARE
  cmd record;
  tbl name;
BEGIN
  FOR cmd IN
    SELECT *
    FROM pg_event_trigger_ddl_commands()
    WHERE command_tag IN ('CREATE TABLE', 'CREATE TABLE AS', 'SELECT INTO')
      AND object_type IN ('table','partitioned table')
  LOOP
     IF cmd.schema_name IS NOT NULL AND cmd.schema_name IN ('public') AND cmd.schema_name NOT IN ('pg_catalog','information_schema') AND cmd.schema_name NOT LIKE 'pg_toast%' AND cmd.schema_name NOT LIKE 'pg_temp%' THEN
      BEGIN
        SELECT c.relname INTO tbl FROM pg_catalog.pg_class c WHERE c.oid = cmd.objid;
        EXECUTE format('alter table if exists %I.%I enable row level security', cmd.schema_name, tbl);
        RAISE LOG 'rls_auto_enable: enabled RLS on %', cmd.object_identity;
      EXCEPTION
        WHEN OTHERS THEN
          RAISE LOG 'rls_auto_enable: failed to enable RLS on %', cmd.object_identity;
      END;
     ELSE
        RAISE LOG 'rls_auto_enable: skip % (either system schema or not in enforced list: %.)', cmd.object_identity, cmd.schema_name;
     END IF;
  END LOOP;
END;
$function$;

REVOKE ALL ON FUNCTION "public"."rls_auto_enable"() FROM "anon", "authenticated", "service_role";

ALTER TABLE "public"."email_reminder_logs"
  ADD CONSTRAINT "email_reminder_logs_member_id_fkey" FOREIGN KEY (member_id) REFERENCES public.members(id) ON DELETE CASCADE;

ALTER TABLE "public"."memberships"
  ADD CONSTRAINT "memberships_member_id_fkey" FOREIGN KEY (member_id) REFERENCES public.members(id) ON DELETE CASCADE;

ALTER TABLE "public"."memberships"
  ADD CONSTRAINT "memberships_member_organization_fk" FOREIGN KEY (member_id, organization_id) REFERENCES public.members(id, organization_id);

ALTER TABLE "public"."email_reminder_logs"
  ADD CONSTRAINT "email_reminder_logs_membership_id_fkey" FOREIGN KEY (membership_id) REFERENCES public.memberships(id) ON DELETE CASCADE;

ALTER TABLE "public"."memberships"
  ADD CONSTRAINT "memberships_plan_id_fkey" FOREIGN KEY (plan_id) REFERENCES public.membership_plans(id) ON DELETE SET NULL;

ALTER TABLE "public"."memberships"
  ADD CONSTRAINT "memberships_plan_organization_fk" FOREIGN KEY (plan_id, organization_id) REFERENCES public.membership_plans(id, organization_id);

ALTER TABLE "public"."organizations"
  ADD CONSTRAINT "organizations_owner_id_fkey" FOREIGN KEY (owner_id) REFERENCES auth.users(id) ON DELETE CASCADE;

ALTER TABLE "public"."email_reminder_logs"
  ADD CONSTRAINT "email_reminder_logs_organization_id_fkey" FOREIGN KEY (organization_id) REFERENCES public.organizations(id) ON DELETE CASCADE;

ALTER TABLE "public"."members"
  ADD CONSTRAINT "members_organization_id_fkey" FOREIGN KEY (organization_id) REFERENCES public.organizations(id) ON DELETE CASCADE;

ALTER TABLE "public"."membership_plans"
  ADD CONSTRAINT "membership_plans_organization_id_fkey" FOREIGN KEY (organization_id) REFERENCES public.organizations(id) ON DELETE CASCADE;

ALTER TABLE "public"."memberships"
  ADD CONSTRAINT "memberships_organization_id_fkey" FOREIGN KEY (organization_id) REFERENCES public.organizations(id) ON DELETE CASCADE;

ALTER TABLE "public"."organization_subscriptions"
  ADD CONSTRAINT "organization_subscriptions_organization_id_fkey" FOREIGN KEY (organization_id) REFERENCES public.organizations(id) ON DELETE CASCADE;

ALTER TABLE "public"."payments"
  ADD CONSTRAINT "payments_member_id_fkey" FOREIGN KEY (member_id) REFERENCES public.members(id) ON DELETE CASCADE;

ALTER TABLE "public"."payments"
  ADD CONSTRAINT "payments_membership_id_fkey" FOREIGN KEY (membership_id) REFERENCES public.memberships(id) ON DELETE CASCADE;

ALTER TABLE "public"."payments"
  ADD CONSTRAINT "payments_membership_member_organization_fk" FOREIGN KEY (membership_id, member_id, organization_id) REFERENCES public.memberships(id, member_id, organization_id);

ALTER TABLE "public"."payments"
  ADD CONSTRAINT "payments_organization_id_fkey" FOREIGN KEY (organization_id) REFERENCES public.organizations(id) ON DELETE CASCADE;

ALTER TABLE "public"."profiles"
  ADD CONSTRAINT "profiles_id_fkey" FOREIGN KEY (id) REFERENCES auth.users(id) ON DELETE CASCADE;

ALTER TABLE "public"."subscription_payments"
  ADD CONSTRAINT "subscription_payments_organization_id_fkey" FOREIGN KEY (organization_id) REFERENCES public.organizations(id);

ALTER TABLE "public"."subscription_payments"
  ADD CONSTRAINT "subscription_payments_subscription_id_fkey" FOREIGN KEY (subscription_id) REFERENCES public.organization_subscriptions(id);

ALTER TABLE "public"."organization_subscriptions"
  ADD CONSTRAINT "organization_subscriptions_plan_id_fkey" FOREIGN KEY (plan_id) REFERENCES public.subscription_plans(id);

ALTER TABLE "public"."whatsapp_reminder_logs"
  ADD CONSTRAINT "whatsapp_reminder_logs_member_id_fkey" FOREIGN KEY (member_id) REFERENCES public.members(id) ON DELETE CASCADE;

ALTER TABLE "public"."whatsapp_reminder_logs"
  ADD CONSTRAINT "whatsapp_reminder_logs_membership_id_fkey" FOREIGN KEY (membership_id) REFERENCES public.memberships(id) ON DELETE CASCADE;

ALTER TABLE "public"."whatsapp_reminder_logs"
  ADD CONSTRAINT "whatsapp_reminder_logs_organization_id_fkey" FOREIGN KEY (organization_id) REFERENCES public.organizations(id) ON DELETE CASCADE;

CREATE INDEX email_reminder_logs_org_idx ON public.email_reminder_logs USING btree (organization_id);

CREATE INDEX idx_subscription_payments_organization ON public.subscription_payments USING btree (organization_id);

CREATE INDEX idx_subscription_payments_subscription ON public.subscription_payments USING btree (subscription_id);

CREATE INDEX memberships_member_id_idx ON public.memberships USING btree (member_id);

CREATE INDEX memberships_organization_id_idx ON public.memberships USING btree (organization_id);

CREATE INDEX payments_member_id_idx ON public.payments USING btree (member_id);

CREATE INDEX payments_membership_id_idx ON public.payments USING btree (membership_id);

CREATE INDEX payments_organization_id_idx ON public.payments USING btree (organization_id);

CREATE INDEX whatsapp_reminder_logs_org_idx ON public.whatsapp_reminder_logs USING btree (organization_id);

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

CREATE POLICY "Owners can view email reminder logs" ON "public"."email_reminder_logs"
  FOR SELECT
  TO "authenticated"
  USING ((EXISTS ( SELECT 1
   FROM public.organizations o
  WHERE ((o.id = email_reminder_logs.organization_id) AND (o.owner_id = ( SELECT auth.uid() AS uid))))));

CREATE POLICY "Owners can add members" ON "public"."members"
  FOR INSERT
  TO "authenticated"
  WITH CHECK ((EXISTS ( SELECT 1
   FROM public.organizations
  WHERE ((organizations.id = members.organization_id) AND (organizations.owner_id = ( SELECT auth.uid() AS uid))))));

CREATE POLICY "Owners can delete their members" ON "public"."members"
  FOR DELETE
  TO "authenticated"
  USING ((EXISTS ( SELECT 1
   FROM public.organizations
  WHERE ((organizations.id = members.organization_id) AND (organizations.owner_id = ( SELECT auth.uid() AS uid))))));

CREATE POLICY "Owners can update their members" ON "public"."members"
  FOR UPDATE
  TO "authenticated"
  USING ((EXISTS ( SELECT 1
   FROM public.organizations
  WHERE ((organizations.id = members.organization_id) AND (organizations.owner_id = ( SELECT auth.uid() AS uid))))))
  WITH CHECK ((EXISTS ( SELECT 1
   FROM public.organizations
  WHERE ((organizations.id = members.organization_id) AND (organizations.owner_id = ( SELECT auth.uid() AS uid))))));

CREATE POLICY "Owners can view their members" ON "public"."members"
  FOR SELECT
  TO "authenticated"
  USING ((EXISTS ( SELECT 1
   FROM public.organizations
  WHERE ((organizations.id = members.organization_id) AND (organizations.owner_id = ( SELECT auth.uid() AS uid))))));

CREATE POLICY "Owners can add membership plans" ON "public"."membership_plans"
  FOR INSERT
  TO "authenticated"
  WITH CHECK ((EXISTS ( SELECT 1
   FROM public.organizations
  WHERE ((organizations.id = membership_plans.organization_id) AND (organizations.owner_id = ( SELECT auth.uid() AS uid))))));

CREATE POLICY "Owners can delete their membership plans" ON "public"."membership_plans"
  FOR DELETE
  TO "authenticated"
  USING ((EXISTS ( SELECT 1
   FROM public.organizations
  WHERE ((organizations.id = membership_plans.organization_id) AND (organizations.owner_id = ( SELECT auth.uid() AS uid))))));

CREATE POLICY "Owners can update their membership plans" ON "public"."membership_plans"
  FOR UPDATE
  TO "authenticated"
  USING ((EXISTS ( SELECT 1
   FROM public.organizations
  WHERE ((organizations.id = membership_plans.organization_id) AND (organizations.owner_id = ( SELECT auth.uid() AS uid))))))
  WITH CHECK ((EXISTS ( SELECT 1
   FROM public.organizations
  WHERE ((organizations.id = membership_plans.organization_id) AND (organizations.owner_id = ( SELECT auth.uid() AS uid))))));

CREATE POLICY "Owners can view their membership plans" ON "public"."membership_plans"
  FOR SELECT
  TO "authenticated"
  USING ((EXISTS ( SELECT 1
   FROM public.organizations
  WHERE ((organizations.id = membership_plans.organization_id) AND (organizations.owner_id = ( SELECT auth.uid() AS uid))))));

CREATE POLICY "Owners can add memberships" ON "public"."memberships"
  FOR INSERT
  TO "authenticated"
  WITH CHECK (((EXISTS ( SELECT 1
   FROM public.organizations
  WHERE ((organizations.id = memberships.organization_id) AND (organizations.owner_id = ( SELECT auth.uid() AS uid))))) AND (EXISTS ( SELECT 1
   FROM public.members
  WHERE ((members.id = memberships.member_id) AND (members.organization_id = memberships.organization_id)))) AND ((plan_id IS NULL) OR (EXISTS ( SELECT 1
   FROM public.membership_plans
  WHERE ((membership_plans.id = memberships.plan_id) AND (membership_plans.organization_id = memberships.organization_id)))))));

CREATE POLICY "Owners can delete their memberships" ON "public"."memberships"
  FOR DELETE
  TO "authenticated"
  USING ((EXISTS ( SELECT 1
   FROM public.organizations
  WHERE ((organizations.id = memberships.organization_id) AND (organizations.owner_id = ( SELECT auth.uid() AS uid))))));

CREATE POLICY "Owners can update their memberships" ON "public"."memberships"
  FOR UPDATE
  TO "authenticated"
  USING ((EXISTS ( SELECT 1
   FROM public.organizations
  WHERE ((organizations.id = memberships.organization_id) AND (organizations.owner_id = ( SELECT auth.uid() AS uid))))))
  WITH CHECK (((EXISTS ( SELECT 1
   FROM public.organizations
  WHERE ((organizations.id = memberships.organization_id) AND (organizations.owner_id = ( SELECT auth.uid() AS uid))))) AND (EXISTS ( SELECT 1
   FROM public.members
  WHERE ((members.id = memberships.member_id) AND (members.organization_id = memberships.organization_id)))) AND ((plan_id IS NULL) OR (EXISTS ( SELECT 1
   FROM public.membership_plans
  WHERE ((membership_plans.id = memberships.plan_id) AND (membership_plans.organization_id = memberships.organization_id)))))));

CREATE POLICY "Owners can view their memberships" ON "public"."memberships"
  FOR SELECT
  TO "authenticated"
  USING ((EXISTS ( SELECT 1
   FROM public.organizations
  WHERE ((organizations.id = memberships.organization_id) AND (organizations.owner_id = ( SELECT auth.uid() AS uid))))));

CREATE POLICY "Owners can view their subscriptions" ON "public"."organization_subscriptions"
  FOR SELECT
  TO "authenticated"
  USING ((EXISTS ( SELECT 1
   FROM public.organizations o
  WHERE ((o.id = organization_subscriptions.organization_id) AND (o.owner_id = ( SELECT auth.uid() AS uid))))));

CREATE POLICY "Owners can create their organization" ON "public"."organizations"
  FOR INSERT
  TO "authenticated"
  WITH CHECK ((owner_id = ( SELECT auth.uid() AS uid)));

CREATE POLICY "Owners can update their organization" ON "public"."organizations"
  FOR UPDATE
  TO "authenticated"
  USING ((owner_id = ( SELECT auth.uid() AS uid)))
  WITH CHECK ((owner_id = ( SELECT auth.uid() AS uid)));

CREATE POLICY "Owners can view their organization" ON "public"."organizations"
  FOR SELECT
  TO "authenticated"
  USING ((owner_id = ( SELECT auth.uid() AS uid)));

CREATE POLICY "Owners can add payments" ON "public"."payments"
  FOR INSERT
  TO "authenticated"
  WITH CHECK (((EXISTS ( SELECT 1
   FROM public.organizations
  WHERE ((organizations.id = payments.organization_id) AND (organizations.owner_id = ( SELECT auth.uid() AS uid))))) AND (EXISTS ( SELECT 1
   FROM public.memberships
  WHERE ((memberships.id = payments.membership_id) AND (memberships.member_id = payments.member_id) AND (memberships.organization_id = payments.organization_id))))));

CREATE POLICY "Owners can delete their payments" ON "public"."payments"
  FOR DELETE
  TO "authenticated"
  USING ((EXISTS ( SELECT 1
   FROM public.organizations
  WHERE ((organizations.id = payments.organization_id) AND (organizations.owner_id = ( SELECT auth.uid() AS uid))))));

CREATE POLICY "Owners can update their payments" ON "public"."payments"
  FOR UPDATE
  TO "authenticated"
  USING ((EXISTS ( SELECT 1
   FROM public.organizations
  WHERE ((organizations.id = payments.organization_id) AND (organizations.owner_id = ( SELECT auth.uid() AS uid))))))
  WITH CHECK (((EXISTS ( SELECT 1
   FROM public.organizations
  WHERE ((organizations.id = payments.organization_id) AND (organizations.owner_id = ( SELECT auth.uid() AS uid))))) AND (EXISTS ( SELECT 1
   FROM public.memberships
  WHERE ((memberships.id = payments.membership_id) AND (memberships.member_id = payments.member_id) AND (memberships.organization_id = payments.organization_id))))));

CREATE POLICY "Owners can view their payments" ON "public"."payments"
  FOR SELECT
  TO "authenticated"
  USING ((EXISTS ( SELECT 1
   FROM public.organizations
  WHERE ((organizations.id = payments.organization_id) AND (organizations.owner_id = ( SELECT auth.uid() AS uid))))));

CREATE POLICY "Owners can read their profile" ON "public"."profiles"
  FOR SELECT
  TO "authenticated"
  USING ((id = ( SELECT auth.uid() AS uid)));

CREATE POLICY "Owners can update their profile" ON "public"."profiles"
  FOR UPDATE
  TO "authenticated"
  USING ((id = ( SELECT auth.uid() AS uid)))
  WITH CHECK ((id = ( SELECT auth.uid() AS uid)));

CREATE POLICY "Users can create their profile" ON "public"."profiles"
  FOR INSERT
  TO "authenticated"
  WITH CHECK ((id = ( SELECT auth.uid() AS uid)));

CREATE POLICY "Users can update their profile" ON "public"."profiles"
  FOR UPDATE
  TO "authenticated"
  USING ((id = ( SELECT auth.uid() AS uid)))
  WITH CHECK ((id = ( SELECT auth.uid() AS uid)));

CREATE POLICY "Users can view their profile" ON "public"."profiles"
  FOR SELECT
  TO "authenticated"
  USING ((id = ( SELECT auth.uid() AS uid)));

CREATE POLICY "Owners can view subscription payments" ON "public"."subscription_payments"
  FOR SELECT
  TO "authenticated"
  USING ((EXISTS ( SELECT 1
   FROM public.organizations o
  WHERE ((o.id = subscription_payments.organization_id) AND (o.owner_id = ( SELECT auth.uid() AS uid))))));

CREATE POLICY "Anyone can view subscription plans" ON "public"."subscription_plans"
  FOR SELECT
  TO "anon", "authenticated"
  USING (true);

CREATE POLICY "Owners can view WhatsApp reminder logs" ON "public"."whatsapp_reminder_logs"
  FOR SELECT
  TO "authenticated"
  USING ((EXISTS ( SELECT 1
   FROM public.organizations o
  WHERE ((o.id = whatsapp_reminder_logs.organization_id) AND (o.owner_id = ( SELECT auth.uid() AS uid))))));

CREATE EVENT TRIGGER "ensure_rls"
  ON ddl_command_end
  WHEN TAG IN ('CREATE TABLE', 'CREATE TABLE AS', 'SELECT INTO')
  EXECUTE FUNCTION "public"."rls_auto_enable"();

REVOKE ALL
  ON FUNCTION "public"."apply_razorpay_subscription_sync"(text, text, timestamp WITH time zone, timestamp WITH time zone, boolean, timestamp WITH time zone)
  FROM "postgres";

GRANT EXECUTE
  ON FUNCTION "public"."apply_razorpay_subscription_sync"(text, text, timestamp WITH time zone, timestamp WITH time zone, boolean, timestamp WITH time zone)
  TO "postgres";

GRANT EXECUTE
  ON FUNCTION "public"."apply_razorpay_subscription_sync"(text, text, timestamp WITH time zone, timestamp WITH time zone, boolean, timestamp WITH time zone)
  TO "service_role";

GRANT EXECUTE ON FUNCTION "public"."handle_new_user"() TO PUBLIC;

REVOKE ALL ON FUNCTION "public"."handle_new_user"() FROM "postgres";

GRANT EXECUTE ON FUNCTION "public"."handle_new_user"() TO "postgres";

REVOKE ALL
  ON FUNCTION "public"."process_razorpay_subscription_event"(text, text, text, text, timestamp WITH time zone, timestamp WITH time zone, boolean, timestamp WITH time zone)
  FROM "postgres";

GRANT EXECUTE
  ON FUNCTION "public"."process_razorpay_subscription_event"(text, text, text, text, timestamp WITH time zone, timestamp WITH time zone, boolean, timestamp WITH time zone)
  TO "postgres";

GRANT EXECUTE
  ON FUNCTION "public"."process_razorpay_subscription_event"(text, text, text, text, timestamp WITH time zone, timestamp WITH time zone, boolean, timestamp WITH time zone)
  TO "service_role";

REVOKE ALL
  ON FUNCTION "public"."process_razorpay_sync_event"(text, text, text, text, timestamp WITH time zone, timestamp WITH time zone, boolean, timestamp WITH time zone, timestamp
    WITH time zone)
  FROM "postgres";

GRANT EXECUTE
  ON FUNCTION "public"."process_razorpay_sync_event"(text, text, text, text, timestamp WITH time zone, timestamp WITH time zone, boolean, timestamp WITH time zone, timestamp
    WITH time zone)
  TO "postgres";

GRANT EXECUTE
  ON FUNCTION "public"."process_razorpay_sync_event"(text, text, text, text, timestamp WITH time zone, timestamp WITH time zone, boolean, timestamp WITH time zone, timestamp
    WITH time zone)
  TO "service_role";

GRANT EXECUTE ON FUNCTION "public"."rls_auto_enable"() TO PUBLIC;

REVOKE ALL ON FUNCTION "public"."rls_auto_enable"() FROM "postgres";

GRANT EXECUTE ON FUNCTION "public"."rls_auto_enable"() TO "postgres";

REVOKE ALL ON TABLE "public"."email_reminder_logs" FROM "anon";

GRANT MAINTAIN, REFERENCES, TRIGGER, TRUNCATE ON TABLE "public"."email_reminder_logs" TO "anon";

REVOKE ALL ON TABLE "public"."email_reminder_logs" FROM "authenticated";

GRANT MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE ON TABLE "public"."email_reminder_logs" TO "authenticated";

REVOKE ALL ON TABLE "public"."email_reminder_logs" FROM "postgres";

GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE "public"."email_reminder_logs" TO "postgres";

REVOKE ALL ON TABLE "public"."email_reminder_logs" FROM "service_role";

GRANT INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE "public"."email_reminder_logs" TO "service_role";

REVOKE ALL ON TABLE "public"."members" FROM "anon";

GRANT MAINTAIN, REFERENCES, TRIGGER, TRUNCATE ON TABLE "public"."members" TO "anon";

GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE "public"."members" TO "authenticated";

REVOKE ALL ON TABLE "public"."members" FROM "postgres";

GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE "public"."members" TO "postgres";

REVOKE ALL ON TABLE "public"."members" FROM "service_role";

GRANT MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE ON TABLE "public"."members" TO "service_role";

REVOKE ALL ON TABLE "public"."membership_plans" FROM "anon";

GRANT MAINTAIN, REFERENCES, TRIGGER, TRUNCATE ON TABLE "public"."membership_plans" TO "anon";

GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE "public"."membership_plans" TO "authenticated";

REVOKE ALL ON TABLE "public"."membership_plans" FROM "postgres";

GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE "public"."membership_plans" TO "postgres";

REVOKE ALL ON TABLE "public"."membership_plans" FROM "service_role";

GRANT MAINTAIN, REFERENCES, TRIGGER, TRUNCATE ON TABLE "public"."membership_plans" TO "service_role";

REVOKE ALL ON TABLE "public"."memberships" FROM "anon";

GRANT MAINTAIN, REFERENCES, TRIGGER, TRUNCATE ON TABLE "public"."memberships" TO "anon";

GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE "public"."memberships" TO "authenticated";

REVOKE ALL ON TABLE "public"."memberships" FROM "postgres";

GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE "public"."memberships" TO "postgres";

REVOKE ALL ON TABLE "public"."memberships" FROM "service_role";

GRANT MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE ON TABLE "public"."memberships" TO "service_role";

REVOKE ALL ON TABLE "public"."organization_subscriptions" FROM "anon";

GRANT MAINTAIN, REFERENCES, TRIGGER, TRUNCATE ON TABLE "public"."organization_subscriptions" TO "anon";

REVOKE ALL ON TABLE "public"."organization_subscriptions" FROM "authenticated";

GRANT MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE ON TABLE "public"."organization_subscriptions" TO "authenticated";

REVOKE ALL ON TABLE "public"."organization_subscriptions" FROM "postgres";

GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE "public"."organization_subscriptions" TO "postgres";

REVOKE ALL ON TABLE "public"."organization_subscriptions" FROM "service_role";

GRANT INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE "public"."organization_subscriptions" TO "service_role";

REVOKE ALL ON TABLE "public"."organizations" FROM "anon";

GRANT MAINTAIN, REFERENCES, TRIGGER, TRUNCATE ON TABLE "public"."organizations" TO "anon";

REVOKE ALL ON TABLE "public"."organizations" FROM "authenticated";

GRANT MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE "public"."organizations" TO "authenticated";

REVOKE ALL ON TABLE "public"."organizations" FROM "postgres";

GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE "public"."organizations" TO "postgres";

REVOKE ALL ON TABLE "public"."organizations" FROM "service_role";

GRANT MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE ON TABLE "public"."organizations" TO "service_role";

REVOKE ALL ON TABLE "public"."payments" FROM "anon";

GRANT MAINTAIN, REFERENCES, TRIGGER, TRUNCATE ON TABLE "public"."payments" TO "anon";

GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE "public"."payments" TO "authenticated";

REVOKE ALL ON TABLE "public"."payments" FROM "postgres";

GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE "public"."payments" TO "postgres";

REVOKE ALL ON TABLE "public"."payments" FROM "service_role";

GRANT MAINTAIN, REFERENCES, TRIGGER, TRUNCATE ON TABLE "public"."payments" TO "service_role";

REVOKE ALL ON TABLE "public"."profiles" FROM "anon";

GRANT MAINTAIN, REFERENCES, TRIGGER, TRUNCATE ON TABLE "public"."profiles" TO "anon";

REVOKE ALL ON TABLE "public"."profiles" FROM "authenticated";

GRANT MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE "public"."profiles" TO "authenticated";

REVOKE ALL ON TABLE "public"."profiles" FROM "postgres";

GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE "public"."profiles" TO "postgres";

REVOKE ALL ON TABLE "public"."profiles" FROM "service_role";

GRANT MAINTAIN, REFERENCES, TRIGGER, TRUNCATE ON TABLE "public"."profiles" TO "service_role";

REVOKE ALL ON TABLE "public"."razorpay_webhook_events" FROM "anon";

GRANT MAINTAIN, REFERENCES, TRIGGER, TRUNCATE ON TABLE "public"."razorpay_webhook_events" TO "anon";

REVOKE ALL ON TABLE "public"."razorpay_webhook_events" FROM "authenticated";

GRANT MAINTAIN, REFERENCES, TRIGGER, TRUNCATE ON TABLE "public"."razorpay_webhook_events" TO "authenticated";

REVOKE ALL ON TABLE "public"."razorpay_webhook_events" FROM "postgres";

GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE "public"."razorpay_webhook_events" TO "postgres";

REVOKE ALL ON TABLE "public"."razorpay_webhook_events" FROM "service_role";

GRANT INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE "public"."razorpay_webhook_events" TO "service_role";

REVOKE ALL ON TABLE "public"."subscription_payments" FROM "anon";

GRANT MAINTAIN, REFERENCES, TRIGGER, TRUNCATE ON TABLE "public"."subscription_payments" TO "anon";

REVOKE ALL ON TABLE "public"."subscription_payments" FROM "authenticated";

GRANT MAINTAIN, REFERENCES, TRIGGER, TRUNCATE ON TABLE "public"."subscription_payments" TO "authenticated";

REVOKE ALL ON TABLE "public"."subscription_payments" FROM "postgres";

GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE "public"."subscription_payments" TO "postgres";

REVOKE ALL ON TABLE "public"."subscription_payments" FROM "service_role";

GRANT MAINTAIN, REFERENCES, TRIGGER, TRUNCATE ON TABLE "public"."subscription_payments" TO "service_role";

REVOKE ALL ON TABLE "public"."subscription_plans" FROM "anon";

GRANT MAINTAIN, REFERENCES, TRIGGER, TRUNCATE ON TABLE "public"."subscription_plans" TO "anon";

REVOKE ALL ON TABLE "public"."subscription_plans" FROM "authenticated";

GRANT MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE ON TABLE "public"."subscription_plans" TO "authenticated";

REVOKE ALL ON TABLE "public"."subscription_plans" FROM "postgres";

GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE "public"."subscription_plans" TO "postgres";

REVOKE ALL ON TABLE "public"."subscription_plans" FROM "service_role";

GRANT MAINTAIN, REFERENCES, TRIGGER, TRUNCATE ON TABLE "public"."subscription_plans" TO "service_role";

REVOKE ALL ON TABLE "public"."whatsapp_reminder_logs" FROM "anon";

GRANT MAINTAIN, REFERENCES, TRIGGER, TRUNCATE ON TABLE "public"."whatsapp_reminder_logs" TO "anon";

REVOKE ALL ON TABLE "public"."whatsapp_reminder_logs" FROM "authenticated";

GRANT MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE ON TABLE "public"."whatsapp_reminder_logs" TO "authenticated";

REVOKE ALL ON TABLE "public"."whatsapp_reminder_logs" FROM "postgres";

GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE "public"."whatsapp_reminder_logs" TO "postgres";

REVOKE ALL ON TABLE "public"."whatsapp_reminder_logs" FROM "service_role";

GRANT MAINTAIN, REFERENCES, TRIGGER, TRUNCATE ON TABLE "public"."whatsapp_reminder_logs" TO "service_role";

ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT MAINTAIN, REFERENCES, TRIGGER, TRUNCATE ON TABLES TO "anon";

ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT MAINTAIN, REFERENCES, TRIGGER, TRUNCATE ON TABLES TO "authenticated";

ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT MAINTAIN, REFERENCES, TRIGGER, TRUNCATE ON TABLES TO "service_role";