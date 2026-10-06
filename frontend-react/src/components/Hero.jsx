import React from "react";
import styles from "./Hero.module.css";

const Hero = () => {
  return (
    <section className={styles.hero}>
      <p className={styles.heroLabel}>Your memberships, organized</p>

      <h1 className={styles.heroTitle}>
        Spend less time managing. More time growing.
      </h1>

      <p className={styles.heroDescription}>
        Keep track of memberships, payments, renewals and member communication
        in one place.
      </p>

      <button className={styles.heroButton}>Get Started</button>
    </section>
  );
};

export default Hero;
