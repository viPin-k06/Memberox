import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Eye, EyeOff } from "lucide-react";
import styles from "./Auth.module.css";

const Login = () => {
  const navigate = useNavigate();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");

  const submitHandler = (e) => {
    e.preventDefault();

    if (!email.trim() || !password.trim()) {
      setError("Please enter your email and password.");
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
          <span className={styles.badge}>
            Membership management made simple
          </span>

          <h1>Run your gym without the membership chaos.</h1>

          <p>
            Keep members, payments, renewals and reminders organized in one
            simple dashboard.
          </p>

          <div className={styles.benefits}>
            <div>
              <span>01</span>
              <p>Manage all your members in one place</p>
            </div>

            <div>
              <span>02</span>
              <p>Track payments and membership renewals</p>
            </div>

            <div>
              <span>03</span>
              <p>Never miss an upcoming membership expiry</p>
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
            <span className={styles.eyebrow}>Welcome back</span>

            <h2>Log in to Memberox</h2>

            <p>Enter your details to access your dashboard.</p>
          </div>

          <form onSubmit={submitHandler} className={styles.form}>
            {error && <div className={styles.error}>{error}</div>}

            <label className={styles.field}>
              <span>Email address</span>

              <input
                type="email"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                autoComplete="email"
              />
            </label>

            <div className={styles.field}>
              <label htmlFor="password">Password</label>

              <div className={styles.passwordField}>
                <input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="Enter your password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  autoComplete="current-password"
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

              <button
                type="button"
                className={styles.forgotButton}
                onClick={() =>
                  alert("Password reset will be added with the backend.")
                }
              >
                Forgot password?
              </button>
            </div>

            <button type="submit" className={styles.submitButton}>
              Log In
            </button>
          </form>

          <p className={styles.switchText}>
            Don't have an account?{" "}
            <Link to="/signup">Create an account</Link>
          </p>
        </div>
      </section>
    </main>
  );
};

export default Login;