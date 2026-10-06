import React from "react";
import styles from "./Dashboard.module.css";

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
    </main>
  );
};

export default Dashboard;