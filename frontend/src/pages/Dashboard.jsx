import React from "react";
import styles from "./Dashboard.module.css";
import RevenueChart from "../components/RevenueChart";

const Dashboard = () => {
  return (
    <main className={styles.dashboardMain}>
      <div className={styles.dashboardHeader}>
        <h1>Dashboard</h1>
        <p>Overview of your membership business.</p>
      </div>

      <section className={styles.stats}>
        <div className={styles.statCard}>
          <h3>Total Members</h3>
          <p>248</p>
        </div>

        <div className={styles.statCard}>
          <h3>Active Members</h3>
          <p>214</p>
        </div>

        <div className={styles.statCard}>
          <h3>Expiring Soon</h3>
          <p>12</p>
        </div>

        <div className={styles.statCard}>
          <h3>Monthly Revenue</h3>
          <p>₹1,24,500</p>
        </div>
      </section>

      <section className={styles.dashboardGrid}>
        <div className={styles.dashboardPanel}>
          <div className={styles.panelHeader}>
            <h2>Revenue</h2>
            <span>Last 6 months</span>
          </div>

          <div className={styles.revenueSummary}>
            <strong>₹1,24,500</strong>
            <p>Monthly revenue</p>
          </div>

          <div className={styles.revenueChart}>
            <RevenueChart />
          </div>
        </div>

        <div className={styles.dashboardSide}>
          <div className={styles.dashboardPanel}>
            <div className={styles.panelHeader}>
              <h2>Memberships</h2>
              <span>Current</span>
            </div>

            <div className={styles.membershipSummary}>
              <div>
                <strong>214</strong>
                <p>Active</p>
              </div>

              <div>
                <strong>22</strong>
                <p>Expiring soon</p>
              </div>

              <div>
                <strong>12</strong>
                <p>Expired</p>
              </div>
            </div>
          </div>

          <div className={styles.dashboardPanel}>
            <div className={styles.panelHeader}>
              <h2>Outstanding Payments</h2>
              <span>View all</span>
            </div>

            <div className={styles.outstandingSummary}>
              <strong>₹8,450</strong>
              <p>3 payments overdue</p>
            </div>
          </div>
        </div>
      </section>

      <section className={styles.dashboardGrid}>
        <div className={styles.dashboardPanel}>
          <div className={styles.panelHeader}>
            <h2>Recent Payments</h2>
            <span>View all</span>
          </div>

          <div className={styles.paymentList}>
            <div className={styles.paymentItem}>
              <div>
                <strong>Rahul Sharma</strong>
                <p>Premium Membership</p>
              </div>
              <span>₹2,499</span>
            </div>

            <div className={styles.paymentItem}>
              <div>
                <strong>Priya Singh</strong>
                <p>Basic Membership</p>
              </div>
              <span>₹999</span>
            </div>

            <div className={styles.paymentItem}>
              <div>
                <strong>Amit Kumar</strong>
                <p>Premium Membership</p>
              </div>
              <span>₹2,499</span>
            </div>
          </div>
        </div>

        <div className={styles.dashboardPanel}>
          <div className={styles.panelHeader}>
            <h2>Expiring Soon</h2>
            <span>View all</span>
          </div>

          <div className={styles.expiryList}>
            <div className={styles.expiryItem}>
              <div>
                <strong>Neha Verma</strong>
                <p>Expires in 2 days</p>
              </div>
              <span>Notify</span>
            </div>

            <div className={styles.expiryItem}>
              <div>
                <strong>Rohit Mehta</strong>
                <p>Expires in 5 days</p>
              </div>
              <span>Notify</span>
            </div>

            <div className={styles.expiryItem}>
              <div>
                <strong>Karan Singh</strong>
                <p>Expires in 7 days</p>
              </div>
              <span>Notify</span>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
};

export default Dashboard;
