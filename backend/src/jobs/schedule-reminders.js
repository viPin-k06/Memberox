import cron from "node-cron";
import { runReminders } from "./run-reminders.js";

let isRunning = false;

export function startReminderSchedule() {
  cron.schedule(
    "0 9 * * *",
    async () => {
      if (isRunning) {
        console.log("Reminder job already running. Skipping.");
        return;
      }

      isRunning = true;

      try {
        console.log("Starting scheduled email reminders...");
        await runReminders();
      } catch (error) {
        console.error("Scheduled reminder job failed:", error);
      } finally {
        isRunning = false;
      }
    },
    {
      timezone: "Asia/Kolkata",
      noOverlap: true,
    },
  );

  console.log("Email reminder scheduler started (9:00 AM IST).");
}
