import { useCallback, useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import {
  UsersRound,
  UserRoundCheck,
  Clock3,
  IndianRupee,
  ArrowUpRight,
  CreditCard,
  CalendarClock,
  Activity,
  Sparkles,
  RefreshCw,
} from "lucide-react";
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
  return Math.round(
    (Date.UTC(ty, tm - 1, td) - Date.UTC(fy, fm - 1, fd)) / 86400000,
  );
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
  const ticks = [1, 0.75, 0.5, 0.25, 0];

  return (
    <div
      className={styles.chart}
      role="img"
      aria-label={`Revenue in the last six months: ${months.map((month) => `${month.label} ${formatCurrency(month.amount)}`).join(", ")}`}
    >
      <div className={styles.chartScale} aria-hidden="true">
        {ticks.map((tick) => (
          <span key={tick}>{formatCurrency(Math.round(max * tick))}</span>
        ))}
      </div>
      <div className={styles.chartPlot} aria-hidden="true">
        <div className={styles.chartGrid}>
          {ticks.map((tick) => (
            <span key={tick} />
          ))}
        </div>
        <div className={styles.chartBars}>
          {months.map((month) => (
            <div className={styles.chartColumn} key={month.key}>
              <div className={styles.chartBarTrack}>
                <div
                  className={styles.chartBar}
                  style={{ height: `${(month.amount / max) * 100}%` }}
                  title={`${month.label}: ${formatCurrency(month.amount)}`}
                />
              </div>
              <span className={styles.chartMonth}>{month.label}</span>
            </div>
          ))}
        </div>
      </div>
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
    try {
      const { data: authData, error: authError } =
        await supabase.auth.getUser();
      if (authError) throw authError;
      if (!authData.user) throw new Error("Please log in again.");

      const { data: org, error: orgError } = await supabase
        .from("organizations")
        .select("id")
        .eq("owner_id", authData.user.id)
        .single();
      if (orgError) throw orgError;

      const [memberResult, membershipResult, paymentResult] = await Promise.all(
        [
          supabase
            .from("members")
            .select("id, name")
            .eq("organization_id", org.id),
          supabase
            .from("memberships")
            .select("id, member_id, plan_name, expiry_date, created_at")
            .eq("organization_id", org.id),
          supabase
            .from("payments")
            .select(
              "id, member_id, membership_id, amount, payment_date, created_at",
            )
            .eq("organization_id", org.id),
        ],
      );

      const queryError =
        memberResult.error || membershipResult.error || paymentResult.error;
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
    // Fetching page data when the component mounts is intentional.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    loadDashboard();
  }, [loadDashboard, refreshCount]);

  const refreshDashboard = () => {
    setLoading(true);
    setError("");
    setRefreshCount((value) => value + 1);
  };

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
      if (
        !previous ||
        membership.created_at > previous.created_at ||
        (membership.created_at === previous.created_at &&
          membership.id > previous.id)
      ) {
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
    expiringMembers.sort(
      (a, b) => a.days - b.days || a.name.localeCompare(b.name),
    );

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
      .sort(
        (a, b) =>
          b.payment_date.localeCompare(a.payment_date) ||
          b.created_at.localeCompare(a.created_at),
      )
      .slice(0, 5)
      .map((payment) => ({
        ...payment,
        name: names.get(payment.member_id) || "Deleted member",
        plan:
          cycleById.get(payment.membership_id)?.plan_name ||
          "Membership payment",
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

  const stats = [
    {
      label: "Total members",
      value: summary.total,
      detail: "Registered members",
      icon: UsersRound,
      tone: "violet",
    },
    {
      label: "Active members",
      value: summary.active,
      detail: "Memberships in good standing",
      icon: UserRoundCheck,
      tone: "teal",
    },
    {
      label: "Expiring soon",
      value: summary.expiring,
      detail: "Within the next 7 days",
      icon: Clock3,
      tone: "orange",
    },
    {
      label: "Monthly revenue",
      value: formatCurrency(summary.monthlyRevenue),
      detail: "Payments recorded this month",
      icon: IndianRupee,
      tone: "pink",
    },
  ];

  return (
    <main className={styles.dashboardMain}>
      <header className={styles.dashboardHeader}>
        <div>
          <span className={styles.eyebrow}>
            <Activity size={15} /> BUSINESS OVERVIEW
          </span>
          <h1>Dashboard</h1>
          <p>Keep your members, revenue, and renewals in view.</p>
        </div>
        <button
          type="button"
          className={styles.refreshButton}
          onClick={refreshDashboard}
          disabled={loading}
        >
          <RefreshCw size={17} /> Refresh
        </button>
      </header>

      {loading && (
        <p className={styles.feedback} role="status">
          Loading dashboard...
        </p>
      )}
      {error && (
        <div className={styles.feedback} role="alert">
          {error}{" "}
          <button type="button" onClick={refreshDashboard}>
            Retry
          </button>
        </div>
      )}

      {!loading && !error && (
        <>
          <section className={styles.hero} aria-label="Business summary">
            <div className={styles.heroContent}>
              <span className={styles.heroEyebrow}>
                <Sparkles size={15} /> YOUR BUSINESS AT A GLANCE
              </span>
              <h2>Every member matters. Every renewal counts.</h2>
              <p>
                Track what is happening across your membership business, all in
                one place.
              </p>
              <Link to="/members" className={styles.heroLink}>
                Manage members <ArrowUpRight size={17} />
              </Link>
            </div>
            <div className={styles.heroArt} aria-hidden="true">
              <div className={styles.heroOrbOne} />
              <div className={styles.heroOrbTwo} />
              <div className={styles.heroMiniCard}>
                <span>Members registered</span>
                <strong>{summary.total}</strong>
                <span>{summary.active} active</span>
              </div>
            </div>
          </section>

          <section className={styles.stats} aria-label="Key metrics">
            {stats.map(({ label, value, detail, icon: Icon, tone }) => (
              <div key={label} className={`${styles.statCard} ${styles[tone]}`}>
                <div className={styles.statTop}>
                  <span className={styles.statIcon}>
                    <Icon size={21} strokeWidth={2} />
                  </span>
                  <ArrowUpRight size={17} className={styles.statArrow} />
                </div>
                <h3>{label}</h3>
                <p>{value}</p>
                <span className={styles.statDetail}>{detail}</span>
              </div>
            ))}
          </section>

          <section className={styles.dashboardGrid}>
            <div className={`${styles.dashboardPanel} ${styles.revenuePanel}`}>
              <div className={styles.panelHeader}>
                <div>
                  <span className={styles.panelKicker}>FINANCIAL OVERVIEW</span>
                  <h2>Revenue analytics</h2>
                </div>
                <span className={styles.periodPill}>Last 6 months</span>
              </div>
              <div className={styles.revenueSummary}>
                <strong>{formatCurrency(summary.monthlyRevenue)}</strong>
                <p>Collected this month</p>
              </div>
              <div className={styles.revenueChart}>
                <RevenueBars months={summary.monthSeries} />
              </div>
            </div>

            <div className={styles.dashboardSide}>
              <div className={styles.dashboardPanel}>
                <div className={styles.panelHeader}>
                  <div>
                    <span className={styles.panelKicker}>MEMBER HEALTH</span>
                    <h2>Memberships</h2>
                  </div>
                  <span className={styles.panelIcon}>
                    <UsersRound size={19} />
                  </span>
                </div>
                <div className={styles.membershipSummary}>
                  <div>
                    <strong>{summary.active}</strong>
                    <p>Active</p>
                    <span className={styles.membershipDotActive} />
                  </div>
                  <div>
                    <strong>{summary.expiring}</strong>
                    <p>Expiring</p>
                    <span className={styles.membershipDotExpiring} />
                  </div>
                  <div>
                    <strong>{summary.expired}</strong>
                    <p>Expired</p>
                    <span className={styles.membershipDotExpired} />
                  </div>
                </div>
                <Link to="/memberships" className={styles.panelAction}>
                  View memberships <ArrowUpRight size={16} />
                </Link>
              </div>
              <div
                className={`${styles.dashboardPanel} ${styles.paymentsPanel}`}
              >
                <div className={styles.panelHeader}>
                  <div>
                    <span className={styles.panelKicker}>PAYMENT ACTIVITY</span>
                    <h2>Payments this month</h2>
                  </div>
                  <span className={styles.panelIcon}>
                    <CreditCard size={19} />
                  </span>
                </div>
                <div className={styles.outstandingSummary}>
                  <strong>{summary.monthPaymentCount}</strong>
                  <p>Payments recorded</p>
                  <span className={styles.paymentAmount}>
                    {formatCurrency(summary.monthlyRevenue)} collected
                  </span>
                </div>
                <Link to="/payments" className={styles.panelAction}>
                  View payments <ArrowUpRight size={16} />
                </Link>
              </div>
            </div>
          </section>

          <section className={`${styles.dashboardGrid} ${styles.activityGrid}`}>
            <div className={styles.dashboardPanel}>
              <div className={styles.panelHeader}>
                <div>
                  <span className={styles.panelKicker}>LATEST ACTIVITY</span>
                  <h2>Recent payments</h2>
                </div>
                <Link to="/payments" className={styles.viewAll}>
                  View all <ArrowUpRight size={15} />
                </Link>
              </div>
              <div className={styles.paymentList}>
                {summary.recentPayments.length === 0 && (
                  <p className={styles.emptyState}>No payments recorded yet.</p>
                )}
                {summary.recentPayments.map((payment) => (
                  <div key={payment.id} className={styles.paymentItem}>
                    <div className={styles.memberAvatar}>
                      {payment.name.trim().charAt(0).toUpperCase() || "?"}
                    </div>
                    <div className={styles.activityInfo}>
                      <strong>{payment.name}</strong>
                      <p>{payment.plan}</p>
                    </div>
                    <span className={styles.paymentValue}>
                      +{formatCurrency(payment.amount)}
                    </span>
                  </div>
                ))}
              </div>
            </div>
            <div className={styles.dashboardPanel}>
              <div className={styles.panelHeader}>
                <div>
                  <span className={styles.panelKicker}>RENEWAL WATCH</span>
                  <h2>Expiring soon</h2>
                </div>
                <Link to="/members" className={styles.viewAll}>
                  View all <ArrowUpRight size={15} />
                </Link>
              </div>
              <div className={styles.expiryList}>
                {summary.expiringMembers.length === 0 && (
                  <p className={styles.emptyState}>
                    No memberships expiring in the next 7 days.
                  </p>
                )}
                {summary.expiringMembers.map((member) => (
                  <div key={member.id} className={styles.expiryItem}>
                    <div className={styles.expiryIcon}>
                      <CalendarClock size={19} />
                    </div>
                    <div className={styles.activityInfo}>
                      <strong>{member.name}</strong>
                      <p>
                        {member.days === 0
                          ? "Expires today"
                          : `Expires in ${member.days} ${member.days === 1 ? "day" : "days"}`}
                      </p>
                    </div>
                    <span className={styles.upcomingBadge}>
                      {member.days === 0 ? "Today" : "Upcoming"}
                    </span>
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
