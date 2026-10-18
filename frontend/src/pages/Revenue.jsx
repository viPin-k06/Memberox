import { useEffect, useMemo, useState } from "react";
import {
  ArrowDownRight,
  ArrowUpRight,
  Banknote,
  CalendarDays,
  ChartNoAxesCombined,
  CircleDollarSign,
  CreditCard,
  IndianRupee,
  Landmark,
  RefreshCw,
  Sparkles,
  Wallet,
} from "lucide-react";
import styles from "./Revenue.module.css";
import { supabase } from "../lib/supabase";

const PAYMENT_MODE_NAMES = ["UPI", "Cash", "Card", "Bank Transfer"];
const PAGE_SIZE = 1000;
const MODE_ICONS = {
  UPI: Wallet,
  Cash: Banknote,
  Card: CreditCard,
  "Bank Transfer": Landmark,
};

const formatCurrency = (amount) =>
  `₹${Number(amount).toLocaleString("en-IN", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  })}`;

const monthKey = (date) =>
  `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;

const dateKey = (date) =>
  `${monthKey(date)}-${String(date.getDate()).padStart(2, "0")}`;

const getLastSixMonths = (today) =>
  Array.from({ length: 6 }, (_, index) => {
    const date = new Date(
      today.getFullYear(),
      today.getMonth() - (5 - index),
      1,
    );
    return {
      key: monthKey(date),
      month: date.toLocaleDateString("en-IN", { month: "short" }),
      label: date.toLocaleDateString("en-IN", {
        month: "long",
        year: "numeric",
      }),
      amount: 0,
    };
  });

const Revenue = () => {
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    let cancelled = false;

    const loadRevenue = async () => {
      setLoading(true);
      setError("");

      try {
        const { data: userData, error: userError } =
          await supabase.auth.getUser();
        if (userError) throw userError;
        if (!userData.user) throw new Error("Please log in again.");

        const { data: organization, error: orgError } = await supabase
          .from("organizations")
          .select("id")
          .eq("owner_id", userData.user.id)
          .single();
        if (orgError) throw orgError;

        // Fetch every page to keep totals accurate beyond Supabase's row limit.
        const allPayments = [];
        let offset = 0;

        while (true) {
          const { data, error: paymentError } = await supabase
            .from("payments")
            .select("id, amount, payment_date, payment_mode")
            .eq("organization_id", organization.id)
            .order("id", { ascending: true })
            .range(offset, offset + PAGE_SIZE - 1);

          if (paymentError) throw paymentError;
          const page = data || [];
          allPayments.push(...page);
          if (page.length < PAGE_SIZE) break;
          offset += PAGE_SIZE;
        }

        if (!cancelled) setPayments(allPayments);
      } catch (err) {
        if (!cancelled) setError(err.message || "Unable to load revenue.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    loadRevenue();
    return () => {
      cancelled = true;
    };
  }, [refreshKey]);

  const summary = useMemo(() => {
    const today = new Date();
    const todayString = dateKey(today);
    const months = getLastSixMonths(today);
    const monthlyMap = new Map(months.map((month) => [month.key, month]));
    const modes = PAYMENT_MODE_NAMES.map((mode) => ({ mode, amount: 0 }));
    const modeMap = new Map(modes.map((mode) => [mode.mode, mode]));
    const currentMonthKey = months[5].key;
    let totalCollected = 0;
    let todayCollected = 0;
    let currentMonthCount = 0;

    for (const payment of payments) {
      const amount = Number(payment.amount) || 0;
      const paymentDate = payment.payment_date || "";
      totalCollected += amount;

      if (paymentDate === todayString) todayCollected += amount;

      const paymentMonth = paymentDate.slice(0, 7);
      const monthlyBucket = monthlyMap.get(paymentMonth);
      if (monthlyBucket) monthlyBucket.amount += amount;

      if (paymentMonth === currentMonthKey) {
        currentMonthCount += 1;
        const modeBucket = modeMap.get(payment.payment_mode);
        if (modeBucket) modeBucket.amount += amount;
      }
    }

    const currentMonth = months[5].amount;
    const previousMonth = months[4].amount;
    const growth =
      previousMonth > 0
        ? ((currentMonth - previousMonth) / previousMonth) * 100
        : null;

    return {
      months,
      modes,
      currentMonth,
      previousMonth,
      growth,
      totalCollected,
      todayCollected,
      averagePayment:
        currentMonthCount > 0 ? currentMonth / currentMonthCount : 0,
      maxRevenue: Math.max(1, ...months.map((month) => month.amount)),
      previousMonthLabel: months[4].label,
    };
  }, [payments]);

  const kpis = [
    {
      label: "This Month",
      value: summary.currentMonth,
      note:
        summary.growth === null
          ? "No revenue recorded last month"
          : `${summary.growth >= 0 ? "+" : ""}${summary.growth.toFixed(1)}% vs last month`,
      Icon: ChartNoAxesCombined,
      variant: "purple",
      growth: summary.growth,
    },
    {
      label: "Last Month",
      value: summary.previousMonth,
      note: `${summary.previousMonthLabel} revenue`,
      Icon: CalendarDays,
      variant: "blue",
    },
    {
      label: "Total Collected",
      value: summary.totalCollected,
      note: "All recorded payments",
      Icon: Wallet,
      variant: "green",
    },
    {
      label: "Average Payment",
      value: summary.averagePayment,
      note: "Current month",
      Icon: IndianRupee,
      variant: "orange",
    },
  ];

  return (
    <main className={styles.page}>
      <header className={styles.header}>
        <div>
          <div className={styles.eyebrow}>
            <Sparkles size={14} /> FINANCIAL ANALYTICS
          </div>
          <h1>Revenue</h1>
          <p>Track membership income and payment performance.</p>
        </div>
        <span className={styles.headerPill}>
          <CircleDollarSign size={16} /> Payment insights
        </span>
      </header>

      {loading && (
        <div className={styles.loadingState} role="status">
          Loading revenue...
        </div>
      )}
      {error && (
        <div className={styles.errorState} role="alert">
          <span>{error}</span>
          <button type="button" onClick={() => setRefreshKey((key) => key + 1)}>
            <RefreshCw size={16} /> Retry
          </button>
        </div>
      )}

      {!loading && !error && (
        <>
          <section className={styles.stats} aria-label="Revenue statistics">
            {kpis.map(({ label, value, note, Icon, variant, growth }) => (
              <article
                key={label}
                className={`${styles.statCard} ${styles[variant]}`}
              >
                <div className={styles.statTop}>
                  <div className={styles.statIcon}>
                    <Icon size={21} />
                  </div>
                  <span className={styles.statDecoration}>
                    <ArrowUpRight size={19} />
                  </span>
                </div>
                <span className={styles.statLabel}>{label}</span>
                <strong className={styles.statValue}>
                  {formatCurrency(value)}
                </strong>
                <small className={styles.statNote}>
                  {growth !== undefined &&
                    growth !== null &&
                    (growth >= 0 ? (
                      <ArrowUpRight size={14} />
                    ) : (
                      <ArrowDownRight size={14} />
                    ))}
                  {note}
                </small>
              </article>
            ))}
          </section>

          <div className={styles.grid}>
            <section
              className={styles.panel}
              aria-labelledby="monthly-revenue-heading"
            >
              <div className={styles.panelHeader}>
                <div>
                  <span className={styles.panelEyebrow}>REVENUE TREND</span>
                  <h2 id="monthly-revenue-heading">Monthly Revenue</h2>
                  <p>Last 6 months of recorded payments</p>
                </div>
                <div className={styles.panelIcon}>
                  <ChartNoAxesCombined size={20} />
                </div>
              </div>
              <div className={styles.chartSummary}>
                <span>Current month</span>
                <strong>{formatCurrency(summary.currentMonth)}</strong>
              </div>
              <div
                className={styles.chart}
                role="group"
                aria-label={`Revenue for the last six months: ${summary.months.map((item) => `${item.label}: ${formatCurrency(item.amount)}`).join(", ")}`}
              >
                {summary.months.map((item, index) => (
                  <div
                    key={item.key}
                    className={styles.barGroup}
                    tabIndex={0}
                    aria-label={`${item.label}: ${formatCurrency(item.amount)}`}
                  >
                    <div className={styles.barArea}>
                      <div className={styles.barTrack}>
                        <div
                          className={`${styles.bar} ${index === 5 ? styles.currentBar : ""}`}
                          style={{
                            height: `${Math.max(0, (item.amount / summary.maxRevenue) * 100)}%`,
                          }}
                        />
                      </div>
                    </div>
                    <div className={styles.barTooltip} aria-hidden="true">
                      <span>{item.label}</span>
                      <strong>{formatCurrency(item.amount)}</strong>
                    </div>
                    <span className={styles.barLabel}>{item.month}</span>
                  </div>
                ))}
              </div>
              <div className={styles.chartFootnote}>
                <span className={styles.legendDot} /> Recorded revenue in INR
              </div>
            </section>

            <section
              className={styles.panel}
              aria-labelledby="payment-modes-heading"
            >
              <div className={styles.panelHeader}>
                <div>
                  <span className={styles.panelEyebrow}>PAYMENT BREAKDOWN</span>
                  <h2 id="payment-modes-heading">Payment Modes</h2>
                  <p>Current month</p>
                </div>
                <div className={styles.panelIcon}>
                  <CreditCard size={20} />
                </div>
              </div>

              <div className={styles.modeList}>
                {summary.modes.map((item, index) => {
                  const percent =
                    summary.currentMonth > 0
                      ? Math.round((item.amount / summary.currentMonth) * 100)
                      : 0;
                  const Icon = MODE_ICONS[item.mode];
                  return (
                    <div
                      key={item.mode}
                      className={`${styles.modeItem} ${styles[`mode${index}`]}`}
                    >
                      <div className={styles.modeTop}>
                        <div className={styles.modeName}>
                          <div className={styles.modeIcon}>
                            <Icon size={17} />
                          </div>
                          <span>{item.mode}</span>
                        </div>
                        <strong>{formatCurrency(item.amount)}</strong>
                      </div>
                      <div
                        className={styles.progress}
                        role="progressbar"
                        aria-label={`${item.mode} share of revenue`}
                        aria-valuemin={0}
                        aria-valuemax={100}
                        aria-valuenow={percent}
                      >
                        <div
                          style={{
                            width: `${Math.max(0, Math.min(100, percent))}%`,
                          }}
                        />
                      </div>
                      <small>{percent}% of revenue</small>
                    </div>
                  );
                })}
              </div>
              <p className={styles.modeFootnote}>
                Based on recorded payments this month.
              </p>
            </section>
          </div>
        </>
      )}
    </main>
  );
};

export default Revenue;
