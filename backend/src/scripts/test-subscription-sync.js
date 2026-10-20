import "dotenv/config";

import { prepareSubscriptionSync } from "../services/razorpay-sync.service.js";

const subscriptionId = "sub_TpuLhg0D5O2HeN";

try {
  const result = await prepareSubscriptionSync(subscriptionId);

  console.log("Subscription Sync Result:");
  console.log(JSON.stringify(result, null, 2));
} catch (error) {
  console.error("Subscription sync failed:", error.message);

  process.exitCode = 1;
}
