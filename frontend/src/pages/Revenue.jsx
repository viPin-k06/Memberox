import React from "react";
import styles from "./Revenue.module.css";

const MONTHLY_REVENUE = [
  { month: "May", amount: 42000 },
  { month: "Jun", amount: 51000 },
  { month: "Jul", amount: 47000 },
  { month: "Aug", amount: 62000 },
  { month: "Sep", amount: 68000 },
  { month: "Oct", amount: 73500 },
];

const PAYMENT_MODES = [
  { mode: "UPI", amount: 39500 },
  { mode: "Cash", amount: 22000 },
  { mode: "Card", amount: 8000 },
  { mode: "Bank Transfer", amount: 4000 },
];

const formatCurrency = (amount) =>
  `₹${Number(amount).toLocaleString("en-IN")}`;

const Revenue = () => {
  const currentMonth = MONTHLY_REVENUE.at(-1).amount;
  const previousMonth = MONTHLY_REVENUE.at(-2).amount;
  const growth = (((currentMonth - previousMonth) / previousMonth) * 100).toFixed(1);
  const maxRevenue = Math.max(...MONTHLY_REVENUE.map((item) => item.amount));

  return (
    <main className={styles.page}>
      <div className={styles.header}>
        <div>
          <h1>Revenue</h1>
          <p>Track membership income and payment performance.</p>
        </div>
      </div>

      <section className={styles.stats}>
        <div className={styles.statCard}>
          <span>This Month</span>
          <strong>{formatCurrency(currentMonth)}</strong>
          <small>{growth}% vs last month</small>
        </div>

        <div className={styles.statCard}>
          <span>Last Month</span>
          <strong>{formatCurrency(previousMonth)}</strong>
          <small>September revenue</small>
        </div>

        <div className={styles.statCard}>
          <span>Outstanding</span>
          <strong>{formatCurrency(14500)}</strong>
          <small>Across active members</small>
        </div>

        <div className={styles.statCard}>
          <span>Average Payment</span>
          <strong>{formatCurrency(1875)}</strong>
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
            {MONTHLY_REVENUE.map((item) => (
              <div key={item.month} className={styles.barGroup}>
                <div className={styles.barArea}>
                  <div
                    className={styles.bar}
                    style={{ height: `${(item.amount / maxRevenue) * 100}%` }}
                    title={`${item.month}: ${formatCurrency(item.amount)}`}
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
            {PAYMENT_MODES.map((item) => {
              const percent = Math.round((item.amount / currentMonth) * 100);

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
    </main>
  );
};

export default Revenue;
