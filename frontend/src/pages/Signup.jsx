import { useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import {
  ArrowRight,
  Check,
  CheckCircle2,
  Eye,
  EyeOff,
  LockKeyhole,
  MailCheck,
} from "lucide-react";

import { supabase } from "../lib/supabase";
import styles from "./Auth.module.css";

const businessTypes = [
  { value: "gym", label: "Gym / Fitness Center" },
  { value: "yoga", label: "Yoga / Pilates Studio" },
  { value: "swimming", label: "Swimming Academy" },
  { value: "dance", label: "Dance Academy" },
  { value: "martial_arts", label: "Martial Arts Academy" },
  { value: "other", label: "Other" },
];

const initialForm = {
  ownerName: "",
  businessName: "",
  businessType: "",
  email: "",
  mobile: "",
  password: "",
};

const Signup = () => {
  const [searchParams] = useSearchParams();

  const requestedPlan = searchParams.get("plan");

  const selectedPlan = ["starter", "pro"].includes(requestedPlan)
    ? requestedPlan
    : null;

  const loginUrl = selectedPlan ? `/login?plan=${selectedPlan}` : "/login";

  const [formData, setFormData] = useState(initialForm);
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState("");

  const inputHandler = (e) => {
    const { name, value } = e.target;

    setFormData((current) => ({
      ...current,
      [name]: name === "mobile" ? value.replace(/\D/g, "").slice(0, 10) : value,
    }));

    if (error) setError("");
  };

  const passwordChecks = [
    {
      label: "8+ characters",
      valid: formData.password.length >= 8,
    },
    {
      label: "Uppercase letter",
      valid: /[A-Z]/.test(formData.password),
    },
    {
      label: "One number",
      valid: /\d/.test(formData.password),
    },
  ];

  const submitHandler = async (e) => {
    e.preventDefault();

    const { ownerName, businessName, businessType, email, mobile, password } =
      formData;

    if (
      !ownerName.trim() ||
      !businessName.trim() ||
      !businessType ||
      !email.trim() ||
      !mobile.trim() ||
      !password
    ) {
      setError("Please complete all the fields.");
      return;
    }

    if (!/^[6-9]\d{9}$/.test(mobile)) {
      setError("Enter a valid 10-digit Indian mobile number.");
      return;
    }

    if (!passwordChecks.every((check) => check.valid)) {
      setError(
        "Password must contain at least 8 characters, one uppercase letter, and one number.",
      );
      return;
    }

    setError("");
    setSuccess("");
    setLoading(true);

    try {
      const { data, error: signupError } = await supabase.auth.signUp({
        email: email.trim().toLowerCase(),
        password,
        options: {
          emailRedirectTo: `${window.location.origin}${loginUrl}`,
          data: {
            full_name: ownerName.trim(),
            business_name: businessName.trim(),
            organization_type: businessType,
            phone: mobile.trim(),
          },
        },
      });

      if (signupError) {
        throw signupError;
      }

      if (!data.user) {
        throw new Error("Unable to process registration. Please try again.");
      }

      setSuccess(data.session ? "created" : "email");
      setFormData(initialForm);
    } catch (err) {
      setError(err.message || "Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className={`${styles.authPage} ${styles.signupPage}`}>
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
            Less admin.
            <br />
            <span>More growth.</span>
          </h1>

          <p>
            Create your Memberox workspace and bring your members, memberships,
            and renewal records together in one organized place.
          </p>

          <div className={styles.benefits}>
            <div>
              <span className={styles.benefitIcon}>
                <Check size={17} />
              </span>
              <p>Manage your members with ease</p>
            </div>

            <div>
              <span className={styles.benefitIcon}>
                <Check size={17} />
              </span>
              <p>Keep track of membership expiries</p>
            </div>

            <div>
              <span className={styles.benefitIcon}>
                <Check size={17} />
              </span>
              <p>Organize your business records</p>
            </div>
          </div>
        </div>

        <div className={styles.brandFooter}>
          <span>© 2026 Memberox</span>
          <span>Made for businesses in India</span>
        </div>
      </section>

      {/* RIGHT SIGNUP PANEL */}
      <section className={styles.formSection}>
        <div className={styles.formContainer}>
          <div className={styles.mobileLogo}>
            <Link to="/">
              <span className={styles.logoMark}>M</span>
              <span>Memberox</span>
            </Link>
          </div>

          {success ? (
            <div className={styles.signupSuccess}>
              <div className={styles.successIcon}>
                {success === "email" ? (
                  <MailCheck size={30} />
                ) : (
                  <CheckCircle2 size={30} />
                )}
              </div>

              <span className={styles.eyebrow}>
                {success === "email" ? "CHECK YOUR INBOX" : "ACCOUNT CREATED"}
              </span>

              <h2>
                {success === "email"
                  ? "Check your email"
                  : "Welcome to Memberox!"}
              </h2>

              <p>
                {success === "email"
                  ? "If your registration is eligible, you'll receive a confirmation link. Open it to verify your account."
                  : "Your account has been created successfully. Log in to access your workspace."}
              </p>

              <Link to={loginUrl} className={styles.submitButton}>
                Continue to login
                <ArrowRight size={18} />
              </Link>

              {success === "email" && (
                <p className={styles.switchText}>
                  Didn't receive an email? Check your spam folder.
                </p>
              )}
            </div>
          ) : (
            <>
              <div className={styles.formHeader}>
                <span className={styles.eyebrow}>GET STARTED</span>

                <h2>Create your account</h2>

                <p>Set up your Memberox workspace in just a few steps.</p>
              </div>

              <form onSubmit={submitHandler} className={styles.form}>
                {error && (
                  <div className={styles.error} role="alert">
                    {error}
                  </div>
                )}

                {/* ROW 1: OWNER AND BUSINESS */}
                <div className={styles.twoColumns}>
                  <label className={styles.field}>
                    <span>Your name</span>

                    <input
                      type="text"
                      name="ownerName"
                      placeholder="Full name"
                      value={formData.ownerName}
                      onChange={inputHandler}
                      autoComplete="name"
                      maxLength={100}
                      required
                    />
                  </label>

                  <label className={styles.field}>
                    <span>Business name</span>

                    <input
                      type="text"
                      name="businessName"
                      placeholder="Business name"
                      value={formData.businessName}
                      onChange={inputHandler}
                      autoComplete="organization"
                      maxLength={120}
                      required
                    />
                  </label>
                </div>

                {/* ROW 2: BUSINESS TYPE AND MOBILE */}
                <div className={styles.twoColumns}>
                  <label className={styles.field}>
                    <span>Business type</span>

                    <select
                      name="businessType"
                      value={formData.businessType}
                      onChange={inputHandler}
                      required
                    >
                      <option value="" disabled>
                        Select business type
                      </option>

                      {businessTypes.map((type) => (
                        <option key={type.value} value={type.value}>
                          {type.label}
                        </option>
                      ))}
                    </select>
                  </label>

                  <label className={styles.field}>
                    <span>Mobile number</span>

                    <div className={styles.phoneField}>
                      <span className={styles.phonePrefix}>+91</span>

                      <input
                        type="tel"
                        name="mobile"
                        placeholder="10-digit number"
                        value={formData.mobile}
                        onChange={inputHandler}
                        autoComplete="tel-national"
                        inputMode="numeric"
                        maxLength={10}
                        required
                      />
                    </div>
                  </label>
                </div>

                {/* ROW 3: EMAIL AND PASSWORD */}
                <div className={styles.twoColumns}>
                  <label className={styles.field}>
                    <span>Email address</span>

                    <input
                      type="email"
                      name="email"
                      placeholder="you@example.com"
                      value={formData.email}
                      onChange={inputHandler}
                      autoComplete="email"
                      maxLength={254}
                      required
                    />
                  </label>

                  <div className={styles.field}>
                    <label htmlFor="signup-password">Password</label>

                    <div className={styles.passwordField}>
                      <input
                        id="signup-password"
                        type={showPassword ? "text" : "password"}
                        name="password"
                        placeholder="Create password"
                        value={formData.password}
                        onChange={inputHandler}
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
                        {showPassword ? (
                          <EyeOff size={19} />
                        ) : (
                          <Eye size={19} />
                        )}
                      </button>
                    </div>

                    {/* REQUIREMENTS UNDER PASSWORD */}
                    <div
                      className={styles.passwordRequirements}
                      aria-live="polite"
                    >
                      {passwordChecks.map((check) => (
                        <span
                          key={check.label}
                          className={check.valid ? styles.requirementMet : ""}
                        >
                          <Check size={14} />
                          {check.label}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>

                {/* TERMS AND PRIVACY */}
                <p className={styles.terms}>
                  By creating an account, you agree to Memberox's{" "}
                  <Link to="/terms">Terms of Service</Link> and{" "}
                  <Link to="/privacy">Privacy Policy</Link>.
                </p>

                {/* SUBMIT BUTTON */}
                <button
                  type="submit"
                  className={styles.submitButton}
                  disabled={loading}
                >
                  <span>
                    {loading ? "Creating account..." : "Create account"}
                  </span>

                  {!loading && <ArrowRight size={19} />}
                </button>
              </form>

              <p className={styles.switchText}>
                Already have an account? <Link to={loginUrl}>Log in</Link>
              </p>

              <div className={styles.formFooter}>
                <LockKeyhole size={15} />
                <span>Secure account registration</span>
              </div>
            </>
          )}
        </div>
      </section>
    </main>
  );
};

export default Signup;
