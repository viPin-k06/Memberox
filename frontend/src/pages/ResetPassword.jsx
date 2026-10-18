import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  ArrowLeft,
  CheckCircle2,
  Eye,
  EyeOff,
  LockKeyhole,
} from "lucide-react";

import { supabase } from "../lib/supabase";
import styles from "./Auth.module.css";

const ResetPassword = () => {
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const [checking, setChecking] = useState(true);
  const [canReset, setCanReset] = useState(false);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event) => {
      if (event === "PASSWORD_RECOVERY") {
        setCanReset(true);
        setChecking(false);
        setError("");
      }

      if (event === "INITIAL_SESSION") {
        setChecking(false);
      }

      if (event === "SIGNED_OUT") {
        setCanReset(false);
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const submitHandler = async (e) => {
    e.preventDefault();

    if (!canReset) {
      setError("Please use a valid password-reset link.");
      return;
    }

    if (password.length < 8) {
      setError("Password must contain at least 8 characters.");
      return;
    }

    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    setError("");
    setLoading(true);

    try {
      const { error: updateError } = await supabase.auth.updateUser({
        password,
      });

      if (updateError) {
        throw updateError;
      }

      setSuccess(true);
      setCanReset(false);
      setPassword("");
      setConfirmPassword("");

      const { error: signOutError } = await supabase.auth.signOut();

      if (signOutError) {
        console.error("Password updated, but sign-out failed:", signOutError);
      }
    } catch (err) {
      setError(
        err.message || "Unable to update your password. Please try again.",
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className={styles.authPage}>
      {/* LEFT BRANDING SECTION */}
      <section className={styles.brandSection}>
        <Link to="/" className={styles.logo}>
          <span className={styles.logoMark}>M</span>
          <span>Memberox</span>
        </Link>

        <div className={styles.brandContent}>
          <span className={styles.badge}>SECURE ACCOUNT RECOVERY</span>

          <h1>
            A fresh start.
            <br />
            <span>Same great workspace.</span>
          </h1>

          <p>
            Create a new password and securely regain access to your Memberox
            account.
          </p>

          <div className={styles.benefits}>
            <div>
              <span>01</span>
              <p>Open your secure recovery link</p>
            </div>

            <div>
              <span>02</span>
              <p>Choose and confirm a new password</p>
            </div>

            <div>
              <span>03</span>
              <p>Log in with your updated password</p>
            </div>
          </div>
        </div>

        <p className={styles.brandFooter}>© 2026 Memberox</p>
      </section>

      {/* RIGHT FORM SECTION */}
      <section className={styles.formSection}>
        <div className={styles.formContainer}>
          <div className={styles.mobileLogo}>
            <Link to="/">Memberox</Link>
          </div>

          <div className={styles.formHeader}>
            <span className={styles.eyebrow}>ACCOUNT SECURITY</span>

            <h2>{success ? "Password updated!" : "Create a new password"}</h2>

            <p>
              {success
                ? "Your password has been changed successfully."
                : "Choose a secure password for your Memberox account."}
            </p>
          </div>

          {success ? (
            <div>
              <div
                role="status"
                style={{
                  padding: "1.25rem",
                  borderRadius: "0.8rem",
                  background: "#f0fdf4",
                  color: "#166534",
                  marginBottom: "1.5rem",
                  lineHeight: 1.7,
                }}
              >
                <CheckCircle2 size={28} />

                <p>
                  Your password has been updated. You can now log in using your
                  new credentials.
                </p>
              </div>

              <Link
                to="/login"
                className={styles.submitButton}
                style={{ textDecoration: "none" }}
              >
                Go to login
              </Link>
            </div>
          ) : checking ? (
            <p>Verifying your recovery link...</p>
          ) : !canReset ? (
            <div>
              <div className={styles.error} role="alert">
                This page requires a valid password-reset link. Your link may
                have expired or already been used.
              </div>

              <p className={styles.switchText}>
                <Link to="/forgot-password">Request a new reset link</Link>
              </p>
            </div>
          ) : (
            <>
              <form onSubmit={submitHandler} className={styles.form}>
                {error && (
                  <div className={styles.error} role="alert">
                    {error}
                  </div>
                )}

                <div className={styles.field}>
                  <label htmlFor="new-password">New password</label>

                  <div className={styles.passwordField}>
                    <input
                      id="new-password"
                      type={showPassword ? "text" : "password"}
                      placeholder="At least 8 characters"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      autoComplete="new-password"
                      minLength={8}
                      required
                    />

                    <button
                      type="button"
                      className={styles.passwordToggle}
                      onClick={() => setShowPassword((prev) => !prev)}
                      aria-label={
                        showPassword ? "Hide password" : "Show password"
                      }
                      aria-pressed={showPassword}
                    >
                      {showPassword ? <EyeOff size={19} /> : <Eye size={19} />}
                    </button>
                  </div>
                </div>

                <div className={styles.field}>
                  <label htmlFor="confirm-password">Confirm new password</label>

                  <div className={styles.passwordField}>
                    <input
                      id="confirm-password"
                      type={showConfirmPassword ? "text" : "password"}
                      placeholder="Confirm your password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      autoComplete="new-password"
                      required
                    />

                    <button
                      type="button"
                      className={styles.passwordToggle}
                      onClick={() => setShowConfirmPassword((prev) => !prev)}
                      aria-label={
                        showConfirmPassword ? "Hide password" : "Show password"
                      }
                      aria-pressed={showConfirmPassword}
                    >
                      {showConfirmPassword ? (
                        <EyeOff size={19} />
                      ) : (
                        <Eye size={19} />
                      )}
                    </button>
                  </div>
                </div>

                <button
                  type="submit"
                  className={styles.submitButton}
                  disabled={loading}
                >
                  <LockKeyhole size={18} />

                  {loading ? "Updating password..." : "Update password"}
                </button>
              </form>

              <p className={styles.switchText}>
                <Link to="/login">
                  <ArrowLeft
                    size={15}
                    style={{
                      display: "inline",
                      verticalAlign: "middle",
                    }}
                  />{" "}
                  Back to login
                </Link>
              </p>
            </>
          )}
        </div>
      </section>
    </main>
  );
};

export default ResetPassword;
