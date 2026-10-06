import React from "react";
import styles from "./Cta.module.css";

const Cta = () => {
  return (
    <section className={styles.cta}>
      <p className={styles.ctaLabel}>Get started today</p>

      <h2 className={styles.ctaTitle}>
        Ready to simplify your membership management?
      </h2>

      <p className={styles.ctaDescription}>
        Manage your members, payments, and renewals from one simple place.
      </p>

      <button className={styles.ctaButton}>Get Started</button>
    </section>
  );
};

export default Cta;