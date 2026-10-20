import { getRazorpaySubscription } from "./razorpay-subscription.service.js";
import { supabaseAdmin } from "../config/supabase-admin.js";

function toDate(timestamp) {
  if (timestamp == null) {
    return null;
  }

  if (!Number.isSafeInteger(timestamp) || timestamp <= 0) {
    throw new Error("Invalid Razorpay timestamp");
  }

  const date = new Date(timestamp * 1000);

  if (Number.isNaN(date.getTime())) {
    throw new Error("Invalid Razorpay date");
  }

  return date.toISOString();
}

export async function prepareSubscriptionSync(subscriptionId) {
  // Capture the time before requesting Razorpay data.
  const syncStartedAt = new Date().toISOString();

  const { subscription, tejtrackStatus } =
    await getRazorpaySubscription(subscriptionId);

  const periodStart = toDate(subscription.current_start);

  const periodEnd = toDate(subscription.current_end);

  // Both dates should be present together,
  // or both should be absent.
  if ((periodStart === null) !== (periodEnd === null)) {
    throw new Error("Incomplete billing period");
  }

  if (periodStart !== null && new Date(periodEnd) <= new Date(periodStart)) {
    throw new Error("Invalid billing period");
  }

  return {
    subscriptionId: subscription.id,
    razorpayStatus: subscription.status,
    tejtrackStatus,
    periodStart,
    periodEnd,
    syncStartedAt,
  };
}

export async function processRazorpaySyncEvent(event, eventId) {
  const subscriptionId = event?.payload?.subscription?.entity?.id;

  if (
    typeof subscriptionId !== "string" ||
    !/^sub_[a-zA-Z0-9]+$/.test(subscriptionId)
  ) {
    throw new Error("Invalid subscription ID");
  }

  if (typeof eventId !== "string" || !eventId.trim()) {
    throw new Error("Missing webhook event ID");
  }

  if (!Number.isSafeInteger(event.created_at) || event.created_at <= 0) {
    throw new Error("Invalid webhook timestamp");
  }

  const supportedEvents = new Set([
    "subscription.authenticated",
    "subscription.activated",
    "subscription.charged",
    "subscription.completed",
    "subscription.updated",
    "subscription.pending",
    "subscription.halted",
    "subscription.cancelled",
    "subscription.paused",
    "subscription.resumed",
  ]);

  if (!supportedEvents.has(event.event)) {
    throw new Error("Unsupported subscription event");
  }

  // Acquire the lease BEFORE requesting data from Razorpay.
  const { data: lockToken, error: lockError } = await supabaseAdmin.rpc(
    "acquire_razorpay_sync_lock",
    {
      p_subscription_id: subscriptionId,
    },
  );

  if (lockError) {
    throw new Error(
      `Could not acquire synchronization lock: ${lockError.message}`,
    );
  }

  // Another request is currently processing this subscription.
  // Throw so the webhook endpoint returns 503 and Razorpay can retry.
  if (!lockToken) {
    throw new Error("Subscription synchronization is busy");
  }

  let processingError = null;

  try {
    const snapshot = await prepareSubscriptionSync(subscriptionId);

    const { data, error } = await supabaseAdmin.rpc(
      "process_razorpay_sync_event_locked",
      {
        p_event_id: eventId,
        p_event_type: event.event,
        p_subscription_id: snapshot.subscriptionId,
        p_status: snapshot.tejtrackStatus,
        p_period_start: snapshot.periodStart,
        p_period_end: snapshot.periodEnd,
        p_cancel_at_period_end: null,
        p_sync_started_at: snapshot.syncStartedAt,
        p_event_at: new Date(event.created_at * 1000).toISOString(),
        p_lock_token: lockToken,
      },
    );

    if (error) {
      throw new Error(`Subscription synchronization failed: ${error.message}`);
    }

    return data;
  } catch (error) {
    processingError = error;
    throw error;
  } finally {
    // Release the lease even if Razorpay or Supabase fails.
    const { data: released, error: releaseError } = await supabaseAdmin.rpc(
      "release_razorpay_sync_lock",
      {
        p_subscription_id: subscriptionId,
        p_lock_token: lockToken,
      },
    );

    if (releaseError) {
      console.error(
        "Failed to release Razorpay synchronization lock:",
        releaseError.message,
      );

      if (!processingError) {
        throw new Error("Synchronization lock release failed");
      }
    } else if (!released) {
      // The lease may have expired or been replaced.
      console.warn("Razorpay synchronization lock was no longer owned");
    }
  }
}
