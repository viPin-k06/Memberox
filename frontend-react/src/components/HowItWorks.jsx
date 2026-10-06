import React from "react";
import styles from "./HowItWorks.module.css";

const HowItWorks = () => {
  return (
    <section id="how-it-works" className={styles.howItWorks}>
      <p className={styles.howLabel}>How it works</p>

      <h2 className={styles.howTitle}>
        Manage your members in three simple steps.
      </h2>

      <div className={styles.steps}>
        <div className={styles.step}>
          <span className={styles.stepNumber}>01</span>
          <h3>Add your members</h3>
          <p>Keep your member information organized in one place.</p>
        </div>

        <div className={styles.step}>
          <span className={styles.stepNumber}>02</span>
          <h3>Manage memberships</h3>
          <p>Track active memberships, payments, and upcoming renewals.</p>
        </div>

        <div className={styles.step}>
          <span className={styles.stepNumber}>03</span>
          <h3>Stay on top of renewals</h3>
          <p>Know who needs attention before their membership expires.</p>
        </div>
      </div>
    </section>
  );
};

export default HowItWorks;
