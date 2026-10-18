import { Link } from "react-router-dom";
import { ArrowRight, Sparkles, Check } from "lucide-react";
import styles from "./Cta.module.css";

const Cta = () => {
  return (
    <section className={styles.cta}>
      <div className={styles.container}>
        <div className={styles.panel}>
          <div className={styles.glowOne} aria-hidden="true" />
          <div className={styles.glowTwo} aria-hidden="true" />

          <div className={styles.content}>
            <span className={styles.eyebrow}>
              <Sparkles size={15} />
              READY WHEN YOU ARE
            </span>

            <h2>
              Your next chapter
              <br />
              starts here.
            </h2>

            <p>
              Give your business a better way to stay organized. Start building
              your Memberox workspace today.
            </p>

            <Link to="/signup" className={styles.button}>
              Create your account
              <ArrowRight size={19} />
            </Link>

            <div className={styles.bottomText}>
              <Check size={15} />
              Set up your workspace in a few simple steps
            </div>
          </div>

          <div className={styles.decoration} aria-hidden="true">
            <div className={styles.orbitOne} />
            <div className={styles.orbitTwo} />
            <div className={styles.orbitThree} />
            <div className={styles.centerCircle}>M</div>
            <span className={`${styles.dot} ${styles.dotOne}`} />
            <span className={`${styles.dot} ${styles.dotTwo}`} />
            <span className={`${styles.dot} ${styles.dotThree}`} />
          </div>
        </div>
      </div>
    </section>
  );
};

export default Cta;
