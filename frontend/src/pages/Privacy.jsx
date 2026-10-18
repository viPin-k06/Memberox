import { Link } from "react-router-dom";
import { ArrowLeft, ShieldCheck } from "lucide-react";

import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import styles from "./Privacy.module.css";

const sections = [
  {
    id: "overview",
    title: "1. Overview",
    paragraphs: [
      "Memberox is a membership-management platform intended for businesses in India, including gyms and fitness studios.",
      "This policy explains the categories of personal information Memberox may process, why that information is needed, and how individuals can raise privacy-related questions.",
    ],
  },
  {
    id: "information",
    title: "2. Information we handle",
    paragraphs: [
      "Business account information may include account identifiers, email addresses, authentication information managed by our authentication provider, and information associated with a business workspace.",
      "Member records entered by business users may include names, phone numbers, email addresses, membership plans, joining dates, renewal or expiry dates, and related membership details.",
      "The platform may also contain payment records entered by businesses, such as amounts, payment dates, and payment methods. These records are for business administration; Memberox does not currently process gym-member payments online.",
      "Technical information necessary to operate and protect the service may also be processed by our hosting and infrastructure providers. The exact categories must be verified before publication.",
    ],
  },
  {
    id: "purposes",
    title: "3. How information is used",
    paragraphs: [
      "Information is used to provide business workspaces, maintain member and membership records, display renewals, and produce operational reports.",
      "Account information is used to support sign-in, access control, and service administration.",
      "Member email addresses may be used for membership-expiry reminders when live email delivery is enabled. Reminder functionality is currently being tested in simulation mode.",
    ],
  },
  {
    id: "responsibilities",
    title: "4. Business and platform responsibilities",
    paragraphs: [
      "Business users decide which member records to enter and manage through their workspaces. They are responsible for having an appropriate basis to collect and use their customers' information and for providing any required notices.",
      "Memberox operates the software and supporting services used to store and process those records. The applicable legal responsibilities of each party should be confirmed before launch.",
    ],
  },
  {
    id: "providers",
    title: "5. Service providers",
    paragraphs: [
      "Memberox uses Supabase services for authentication and database functionality.",
      "Resend is configured for the email-reminder workflow. Live delivery is not yet enabled, and this policy will be updated to reflect actual email processing before activation.",
      "Additional providers, including hosting, monitoring, and subscription-payment services, must be disclosed when selected and enabled. Provider locations and any international data transfers must also be verified.",
    ],
  },
  {
    id: "security",
    title: "6. Access and security",
    paragraphs: [
      "Memberox is being developed with authenticated access and business-specific workspaces. We aim to limit access to information to the users and services that need it.",
      "No online service can guarantee absolute security. Before launch, we will verify access controls, database policies, backup arrangements, and incident-response procedures.",
    ],
  },
  {
    id: "retention",
    title: "7. Retention and deletion",
    paragraphs: [
      "The period for which account information, member records, payment records, and operational logs are retained has not yet been finalized.",
      "Before launch, this section will explain applicable retention periods, deletion procedures, backup handling, and any records that must be kept for legal reasons.",
    ],
  },
  {
    id: "rights",
    title: "8. Privacy requests",
    paragraphs: [
      "Individuals may have rights concerning their personal information under applicable Indian law. The available rights and procedures depend on the legal provisions in force and the circumstances of processing.",
      "Members seeking changes to records maintained by a gym or studio should generally contact that business first. Requests relating to a Memberox account or our own processing can be raised through our Contact Us page.",
      "A dedicated privacy contact and a documented request-handling process must be established before public launch.",
    ],
  },
  {
    id: "changes",
    title: "9. Changes to this policy",
    paragraphs: [
      "We may update this policy as Memberox develops, new service providers are introduced, or legal requirements change.",
      "When this policy is finalized, its effective date will be displayed here. Material changes will be communicated as required by applicable law.",
    ],
  },
];

const Privacy = () => {
  return (
    <>
      <Navbar />

      <main className={styles.page}>
        <section className={styles.hero}>
          <div className={styles.heroInner}>
            <Link to="/" className={styles.backLink}>
              <ArrowLeft size={16} />
              Back to home
            </Link>

            <div className={styles.heroIcon}>
              <ShieldCheck size={27} />
            </div>

            <span className={styles.eyebrow}>PRIVACY & TRANSPARENCY</span>

            <h1>
              Privacy <span>Policy</span>
            </h1>

            <p className={styles.heroDescription}>
              A clear explanation of the information Memberox handles and how it
              supports membership-based businesses.
            </p>

            <div className={styles.draftNotice}>
              <strong>Draft — not yet effective</strong>
              <p>
                This page is under review and must be finalized before Memberox
                launches publicly.
              </p>
            </div>
          </div>
        </section>

        <section className={styles.contentSection}>
          <div className={styles.contentLayout}>
            <aside className={styles.sidebar}>
              <div className={styles.sidebarInner}>
                <span className={styles.sidebarTitle}>ON THIS PAGE</span>

                <nav aria-label="Privacy policy sections">
                  {sections.map((section) => (
                    <a key={section.id} href={`#${section.id}`}>
                      {section.title.replace(/^\d+\.\s/, "")}
                    </a>
                  ))}
                </nav>
              </div>
            </aside>

            <article className={styles.article}>
              {sections.map((section) => (
                <section
                  key={section.id}
                  id={section.id}
                  className={styles.policySection}
                >
                  <h2>{section.title}</h2>

                  {section.paragraphs.map((paragraph) => (
                    <p key={paragraph}>{paragraph}</p>
                  ))}
                </section>
              ))}

              <div className={styles.contactCard}>
                <div>
                  <span className={styles.eyebrow}>NEED HELP?</span>

                  <h2>Have a privacy question?</h2>

                  <p>
                    Visit our Contact Us page for information about reaching the
                    Memberox team.
                  </p>
                </div>

                <Link to="/contact" className={styles.contactButton}>
                  Contact us
                </Link>
              </div>
            </article>
          </div>
        </section>
      </main>

      <Footer />
    </>
  );
};

export default Privacy;
