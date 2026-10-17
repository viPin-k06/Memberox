import React, { useCallback, useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import styles from "./Dashboard.module.css";
import { supabase } from "../lib/supabase";

const formatCurrency = (value) =>
  `₹${Number(value || 0).toLocaleString("en-IN", { maximumFractionDigits: 2 })}`;

const localISO = (date) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

const monthKey = (dateString) => dateString?.slice(0, 7);

const dayDifference = (fromISO, toISO) => {
  // Calendar-day arithmetic in UTC avoids DST-related errors.
  const [fy, fm, fd] = fromISO.split("-").map(Number);
  const [ty, tm, td] = toISO.split("-").map(Number);
  return Math.round((Date.UTC(ty, tm - 1, td) - Date.UTC(fy, fm - 1, fd)) / 86400000);
};

const getLastSixMonths = (today) =>
  Array.from({ length: 6 }, (_, index) => {
    const date = new Date(today.getFullYear(), today.getMonth() - 5 + index, 1);
    return {
      key: `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`,
      label: date.toLocaleDateString("en-IN", { month: "short" }),
      amount: 0,
    };
  });

// This chart is self-contained, so RevenueChart.jsx doesn't need any changes.
const RevenueBars = ({ months }) => {
  const max = Math.max(1, ...months.map((month) => month.amount));
  return (
    <div
      role="img"
      aria-label={`Revenue in the last six months: ${months.map((m) => `${m.label} ${formatCurrency(m.amount)}`).join(", ")}`}
      style={{ display: "flex", alignItems: "stretch", gap: "12px", width: "100%", height: "100%", minHeight: 190 }}
    >
      {months.map((month) => (
        <div key={month.key} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", minWidth: 0 }}>
          <div style={{ flex: 1, width: "100%", display: "flex", alignItems: "flex-end", justifyContent: "center", minHeight: 130 }}>
            <div
              title={`${month.label}: ${formatCurrency(month.amount)}`}
              style={{
                width: "min(100%, 45px)",
                height: month.amount > 0 ? `${Math.max(3, (month.amount / max) * 100)}%` : "0%",
                background: "var(--primary, #7C3AED)",
                borderRadius: "6px 6px 0 0",
                transition: "height 200ms ease",
              }}
            />
          </div>
          <span style={{ fontSize: "0.8rem", marginTop: 10 }}>{month.label}</span>
        </div>
      ))}
    </div>
  );
};

const Dashboard = () => {
  const [members, setMembers] = useState([]);
  const [memberships, setMemberships] = useState([]);
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [refreshCount, setRefreshCount] = useState(0);

  const loadDashboard = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const { data: authData, error: authError } = await supabase.auth.getUser();
      if (authError) throw authError;
      if (!authData.user) throw new Error("Please log in again.");

      const { data: org, error: orgError } = await supabase
        .from("organizations")
        .select("id")
        .eq("owner_id", authData.user.id)
        .single();
      if (orgError) throw orgError;

      const [memberResult, membershipResult, paymentResult] = await Promise.all([
        supabase.from("members").select("id, name").eq("organization_id", org.id),
        supabase.from("memberships")
          .select("id, member_id, plan_name, expiry_date, created_at")
          .eq("organization_id", org.id),
        supabase.from("payments")
          .select("id, member_id, membership_id, amount, payment_date, created_at")
          .eq("organization_id", org.id),
      ]);

      const queryError = memberResult.error || membershipResult.error || paymentResult.error;
      if (queryError) throw queryError;

      setMembers(memberResult.data || []);
      setMemberships(membershipResult.data || []);
      setPayments(paymentResult.data || []);
    } catch (err) {
      setError(err.message || "Unable to load dashboard.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadDashboard();
  }, [loadDashboard, refreshCount]);

  const summary = useMemo(() => {
    const now = new Date();
    const today = localISO(now);
    const currentMonth = today.slice(0, 7);
    const monthSeries = getLastSixMonths(now);
    const monthByKey = new Map(monthSeries.map((month) => [month.key, month]));
    const names = new Map(members.map((member) => [member.id, member.name]));
    const cycleById = new Map(memberships.map((cycle) => [cycle.id, cycle]));

    // The most recently created membership cycle determines the current status.
    const latestByMember = new Map();
    for (const membership of memberships) {
      const previous = latestByMember.get(membership.member_id);
      if (!previous || membership.created_at > previous.created_at ||
          (membership.created_at === previous.created_at && membership.id > previous.id)) {
        latestByMember.set(membership.member_id, membership);
      }
    }

    let active = 0;
    let expiring = 0;
    let expired = 0;
    const expiringMembers = [];
    for (const member of members) {
      const cycle = latestByMember.get(member.id);
      if (!cycle?.expiry_date) {
        expired++;
        continue;
      }
      const days = dayDifference(today, cycle.expiry_date);
      if (days < 0) expired++;
      else if (days <= 7) {
        expiring++;
        expiringMembers.push({ id: member.id, name: member.name, days });
      } else active++;
    }
    expiringMembers.sort((a, b) => a.days - b.days || a.name.localeCompare(b.name));

    let monthlyRevenue = 0;
    let monthPaymentCount = 0;
    let allTimeRevenue = 0;
    for (const payment of payments) {
      const amount = Number(payment.amount) || 0;
      allTimeRevenue += amount;
      const key = monthKey(payment.payment_date);
      if (key === currentMonth) {
        monthlyRevenue += amount;
        monthPaymentCount++;
      }
      const month = monthByKey.get(key);
      if (month) month.amount += amount;
    }

    const recentPayments = [...payments]
      .sort((a, b) => b.payment_date.localeCompare(a.payment_date) || b.created_at.localeCompare(a.created_at))
      .slice(0, 5)
      .map((payment) => ({
        ...payment,
        name: names.get(payment.member_id) || "Deleted member",
        plan: cycleById.get(payment.membership_id)?.plan_name || "Membership payment",
      }));

    return {
      total: members.length,
      active,
      expiring,
      expired,
      monthlyRevenue,
      monthPaymentCount,
      allTimeRevenue,
      monthSeries,
      recentPayments,
      expiringMembers: expiringMembers.slice(0, 5),
    };
  }, [members, memberships, payments]);

  return (
    <main className={styles.dashboardMain}>
      <div className={styles.dashboardHeader}>
        <h1>Dashboard</h1>
        <p>Overview of your membership business.</p>
      </div>

      {loading && <p role="status">Loading dashboard...</p>}
      {error && (
        <p role="alert">
          {error}{" "}
          <button type="button" onClick={() => setRefreshCount((value) => value + 1)}>Retry</button>
        </p>
      )}

      {!loading && !error && (
        <>
          <section className={styles.stats}>
            <div className={styles.statCard}><h3>Total Members</h3><p>{summary.total}</p></div>
            <div className={styles.statCard}><h3>Active Members</h3><p>{summary.active}</p></div>
            <div className={styles.statCard}><h3>Expiring Soon</h3><p>{summary.expiring}</p></div>
            <div className={styles.statCard}><h3>Monthly Revenue</h3><p>{formatCurrency(summary.monthlyRevenue)}</p></div>
          </section>

          <section className={styles.dashboardGrid}>
            <div className={styles.dashboardPanel}>
              <div className={styles.panelHeader}><h2>Revenue</h2><span>Last 6 months</span></div>
              <div className={styles.revenueSummary}>
                <strong>{formatCurrency(summary.monthlyRevenue)}</strong>
                <p>Monthly revenue</p>
              </div>
              <div className={styles.revenueChart}>
                <RevenueBars months={summary.monthSeries} />
              </div>
            </div>

            <div className={styles.dashboardSide}>
              <div className={styles.dashboardPanel}>
                <div className={styles.panelHeader}><h2>Memberships</h2><span>Current</span></div>
                <div className={styles.membershipSummary}>
                  <div><strong>{summary.active}</strong><p>Active</p></div>
                  <div><strong>{summary.expiring}</strong><p>Expiring soon</p></div>
                  <div><strong>{summary.expired}</strong><p>Expired</p></div>
                </div>
              </div>
              <div className={styles.dashboardPanel}>
                <div className={styles.panelHeader}>
                  <h2>Payments This Month</h2>
                  <Link to="/payments">View all</Link>
                </div>
                <div className={styles.outstandingSummary}>
                  <strong>{summary.monthPaymentCount}</strong>
                  <p>{formatCurrency(summary.monthlyRevenue)} collected this month</p>
                </div>
              </div>
            </div>
          </section>

          <section className={styles.dashboardGrid}>
            <div className={styles.dashboardPanel}>
              <div className={styles.panelHeader}>
                <h2>Recent Payments</h2>
                <Link to="/payments">View all</Link>
              </div>
              <div className={styles.paymentList}>
                {summary.recentPayments.length === 0 && <p>No payments yet.</p>}
                {summary.recentPayments.map((payment) => (
                  <div key={payment.id} className={styles.paymentItem}>
                    <div><strong>{payment.name}</strong><p>{payment.plan}</p></div>
                    <span>{formatCurrency(payment.amount)}</span>
                  </div>
                ))}
              </div>
            </div>
            <div className={styles.dashboardPanel}>
              <div className={styles.panelHeader}>
                <h2>Expiring Soon</h2>
                <Link to="/members">View all</Link>
              </div>
              <div className={styles.expiryList}>
                {summary.expiringMembers.length === 0 && <p>No memberships expiring in the next 7 days.</p>}
                {summary.expiringMembers.map((member) => (
                  <div key={member.id} className={styles.expiryItem}>
                    <div>
                      <strong>{member.name}</strong>
                      <p>{member.days === 0 ? "Expires today" : `Expires in ${member.days} ${member.days === 1 ? "day" : "days"}`}</p>
                    </div>
                    <span>Upcoming</span>
                  </div>
                ))}
              </div>
            </div>
          </section>
        </>
      )}
    </main>
  );
};

export default Dashboard;
