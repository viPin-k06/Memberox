import React, { useState } from "react";
import styles from "./Settings.module.css";

const Settings = () => {
  const [gymName, setGymName] = useState("Memberox Fitness");
  const [ownerName, setOwnerName] = useState("Gym Owner");
  const [mobile, setMobile] = useState("9876543210");
  const [email, setEmail] = useState("owner@example.com");

  const [whatsapp, setWhatsapp] = useState(true);
  const [sms, setSms] = useState(false);
  const [emailReminders, setEmailReminders] = useState(true);
  const [daysBefore, setDaysBefore] = useState("3");

  const [message, setMessage] = useState("");

  const saveBusiness = (event) => {
    event.preventDefault();
    setMessage("Business details saved.");
  };

  const saveNotifications = (event) => {
    event.preventDefault();
    setMessage("Reminder settings saved.");
  };

  return (
    <main className={styles.page}>
      <div className={styles.header}>
        <h1>Settings</h1>
        <p>Manage your gym and reminder preferences.</p>
      </div>

      {message && (
        <div className={styles.success} onClick={() => setMessage("")}>
          {message}
        </div>
      )}

      <section className={styles.card}>
        <div className={styles.sectionHeader}>
          <h2>Business Details</h2>
          <p>Information used across your Memberox account.</p>
        </div>

        <form className={styles.form} onSubmit={saveBusiness}>
          <label>
            Gym / Business Name
            <input
              value={gymName}
              onChange={(event) => setGymName(event.target.value)}
              required
            />
          </label>

          <label>
            Owner Name
            <input
              value={ownerName}
              onChange={(event) => setOwnerName(event.target.value)}
              required
            />
          </label>

          <label>
            Mobile Number
            <input
              type="tel"
              value={mobile}
              onChange={(event) => setMobile(event.target.value)}
              required
            />
          </label>

          <label>
            Email
            <input
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
            />
          </label>

          <button type="submit">Save Business Details</button>
        </form>
      </section>

      <section className={styles.card}>
        <div className={styles.sectionHeader}>
          <h2>Reminder Preferences</h2>
          <p>Choose how expiry reminders should be delivered.</p>
        </div>

        <form className={styles.preferenceForm} onSubmit={saveNotifications}>
          <div className={styles.toggleRow}>
            <div>
              <strong>WhatsApp reminders</strong>
              <span>Send expiry reminders through WhatsApp.</span>
            </div>

            <input
              type="checkbox"
              checked={whatsapp}
              onChange={(event) => setWhatsapp(event.target.checked)}
            />
          </div>

          <div className={styles.toggleRow}>
            <div>
              <strong>SMS reminders</strong>
              <span>Send expiry reminders through SMS.</span>
            </div>

            <input
              type="checkbox"
              checked={sms}
              onChange={(event) => setSms(event.target.checked)}
            />
          </div>

          <div className={styles.toggleRow}>
            <div>
              <strong>Email reminders</strong>
              <span>Send expiry reminders through email.</span>
            </div>

            <input
              type="checkbox"
              checked={emailReminders}
              onChange={(event) => setEmailReminders(event.target.checked)}
            />
          </div>

          <label className={styles.selectLabel}>
            Send reminder before expiry
            <select
              value={daysBefore}
              onChange={(event) => setDaysBefore(event.target.value)}
            >
              <option value="1">1 day before</option>
              <option value="3">3 days before</option>
              <option value="5">5 days before</option>
              <option value="7">7 days before</option>
            </select>
          </label>

          <button type="submit">Save Reminder Settings</button>
        </form>
      </section>
    </main>
  );
};

export default Settings;
