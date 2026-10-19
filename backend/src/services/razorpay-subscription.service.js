import { razorpay } from "../config/razorpay.js";
import { mapRazorpaySubscriptionStatus } from "../utils/razorpay-subscription-status.js";

export async function getRazorpaySubscription(subscriptionId) {
  if (
    typeof subscriptionId !== "string" ||
    !/^sub_[a-zA-Z0-9]+$/.test(subscriptionId)
  ) {
    throw new Error("Invalid Razorpay subscription ID");
  }

  // Fetch the latest subscription information
  // directly from Razorpay.
  const subscription = await razorpay.subscriptions.fetch(subscriptionId);

  if (subscription.id !== subscriptionId) {
    throw new Error("Razorpay subscription ID mismatch");
  }

  // Convert Razorpay's status into a TejTrack status.
  const tejtrackStatus = mapRazorpaySubscriptionStatus(subscription.status);

  return {
    subscription,
    tejtrackStatus,
  };
}
