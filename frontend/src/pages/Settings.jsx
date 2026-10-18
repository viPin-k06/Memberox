import React, { useEffect, useState } from "react";
import styles from "./Settings.module.css";
import { supabase } from "../lib/supabase";

const Settings = () => {
  const [organizationId, setOrganizationId] = useState(null);
  const [userId, setUserId] = useState(null);
  const [gymName, setGymName] = useState("");
  const [ownerName, setOwnerName] = useState("");
  const [mobile, setMobile] = useState("");
  const [email, setEmail] = useState("");
  const [emailReminders, setEmailReminders] = useState(false);
  const [daysBefore, setDaysBefore] = useState("3");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [savingBusiness, setSavingBusiness] = useState(false);
  const [savingNotifications, setSavingNotifications] = useState(false);

  useEffect(() => {
    let cancelled = false;

    const loadSettings = async () => {
      try {
        const { data: authData, error: authError } =
          await supabase.auth.getUser();
        if (authError) throw authError;
        const user = authData.user;
        if (!user) throw new Error("Please sign in again.");

        const [orgResult, profileResult] = await Promise.all([
          supabase
            .from("organizations")
            .select(
              "id, name, phone, email_reminders_enabled, reminder_days_before",
            )
            .eq("owner_id", user.id)
            .single(),
          supabase
            .from("profiles")
            .select("full_name, phone")
            .eq("id", user.id)
            .single(),
        ]);

        if (orgResult.error) throw orgResult.error;
        if (profileResult.error) throw profileResult.error;
        if (cancelled) return;

        setUserId(user.id);
        setOrganizationId(orgResult.data.id);
        setGymName(orgResult.data.name ?? "");
        setOwnerName(profileResult.data.full_name ?? "");
        setMobile(orgResult.data.phone ?? profileResult.data.phone ?? "");
        setEmail(user.email ?? "");
        setEmailReminders(orgResult.data.email_reminders_enabled ?? false);
        setDaysBefore(String(orgResult.data.reminder_days_before ?? 3));
      } catch (err) {
        if (!cancelled) setError(err.message || "Unable to load settings.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    loadSettings();
    return () => {
      cancelled = true;
    };
  }, []);

  const saveBusiness = async (event) => {
    event.preventDefault();
    if (!organizationId || !userId || savingBusiness) return;
    setMessage("");
    setError("");

    const businessName = gymName.trim();
    const fullName = ownerName.trim();

    if (!businessName || !fullName) {
      setError("Business name and owner name are required.");
      return;
    }

    setSavingBusiness(true);
    try {
      const { error: orgError } = await supabase
        .from("organizations")
        .update({ name: businessName })
        .eq("id", organizationId)
        .eq("owner_id", userId);
      if (orgError) throw orgError;

      const { error: profileError } = await supabase
        .from("profiles")
        .update({ full_name: fullName })
        .eq("id", userId);
      if (profileError) {
        throw new Error(
          `Business details were saved, but owner details could not be updated: ${profileError.message}`,
        );
      }

      setGymName(businessName);
      setOwnerName(fullName);
      setMessage("Business details saved successfully.");
    } catch (err) {
      setError(err.message || "Unable to save business details.");
    } finally {
      setSavingBusiness(false);
    }
  };

  const saveNotifications = async (event) => {
    event.preventDefault();
    if (!organizationId || savingNotifications) return;
    setMessage("");
    setError("");
    setSavingNotifications(true);

    try {
      const { error: updateError } = await supabase
        .from("organizations")
        .update({
          email_reminders_enabled: emailReminders,
          reminder_days_before: Number(daysBefore),
        })
        .eq("id", organizationId)
        .eq("owner_id", userId);
      if (updateError) throw updateError;
      setMessage("Email reminder preferences saved successfully.");
    } catch (err) {
      setError(err.message || "Unable to save reminder settings.");
    } finally {
      setSavingNotifications(false);
    }
  };

  return (
    <main className={styles.page}>
      <div className={styles.header}>
        <h1>Settings</h1>
        <p>Manage your gym and reminder preferences.</p>
      </div>

      {loading && <p role="status">Loading settings...</p>}
      {error && (
        <div role="alert" className={styles.success}>
          {error}
        </div>
      )}
      {message && (
        <div
          className={styles.success}
          role="status"
          onClick={() => setMessage("")}
        >
          {message}
        </div>
      )}

      {!loading && organizationId && (
        <>
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
                  inputMode="numeric"
                  maxLength={10}
                  value={mobile}
                  readOnly
                  title="Your registered mobile number cannot be changed here."
                />
              </label>
              <label>
                Email
                <input
                  type="email"
                  value={email}
                  readOnly
                  title="Your sign-in email is managed through authentication."
                />
              </label>
              <button type="submit" disabled={savingBusiness}>
                {savingBusiness ? "Saving..." : "Save Business Details"}
              </button>
            </form>
          </section>

          <section className={styles.card}>
            <div className={styles.sectionHeader}>
              <h2>Reminder Preferences</h2>
              <p>
                Choose when membership expiry reminders should be sent by email.
              </p>
            </div>

            <form
              className={styles.preferenceForm}
              onSubmit={saveNotifications}
            >
              <div className={styles.toggleRow}>
                <div>
                  <strong>Email reminders</strong>
                  <span>
                    Send expiry reminders to members with an email address.
                  </span>
                </div>
                <input
                  type="checkbox"
                  aria-label="Email reminders"
                  checked={emailReminders}
                  onChange={(event) => setEmailReminders(event.target.checked)}
                />
              </div>

              <label className={styles.selectLabel}>
                Send reminder before expiry
                <select
                  value={daysBefore}
                  onChange={(event) => setDaysBefore(event.target.value)}
                  disabled={!emailReminders}
                >
                  <option value="1">1 day before</option>
                  <option value="3">3 days before</option>
                  <option value="5">5 days before</option>
                  <option value="7">7 days before</option>
                </select>
              </label>
              <button type="submit" disabled={savingNotifications}>
                {savingNotifications ? "Saving..." : "Save Reminder Settings"}
              </button>
            </form>
          </section>
        </>
      )}
    </main>
  );
};

export default Settings;
