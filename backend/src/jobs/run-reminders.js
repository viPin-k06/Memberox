import "dotenv/config";
import { pathToFileURL } from "node:url";
import { supabaseAdmin } from "../config/supabase-admin.js";
import { sendReminderEmail } from "../services/reminder-email.service.js";

const EMAIL_MODE = process.env.EMAIL_MODE || "simulate";
const STALE_AFTER_MINUTES = 15;

function getTodayInIndia() {
  const parts = new Intl.DateTimeFormat("en-GB", {
    timeZone: "Asia/Kolkata",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(new Date());

  const values = Object.fromEntries(
    parts.map(({ type, value }) => [type, value]),
  );

  return `${values.year}-${values.month}-${values.day}`;
}

function isValidDate(date) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) return false;

  const parsed = new Date(`${date}T00:00:00Z`);

  return (
    !Number.isNaN(parsed.getTime()) &&
    parsed.toISOString().slice(0, 10) === date
  );
}

function addDays(dateString, days) {
  const date = new Date(`${dateString}T00:00:00Z`);
  date.setUTCDate(date.getUTCDate() + days);
  return date.toISOString().slice(0, 10);
}

async function claimReminder(organization, membership, date) {
  const startedAt = new Date().toISOString();

  const { data, error } = await supabaseAdmin
    .from("email_reminder_logs")
    .insert({
      organization_id: organization.id,
      member_id: membership.member_id,
      membership_id: membership.id,
      reminder_date: date,
      status: "processing",
      processing_mode: EMAIL_MODE,
      processing_started_at: startedAt,
    })
    .select("id")
    .single();

  if (!error) return data;

  if (error.code !== "23505") {
    throw error;
  }

  // Only simulations can be automatically recovered.
  if (EMAIL_MODE !== "simulate") {
    return null;
  }

  const { data: existing, error: lookupError } = await supabaseAdmin
    .from("email_reminder_logs")
    .select("id, status, processing_mode, processing_started_at")
    .eq("membership_id", membership.id)
    .eq("reminder_date", date)
    .maybeSingle();

  if (lookupError) throw lookupError;
  if (!existing) return null;

  // Never automatically retry live or legacy unknown attempts.
  if (existing.processing_mode !== "simulate") {
    return null;
  }

  const isFailed = existing.status === "failed";

  const startedTime = existing.processing_started_at
    ? Date.parse(existing.processing_started_at)
    : NaN;

  const isStale =
    existing.status === "processing" &&
    Number.isFinite(startedTime) &&
    Date.now() - startedTime > STALE_AFTER_MINUTES * 60 * 1000;

  if (!isFailed && !isStale) {
    return null;
  }

  // Atomically claim this exact previous attempt.
  let retryQuery = supabaseAdmin
    .from("email_reminder_logs")
    .update({
      status: "processing",
      processing_started_at: startedAt,
      sent_at: null,
      provider_message_id: null,
    })
    .eq("id", existing.id)
    .eq("processing_mode", "simulate")
    .eq("status", existing.status);

  if (existing.processing_started_at === null) {
    retryQuery = retryQuery.is("processing_started_at", null);
  } else {
    retryQuery = retryQuery.eq(
      "processing_started_at",
      existing.processing_started_at,
    );
  }

  const { data: claimed, error: retryError } = await retryQuery
    .select("id")
    .maybeSingle();

  if (retryError) throw retryError;

  if (claimed) {
    console.log(`Recovered simulated reminder: ${membership.id}`);
  }

  return claimed;
}

