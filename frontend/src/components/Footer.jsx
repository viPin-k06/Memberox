import { Link } from "react-router-dom";
import { ArrowUpRight, ArrowRight } from "lucide-react";
import styles from "./Footer.module.css";

const Footer = () => {
  return (
    <footer className={styles.footer}>
      <div className={styles.container}>
        <div className={styles.footerMain}>
          <div className={styles.brandSection}>
            <Link to="/" className={styles.brand}>
              <span className={styles.logoMark}>M</span>
              <span className={styles.logoText}>Memberox</span>
            </Link>

            <p className={styles.tagline}>
              A little less admin.
              <br />A lot more room to grow.
            </p>

            <span className={styles.brandCaption}>
              Built for membership-based businesses.
            </span>
          </div>

          <div className={styles.linkGroups}>
            <div className={styles.linkGroup}>
              <h3>Explore</h3>

              <a href="#features">Features</a>
              <a href="#how-it-works">How it works</a>
              <a href="#pricing">Pricing</a>
            </div>

            <div className={styles.linkGroup}>
              <h3>Get started</h3>

              <Link to="/login">Log in</Link>
              <Link to="/signup">Create an account</Link>
            </div>

            <div className={styles.footerAction}>
              <span className={styles.actionLabel}>YOUR WORKSPACE AWAITS</span>

              <p>Ready to get started?</p>

              <Link to="/signup" className={styles.actionLink}>
                Join Memberox
                <ArrowUpRight size={18} />
              </Link>
            </div>
          </div>
        </div>

        <div className={styles.footerBottom}>
          <p>© {new Date().getFullYear()} Memberox. All rights reserved.</p>

          <a href="#" className={styles.backToTop}>
            Back to top
            <ArrowRight size={15} />
          </a>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
