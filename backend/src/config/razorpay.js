import "dotenv/config";
import Razorpay from "razorpay";

const { RAZORPAY_KEY_ID, RAZORPAY_KEY_SECRET } = process.env;

if (!RAZORPAY_KEY_ID || !RAZORPAY_KEY_SECRET) {
  throw new Error("Razorpay API credentials are missing");
}

if (!RAZORPAY_KEY_ID.startsWith("rzp_test_")) {
  throw new Error("Expected a Razorpay test-mode key");
}

export const razorpay = new Razorpay({
  key_id: RAZORPAY_KEY_ID,
  key_secret: RAZORPAY_KEY_SECRET,
});
