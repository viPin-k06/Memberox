import React, { useMemo, useState } from "react";
import { Bell, Check } from "lucide-react";
import styles from "./Reminders.module.css";

const INITIAL_REMINDERS = [
  {
    id: 1,
    member: "Rahul Sharma",
    mobile: "9876543210",
    expiryDate: "2026-10-12",
    status: "Pending",
  },
  {
    id: 2,
    member: "Priya Singh",
    mobile: "9876543211",
    expiryDate: "2026-10-18",
    status: "Pending",
  },
  {
    id: 3,
    member: "Amit Kumar",
    mobile: "9876543212",
    expiryDate: "2026-10-05",
    status: "Sent",
  },
];

const formatDate = (date) =>
  new Date(`${date}T00:00:00`).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });

const getInitials = (name) =>
  name
    .split(" ")
    .map((word) => word[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

const Reminders = () => {
  const [reminders, setReminders] = useState(INITIAL_REMINDERS);
  const [filter, setFilter] = useState("All");

  const pendingCount = reminders.filter((r) => r.status === "Pending").length;
  const sentCount = reminders.filter((r) => r.status === "Sent").length;

  const filtered = useMemo(
    () =>
      reminders.filter(
        (reminder) => filter === "All" || reminder.status === filter,
      ),
    [reminders, filter],
  );

  const markSent = (id) => {
    setReminders((current) =>
      current.map((reminder) =>
        reminder.id === id ? { ...reminder, status: "Sent" } : reminder,
      ),
    );
  };

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

              {reminder.status === "Pending" && (
                <button type="button" onClick={() => markSent(reminder.id)}>
                  Mark as Sent
                </button>
              )}
            </div>
          </article>
        ))}
      </div>

      {filtered.length === 0 && (
        <div className={styles.empty}>No reminders here.</div>
      )}
    </main>
  );
};

export default Reminders;
