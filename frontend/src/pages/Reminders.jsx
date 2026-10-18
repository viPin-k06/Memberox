import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Bell,
  CheckCheck,
  FlaskConical,
  AlertCircle,
  Clock3,
  RefreshCw,
  Sparkles,
  Mail,
  CalendarClock,
  Info,
  Settings2,
  Inbox,
} from "lucide-react";
import { supabase } from "../lib/supabase";
import styles from "./Reminders.module.css";

const FILTERS = ["All", "Pending", "Simulated", "Sent", "Failed", "Processing"];

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

const displayStatus = (status) => {
  switch (status) {
    case "sent":
    case "delivered":
      return "Sent";
    case "simulated":
      return "Simulated";
    case "failed":
      return "Failed";
    case "processing":
      return "Processing";
    default:
      return "Pending";
  }
};

const STATUS_ICONS = {
  Pending: Clock3,
  Simulated: FlaskConical,
  Sent: CheckCheck,
  Failed: AlertCircle,
  Processing: RefreshCw,
};

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
        .select("id, email_reminders_enabled, reminder_days_before")
        .eq("owner_id", authData.user.id)
        .single();
      if (orgError) throw orgError;

      const [membersResult, membershipsResult, logsResult] = await Promise.all([
        supabase
          .from("members")
          .select("id, name, email")
          .eq("organization_id", org.id),
        supabase
          .from("memberships")
          .select("id, member_id, expiry_date, created_at")
          .eq("organization_id", org.id),
        supabase
          .from("email_reminder_logs")
          .select(
            "id, membership_id, member_id, reminder_date, sent_at, status",
          )
          .eq("organization_id", org.id),
      ]);

      const queryError =
        membersResult.error || membershipsResult.error || logsResult.error;
      if (queryError) throw queryError;

      const membersById = new Map(
        (membersResult.data || []).map((member) => [member.id, member]),
      );
      const membershipsById = new Map(
        (membershipsResult.data || []).map((membership) => [
          membership.id,
          membership,
        ]),
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
      const isEnabled = Boolean(org.email_reminders_enabled);
      const logs = logsResult.data || [];

      // A claimed reminder is represented by its log, not by another pending row.
      const loggedKeys = new Set(
        logs.map((log) => `${log.membership_id}|${log.reminder_date}`),
      );
      const pending = [];
      if (isEnabled) {
        for (const membership of latestByMember.values()) {
          const member = membersById.get(membership.member_id);
          if (
            !member ||
            !member.email?.trim() ||
            !membership.expiry_date ||
            membership.expiry_date < today
          )
            continue;

          const reminderDate = shiftDate(membership.expiry_date, -leadDays);
          if (loggedKeys.has(`${membership.id}|${reminderDate}`)) continue;
          pending.push({
            id: `pending-${membership.id}-${reminderDate}`,
            member: member.name,
            email: member.email,
            expiryDate: membership.expiry_date,
            reminderDate,
            status: "Pending",
          });
        }
      }

      const history = logs.map((log) => {
        const member = membersById.get(log.member_id);
        const membership = membershipsById.get(log.membership_id);
        return {
          id: log.id,
          member: member?.name || "Deleted member",
          email: member?.email || "—",
          expiryDate: membership?.expiry_date || null,
          reminderDate: log.reminder_date,
          status: displayStatus(log.status),
          sentAt: log.sent_at,
        };
      });

      setEnabled(isEnabled);
      setDaysBefore(leadDays);
      setReminders(
        [...pending, ...history].sort(
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
    // Fetching page data when the component mounts is intentional.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    loadReminders();
  }, [loadReminders]);

  const counts = useMemo(() => {
    const result = {
      All: reminders.length,
      Pending: 0,
      Simulated: 0,
      Sent: 0,
      Failed: 0,
      Processing: 0,
    };
    for (const reminder of reminders) {
      if (Object.prototype.hasOwnProperty.call(result, reminder.status)) {
        result[reminder.status] += 1;
      }
    }
    return result;
  }, [reminders]);

  const today = toDateKey(new Date());
  const filtered = useMemo(
    () =>
      reminders.filter(
        (reminder) => filter === "All" || reminder.status === filter,
      ),
    [reminders, filter],
  );

  const statusDescription = (reminder) => {
    switch (reminder.status) {
      case "Sent":
        return `Email sent ${formatDate(reminder.reminderDate)}`;
      case "Simulated":
        return `Simulated ${formatDate(reminder.reminderDate)} — no email sent`;
      case "Failed":
        return `Sending failed for ${formatDate(reminder.reminderDate)}`;
      case "Processing":
        return `Processing reminder for ${formatDate(reminder.reminderDate)}`;
      default:
        return reminder.reminderDate <= today
          ? `Due since ${formatDate(reminder.reminderDate)}`
          : `Scheduled for ${formatDate(reminder.reminderDate)}`;
    }
  };

  return (
    <main className={styles.page}>
      <header className={styles.header}>
        <div>
          <div className={styles.eyebrow}>
            <Sparkles size={14} /> AUTOMATED COMMUNICATION
          </div>
          <h1>Reminders</h1>
          <p>Track upcoming membership expiry emails and delivery history.</p>
        </div>
        <span className={styles.headerPill}>
          <Bell size={16} /> Email reminders
        </span>
      </header>

      <section className={styles.stats} aria-label="Reminder overview">
        <article className={`${styles.statCard} ${styles.pendingStat}`}>
          <span className={styles.statIcon}>
            <Clock3 size={21} />
          </span>
          <span className={styles.statLabel}>Pending</span>
          <strong>{loading ? "—" : counts.Pending}</strong>
          <small>Awaiting scheduled processing</small>
        </article>
        <article className={`${styles.statCard} ${styles.sentStat}`}>
          <span className={styles.statIcon}>
            <CheckCheck size={21} />
          </span>
          <span className={styles.statLabel}>Sent</span>
          <strong>{loading ? "—" : counts.Sent}</strong>
          <small>Emails marked as sent</small>
        </article>
        <article className={`${styles.statCard} ${styles.simulatedStat}`}>
          <span className={styles.statIcon}>
            <FlaskConical size={21} />
          </span>
          <span className={styles.statLabel}>Simulated</span>
          <strong>{loading ? "—" : counts.Simulated}</strong>
          <small>Test runs · no email delivered</small>
        </article>
        <article className={`${styles.statCard} ${styles.failedStat}`}>
          <span className={styles.statIcon}>
            <AlertCircle size={21} />
          </span>
          <span className={styles.statLabel}>Failed</span>
          <strong>{loading ? "—" : counts.Failed}</strong>
          <small>Unsuccessful send attempts</small>
        </article>
      </section>

      {!loading && !error && (
        <div
          className={`${styles.notice} ${enabled ? styles.enabledNotice : styles.disabledNotice}`}
        >
          <div className={styles.noticeIcon}>
            {enabled ? <CalendarClock size={19} /> : <Settings2 size={19} />}
          </div>
          <div>
            <strong>
              {enabled ? "Email reminders enabled" : "Email reminders disabled"}
            </strong>
            <p>
              {enabled
                ? `Scheduled ${daysBefore} ${daysBefore === 1 ? "day" : "days"} before expiry. Only members with an email address are eligible. Simulated reminders do not send emails.`
                : "Enable email reminders in Settings to schedule new reminders. Previous reminder history remains available."}
            </p>
          </div>
        </div>
      )}

      <section
        className={styles.historyPanel}
        aria-labelledby="reminder-history-heading"
      >
        <div className={styles.panelHeading}>
          <div>
            <span className={styles.sectionEyebrow}>REMINDER ACTIVITY</span>
            <h2 id="reminder-history-heading">Reminder history</h2>
            <p>
              Review scheduled reminders and the results of past email attempts.
            </p>
          </div>
          <span className={styles.totalPill}>
            {loading ? "Loading…" : `${counts.All} records`}
          </span>
        </div>

        <div className={styles.toolbar}>
          <div
            className={styles.filters}
            aria-label="Filter reminders by status"
          >
            {FILTERS.map((item) => (
              <button
                key={item}
                type="button"
                aria-pressed={filter === item}
                className={filter === item ? styles.activeFilter : ""}
                onClick={() => setFilter(item)}
              >
                {item}
                <span className={styles.filterCount}>{counts[item]}</span>
              </button>
            ))}
          </div>
          <button
            type="button"
            className={styles.refreshBtn}
            onClick={loadReminders}
            disabled={loading}
          >
            <RefreshCw size={16} /> Refresh
          </button>
        </div>

        {loading && (
          <div className={styles.message} role="status">
            Loading reminders...
          </div>
        )}
        {error && (
          <div className={styles.errorBanner} role="alert">
            <AlertCircle size={18} />
            <span>{error}</span>
            <button type="button" onClick={loadReminders}>
              Retry
            </button>
          </div>
        )}

        {!loading && !error && (
          <>
            <div className={styles.list}>
              {filtered.map((reminder) => {
                const StatusIcon = STATUS_ICONS[reminder.status] || Info;
                const badgeClass =
                  {
                    Pending: styles.pendingBadge,
                    Sent: styles.sentBadge,
                    Simulated: styles.simulatedBadge,
                    Failed: styles.failedBadge,
                    Processing: styles.processingBadge,
                  }[reminder.status] || styles.pendingBadge;
                return (
                  <article key={reminder.id} className={styles.card}>
                    <div className={styles.info}>
                      <div className={styles.avatar}>
                        {getInitials(reminder.member)}
                      </div>
                      <div className={styles.memberDetails}>
                        <strong>{reminder.member}</strong>
                        <span className={styles.email}>
                          <Mail size={13} /> {reminder.email}
                        </span>
                      </div>
                    </div>
                    <div className={styles.dateDetails}>
                      <span className={styles.detailLabel}>
                        MEMBERSHIP EXPIRY
                      </span>
                      <strong>{formatDate(reminder.expiryDate)}</strong>
                      <small>{statusDescription(reminder)}</small>
                    </div>
                    <div className={styles.actions}>
                      <span className={`${styles.statusBadge} ${badgeClass}`}>
                        <StatusIcon size={14} /> {reminder.status}
                      </span>
                    </div>
                  </article>
                );
              })}
            </div>
            {filtered.length === 0 && (
              <div className={styles.empty}>
                <span className={styles.emptyIcon}>
                  <Inbox size={26} />
                </span>
                <h3>No reminders found</h3>
                <p>
                  {filter === "All"
                    ? "Reminder records will appear here when available."
                    : `There are no ${filter.toLowerCase()} reminders to display.`}
                </p>
              </div>
            )}
          </>
        )}
      </section>
    </main>
  );
};

export default Reminders;
