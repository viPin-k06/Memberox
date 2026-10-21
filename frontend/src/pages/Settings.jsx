import { useCallback, useEffect, useState } from "react";
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
  CreditCard,
  Crown,
  Users,
  CalendarDays,
  RefreshCw,
} from "lucide-react";

import styles from "./Settings.module.css";
import { supabase } from "../lib/supabase";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

const STATUS_LABELS = {
  pending: "Pending payment",
  active: "Active",
  past_due: "Payment overdue",
  cancelled: "Cancelled",
  expired: "Expired",
};

function formatDate(value) {
  if (!value) return "Not available";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Not available";
  return new Intl.DateTimeFormat("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(date);
}

function formatPrice(amount) {
  if (typeof amount !== "number") return "Not available";
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(amount);
}

async function readApiResponse(response) {
  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(
      data.error || data.message || `Request failed (${response.status}).`,
    );
  }
  return data;
}

export default function Settings() {
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

  const [subscription, setSubscription] = useState(null);
  const [plan, setPlan] = useState(null);
  const [subscriptionLoading, setSubscriptionLoading] = useState(true);
  const [subscriptionError, setSubscriptionError] = useState("");
  const [selectedPlan, setSelectedPlan] = useState("starter");
  const [checkoutLoading, setCheckoutLoading] = useState(false);
  const [checkoutError, setCheckoutError] = useState("");

  const refreshSubscription = useCallback(async (orgId) => {
    if (!orgId) return;
    setSubscriptionLoading(true);
    setSubscriptionError("");
    try {
      const { data: sub, error: subError } = await supabase
        .from("organization_subscriptions")
        .select(
          "id, organization_id, plan_id, status, current_period_start, current_period_end, cancel_at_period_end",
        )
        .eq("organization_id", orgId)
        .maybeSingle();
      if (subError) throw subError;

      let planData = null;
      if (sub) {
        const { data, error: planError } = await supabase
          .from("subscription_plans")
          .select("id, name, price_inr, member_limit")
          .eq("id", sub.plan_id)
          .single();
        if (planError) throw planError;
        planData = data;
      }
      setSubscription(sub);
      setPlan(planData);
    } catch (err) {
      setSubscriptionError(err.message || "Unable to load subscription.");
    } finally {
      setSubscriptionLoading(false);
    }
  }, []);

  useEffect(() => {
    let cancelled = false;

    async function loadSettings() {
      try {
        const {
          data: { user },
          error: authError,
        } = await supabase.auth.getUser();
        if (authError) throw authError;
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

        const org = orgResult.data;
        const profile = profileResult.data;
        setUserId(user.id);
        setOrganizationId(org.id);
        setGymName(org.name ?? "");
        setOwnerName(profile.full_name ?? "");
        setMobile(org.phone ?? profile.phone ?? "");
        setEmail(user.email ?? "");
        setEmailReminders(org.email_reminders_enabled ?? false);
        setDaysBefore(String(org.reminder_days_before ?? 3));
        await refreshSubscription(org.id);
      } catch (err) {
        if (!cancelled) setError(err.message || "Unable to load settings.");
      } finally {
        if (!cancelled) {
          setLoading(false);
          setSubscriptionLoading(false);
        }
      }
    }

    loadSettings();
    return () => {
      cancelled = true;
    };
  }, [refreshSubscription]);

  async function saveBusiness(event) {
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
          `Business name saved, but owner name could not be updated: ${profileError.message}`,
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
  }

  async function saveNotifications(event) {
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
      setMessage("Reminder preferences saved successfully.");
    } catch (err) {
      setError(err.message || "Unable to save reminder settings.");
    } finally {
      setSavingNotifications(false);
    }
  }

  async function startCheckout() {
    if (checkoutLoading) return;
    setCheckoutLoading(true);
    setCheckoutError("");
    try {
      const {
        data: { session },
        error: sessionError,
      } = await supabase.auth.getSession();
      if (sessionError || !session) throw new Error("Please log in again.");
      if (!window.Razorpay) {
        throw new Error(
          "Razorpay Checkout is unavailable. Refresh the page and try again.",
        );
      }
      if (!API_BASE_URL) throw new Error("Subscription API is not configured.");

      const checkoutPlan =
        subscription?.status === "pending"
          ? subscription.plan_id
          : selectedPlan;

      const response = await fetch(`${API_BASE_URL}/api/subscriptions/create`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({ plan: checkoutPlan }),
      });
      const result = await readApiResponse(response);
      if (!result.subscription_id || !result.key_id) {
        throw new Error("Incomplete checkout details received.");
      }

      const checkout = new window.Razorpay({
        key: result.key_id,
        subscription_id: result.subscription_id,
        name: "TejTrack",
        description: `${checkoutPlan === "starter" ? "Starter" : "Pro"} Monthly Subscription`,
        handler: async (payment) => {
          try {
            setCheckoutError("");
            const verifyResponse = await fetch(
              `${API_BASE_URL}/api/subscriptions/verify`,
              {
                method: "POST",
                headers: {
                  "Content-Type": "application/json",
                  Authorization: `Bearer ${session.access_token}`,
                },
                body: JSON.stringify({
                  razorpay_payment_id: payment.razorpay_payment_id,
                  razorpay_subscription_id: payment.razorpay_subscription_id,
                  razorpay_signature: payment.razorpay_signature,
                }),
              },
            );
            await readApiResponse(verifyResponse);
            setMessage(
              "Payment verified. Subscription activation is being confirmed.",
            );
            // The signed Razorpay webhook, not Checkout, controls activation.
            await refreshSubscription(organizationId);
          } catch (err) {
            setCheckoutError(err.message || "Unable to verify payment.");
          }
        },
        modal: { ondismiss: () => {} },
        theme: { color: "#7C3AED" },
      });

      checkout.on("payment.failed", (response) => {
        setCheckoutError(
          response.error?.description || "Payment failed. Please try again.",
        );
      });
      checkout.open();
    } catch (err) {
      setCheckoutError(err.message || "Unable to open checkout.");
    } finally {
      setCheckoutLoading(false);
    }
  }

  const periodEnd = subscription?.current_period_end;
  const periodHasEnded = Boolean(
    periodEnd && new Date(periodEnd).getTime() <= Date.now(),
  );
  const isActive = subscription?.status === "active" && !periodHasEnded;
  const displayStatus = !subscription
    ? "No subscription"
    : periodHasEnded && subscription.status === "active"
      ? "Period ended"
      : (STATUS_LABELS[subscription.status] ?? subscription.status);
  const showRenewalDate =
    isActive && !subscription?.cancel_at_period_end && periodEnd;

  return (
    <main className={styles.page}>
      <header className={styles.header}>
        <div>
          <div className={styles.eyebrow}>
            <Sparkles size={14} /> ACCOUNT PREFERENCES
          </div>
          <h1>Settings</h1>
          <p>
            Manage your business, reminder preferences, and TejTrack
            subscription.
          </p>
        </div>
        <span className={styles.headerPill}>
          <Settings2 size={16} /> Workspace settings
        </span>
      </header>

      {error && (
        <div role="alert" className={styles.errorBanner}>
          <AlertCircle size={19} />
          <span>{error}</span>
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
          <CheckCircle2 size={19} />
          <span>{message}</span>
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
          {/* BUSINESS DETAILS */}
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
                  value={mobile}
                  readOnly
                  title="Mobile number cannot be changed here."
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
                  title="Email is managed through authentication."
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

          {/* BILLING & SUBSCRIPTION */}
          <section className={styles.card}>
            <div className={styles.sectionHeader}>
              <div className={`${styles.sectionIcon} ${styles.billingIcon}`}>
                <CreditCard size={22} />
              </div>
              <div className={styles.billingHeading}>
                <span className={styles.sectionEyebrow}>TEJTRACK BILLING</span>
                <h2>Billing & Subscription</h2>
                <p>View your plan, subscription status, and billing period.</p>
              </div>
              <span className={styles.comingSoon}>Subscription billing</span>
            </div>

            {subscriptionLoading ? (
              <div className={styles.subscriptionEmpty} role="status">
                Loading subscription details...
              </div>
            ) : subscriptionError ? (
              <div className={styles.errorBanner} role="alert">
                <AlertCircle size={19} />
                <span>{subscriptionError}</span>
                <button
                  type="button"
                  onClick={() => refreshSubscription(organizationId)}
                >
                  Retry
                </button>
              </div>
            ) : !subscription ? (
              <div className={styles.subscriptionEmpty}>
                <div className={styles.emptyIcon}>
                  <Crown size={25} />
                </div>
                <h3>Choose your TejTrack plan</h3>
                <p>Get started with a monthly subscription for your gym.</p>
                <div className={styles.availablePlans}>
                  <label className={styles.planOption}>
                    <input
                      type="radio"
                      name="subscriptionPlan"
                      value="starter"
                      checked={selectedPlan === "starter"}
                      onChange={() => setSelectedPlan("starter")}
                    />
                    <span>Starter</span>
                    <strong>₹499/month</strong>
                    <small>Up to 100 members</small>
                  </label>
                  <label className={styles.planOption}>
                    <input
                      type="radio"
                      name="subscriptionPlan"
                      value="pro"
                      checked={selectedPlan === "pro"}
                      onChange={() => setSelectedPlan("pro")}
                    />
                    <span>Pro</span>
                    <strong>₹999/month</strong>
                    <small>Unlimited members</small>
                  </label>
                </div>
                <button
                  type="button"
                  className={styles.saveButton}
                  onClick={startCheckout}
                  disabled={checkoutLoading}
                >
                  <CreditCard size={17} />
                  {checkoutLoading
                    ? "Opening Checkout..."
                    : `Subscribe — ${selectedPlan === "starter" ? "₹499" : "₹999"}/month`}
                </button>
                {checkoutError && (
                  <p
                    role="alert"
                    style={{ color: "#DC2626", marginTop: "1rem" }}
                  >
                    {checkoutError}
                  </p>
                )}
              </div>
            ) : (
              <>
                <div className={styles.subscriptionOverview}>
                  <div className={styles.planSummary}>
                    <div className={styles.planSymbol}>
                      <Crown size={22} />
                    </div>
                    <div>
                      <span className={styles.planLabel}>
                        YOUR CURRENT PLAN
                      </span>
                      <h3>{plan?.name ?? subscription.plan_id}</h3>
                      <p>
                        {!plan
                          ? "Member limit unavailable"
                          : plan.member_limit == null
                            ? "Unlimited members"
                            : `Up to ${plan.member_limit} members`}
                      </p>
                    </div>
                  </div>
                  <div className={styles.planPrice}>
                    <strong>{formatPrice(plan?.price_inr)}</strong>
                    <span>per month</span>
                  </div>
                </div>
                <div className={styles.subscriptionGrid}>
                  <div className={styles.subscriptionDetail}>
                    <span>
                      <ShieldCheck size={16} /> Subscription status
                    </span>
                    <strong
                      className={
                        isActive ? styles.statusActive : styles.statusNeutral
                      }
                    >
                      <span className={styles.statusDot} />
                      {displayStatus}
                    </strong>
                  </div>
                  <div className={styles.subscriptionDetail}>
                    <span>
                      <Users size={16} /> Member allowance
                    </span>
                    <strong>
                      {!plan
                        ? "Not available"
                        : plan.member_limit == null
                          ? "Unlimited"
                          : plan.member_limit}
                    </strong>
                  </div>
                  <div className={styles.subscriptionDetail}>
                    <span>
                      <CalendarDays size={16} /> Current period started
                    </span>
                    <strong>
                      {formatDate(subscription.current_period_start)}
                    </strong>
                  </div>
                  <div className={styles.subscriptionDetail}>
                    <span>
                      <RefreshCw size={16} />{" "}
                      {showRenewalDate
                        ? "Current billing period ends"
                        : "Current period ends"}
                    </span>
                    <strong>{formatDate(periodEnd)}</strong>
                  </div>
                </div>

                {subscription.cancel_at_period_end && (
                  <div className={styles.billingNotice}>
                    <Info size={18} />
                    <span>
                      This subscription is scheduled to cancel at the end of its
                      current billing period.
                    </span>
                  </div>
                )}
                <div className={styles.billingActions}>
                  <div>
                    <strong>Manage subscription</strong>
                    <p>
                      {subscription.status === "pending"
                        ? "Complete your payment to activate your subscription."
                        : "Plan changes and cancellation options are being prepared."}
                    </p>
                  </div>
                  {subscription.status === "pending" && (
                    <button
                      type="button"
                      className={styles.saveButton}
                      onClick={startCheckout}
                      disabled={checkoutLoading}
                    >
                      <CreditCard size={17} />
                      {checkoutLoading
                        ? "Opening Checkout..."
                        : "Continue Payment"}
                    </button>
                  )}
                  <button
                    type="button"
                    className={styles.disabledButton}
                    disabled
                  >
                    Manage plan — Coming soon
                  </button>
                </div>
                {subscription.status === "pending" && checkoutError && (
                  <p
                    role="alert"
                    style={{ color: "#DC2626", marginTop: "1rem" }}
                  >
                    {checkoutError}
                  </p>
                )}
                <div style={{ marginTop: "1rem" }}>
                  <button
                    type="button"
                    className={styles.saveButton}
                    onClick={() => refreshSubscription(organizationId)}
                    disabled={subscriptionLoading}
                  >
                    <RefreshCw size={15} /> Refresh subscription status
                  </button>
                </div>
              </>
            )}
            <div className={styles.billingFootnote}>
              <LockKeyhole size={15} /> Subscription payments are separate from
              your gym members' payment records.
            </div>
          </section>

          {/* REMINDER PREFERENCES */}
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
                  on your configured email service.
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
                  <Save size={17} />
                  {savingNotifications ? "Saving..." : "Save reminder settings"}
                </button>
              </div>
            </form>
          </section>
        </div>
      ) : null}
    </main>
  );
}
