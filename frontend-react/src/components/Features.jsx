import React from "react";
import styles from "./Features.module.css";

const Features = () => {
  return (
    <section id="features" className={styles.features}>
      <p className={styles.featuresLabel}>Why Memberox?</p>

      <h2 className={styles.featuresTitle}>
        Everything you need to manage your members.
      </h2>

      <p className={styles.featuresDescription}>
        Manage memberships, payments, renewals, and communication in one simple
        place.
      </p>

      <div className={styles.featureCards}>
        <div className={styles.featureCard}>
          <h3>Membership Management</h3>
          <p>Keep all your member information organized in one place.</p>
        </div>

        <div className={styles.featureCard}>
          <h3>Payment Tracking</h3>
          <p>Track payments and quickly see which members have pending dues.</p>
        </div>

        <div className={styles.featureCard}>
          <h3>Renewal Reminders</h3>
          <p>Know when memberships are expiring and stay ahead of renewals.</p>
        </div>

        <div className={styles.featureCard}>
          <h3>Member Communication</h3>
          <p>Keep your member communication simple and organized.</p>
        </div>
      </div>
    </section>
  );
};

export default Features;
