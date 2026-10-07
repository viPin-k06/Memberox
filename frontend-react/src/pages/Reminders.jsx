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
    channel: "WhatsApp",
  },
  {
    id: 2,
    member: "Priya Singh",
    mobile: "9876543211",
    expiryDate: "2026-10-18",
    status: "Pending",
    channel: "WhatsApp",
  },
  {
    id: 3,
    member: "Amit Kumar",
    mobile: "9876543212",
    expiryDate: "2026-10-05",
    status: "Sent",
    channel: "SMS",
  },
];

const formatDate = (date) =>
  new Date(`${date}T00:00:00`).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });

const Reminders = () => {
  const [reminders, setReminders] = useState(INITIAL_REMINDERS);
  const [filter, setFilter] = useState("All");

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
        reminder.id === id
          ? { ...reminder, status: "Sent" }
          : reminder,
      ),
    );
  };

  return (
    <main className={styles.page}>
      <div className={styles.header}>
        <div>
          <h1>Reminders</h1>
          <p>Keep track of membership expiry reminders.</p>
        </div>
      </div>

      <section className={styles.stats}>
        <div className={styles.statCard}>
          <Bell size={20} />
          <div>
            <span>Pending</span>
            <strong>
              {reminders.filter((item) => item.status === "Pending").length}
            </strong>
          </div>
        </div>

        <div className={styles.statCard}>
          <Check size={20} />
          <div>
            <span>Sent</span>
            <strong>
              {reminders.filter((item) => item.status === "Sent").length}
            </strong>
          </div>
        </div>
      </section>

      <div className={styles.toolbar}>
        {["All", "Pending", "Sent"].map((item) => (
          <button
            key={item}
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
                {reminder.member
                  .split(" ")
                  .map((word) => word[0])
                  .join("")}
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

              <span className={styles.channel}>{reminder.channel}</span>

              {reminder.status === "Pending" && (
                <button onClick={() => markSent(reminder.id)}>
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
