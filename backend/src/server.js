import express from "express";

import razorpayWebhookRoutes from "./routes/razorpay-webhook.routes.js";

import "dotenv/config";

import cors from "cors";

import { supabase } from "./config/supabase.js";
import { sendTestEmail } from "./services/email.service.js";
import { startReminderSchedule } from "./jobs/schedule-reminders.js";

// Razorpay subscription routes
import subscriptionRoutes from "./routes/subscription.routes.js";

const app = express();
const PORT = process.env.PORT || 4000;

// Middleware

app.use(
  cors({
    origin: "http://localhost:5173",
  }),
);

// Razorpay webhooks need the original raw request body.
// This route MUST be registered before express.json().
app.use(
  "/api/webhooks/razorpay",
  express.raw({ type: "application/json" }),
  razorpayWebhookRoutes,
);

// Parse JSON for all other API routes.
app.use(express.json());

// Health check
app.get("/", (req, res) => {
  res.send("TejTrack API is running!");
});

// Supabase connection test
app.get("/api/test-supabase", async (req, res) => {
  const { error } = await supabase.auth.getSession();

  if (error) {
    return res.status(500).json({
      message: "Supabase request failed",
      error: error.message,
    });
  }

  res.json({
    message: "Supabase client is configured",
  });
});

// Razorpay subscription API
app.use("/api/subscriptions", subscriptionRoutes);

// Development-only email test
if (process.env.NODE_ENV !== "production") {
  app.post("/api/test-email", async (req, res) => {
    try {
      const email = process.env.TEST_EMAIL;

      if (!email) {
        return res.status(400).json({
          error: "TEST_EMAIL is not configured",
        });
      }

      const result = await sendTestEmail(email);

      res.json({
        success: true,
        message: "Email accepted by Resend",
        id: result?.id,
      });
    } catch (error) {
      console.error("Email test failed:", error.message);

      res.status(500).json({
        success: false,
        error: "Failed to send test email",
      });
    }
  });
}

// Start server
app.listen(PORT, () => {
  console.log(`TejTrack backend running on http://localhost:${PORT}`);

  startReminderSchedule();
});
