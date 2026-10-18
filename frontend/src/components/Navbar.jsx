import { useState } from "react";
import { Link } from "react-router-dom";
import { ArrowUpRight, Menu, X } from "lucide-react";
import styles from "./Navbar.module.css";

const Navbar = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const closeMenu = () => setIsMenuOpen(false);

  return (
    <header className={styles.navbar}>
      <nav className={styles.navInner} aria-label="Main navigation">
        <Link to="/" className={styles.logo} onClick={closeMenu}>
          <span className={styles.logoMark} aria-hidden="true">
            M
          </span>
          <span>Memberox</span>
        </Link>

        <button
          type="button"
          className={styles.menuToggle}
          onClick={() => setIsMenuOpen((open) => !open)}
          aria-label={
            isMenuOpen ? "Close navigation menu" : "Open navigation menu"
          }
          aria-expanded={isMenuOpen}
          aria-controls="memberox-nav-links"
        >
          {isMenuOpen ? <X size={22} /> : <Menu size={22} />}
        </button>

        <div
          id="memberox-nav-links"
          className={`${styles.navLinks} ${isMenuOpen ? styles.navLinksOpen : ""}`}
        >
          <div className={styles.sectionLinks}>
            <a href="#features" onClick={closeMenu}>
              Features
            </a>
            <a href="#how-it-works" onClick={closeMenu}>
              How it works
            </a>
            <a href="#pricing" onClick={closeMenu}>
              Pricing
            </a>
          </div>
          <div className={styles.accountLinks}>
            <Link to="/login" className={styles.loginLink} onClick={closeMenu}>
              Log in
            </Link>
            <Link
              to="/signup"
              className={styles.signupButton}
              onClick={closeMenu}
            >
              Get started <ArrowUpRight size={17} aria-hidden="true" />
            </Link>
          </div>
        </div>
      </nav>
    </header>
  );
};

export default Navbar;
