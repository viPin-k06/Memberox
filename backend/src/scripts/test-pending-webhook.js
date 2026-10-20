import "dotenv/config";
import crypto from "node:crypto";

const secret = process.env.RAZORPAY_WEBHOOK_SECRET;

if (!secret) {
  throw new Error("Webhook secret is missing");
}

const payload = JSON.stringify({
  event: "subscription.pending",
  created_at: Math.floor(Date.now() / 1000),
  payload: {
    subscription: {
      entity: {
        id: "sub_TpuLhg0D5O2HeN",
      },
    },
  },
});

const signature = crypto
  .createHmac("sha256", secret)
  .update(payload)
  .digest("hex");

const response = await fetch("http://localhost:4000/api/webhooks/razorpay", {
  method: "POST",
  headers: {
    "Content-Type": "application/json",
    "X-Razorpay-Signature": signature,
    "X-Razorpay-Event-Id": "evt_tejtrack_local_pending_test_001",
  },
  body: payload,
});

console.log("HTTP Status:", response.status);
console.log("Response:", await response.json());
