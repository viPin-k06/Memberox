import { useState } from "react";
import { Link } from "react-router-dom";
import { ArrowLeft, Mail } from "lucide-react";
import { supabase } from "../lib/supabase";
import styles from "./Auth.module.css";

const ForgotPassword = () => {
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);

  const submitHandler = async (e) => {
    e.preventDefault();

    if (!email.trim()) {
      setError("Please enter your email address.");
      return;
    }

    setError("");
    setSuccess(false);
    setLoading(true);

    try {
      const { error: resetError } = await supabase.auth.resetPasswordForEmail(
        email.trim(),
        {
          redirectTo: `${window.location.origin}/reset-password`,
        },
      );

      if (resetError) {
        throw resetError;
      }

      setSuccess(true);
    } catch (err) {
      setError(err.message || "Unable to send reset email. Please try again.");
    } finally {
      setLoading(false);
    }
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

          <h1>Get back to managing your business.</h1>

          <p>
            Forgot your password? No problem. Request a secure reset link and
            get back to your Memberox dashboard.
          </p>

          <div className={styles.benefits}>
            <div>
              <span>01</span>
              <p>Enter your registered email address</p>
            </div>

            <div>
              <span>02</span>
              <p>Open the password-reset email</p>
            </div>

            <div>
              <span>03</span>
              <p>Set a new password and log in</p>
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
            <span className={styles.eyebrow}>ACCOUNT RECOVERY</span>

            <h2>Forgot your password?</h2>

            <p>
              Enter your email address and we'll send you a link to reset your
              password.
            </p>
          </div>

          {success ? (
            <div>
              <div
                role="status"
                style={{
                  padding: "1rem",
                  borderRadius: "0.75rem",
                  background: "#f0fdf4",
                  color: "#166534",
                  lineHeight: 1.7,
                }}
              >
                <Mail size={24} />

                <p>
                  If an account exists for this email, you'll receive a
                  password-reset link. Check your inbox and spam folder.
                </p>
              </div>

              <p className={styles.switchText}>
                <Link to="/login">Back to login</Link>
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

                <button
                  type="submit"
                  className={styles.submitButton}
                  disabled={loading}
                >
                  {loading ? "Sending reset link..." : "Send reset link"}
                </button>
              </form>

              <p className={styles.switchText}>
                <Link to="/login">
                  <ArrowLeft
                    size={16}
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

export default ForgotPassword;
