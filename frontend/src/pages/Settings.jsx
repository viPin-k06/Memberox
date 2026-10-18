import { useEffect, useState } from "react";
import {
  Sparkles,
  Settings2,
  Building2,
  UserRound,
  Phone,
  Mail,
  BellRing,
  CalendarClock,
  Save,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  Info,
  LockKeyhole,
} from "lucide-react";
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
    if (!organizationId || !userId || savingNotifications) return;
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
      <header className={styles.header}>
        <div>
          <div className={styles.eyebrow}>
            <Sparkles size={14} /> ACCOUNT PREFERENCES
          </div>
          <h1>Settings</h1>
          <p>
            Manage your business information and membership reminder
            preferences.
          </p>
        </div>
        <span className={styles.headerPill}>
          <Settings2 size={16} /> Workspace settings
        </span>
      </header>

      {error && (
        <div role="alert" className={styles.errorBanner}>
          <AlertCircle size={19} /> <span>{error}</span>
          <button
            type="button"
            onClick={() => setError("")}
            aria-label="Dismiss error"
          >
            ×
          </button>
        </div>
      )}
      {message && (
        <div role="status" className={styles.successBanner}>
          <CheckCircle2 size={19} /> <span>{message}</span>
          <button
            type="button"
            onClick={() => setMessage("")}
            aria-label="Dismiss message"
          >
            ×
          </button>
        </div>
      )}

      {loading ? (
        <div className={styles.loading} role="status">
          Loading your settings...
        </div>
      ) : organizationId ? (
        <div className={styles.sections}>
          <section className={styles.card}>
            <div className={styles.sectionHeader}>
              <div className={`${styles.sectionIcon} ${styles.businessIcon}`}>
                <Building2 size={22} />
              </div>
              <div>
                <span className={styles.sectionEyebrow}>YOUR WORKSPACE</span>
                <h2>Business details</h2>
                <p>
                  Keep your business and account owner information up to date.
                </p>
              </div>
            </div>

            <form className={styles.form} onSubmit={saveBusiness}>
              <label className={styles.field}>
                <span>
                  <Building2 size={15} /> Gym / Business Name
                </span>
                <input
                  value={gymName}
                  onChange={(event) => setGymName(event.target.value)}
                  placeholder="Enter business name"
                  required
                />
              </label>
              <label className={styles.field}>
                <span>
                  <UserRound size={15} /> Owner Name
                </span>
                <input
                  value={ownerName}
                  onChange={(event) => setOwnerName(event.target.value)}
                  placeholder="Enter owner name"
                  required
                />
              </label>
              <label className={styles.field}>
                <span>
                  <Phone size={15} /> Mobile Number{" "}
                  <LockKeyhole size={13} className={styles.lockIcon} />
                </span>
                <input
                  type="tel"
                  inputMode="numeric"
                  maxLength={10}
                  value={mobile}
                  readOnly
                  title="Your registered mobile number cannot be changed here."
                />
              </label>
              <label className={styles.field}>
                <span>
                  <Mail size={15} /> Email{" "}
                  <LockKeyhole size={13} className={styles.lockIcon} />
                </span>
                <input
                  type="email"
                  value={email}
                  readOnly
                  title="Your sign-in email is managed through authentication."
                />
              </label>
              <div className={styles.formFooter}>
                <span className={styles.helper}>
                  <ShieldCheck size={16} /> Your account details are securely
                  stored.
                </span>
                <button
                  className={styles.saveButton}
                  type="submit"
                  disabled={savingBusiness}
                >
                  <Save size={17} />{" "}
                  {savingBusiness ? "Saving..." : "Save business details"}
                </button>
              </div>
            </form>
          </section>

          <section className={styles.card}>
            <div className={styles.sectionHeader}>
              <div className={`${styles.sectionIcon} ${styles.reminderIcon}`}>
                <BellRing size={22} />
              </div>
              <div>
                <span className={styles.sectionEyebrow}>
                  AUTOMATED COMMUNICATION
                </span>
                <h2>Reminder preferences</h2>
                <p>
                  Choose whether and when members receive expiry reminder
                  emails.
                </p>
              </div>
            </div>

            <form
              className={styles.preferenceForm}
              onSubmit={saveNotifications}
            >
              <div className={styles.toggleRow}>
                <div className={styles.toggleText}>
                  <span className={styles.toggleTitle}>
                    <BellRing size={17} /> Email reminders
                  </span>
                  <span>
                    Enable membership expiry reminders for members with an email
                    address.
                  </span>
                </div>
                <label className={styles.switch}>
                  <input
                    type="checkbox"
                    aria-label="Email reminders"
                    checked={emailReminders}
                    onChange={(event) =>
                      setEmailReminders(event.target.checked)
                    }
                  />
                  <span className={styles.switchTrack} aria-hidden="true" />
                </label>
              </div>

              <label className={styles.selectLabel}>
                <span>
                  <CalendarClock size={17} /> Send reminder before expiry
                </span>
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

              <div className={styles.notice}>
                <Info size={18} />
                <span>
                  Changes take effect after you save. Reminder delivery depends
                  on your configured email service; simulated reminders do not
                  send real emails.
                </span>
              </div>
              <div className={styles.formFooter}>
                <span className={styles.helper}>
                  <ShieldCheck size={16} /> Preferences apply to your business.
                </span>
                <button
                  className={styles.saveButton}
                  type="submit"
                  disabled={savingNotifications}
                >
                  <Save size={17} />{" "}
                  {savingNotifications ? "Saving..." : "Save reminder settings"}
                </button>
              </div>
            </form>
          </section>
        </div>
      ) : null}
    </main>
  );
};

export default Settings;
