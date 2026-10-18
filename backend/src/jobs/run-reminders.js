import "dotenv/config";
import { pathToFileURL } from "node:url";
import { supabaseAdmin } from "../config/supabase-admin.js";
import { sendReminderEmail } from "../services/reminder-email.service.js";

function getTodayInIndia() {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Kolkata",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date());
}

function addDays(dateString, days) {
  const date = new Date(`${dateString}T00:00:00Z`);
  date.setUTCDate(date.getUTCDate() + days);
  return date.toISOString().slice(0, 10);
}

export async function runReminders(date = getTodayInIndia()) {
  if (
    !/^\d{4}-\d{2}-\d{2}$/.test(date) ||
    Number.isNaN(Date.parse(`${date}T00:00:00Z`))
  ) {
    throw new Error("Invalid reminder date. Use YYYY-MM-DD.");
  }

  console.log(`Checking email reminders for ${date}`);

  const { data: organizations, error: orgError } = await supabaseAdmin
    .from("organizations")
    .select("id, name, reminder_days_before")
    .eq("email_reminders_enabled", true);

  if (orgError) throw orgError;

  let processed = 0;
  let skipped = 0;
  let failed = 0;

  for (const organization of organizations ?? []) {
    const expiryDate = addDays(date, organization.reminder_days_before);

    const { data: memberships, error: membershipError } = await supabaseAdmin
      .from("memberships")
      .select("id, member_id, expiry_date")
      .eq("organization_id", organization.id)
      .eq("expiry_date", expiryDate);

    if (membershipError) {
      console.error(
        `Membership lookup failed for ${organization.name}:`,
        membershipError.message,
      );
      failed++;
      continue;
    }

    for (const membership of memberships ?? []) {
      const { data: member, error: memberError } = await supabaseAdmin
        .from("members")
        .select("name, email")
        .eq("id", membership.member_id)
        .eq("organization_id", organization.id)
        .single();

      if (memberError || !member?.email?.trim()) {
        skipped++;
        continue;
      }

      // Claim this reminder before sending it.
      // The database unique constraint prevents duplicates.
      const { data: log, error: claimError } = await supabaseAdmin
        .from("email_reminder_logs")
        .insert({
          organization_id: organization.id,
          member_id: membership.member_id,
          membership_id: membership.id,
          reminder_date: date,
          status: "processing",
        })
        .select("id")
        .single();

      if (claimError) {
        if (claimError.code === "23505") {
          skipped++;
          continue;
        }

        console.error("Reminder claim failed:", claimError.message);
        failed++;
        continue;
      }

      try {
        const result = await sendReminderEmail({
          to: member.email.trim(),
          memberName: member.name,
          gymName: organization.name,
          expiryDate: membership.expiry_date,
        });

        const { error: updateError } = await supabaseAdmin
          .from("email_reminder_logs")
          .update({
            status: result.status,
            sent_at: result.status === "sent" ? new Date().toISOString() : null,
            provider_message_id: result.providerMessageId,
          })
          .eq("id", log.id);

        if (updateError) throw updateError;

        processed++;
        console.log(`[${result.status}] ${member.name} - ${organization.name}`);
      } catch (error) {
        failed++;
        console.error(`Reminder failed for ${member.name}:`, error.message);

        const { error: logError } = await supabaseAdmin
          .from("email_reminder_logs")
          .update({ status: "failed" })
          .eq("id", log.id);

        if (logError) {
          console.error("Failed to update log:", logError.message);
        }
      }
    }
  }

  const summary = { processed, skipped, failed };
  console.log("Reminder job completed:", summary);

  return summary;
}

// Allow manual execution from the terminal.
const isDirectRun =
  process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href;

if (isDirectRun) {
  const dateArg = process.argv.find((arg) => arg.startsWith("--date="));

  const date = dateArg?.split("=")[1];

  runReminders(date).catch((error) => {
    console.error("Reminder job failed:", error.message);
    process.exitCode = 1;
  });
}
