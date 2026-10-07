import React, { useState } from "react";
import { Link } from "react-router-dom";
import { Menu } from "lucide-react";
import styles from "./Navbar.module.css";

const Navbar = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  return (
    <nav className={styles.navbar}>
      <Link to="/" className={styles.logo}>
        Memberox
      </Link>

      <button
        className={styles.menuToggle}
        onClick={() => {
          setIsMenuOpen(!isMenuOpen);
        }}
        aria-label="Toggle navigation menu"
      >
        <Menu />
      </button>

      <div
        className={`${styles.navLinks} ${
          isMenuOpen ? styles.navLinksOpen : ""
        }`}
      >
        <a href="#features">Features</a>
        <a href="#how-it-works">How it works</a>
        <a href="#pricing">Pricing</a>

        <Link to="/login">Login</Link>

        <Link to="/signup" className={styles.signupButton}>
          Sign Up
        </Link>
      </div>
    </nav>
  );
};

export default Navbar;
