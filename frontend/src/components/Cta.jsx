import React from "react";
import styles from "./Cta.module.css";
import { Link } from "react-router-dom";

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

      <Link to="/signup" className={styles.ctaButton}>
        Get Started
      </Link>
    </section>
  );
};

export default Cta;
