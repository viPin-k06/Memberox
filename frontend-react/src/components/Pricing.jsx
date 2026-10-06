import React from "react";
import styles from "./Pricing.module.css";

const Pricing = () => {
  return (
    <section id="pricing" className={styles.pricing}>
      <p className={styles.pricingLabel}>Pricing</p>

      <h2 className={styles.pricingTitle}>
        Simple plans for growing businesses.
      </h2>

      <p className={styles.pricingDescription}>
        Choose a plan that fits the way you manage your members.
      </p>

      <div className={styles.pricingCards}>
        <div className={`${styles.pricingCard} ${styles.featured}`}>
          <h3>Pro</h3>

          <p className={styles.price}>
            ₹499<span>/month</span>
          </p>

          <p>For businesses managing more members.</p>

          <ul>
            <li>Up to 500 members</li>
            <li>Renewal reminders</li>
            <li>Payment tracking</li>
            <li>Member communication</li>
          </ul>

          <button>Get Started</button>
        </div>

        <div className={styles.pricingCard}>
          <h3>Business</h3>

          <p className={styles.price}>
            ₹999<span>/month</span>
          </p>

          <p>For businesses with larger memberships.</p>

          <ul>
            <li>Unlimited members</li>
            <li>Renewal reminders</li>
            <li>Advanced management</li>
            <li>Priority support</li>
          </ul>

          <button>Get Started</button>
        </div>
      </div>
    </section>
  );
};

export default Pricing;