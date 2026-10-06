import React from "react";
import styles from "./Navbar.module.css";

const Navbar = () => {
  return (
    <nav className={styles.navbar}>
      <div className={styles.logo}>Memberox</div>

      <div className={styles.navLinks}>
        <a href="#features">Features</a>
        <a href="#how-it-works">How it works</a>
        <a href="#pricing">Pricing</a>
        <a href="#">Login</a>
        <a href="#" className={styles.signupButton}>
          Sign Up
        </a>
      </div>
    </nav>
  );
};

export default Navbar;