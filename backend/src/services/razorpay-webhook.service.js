import { supabaseAdmin } from "../config/supabase-admin.js";
import { getRazorpaySubscription } from "./razorpay-subscription.service.js";

export async function processSubscriptionActivated(event, eventId) {
  const subscriptionId = event.payload?.subscription?.entity?.id;

  if (
    typeof subscriptionId !== "string" ||
    !subscriptionId.startsWith("sub_")
  ) {
    throw new Error("Missing Razorpay subscription ID");
  }

  if (!Number.isSafeInteger(event.created_at) || event.created_at <= 0) {
    throw new Error("Invalid webhook event timestamp");
  }

  if (typeof eventId !== "string" || !eventId.trim()) {
    throw new Error("Missing Razorpay event ID");
  }

  // Fetch the current subscription directly from Razorpay.
  const { subscription, tejtrackStatus } =
    await getRazorpaySubscription(subscriptionId);

  // Activation requires Razorpay to confirm active status.
  if (tejtrackStatus !== "active") {
    throw new Error(
      `Cannot activate subscription with status: ${subscription.status}`,
    );
  }

  const periodStart = subscription.current_start;
  const periodEnd = subscription.current_end;

  if (
    !Number.isSafeInteger(periodStart) ||
    !Number.isSafeInteger(periodEnd) ||
    periodStart <= 0 ||
    periodEnd <= periodStart
  ) {
    throw new Error("Invalid Razorpay billing period");
  }

  const { data, error } = await supabaseAdmin.rpc(
    "process_razorpay_subscription_event",
    {
      p_event_id: eventId,
      p_event_type: "subscription.activated",
      p_subscription_id: subscriptionId,
      p_status: "active",
      p_period_start: new Date(periodStart * 1000).toISOString(),
      p_period_end: new Date(periodEnd * 1000).toISOString(),
      p_cancel_at_period_end: false,
      p_event_at: new Date(event.created_at * 1000).toISOString(),
    },
  );

  if (error) {
    throw new Error(`Subscription database update failed: ${error.message}`);
  }

  return data;
}
