import React, { useMemo, useState } from "react";
import { Search } from "lucide-react";
import styles from "./Payments.module.css";

const INITIAL_PAYMENTS = [
  {
    id: 1,
    member: "Rahul Sharma",
    amount: 2499,
    date: "2026-10-07",
    mode: "UPI",
    type: "Renewal",
  },
  {
    id: 2,
    member: "Priya Singh",
    amount: 999,
    date: "2026-10-06",
    mode: "Cash",
    type: "Membership",
  },
  {
    id: 3,
    member: "Amit Kumar",
    amount: 1500,
    date: "2026-10-05",
    mode: "Card",
    type: "Payment",
  },
  {
    id: 4,
    member: "Neha Verma",
    amount: 2499,
    date: "2026-10-03",
    mode: "UPI",
    type: "Renewal",
  },
  {
    id: 5,
    member: "Karan Mehta",
    amount: 999,
    date: "2026-10-01",
    mode: "Bank Transfer",
    type: "Membership",
  },
];

const formatCurrency = (amount) =>
  `₹${Number(amount).toLocaleString("en-IN")}`;

const formatDate = (date) =>
  new Date(`${date}T00:00:00`).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });

const Payments = () => {
  const [search, setSearch] = useState("");
  const [mode, setMode] = useState("All");

  const filteredPayments = useMemo(() => {
    const query = search.trim().toLowerCase();

    return INITIAL_PAYMENTS.filter((payment) => {
      const matchesSearch =
        !query || payment.member.toLowerCase().includes(query);

      const matchesMode = mode === "All" || payment.mode === mode;

      return matchesSearch && matchesMode;
    });
  }, [search, mode]);

  const total = filteredPayments.reduce(
    (sum, payment) => sum + payment.amount,
    0,
  );

  return (
    <main className={styles.page}>
      <div className={styles.header}>
        <div>
          <h1>Payments</h1>
          <p>View all membership and renewal payments.</p>
        </div>
      </div>

      <div className={styles.summary}>
        <span>Showing {filteredPayments.length} payments</span>
        <strong>{formatCurrency(total)}</strong>
      </div>

      <div className={styles.toolbar}>
        <div className={styles.search}>
          <Search size={18} />
          <input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search member..."
          />
        </div>

        <select value={mode} onChange={(event) => setMode(event.target.value)}>
          <option value="All">All payment modes</option>
          <option value="Cash">Cash</option>
          <option value="UPI">UPI</option>
          <option value="Card">Card</option>
          <option value="Bank Transfer">Bank Transfer</option>
        </select>
      </div>

      <div className={styles.tableWrapper}>
        <table className={styles.table}>
          <thead>
            <tr>
              <th>Member</th>
              <th>Type</th>
              <th>Mode</th>
              <th>Date</th>
              <th>Amount</th>
            </tr>
          </thead>

          <tbody>
            {filteredPayments.map((payment) => (
              <tr key={payment.id}>
                <td>{payment.member}</td>
                <td>
                  <span className={styles.typeBadge}>{payment.type}</span>
                </td>
                <td>{payment.mode}</td>
                <td>{formatDate(payment.date)}</td>
                <td>{formatCurrency(payment.amount)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className={styles.mobileList}>
        {filteredPayments.map((payment) => (
          <article key={payment.id} className={styles.mobileCard}>
            <div>
              <strong>{payment.member}</strong>
              <span>{payment.type}</span>
            </div>

            <div>
              <strong>{formatCurrency(payment.amount)}</strong>
              <span>
                {payment.mode} · {formatDate(payment.date)}
              </span>
            </div>
          </article>
        ))}
      </div>

      {filteredPayments.length === 0 && (
        <div className={styles.empty}>No payments found.</div>
      )}
    </main>
  );
};

export default Payments;
