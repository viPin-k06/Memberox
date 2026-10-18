import { Link } from "react-router-dom";
import {
  ArrowRight,
  UsersRound,
  CalendarClock,
  ChartNoAxesCombined,
  Check,
} from "lucide-react";

import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import styles from "./About.module.css";

const About = () => {
  return (
    <>
      <Navbar />

      <main className={styles.aboutPage}>
        <section className={styles.hero}>
          <div className={styles.heroContent}>
            <span className={styles.eyebrow}>ABOUT MEMBEROX</span>

            <h1>
              Running a business is hard enough.
              <span> The admin shouldn't be.</span>
            </h1>

            <p className={styles.heroDescription}>
              Memberox is a workspace for businesses that run on memberships. It
              brings member records, renewals, and everyday operations into one
              organized place.
            </p>

            <Link to="/signup" className={styles.primaryButton}>
              Get started
              <ArrowRight size={18} />
            </Link>
          </div>

          <div className={styles.heroVisual}>
            <div className={styles.visualHeader}>
              <span className={styles.visualDot} />A clearer picture of your
              business
            </div>

            <div className={styles.visualCard}>
              <div className={styles.visualIcon}>
                <UsersRound size={22} />
              </div>
              <div>
                <strong>Know your members</strong>
                <p>Keep the details that matter together.</p>
              </div>
              <Check size={18} className={styles.checkIcon} />
            </div>

            <div className={styles.visualCard}>
              <div className={styles.visualIcon}>
                <CalendarClock size={22} />
              </div>
              <div>
                <strong>Stay ahead of renewals</strong>
                <p>See what's coming up next.</p>
              </div>
              <Check size={18} className={styles.checkIcon} />
            </div>

            <div className={styles.visualCard}>
              <div className={styles.visualIcon}>
                <ChartNoAxesCombined size={22} />
              </div>
              <div>
                <strong>Understand your numbers</strong>
                <p>Find useful information faster.</p>
              </div>
              <Check size={18} className={styles.checkIcon} />
            </div>

            <span className={styles.visualCaption}>
              LESS SEARCHING. MORE CLARITY.
            </span>
          </div>
        </section>

        <section className={styles.storySection}>
          <div className={styles.sectionIntro}>
            <span className={styles.eyebrow}>THE IDEA</span>

            <h2>
              Good businesses deserve
              <span> better tools.</span>
            </h2>
          </div>

          <div className={styles.storyContent}>
            <p>
              Managing a membership-based business involves a lot of moving
              parts. New signups, expiring memberships, payment records, and
              customer details all need attention.
            </p>

            <p>
              When that information is scattered across spreadsheets, notebooks,
              and messages, even simple tasks can take longer than they should.
            </p>

            <p>
              Memberox is being built to make that work easier to manage, so
              business owners can spend less time looking for information and
              more time serving their customers.
            </p>
          </div>
        </section>

        <section className={styles.audienceSection}>
          <div className={styles.audienceHeader}>
            <span className={styles.eyebrow}>WHO IT'S FOR</span>

            <h2>
              Made for businesses built
              <span> around people.</span>
            </h2>

            <p>
              Whether you manage a small studio or a growing membership
              business, staying organized shouldn't require complicated
              software.
            </p>
          </div>

          <div className={styles.audienceGrid}>
            <div className={styles.audienceCard}>
              <span className={styles.cardNumber}>01</span>
              <h3>Gyms & fitness centers</h3>
              <p>
                Keep track of members, membership periods, and upcoming
                renewals.
              </p>
            </div>

            <div className={styles.audienceCard}>
              <span className={styles.cardNumber}>02</span>
              <h3>Yoga & wellness studios</h3>
              <p>
                Organize memberships and spend less time managing routine
                records.
              </p>
            </div>

            <div className={styles.audienceCard}>
              <span className={styles.cardNumber}>03</span>
              <h3>Membership businesses</h3>
              <p>
                Bring customer details and membership information into a single
                workspace.
              </p>
            </div>
          </div>
        </section>

        <section className={styles.bottomSection}>
          <span className={styles.eyebrow}>OUR FOCUS</span>

          <h2>
            Keep the work simple.
            <br />
            <span>Make the important things visible.</span>
          </h2>

          <p>
            We're starting with the everyday essentials: members, memberships,
            renewals, and business visibility.
          </p>

          <Link to="/signup" className={styles.bottomButton}>
            Create your workspace
            <ArrowRight size={18} />
          </Link>
        </section>
      </main>

      <Footer />
    </>
  );
};

export default About;
