import React, { useCallback, useEffect, useMemo, useState } from "react";
import { Search } from "lucide-react";
import { supabase } from "../lib/supabase";
import styles from "./Payments.module.css";

const PAYMENT_MODES = ["Cash", "UPI", "Card", "Bank Transfer"];
const PAGE_SIZE = 1000;

const formatCurrency = (amount) =>
  `₹${Number(amount).toLocaleString("en-IN", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  })}`;

const formatDate = (date) =>
  date
    ? new Date(`${date}T00:00:00`).toLocaleDateString("en-GB", {
        day: "numeric",
        month: "short",
        year: "numeric",
      })
    : "—";

// Supabase/PostgREST returns at most 1,000 rows by default.
// Fetch pages so older payments aren't silently excluded from totals.
const fetchAllRows = async (table, columns, organizationId) => {
  const rows = [];
  let start = 0;

  while (true) {
    const { data, error } = await supabase
      .from(table)
      .select(columns)
      .eq("organization_id", organizationId)
      .order("created_at", { ascending: false })
      .order("id", { ascending: false })
      .range(start, start + PAGE_SIZE - 1);

    if (error) throw error;
    const page = data || [];
    rows.push(...page);
    if (page.length < PAGE_SIZE) return rows;
    start += PAGE_SIZE;
  }
};

const Payments = () => {
  const [payments, setPayments] = useState([]);
  const [search, setSearch] = useState("");
  const [mode, setMode] = useState("All");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [reloadKey, setReloadKey] = useState(0);

  const loadPayments = useCallback(async () => {
    const { data: userData, error: userError } = await supabase.auth.getUser();
    if (userError) throw userError;
    if (!userData.user) throw new Error("Please log in again.");

    const { data: org, error: orgError } = await supabase
      .from("organizations")
      .select("id")
      .eq("owner_id", userData.user.id)
      .single();
    if (orgError) throw orgError;

    // Query members separately to avoid ambiguous foreign-key joins.
    const [paymentRows, memberRows] = await Promise.all([
      fetchAllRows(
        "payments",
        "id, member_id, amount, payment_date, payment_mode, payment_type, created_at",
        org.id,
      ),
      fetchAllRows("members", "id, name, created_at", org.id),
    ]);

    const namesById = new Map(
      memberRows.map((member) => [member.id, member.name]),
    );

    return paymentRows
      .map((payment) => ({
        id: payment.id,
        member: namesById.get(payment.member_id) || "Unknown member",
        amount: Number(payment.amount),
        date: payment.payment_date,
        mode: payment.payment_mode,
        type: payment.payment_type,
        createdAt: payment.created_at,
      }))
      .sort(
        (a, b) =>
          b.date.localeCompare(a.date) ||
          b.createdAt.localeCompare(a.createdAt) ||
          b.id.localeCompare(a.id),
      );
  }, []);

  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      setLoading(true);
      setError("");
      try {
        const result = await loadPayments();
        if (!cancelled) setPayments(result);
      } catch (err) {
        if (!cancelled) {
          setError(err.message || "Unable to load payments.");
          setPayments([]);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    load();
    return () => {
      cancelled = true;
    };
  }, [loadPayments, reloadKey]);

  const filteredPayments = useMemo(() => {
    const query = search.trim().toLowerCase();
    return payments.filter((payment) => {
      const matchesSearch =
        !query || payment.member.toLowerCase().includes(query);
      const matchesMode = mode === "All" || payment.mode === mode;
      return matchesSearch && matchesMode;
    });
  }, [payments, search, mode]);

  const total = useMemo(
    () => filteredPayments.reduce((sum, payment) => sum + payment.amount, 0),
    [filteredPayments],
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
            aria-label="Search payments by member"
          />
        </div>

        <select value={mode} onChange={(event) => setMode(event.target.value)}>
          <option value="All">All payment modes</option>
          {PAYMENT_MODES.map((paymentMode) => (
            <option key={paymentMode} value={paymentMode}>
              {paymentMode}
            </option>
          ))}
        </select>
      </div>

      {loading && <p role="status">Loading payments...</p>}
      {error && (
        <p role="alert">
          {error}{" "}
          <button type="button" onClick={() => setReloadKey((key) => key + 1)}>
            Retry
          </button>
        </p>
      )}

      {!loading && !error && (
        <>
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
        </>
      )}
    </main>
  );
};

export default Payments;
