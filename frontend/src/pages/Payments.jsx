import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Search,
  Wallet,
  ReceiptText,
  CreditCard,
  Sparkles,
  ArrowUpRight,
  Filter,
  CalendarDays,
  UserRound,
  Banknote,
  Landmark,
  Smartphone,
  RefreshCw,
  X,
} from "lucide-react";
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

const localDateKey = (date) =>
  `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;

const getModeIcon = (mode) => {
  switch (mode) {
    case "UPI":
      return Smartphone;
    case "Cash":
      return Banknote;
    case "Card":
      return CreditCard;
    case "Bank Transfer":
      return Landmark;
    default:
      return Wallet;
  }
};

// Fetch all pages to prevent older records being omitted from totals.
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
          (b.date || "").localeCompare(a.date || "") ||
          (b.createdAt || "").localeCompare(a.createdAt || "") ||
          String(b.id).localeCompare(String(a.id)),
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

  const monthTotal = useMemo(() => {
    const now = new Date();
    const month = localDateKey(now).slice(0, 7);
    return payments.reduce(
      (sum, payment) =>
        sum + (payment.date?.startsWith(month) ? payment.amount : 0),
      0,
    );
  }, [payments]);

  const isFiltered = search.trim() !== "" || mode !== "All";

  return (
    <main className={styles.page}>
      <header className={styles.header}>
        <div>
          <div className={styles.eyebrow}>
            <Sparkles size={14} /> TRANSACTION HISTORY
          </div>
          <h1>Payments</h1>
          <p>View and explore membership and renewal payments.</p>
        </div>
        <div className={styles.headerPill}>
          <ReceiptText size={16} /> Payment records
        </div>
      </header>

      <section className={styles.stats} aria-label="Payment overview">
        <article className={`${styles.statCard} ${styles.purpleStat}`}>
          <div className={styles.statTop}>
            <span className={styles.statIcon}>
              <Wallet size={21} />
            </span>
            <ArrowUpRight size={18} className={styles.statArrow} />
          </div>
          <span className={styles.statLabel}>Total Collected</span>
          <strong>
            {loading
              ? "—"
              : formatCurrency(
                  payments.reduce((sum, payment) => sum + payment.amount, 0),
                )}
          </strong>
          <small>All recorded payments</small>
        </article>
        <article className={`${styles.statCard} ${styles.blueStat}`}>
          <div className={styles.statTop}>
            <span className={styles.statIcon}>
              <CalendarDays size={21} />
            </span>
            <ArrowUpRight size={18} className={styles.statArrow} />
          </div>
          <span className={styles.statLabel}>This Month</span>
          <strong>{loading ? "—" : formatCurrency(monthTotal)}</strong>
          <small>Payments recorded this month</small>
        </article>
        <article className={`${styles.statCard} ${styles.greenStat}`}>
          <div className={styles.statTop}>
            <span className={styles.statIcon}>
              <ReceiptText size={21} />
            </span>
            <ArrowUpRight size={18} className={styles.statArrow} />
          </div>
          <span className={styles.statLabel}>Transactions</span>
          <strong>
            {loading ? "—" : payments.length.toLocaleString("en-IN")}
          </strong>
          <small>Total payment records</small>
        </article>
      </section>

      <section
        className={styles.recordsSection}
        aria-labelledby="payments-heading"
      >
        <div className={styles.sectionHeader}>
          <div>
            <span className={styles.sectionEyebrow}>PAYMENT ACTIVITY</span>
            <h2 id="payments-heading">Payment history</h2>
            <p>Find transactions by member name or payment method.</p>
          </div>
          <span className={styles.recordCount}>
            {loading
              ? "Loading…"
              : `${filteredPayments.length} ${filteredPayments.length === 1 ? "payment" : "payments"}`}
          </span>
        </div>

        <div className={styles.toolbar}>
          <label className={styles.search}>
            <Search size={19} aria-hidden="true" />
            <input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search member name..."
              aria-label="Search payments by member"
            />
            {search && (
              <button
                type="button"
                className={styles.clearSearch}
                onClick={() => setSearch("")}
                aria-label="Clear search"
              >
                <X size={16} />
              </button>
            )}
          </label>
          <label className={styles.filterWrap}>
            <Filter size={17} aria-hidden="true" />
            <select
              value={mode}
              onChange={(event) => setMode(event.target.value)}
              aria-label="Filter by payment mode"
            >
              <option value="All">All payment modes</option>
              {PAYMENT_MODES.map((paymentMode) => (
                <option key={paymentMode} value={paymentMode}>
                  {paymentMode}
                </option>
              ))}
            </select>
          </label>
        </div>

        {error && (
          <div className={styles.errorBanner} role="alert">
            <span>{error}</span>
            <button
              type="button"
              onClick={() => setReloadKey((key) => key + 1)}
            >
              <RefreshCw size={15} /> Retry
            </button>
          </div>
        )}

        {loading ? (
          <div className={styles.emptyState} role="status">
            Loading payments...
          </div>
        ) : (
          !error && (
            <>
              <div className={styles.filterSummary}>
                <div className={styles.summaryLeft}>
                  <span className={styles.summaryDot} />{" "}
                  {isFiltered ? "Filtered results" : "All transactions"}{" "}
                  <span className={styles.summaryDivider}>·</span>{" "}
                  {filteredPayments.length} payments
                </div>
                <div className={styles.summaryRight}>
                  <span>Showing total</span>
                  <strong>{formatCurrency(total)}</strong>
                </div>
              </div>

              {filteredPayments.length > 0 ? (
                <>
                  <div className={styles.tableWrapper}>
                    <table className={styles.table}>
                      <thead>
                        <tr>
                          <th>MEMBER</th>
                          <th>PAYMENT TYPE</th>
                          <th>METHOD</th>
                          <th>DATE</th>
                          <th className={styles.amountCol}>AMOUNT</th>
                        </tr>
                      </thead>
                      <tbody>
                        {filteredPayments.map((payment) => {
                          const ModeIcon = getModeIcon(payment.mode);
                          return (
                            <tr key={payment.id}>
                              <td>
                                <div className={styles.memberCell}>
                                  <span className={styles.avatar}>
                                    <UserRound size={17} />
                                  </span>
                                  <strong>{payment.member}</strong>
                                </div>
                              </td>
                              <td>
                                <span className={styles.typeBadge}>
                                  {payment.type || "Payment"}
                                </span>
                              </td>
                              <td>
                                <span
                                  className={`${styles.modeBadge} ${styles[`mode${(payment.mode || "").replace(/\s/g, "")}`] || ""}`}
                                >
                                  <ModeIcon size={15} /> {payment.mode || "—"}
                                </span>
                              </td>
                              <td className={styles.dateCell}>
                                {formatDate(payment.date)}
                              </td>
                              <td className={styles.amountCell}>
                                {formatCurrency(payment.amount)}
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                  <div className={styles.mobileList}>
                    {filteredPayments.map((payment) => {
                      const ModeIcon = getModeIcon(payment.mode);
                      return (
                        <article key={payment.id} className={styles.mobileCard}>
                          <div className={styles.mobileTop}>
                            <div className={styles.memberCell}>
                              <span className={styles.avatar}>
                                <UserRound size={17} />
                              </span>
                              <strong>{payment.member}</strong>
                            </div>
                            <strong className={styles.mobileAmount}>
                              {formatCurrency(payment.amount)}
                            </strong>
                          </div>
                          <div className={styles.mobileBottom}>
                            <span className={styles.typeBadge}>
                              {payment.type || "Payment"}
                            </span>
                            <span className={styles.mobileMode}>
                              <ModeIcon size={14} />
                              {payment.mode || "—"}
                            </span>
                            <span className={styles.mobileDate}>
                              {formatDate(payment.date)}
                            </span>
                          </div>
                        </article>
                      );
                    })}
                  </div>
                </>
              ) : (
                <div className={styles.emptyState}>
                  <div className={styles.emptyIcon}>
                    <ReceiptText size={26} />
                  </div>
                  <h3>No payments found</h3>
                  <p>
                    {isFiltered
                      ? "Try another member name or payment method."
                      : "Payments will appear here once they are recorded."}
                  </p>
                  {isFiltered && (
                    <button
                      type="button"
                      className={styles.resetButton}
                      onClick={() => {
                        setSearch("");
                        setMode("All");
                      }}
                    >
                      Clear filters
                    </button>
                  )}
                </div>
              )}
            </>
          )
        )}
      </section>
    </main>
  );
};

export default Payments;
