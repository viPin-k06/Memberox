import "dotenv/config";
import crypto from "node:crypto";

const secret = process.env.RAZORPAY_WEBHOOK_SECRET;

if (!secret) {
  throw new Error("RAZORPAY_WEBHOOK_SECRET is missing");
}

const payload = JSON.stringify({
  event: "tejtrack.test",
  payload: {},
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
  },
  body: payload,
});

console.log("HTTP Status:", response.status);
console.log("Response:", await response.json());
