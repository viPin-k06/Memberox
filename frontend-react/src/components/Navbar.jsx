import React, { useState } from "react";
import { Menu } from "lucide-react";
import styles from "./Navbar.module.css";

const Navbar = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  return (
    <nav className={styles.navbar}>
      <div className={styles.logo}>Memberox</div>

      <button
        className={styles.menuToggle}
        onClick={() => {
          setIsMenuOpen(!isMenuOpen);
        }}
      >
        <Menu />
      </button>

      <div
        className={`${styles.navLinks} ${isMenuOpen ? styles.navLinksOpen : ""}`}
      >
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
