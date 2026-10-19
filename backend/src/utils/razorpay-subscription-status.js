export function mapRazorpaySubscriptionStatus(status) {
  switch (status) {
    case "created":
    case "authenticated":
      return "pending";

    case "active":
      return "active";

    case "pending":
    case "halted":
      return "past_due";

    case "cancelled":
      return "cancelled";

    case "completed":
    case "expired":
      return "expired";

    default:
      throw new Error(`Unsupported Razorpay subscription status: ${status}`);
  }
}
