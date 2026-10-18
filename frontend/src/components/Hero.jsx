import { Link } from "react-router-dom";
import {
  ArrowRight,
  ArrowUpRight,
  UsersRound,
  CalendarClock,
  IndianRupee,
  CheckCircle2,
  TrendingUp,
} from "lucide-react";
import styles from "./Hero.module.css";

const Hero = () => {
  return (
    <section className={styles.hero}>
      <div className={styles.container}>
        <div className={styles.content}>
          <div className={styles.eyebrow}>
            <span className={styles.eyebrowDot} />A simpler way to run your
            business
          </div>

          <h1 className={styles.title}>
            Spend less time <span className={styles.highlight}>managing.</span>
            <br />
            More time <span className={styles.highlight}>growing.</span>
          </h1>

          <p className={styles.description}>
            Know who's active, what's due, and what needs your attention without
            digging through spreadsheets or messages.
          </p>

          <div className={styles.actions}>
            <Link to="/signup" className={styles.primaryButton}>
              Get started <ArrowRight size={18} />
            </Link>

            <a href="#features" className={styles.secondaryButton}>
              Explore features <ArrowUpRight size={17} />
            </a>
          </div>

          <p className={styles.helperText}>
            Built for gyms, studios, and membership-based businesses.
          </p>
        </div>

        <div className={styles.preview}>
          <div className={styles.previewGlow} />

          <div className={styles.dashboard}>
            <div className={styles.dashboardTop}>
              <div className={styles.dashboardBrand}>
                <span className={styles.brandMark}>M</span>
                <span>Memberox</span>
              </div>

              <span className={styles.demoBadge}>
                <span /> Dashboard preview
              </span>
            </div>

            <div className={styles.dashboardBody}>
              <div className={styles.dashboardHeading}>
                <div>
                  <span className={styles.overline}>BUSINESS OVERVIEW</span>
                  <h2>Good morning 👋</h2>
                  <p>Here's what's happening at your business.</p>
                </div>
                <span className={styles.period}>This month</span>
              </div>

              <div className={styles.stats}>
                <div className={`${styles.stat} ${styles.purpleStat}`}>
                  <UsersRound size={19} />
                  <span>Total members</span>
                  <strong>128</strong>
                </div>

                <div className={`${styles.stat} ${styles.greenStat}`}>
                  <CheckCircle2 size={19} />
                  <span>Active members</span>
                  <strong>112</strong>
                </div>

                <div className={`${styles.stat} ${styles.orangeStat}`}>
                  <CalendarClock size={19} />
                  <span>Expiring soon</span>
                  <strong>08</strong>
                </div>
              </div>

              <div className={styles.previewBottom}>
                <div className={styles.revenueCard}>
                  <div className={styles.cardHeading}>
                    <span>Monthly revenue</span>
                    <TrendingUp size={17} />
                  </div>

                  <div className={styles.revenueValue}>
                    <IndianRupee size={22} />
                    <strong>48,500</strong>
                  </div>

                  <div className={styles.chart}>
                    {[35, 52, 44, 68, 58, 82, 72, 100].map((height, index) => (
                      <span key={index} style={{ height: `${height}%` }} />
                    ))}
                  </div>
                </div>

                <div className={styles.renewalCard}>
                  <div className={styles.cardHeading}>
                    <span>Upcoming renewals</span>
                    <CalendarClock size={17} />
                  </div>

                  <div className={styles.renewalItem}>
                    <span className={styles.avatar}>AK</span>
                    <div>
                      <strong>Aman Kumar</strong>
                      <small>Expires in 2 days</small>
                    </div>
                    <span className={styles.statusDot} />
                  </div>

                  <div className={styles.renewalItem}>
                    <span className={styles.avatar}>PS</span>
                    <div>
                      <strong>Priya Sharma</strong>
                      <small>Expires in 4 days</small>
                    </div>
                    <span className={styles.statusDot} />
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className={styles.floatingBadge}>
            <span className={styles.floatingIcon}>
              <TrendingUp size={19} />
            </span>
            <div>
              <strong>Stay on top of renewals</strong>
              <span>Everything in one view</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Hero;