async function processMembership(organization, membership, date) {
  // Only remind members about their latest membership.
  const { data: latest, error: latestError } = await supabaseAdmin
    .from("memberships")
    .select("id")
    .eq("organization_id", organization.id)
    .eq("member_id", membership.member_id)
    .order("created_at", { ascending: false })
    .order("id", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (latestError) throw latestError;

  if (!latest || latest.id !== membership.id) {
    return "skipped";
  }

  const { data: member, error: memberError } = await supabaseAdmin
    .from("members")
    .select("name, email")
    .eq("id", membership.member_id)
    .eq("organization_id", organization.id)
    .maybeSingle();

  if (memberError) throw memberError;
  if (!member?.email?.trim()) return "skipped";

  const log = await claimReminder(organization, membership, date);

  if (!log) return "skipped";

  let result;

  try {
    result = await sendReminderEmail({
      to: member.email.trim(),
      memberName: member.name,
      gymName: organization.name,
      expiryDate: membership.expiry_date,
      idempotencyKey: `membership-expiry/${membership.id}/${date}`,
    });
  } catch (error) {
    if (EMAIL_MODE === "simulate") {
      const { error: logError } = await supabaseAdmin
        .from("email_reminder_logs")
        .update({ status: "failed" })
        .eq("id", log.id)
        .eq("status", "processing")
        .eq("processing_mode", "simulate");

      if (logError) {
        console.error("Failed to update reminder log:", logError.message);
      }
    }

    // Live delivery may be uncertain. Leave it for review.
    throw error;
  }

  const { data: updated, error: updateError } = await supabaseAdmin
    .from("email_reminder_logs")
    .update({
      status: result.status,
      sent_at:
        result.status === "sent" || result.status === "delivered"
          ? new Date().toISOString()
          : null,
      provider_message_id: result.providerMessageId ?? null,
    })
    .eq("id", log.id)
    .eq("status", "processing")
    .select("id")
    .maybeSingle();

  if (updateError) throw updateError;

  if (!updated) {
    throw new Error("Reminder log was modified during processing");
  }

  console.log(`[${result.status}] ${member.name} - ${organization.name}`);

  return "processed";
}

export async function runReminders(date = getTodayInIndia()) {
  if (!isValidDate(date)) {
    throw new Error("Invalid reminder date. Use YYYY-MM-DD.");
  }

  if (!["simulate", "live"].includes(EMAIL_MODE)) {
    throw new Error(`Invalid EMAIL_MODE: ${EMAIL_MODE}`);
  }

  console.log(`Checking email reminders for ${date}`);

  const { data: organizations, error: orgError } = await supabaseAdmin
    .from("organizations")
    .select("id, name, reminder_days_before")
    .eq("email_reminders_enabled", true);

  if (orgError) throw orgError;

  const summary = {
    processed: 0,
    skipped: 0,
    failed: 0,
  };

  for (const organization of organizations ?? []) {
    try {
      const leadDays = Number(organization.reminder_days_before);

      if (!Number.isInteger(leadDays) || leadDays < 1) {
        throw new Error("Invalid reminder_days_before setting");
      }

      const expiryDate = addDays(date, leadDays);

      const { data: memberships, error: membershipError } = await supabaseAdmin
        .from("memberships")
        .select("id, member_id, expiry_date")
        .eq("organization_id", organization.id)
        .eq("expiry_date", expiryDate);

      if (membershipError) throw membershipError;

      for (const membership of memberships ?? []) {
        try {
          const outcome = await processMembership(
            organization,
            membership,
            date,
          );

          summary[outcome]++;
        } catch (error) {
          summary.failed++;

          console.error(
            `Reminder failed for membership ${membership.id}:`,
            error.message,
          );
        }
      }
    } catch (error) {
      summary.failed++;

      console.error(
        `Reminder lookup failed for ${organization.name}:`,
        error.message,
      );
    }
  }

  console.log("Reminder job completed:", summary);
  return summary;
}

const isDirectRun =
  process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href;

if (isDirectRun) {
  const dateArg = process.argv.find((arg) => arg.startsWith("--date="));

  const date = dateArg?.slice("--date=".length);

  runReminders(date).catch((error) => {
    console.error("Reminder job failed:", error.message);
    process.exitCode = 1;
  });
}
