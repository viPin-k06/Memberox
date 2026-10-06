import React from "react";
import styles from "./Footer.module.css";

const Footer = () => {
  return (
    <footer className={styles.footer}>
      <div className={styles.footerContent}>
        <div className={styles.footerBrand}>
          <div className={styles.logo}>Memberox</div>
          <p>Manage your members, payments, and renewals in one place.</p>
        </div>

        <div className={styles.footerLinks}>
          <div>
            <h3>Product</h3>
            <a href="#features">Features</a>
            <a href="#how-it-works">How it works</a>
            <a href="#pricing">Pricing</a>
          </div>

          <div>
            <h3>Company</h3>
            <a href="#">About</a>
            <a href="#">Contact</a>
          </div>
        </div>
      </div>

      <div className={styles.footerBottom}>
        <p>© 2026 Memberox. All rights reserved.</p>
      </div>
    </footer>
  );
};

export default Footer;
