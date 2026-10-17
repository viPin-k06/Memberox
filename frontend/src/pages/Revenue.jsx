import React, { useEffect, useMemo, useState } from "react";
import styles from "./Revenue.module.css";
import { supabase } from "../lib/supabase";

const PAYMENT_MODE_NAMES = ["UPI", "Cash", "Card", "Bank Transfer"];
const PAGE_SIZE = 1000;

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

        // Supabase limits the rows returned in one request. Fetch every page
        // so totals remain accurate as the number of payments grows.
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

  return (
    <main className={styles.page}>
      <div className={styles.header}>
        <div>
          <h1>Revenue</h1>
          <p>Track membership income and payment performance.</p>
        </div>
      </div>

      {loading && <p role="status">Loading revenue...</p>}
      {error && (
        <p role="alert">
          {error}{" "}
          <button type="button" onClick={() => setRefreshKey((key) => key + 1)}>
            Retry
          </button>
        </p>
      )}

      {!loading && !error && (
        <>
          <section className={styles.stats}>
            <div className={styles.statCard}>
              <span>This Month</span>
              <strong>{formatCurrency(summary.currentMonth)}</strong>
              <small>
                {summary.growth === null
                  ? "No revenue recorded last month"
                  : `${summary.growth >= 0 ? "+" : ""}${summary.growth.toFixed(1)}% vs last month`}
              </small>
            </div>

            <div className={styles.statCard}>
              <span>Last Month</span>
              <strong>{formatCurrency(summary.previousMonth)}</strong>
              <small>{summary.previousMonthLabel} revenue</small>
            </div>

            <div className={styles.statCard}>
              <span>Total Collected</span>
              <strong>{formatCurrency(summary.totalCollected)}</strong>
              <small>All recorded payments</small>
            </div>

            <div className={styles.statCard}>
              <span>Average Payment</span>
              <strong>{formatCurrency(summary.averagePayment)}</strong>
              <small>Current month</small>
            </div>
          </section>

          <div className={styles.grid}>
            <section className={styles.panel}>
              <div className={styles.panelHeader}>
                <div>
                  <h2>Monthly Revenue</h2>
                  <p>Last 6 months</p>
                </div>
              </div>

              <div className={styles.chart}>
                {summary.months.map((item) => (
                  <div key={item.key} className={styles.barGroup}>
                    <div className={styles.barArea}>
                      <div
                        className={styles.bar}
                        style={{
                          height: `${(item.amount / summary.maxRevenue) * 100}%`,
                        }}
                        title={`${item.label}: ${formatCurrency(item.amount)}`}
                      />
                    </div>
                    <span>{item.month}</span>
                  </div>
                ))}
              </div>
            </section>

            <section className={styles.panel}>
              <div className={styles.panelHeader}>
                <div>
                  <h2>Payment Modes</h2>
                  <p>Current month</p>
                </div>
              </div>

              <div className={styles.modeList}>
                {summary.modes.map((item) => {
                  const percent =
                    summary.currentMonth > 0
                      ? Math.round((item.amount / summary.currentMonth) * 100)
                      : 0;

                  return (
                    <div key={item.mode} className={styles.modeItem}>
                      <div className={styles.modeTop}>
                        <span>{item.mode}</span>
                        <strong>{formatCurrency(item.amount)}</strong>
                      </div>

                      <div className={styles.progress}>
                        <div style={{ width: `${percent}%` }} />
                      </div>

                      <small>{percent}% of revenue</small>
                    </div>
                  );
                })}
              </div>
            </section>
          </div>
        </>
      )}
    </main>
  );
};

export default Revenue;
