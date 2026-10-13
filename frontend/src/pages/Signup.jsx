import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Eye, EyeOff } from "lucide-react";
import styles from "./Auth.module.css";

const Signup = () => {
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    ownerName: "",
    gymName: "",
    email: "",
    mobile: "",
    password: "",
  });

  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");

  const inputHandler = (e) => {
    const { name, value } = e.target;

    setFormData((current) => ({
      ...current,
      [name]: value,
    }));
  };

  const submitHandler = (e) => {
    e.preventDefault();

    const { ownerName, gymName, email, mobile, password } = formData;

    if (
      !ownerName.trim() ||
      !gymName.trim() ||
      !email.trim() ||
      !mobile.trim() ||
      !password.trim()
    ) {
      setError("Please complete all the fields.");
      return;
    }

    if (mobile.length < 10) {
      setError("Please enter a valid mobile number.");
      return;
    }

    if (password.length < 6) {
      setError("Password must contain at least 6 characters.");
      return;
    }

    setError("");

    // Temporary until backend authentication is connected.
    navigate("/dashboard");
  };

  return (
    <main className={styles.authPage}>
      <section className={styles.brandSection}>
        <Link to="/" className={styles.logo}>
          Memberox
        </Link>

        <div className={styles.brandContent}>
          <span className={styles.badge}>Built for membership businesses</span>

          <h1>Spend less time managing records. More time growing.</h1>

          <p>
            Memberox gives gyms and membership businesses a simple way to manage
            members, payments and renewals.
          </p>

          <div className={styles.benefits}>
            <div>
              <span>01</span>
              <p>Quick member onboarding</p>
            </div>

            <div>
              <span>02</span>
              <p>Clear payment and revenue tracking</p>
            </div>

            <div>
              <span>03</span>
              <p>Automatic renewal visibility</p>
            </div>
          </div>
        </div>

        <p className={styles.brandFooter}>© 2026 Memberox</p>
      </section>

      <section className={styles.formSection}>
        <div className={styles.formContainer}>
          <div className={styles.mobileLogo}>
            <Link to="/">Memberox</Link>
          </div>

          <div className={styles.formHeader}>
            <span className={styles.eyebrow}>Get started</span>
            <h2>Create your account</h2>
            <p>Set up your Memberox workspace in a few seconds.</p>
          </div>

          <form onSubmit={submitHandler} className={styles.form}>
            {error && <div className={styles.error}>{error}</div>}

            <div className={styles.twoColumns}>
              <label className={styles.field}>
                <span>Your name</span>

                <input
                  type="text"
                  name="ownerName"
                  placeholder="Your full name"
                  value={formData.ownerName}
                  onChange={inputHandler}
                  autoComplete="name"
                />
              </label>

              <label className={styles.field}>
                <span>Gym / business name</span>

                <input
                  type="text"
                  name="gymName"
                  placeholder="Your gym name"
                  value={formData.gymName}
                  onChange={inputHandler}
                />
              </label>
            </div>

            <label className={styles.field}>
              <span>Email address</span>

              <input
                type="email"
                name="email"
                placeholder="you@example.com"
                value={formData.email}
                onChange={inputHandler}
                autoComplete="email"
              />
            </label>

            <label className={styles.field}>
              <span>Mobile number</span>

              <input
                type="tel"
                name="mobile"
                placeholder="Enter mobile number"
                value={formData.mobile}
                onChange={inputHandler}
                autoComplete="tel"
              />
            </label>

            <label className={styles.field}>
              <span>Password</span>

              <div className={styles.passwordField}>
                <input
                  type={showPassword ? "text" : "password"}
                  name="password"
                  placeholder="Minimum 6 characters"
                  value={formData.password}
                  onChange={inputHandler}
                  autoComplete="new-password"
                />

                <button
                  type="button"
                  className={styles.passwordToggle}
                  onClick={() => setShowPassword(!showPassword)}
                  aria-label={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? <EyeOff size={19} /> : <Eye size={19} />}
                </button>
              </div>
            </label>

            <p className={styles.terms}>
              By creating an account, you agree to Memberox's Terms of Service
              and Privacy Policy.
            </p>

            <button type="submit" className={styles.submitButton}>
              Create Account
            </button>
          </form>

          <p className={styles.switchText}>
            Already have an account? <Link to="/login">Log in</Link>
          </p>
        </div>
      </section>
    </main>
  );
};

export default Signup;
