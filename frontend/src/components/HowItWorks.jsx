import {
  ArrowRight,
  Building2,
  UsersRound,
  CalendarCheck2,
  Check,
  Plus,
  Bell,
} from "lucide-react";
import styles from "./HowItWorks.module.css";

const steps = [
  {
    number: "01",
    title: "Set up your workspace",
    description:
      "Create your account, add your business details, and set up your membership plans.",
    tone: "purple",
  },
  {
    number: "02",
    title: "Bring your members in",
    description:
      "Add members, assign their memberships, and record payments as they happen.",
    tone: "blue",
  },
  {
    number: "03",
    title: "Keep things moving",
    description:
      "Check upcoming expiries, review revenue, and manage renewal reminders.",
    tone: "green",
  },
];

const HowItWorks = () => {
  return (
    <section id="how-it-works" className={styles.section}>
      <div className={styles.container}>
        <div className={styles.heading}>
          <span className={styles.eyebrow}>
            <span className={styles.eyebrowLine} />
            GETTING STARTED
          </span>

          <h2>
            From signup to
            <br />
            <span>your daily workflow.</span>
          </h2>

          <p>
            No complicated setup. Just a straightforward way to get your
            business organized.
          </p>
        </div>

        <div className={styles.steps}>
          <div className={styles.connector} aria-hidden="true" />

          {steps.map((step, index) => (
            <article
              key={step.number}
              className={`${styles.step} ${styles[step.tone]}`}
            >
              <div className={styles.stepTop}>
                <span className={styles.stepNumber}>{step.number}</span>

                {index < steps.length - 1 && (
                  <span className={styles.nextArrow}>
                    <ArrowRight size={18} />
                  </span>
                )}
              </div>

              <div className={styles.illustration}>
                {index === 0 && (
                  <div className={styles.setupPreview}>
                    <div className={styles.setupIcon}>
                      <Building2 size={23} />
                    </div>
                    <div className={styles.setupText}>
                      <strong>Your business</strong>
                      <span>Workspace ready</span>
                    </div>
                    <span className={styles.checkIcon}>
                      <Check size={16} />
                    </span>
                  </div>
                )}

                {index === 1 && (
                  <div className={styles.membersPreview}>
                    <div className={styles.memberAvatar}>
                      <UsersRound size={21} />
                    </div>
                    <div className={styles.setupText}>
                      <strong>Member directory</strong>
                      <span>Add your first member</span>
                    </div>
                    <span className={styles.plusIcon}>
                      <Plus size={17} />
                    </span>
                  </div>
                )}

                {index === 2 && (
                  <div className={styles.renewalPreview}>
                    <div className={styles.renewalIcon}>
                      <CalendarCheck2 size={22} />
                    </div>
                    <div className={styles.setupText}>
                      <strong>Renewal overview</strong>
                      <span>Upcoming expiries</span>
                    </div>
                    <span className={styles.bellIcon}>
                      <Bell size={17} />
                    </span>
                  </div>
                )}
              </div>

              <div className={styles.stepContent}>
                <h3>{step.title}</h3>
                <p>{step.description}</p>
              </div>
            </article>
          ))}
        </div>

        <div className={styles.bottomNote}>
          <span className={styles.noteIcon}>
            <Check size={15} />
          </span>
          Start with your existing members and build from there.
        </div>
      </div>
    </section>
  );
};

export default HowItWorks;
