import "dotenv/config";

import { getRazorpaySubscription } from "../services/razorpay-subscription.service.js";

const subscriptionId = "sub_TpuLhg0D5O2HeN";

try {
  const { subscription, tejtrackStatus } =
    await getRazorpaySubscription(subscriptionId);

  console.log("Razorpay Subscription ID:", subscription.id);
  console.log("Razorpay Status:", subscription.status);
  console.log("TejTrack Status:", tejtrackStatus);
  console.log("Current Period Start:", subscription.current_start);
  console.log("Current Period End:", subscription.current_end);

  console.log("Charge At:", subscription.charge_at);
  console.log("Start At:", subscription.start_at);
  console.log("End At:", subscription.end_at);
  console.log("Paid Count:", subscription.paid_count);
  console.log("Remaining Count:", subscription.remaining_count);
  console.log("Cancel At Cycle End:", subscription.cancel_at_cycle_end);
  console.log("Cancelled At:", subscription.cancelled_at);
  console.log("Ended At:", subscription.ended_at);
} catch (error) {
  console.error("Subscription lookup failed:", error.message);
}
