import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { ArrowRight, Check, Eye, EyeOff, LockKeyhole } from "lucide-react";

import { supabase } from "../lib/supabase";
import styles from "./Auth.module.css";

const Login = () => {
  const navigate = useNavigate();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const submitHandler = async (e) => {
    e.preventDefault();

    if (!email.trim() || !password.trim()) {
      setError("Please enter your email and password.");
      return;
    }

    setError("");
    setLoading(true);

    try {
      const { data, error: loginError } =
        await supabase.auth.signInWithPassword({
          email: email.trim(),
          password,
        });

      if (loginError) {
        throw loginError;
      }

      if (!data.session) {
        throw new Error("Unable to log in. Please try again.");
      }

      navigate("/dashboard", { replace: true });
    } catch (err) {
      setError(err.message || "Login failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className={styles.authPage}>
      {/* LEFT BRANDING PANEL */}
      <section className={styles.brandSection}>
        <Link to="/" className={styles.logo}>
          <span className={styles.logoMark}>M</span>
          <span>Memberox</span>
        </Link>

        <div className={styles.brandContent}>
          <span className={styles.badge}>
            <span className={styles.badgeDot} />
            BUILT FOR GROWING BUSINESSES
          </span>

          <h1>
            Your business.
            <br />
            <span>Better organized.</span>
          </h1>

          <p>
            Everything you need to manage memberships, track renewals, and stay
            on top of your business — all in one place.
          </p>

          <div className={styles.benefits}>
            <div>
              <span className={styles.benefitIcon}>
                <Check size={17} />
              </span>
              <p>All your members in one workspace</p>
            </div>

            <div>
              <span className={styles.benefitIcon}>
                <Check size={17} />
              </span>
              <p>Stay ahead of membership expiries</p>
            </div>

            <div>
              <span className={styles.benefitIcon}>
                <Check size={17} />
              </span>
              <p>Keep your records organized</p>
            </div>
          </div>
        </div>

        <div className={styles.brandFooter}>
          <span>© 2026 Memberox</span>
          <span>Made for businesses in India</span>
        </div>
      </section>

      {/* RIGHT LOGIN PANEL */}
      <section className={styles.formSection}>
        <div className={styles.formContainer}>
          <div className={styles.mobileLogo}>
            <Link to="/">
              <span className={styles.logoMark}>M</span>
              <span>Memberox</span>
            </Link>
          </div>

          <div className={styles.formHeader}>
            <span className={styles.eyebrow}>WELCOME BACK</span>

            <h2>Log in to your account</h2>

            <p>Enter your credentials to access your Memberox dashboard.</p>
          </div>

          <form onSubmit={submitHandler} className={styles.form}>
            {error && (
              <div className={styles.error} role="alert">
                {error}
              </div>
            )}

            <label className={styles.field}>
              <span>Email address</span>

              <input
                type="email"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                autoComplete="email"
                required
              />
            </label>

            <div className={styles.field}>
              <div className={styles.fieldHeading}>
                <label htmlFor="password">Password</label>

                <Link to="/forgot-password" className={styles.forgotButton}>
                  Forgot password?
                </Link>
              </div>

              <div className={styles.passwordField}>
                <input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="Enter your password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  autoComplete="current-password"
                  required
                />

                <button
                  type="button"
                  className={styles.passwordToggle}
                  onClick={() => setShowPassword((prev) => !prev)}
                  aria-label={showPassword ? "Hide password" : "Show password"}
                  aria-pressed={showPassword}
                >
                  {showPassword ? <EyeOff size={19} /> : <Eye size={19} />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              className={styles.submitButton}
              disabled={loading}
            >
              <span>{loading ? "Logging in..." : "Log in"}</span>

              {!loading && <ArrowRight size={18} />}
            </button>
          </form>

          <p className={styles.switchText}>
            New to Memberox? <Link to="/signup">Create an account</Link>
          </p>

          <div className={styles.formFooter}>
            <LockKeyhole size={15} />
            <span>Secure account authentication</span>
          </div>
        </div>
      </section>
    </main>
  );
};

export default Login;
