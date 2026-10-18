import styles from "./Hero.module.css";
import { Link } from "react-router-dom";

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

      <Link to="/signup" className={styles.heroButton}>
        Get Started
      </Link>
    </section>
  );
};

export default Hero;
