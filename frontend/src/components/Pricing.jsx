import { Link } from "react-router-dom";
import { ArrowRight, Check, Sparkles, Zap } from "lucide-react";
import styles from "./Pricing.module.css";

const plans = [
  {
    name: "Pro",
    price: "499",
    description: "For independent gyms and studios.",
    memberLimit: "Up to 100 members",
    features: [
      "Member and membership records",
      "Membership expiry tracking",
      "Configurable email reminders",
      "Payment records and revenue overview",
    ],
    slug: "pro",
    featured: true,
  },
  {
    name: "Business",
    price: "999",
    description: "For businesses with a larger member base.",
    memberLimit: "Unlimited members",
    features: [
      "Everything in Pro",
      "Unlimited member records",
      "Membership plans and renewals",
      "Revenue analytics and payment history",
      "Priority support",
    ],
    slug: "business",
    featured: false,
  },
];

const Pricing = () => {
  return (
    <section id="pricing" className={styles.pricing}>
      <div className={styles.container}>
        <div className={styles.heading}>
          <span className={styles.eyebrow}>
            <span className={styles.eyebrowLine} />
            PRICING
          </span>

          <h2>
            Straightforward pricing.
            <br />
            <span>Room to grow.</span>
          </h2>

          <p>
            Pick the member capacity that suits your business. No complicated
            plan comparisons.
          </p>
        </div>

        <div className={styles.cards}>
          {plans.map((plan) => (
            <article
              key={plan.slug}
              className={`${styles.card} ${
                plan.featured ? styles.featured : ""
              }`}
            >
              {plan.featured && (
                <div className={styles.popularBadge}>
                  <Sparkles size={14} />
                  RECOMMENDED
                </div>
              )}

              <div className={styles.cardHeader}>
                <span
                  className={`${styles.planIcon} ${
                    plan.featured ? styles.proIcon : styles.businessIcon
                  }`}
                >
                  {plan.featured ? <Zap size={22} /> : <Sparkles size={22} />}
                </span>

                <div>
                  <h3>{plan.name}</h3>
                  <p>{plan.description}</p>
                </div>
              </div>

              <div className={styles.priceBlock}>
                <span className={styles.currency}>₹</span>
                <strong>{plan.price}</strong>
                <span className={styles.period}>/ month</span>
              </div>

              <div className={styles.capacity}>
                <Check size={17} />
                <strong>{plan.memberLimit}</strong>
              </div>

              <Link
                to={`/signup?plan=${plan.slug}`}
                className={`${styles.planButton} ${
                  plan.featured ? styles.primaryButton : styles.secondaryButton
                }`}
              >
                Choose {plan.name}
                <ArrowRight size={18} />
              </Link>

              <div className={styles.divider} />

              <p className={styles.includedLabel}>WHAT'S INCLUDED</p>

              <ul className={styles.features}>
                {plan.features.map((feature) => (
                  <li key={feature}>
                    <span className={styles.checkIcon}>
                      <Check size={15} />
                    </span>
                    {feature}
                  </li>
                ))}
              </ul>
            </article>
          ))}
        </div>

        <p className={styles.pricingNote}>
          Prices shown in INR. Subscription billing and plan enforcement must be
          enabled before paid launch.
        </p>
      </div>
    </section>
  );
};

export default Pricing;
