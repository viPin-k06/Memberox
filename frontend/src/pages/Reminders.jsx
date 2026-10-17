import React, { useCallback, useEffect, useMemo, useState } from "react";
import { Bell, Check } from "lucide-react";
import { supabase } from "../lib/supabase";
import styles from "./Reminders.module.css";

const toDateKey = (date) =>
  `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;

const shiftDate = (dateKey, days) => {
  const [year, month, day] = dateKey.split("-").map(Number);
  const date = new Date(Date.UTC(year, month - 1, day + days));
  return date.toISOString().slice(0, 10);
};

const formatDate = (dateKey) => {
  if (!dateKey) return "—";
  const [year, month, day] = dateKey.slice(0, 10).split("-").map(Number);
  return new Date(year, month - 1, day).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
};

const getInitials = (name) =>
  (name || "?")
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((word) => word[0] || "")
    .join("")
    .toUpperCase();

const Reminders = () => {
  const [reminders, setReminders] = useState([]);
  const [filter, setFilter] = useState("All");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [enabled, setEnabled] = useState(false);
  const [daysBefore, setDaysBefore] = useState(3);

  const loadReminders = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const { data: authData, error: authError } =
        await supabase.auth.getUser();
      if (authError) throw authError;
      if (!authData.user) throw new Error("Please sign in again.");

      const { data: org, error: orgError } = await supabase
        .from("organizations")
        .select("id, whatsapp_reminders_enabled, reminder_days_before")
        .eq("owner_id", authData.user.id)
        .single();
      if (orgError) throw orgError;

      const [membersResult, membershipsResult, deliveriesResult] =
        await Promise.all([
          supabase
            .from("members")
            .select("id, name, mobile_number")
            .eq("organization_id", org.id),
          supabase
            .from("memberships")
            .select("id, member_id, expiry_date, created_at")
            .eq("organization_id", org.id),
          supabase
            .from("whatsapp_reminder_logs")
            .select(
              "id, membership_id, member_id, reminder_date, sent_at, status",
            )
            .eq("organization_id", org.id)
            .in("status", ["sent", "delivered"]),
        ]);

      const queryError =
        membersResult.error ||
        membershipsResult.error ||
        deliveriesResult.error;
      if (queryError) throw queryError;

      const membersById = new Map(
        (membersResult.data || []).map((member) => [member.id, member]),
      );
      const latestByMember = new Map();
      for (const membership of membershipsResult.data || []) {
        const previous = latestByMember.get(membership.member_id);
        if (
          !previous ||
          membership.created_at > previous.created_at ||
          (membership.created_at === previous.created_at &&
            membership.id > previous.id)
        ) {
          latestByMember.set(membership.member_id, membership);
        }
      }

      const today = toDateKey(new Date());
      const leadDays = Number(org.reminder_days_before) || 3;
      const isEnabled = Boolean(org.whatsapp_reminders_enabled);
      const sentRows = deliveriesResult.data || [];
      const sentKeys = new Set(
        sentRows.map((log) => `${log.membership_id}|${log.reminder_date}`),
      );

      const pending = [];
      if (isEnabled) {
        for (const membership of latestByMember.values()) {
          const member = membersById.get(membership.member_id);
          if (
            !member ||
            !membership.expiry_date ||
            membership.expiry_date < today
          )
            continue;

          const reminderDate = shiftDate(membership.expiry_date, -leadDays);
          if (sentKeys.has(`${membership.id}|${reminderDate}`)) continue;

          pending.push({
            id: `pending-${membership.id}-${reminderDate}`,
            member: member.name,
            mobile: member.mobile_number,
            expiryDate: membership.expiry_date,
            reminderDate,
            status: "Pending",
            sentAt: null,
          });
        }
      }

      const sent = sentRows.map((log) => {
        const member = membersById.get(log.member_id);
        const membership = (membershipsResult.data || []).find(
          (row) => row.id === log.membership_id,
        );
        return {
          id: log.id,
          member: member?.name || "Deleted member",
          mobile: member?.mobile_number || "—",
          expiryDate: membership?.expiry_date || null,
          reminderDate: log.reminder_date,
          status: "Sent",
          sentAt: log.sent_at,
        };
      });

      setEnabled(isEnabled);
      setDaysBefore(leadDays);
      setReminders(
        [...pending, ...sent].sort(
          (a, b) =>
            a.reminderDate.localeCompare(b.reminderDate) ||
            a.member.localeCompare(b.member),
        ),
      );
    } catch (err) {
      setError(err.message || "Unable to load reminders.");
      setReminders([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadReminders();
  }, [loadReminders]);

  const pendingCount = reminders.filter(
    (item) => item.status === "Pending",
  ).length;
  const sentCount = reminders.filter((item) => item.status === "Sent").length;
  const today = toDateKey(new Date());

  const filtered = useMemo(
    () =>
      reminders.filter(
        (reminder) => filter === "All" || reminder.status === filter,
      ),
    [reminders, filter],
  );

  return (
    <main className={styles.page}>
      <div className={styles.header}>
        <div>
          <h1>Reminders</h1>
          <p>Keep track of membership expiry reminders sent on WhatsApp.</p>
        </div>
      </div>

      <section className={styles.stats}>
        <div className={styles.statCard}>
          <Bell size={20} />
          <div>
            <span>Pending</span>
            <strong>{pendingCount}</strong>
          </div>
        </div>
        <div className={styles.statCard}>
          <Check size={20} />
          <div>
            <span>Sent</span>
            <strong>{sentCount}</strong>
          </div>
        </div>
      </section>

      <div className={styles.toolbar}>
        {["All", "Pending", "Sent"].map((item) => (
          <button
            key={item}
            type="button"
            aria-pressed={filter === item}
            className={filter === item ? styles.activeFilter : ""}
            onClick={() => setFilter(item)}
          >
            {item}
          </button>
        ))}
      </div>

      {loading && <p role="status">Loading reminders...</p>}
      {error && (
        <p role="alert">
          {error}{" "}
          <button type="button" onClick={loadReminders}>
            Retry
          </button>
        </p>
      )}
      {!loading && !error && !enabled && (
        <p>
          WhatsApp reminders are disabled. Enable them in Settings to schedule
          reminders.
        </p>
      )}
      {!loading && !error && enabled && (
        <p>
          Reminder timing: {daysBefore} {daysBefore === 1 ? "day" : "days"}{" "}
          before expiry. Automatic WhatsApp sending is not connected yet.
        </p>
      )}

      {!loading && !error && (
        <div className={styles.list}>
          {filtered.map((reminder) => (
            <article key={reminder.id} className={styles.card}>
              <div className={styles.info}>
                <div className={styles.avatar}>
                  {getInitials(reminder.member)}
                </div>
                <div>
                  <strong>{reminder.member}</strong>
                  <span>{reminder.mobile}</span>
                  <small>Expires {formatDate(reminder.expiryDate)}</small>
                  <small>
                    {reminder.status === "Sent"
                      ? `Reminder sent ${formatDate(reminder.reminderDate)}`
                      : reminder.reminderDate <= today
                        ? `Due since ${formatDate(reminder.reminderDate)}`
                        : `Scheduled for ${formatDate(reminder.reminderDate)}`}
                  </small>
                </div>
              </div>
              <div className={styles.actions}>
                <span
                  className={
                    reminder.status === "Sent"
                      ? styles.sentBadge
                      : styles.pendingBadge
                  }
                >
                  {reminder.status}
                </span>
              </div>
            </article>
          ))}
        </div>
      )}

      {!loading && !error && filtered.length === 0 && (
        <div className={styles.empty}>No reminders here.</div>
      )}
    </main>
  );
};

export default Reminders;
