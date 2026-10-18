import express from "express";
import "dotenv/config";
import { supabase } from "./config/supabase.js";
import { sendTestEmail } from "./services/email.service.js";
import { startReminderSchedule } from "./jobs/schedule-reminders.js";

const app = express();
const PORT = process.env.PORT || 4000;

app.use(express.json());

app.get("/", (req, res) => {
  res.send("Memberox API is running!");
});

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

app.listen(PORT, () => {
  console.log(`Memberox backend running on http://localhost:${PORT}`);

  startReminderSchedule();
});
