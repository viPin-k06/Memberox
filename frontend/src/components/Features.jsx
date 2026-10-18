import {
  UsersRound,
  CalendarClock,
  CreditCard,
  ChartNoAxesCombined,
  MailCheck,
  ArrowUpRight,
  Check,
} from "lucide-react";
import styles from "./Features.module.css";

const Features = () => {
  return (
    <section id="features" className={styles.features}>
      <div className={styles.container}>
        <div className={styles.heading}>
          <div className={styles.headingContent}>
            <span className={styles.eyebrow}>
              <span className={styles.eyebrowLine} />
              THE TOOLKIT
            </span>

            <h2>
              Less admin.
              <br />
              <span>Better visibility.</span>
            </h2>
          </div>

          <p className={styles.intro}>
            From the first signup to the next renewal, keep the details that
            matter within reach.
          </p>
        </div>

        <div className={styles.grid}>
          {/* Featured member management card */}
          <article className={`${styles.card} ${styles.membersCard}`}>
            <div className={styles.cardTop}>
              <span className={`${styles.iconBox} ${styles.purpleIcon}`}>
                <UsersRound size={22} />
              </span>
              <span className={styles.cardNumber}>01 / MEMBERS</span>
            </div>

            <h3>Every member, accounted for.</h3>
            <p>
              Keep contact details, membership history, and expiry dates in one
              searchable directory.
            </p>

            <div className={styles.memberPreview}>
              <div className={styles.previewHeader}>
                <span>Member directory</span>
                <span className={styles.previewCount}>128 members</span>
              </div>

              <div className={styles.memberRow}>
                <span className={styles.avatarPurple}>AK</span>
                <div className={styles.memberInfo}>
                  <strong>Aman Kumar</strong>
                  <small>Quarterly membership</small>
                </div>
                <span className={styles.activeBadge}>
                  <Check size={12} /> Active
                </span>
              </div>

              <div className={styles.memberRow}>
                <span className={styles.avatarPink}>PS</span>
                <div className={styles.memberInfo}>
                  <strong>Priya Sharma</strong>
                  <small>Monthly membership</small>
                </div>
                <span className={styles.activeBadge}>
                  <Check size={12} /> Active
                </span>
              </div>

              <div className={styles.memberRow}>
                <span className={styles.avatarOrange}>RS</span>
                <div className={styles.memberInfo}>
                  <strong>Rahul Singh</strong>
                  <small>Monthly membership</small>
                </div>
                <span className={styles.expiringBadge}>Expiring</span>
              </div>
            </div>
          </article>

          {/* Renewals */}
          <article className={`${styles.card} ${styles.renewalsCard}`}>
            <div className={styles.cardTop}>
              <span className={`${styles.iconBox} ${styles.orangeIcon}`}>
                <CalendarClock size={22} />
              </span>
              <ArrowUpRight size={19} className={styles.cardArrow} />
            </div>

            <h3>Catch renewals before they slip.</h3>
            <p>
              Spot upcoming expiries and see which memberships need attention.
            </p>

            <div className={styles.renewalPreview}>
              <div className={styles.renewalDate}>
                <span>UPCOMING</span>
                <strong>08</strong>
                <small>Expiring within 7 days</small>
              </div>
              <div className={styles.renewalProgress}>
                <span />
                <span />
                <span />
                <span />
                <span />
              </div>
            </div>
          </article>

          {/* Payments */}
          <article className={`${styles.card} ${styles.paymentsCard}`}>
            <div className={styles.cardTop}>
              <span className={`${styles.iconBox} ${styles.blueIcon}`}>
                <CreditCard size={22} />
              </span>
              <ArrowUpRight size={19} className={styles.cardArrow} />
            </div>

            <h3>A clear record of every payment.</h3>
            <p>
              Record membership payments and review transaction history without
              searching through notebooks.
            </p>

            <div className={styles.paymentPreview}>
              <div className={styles.paymentIcon}>
                <Check size={19} />
              </div>
              <div>
                <span>Payment recorded</span>
                <strong>₹1,500.00</strong>
              </div>
              <span className={styles.paymentMethod}>UPI</span>
            </div>
          </article>

          {/* Analytics */}
          <article className={`${styles.card} ${styles.analyticsCard}`}>
            <div className={styles.cardTop}>
              <span className={`${styles.iconBox} ${styles.greenIcon}`}>
                <ChartNoAxesCombined size={22} />
              </span>
              <span className={styles.cardNumber}>04 / INSIGHTS</span>
            </div>

            <div className={styles.analyticsLayout}>
              <div>
                <h3>Numbers you can actually use.</h3>
                <p>
                  Follow revenue trends, review collections, and understand how
                  your business is performing.
                </p>
              </div>

              <div className={styles.analyticsPreview}>
                <span className={styles.chartLabel}>Monthly collections</span>
                <strong>₹48,500</strong>
                <div className={styles.bars}>
                  {[36, 52, 44, 68, 58, 83, 73, 100].map((height, index) => (
                    <span key={index} style={{ height: `${height}%` }} />
                  ))}
                </div>
              </div>
            </div>
          </article>

          {/* Reminders */}
          <article className={`${styles.card} ${styles.remindersCard}`}>
            <div className={styles.cardTop}>
              <span className={`${styles.iconBox} ${styles.pinkIcon}`}>
                <MailCheck size={22} />
              </span>
              <ArrowUpRight size={19} className={styles.cardArrow} />
            </div>

            <h3>Reminders with a paper trail.</h3>
            <p>
              Configure email renewal reminders and review their processing
              status in one place.
            </p>

            <div className={styles.reminderPreview}>
              <div className={styles.mailIcon}>
                <MailCheck size={20} />
              </div>
              <div>
                <strong>Renewal reminder</strong>
                <span>Email notification</span>
              </div>
              <span className={styles.configuredBadge}>Configurable</span>
            </div>
          </article>
        </div>

        <p className={styles.previewNote}>
          Illustrative previews shown. Actual figures depend on your business
          data.
        </p>
      </div>
    </section>
  );
};

export default Features;
