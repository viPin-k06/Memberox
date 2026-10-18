import { Link } from "react-router-dom";
import { ArrowLeft, FileText } from "lucide-react";

import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import styles from "./Privacy.module.css";

const sections = [
  {
    id: "introduction",
    title: "1. Introduction",
    paragraphs: [
      "These Terms of Service describe the proposed conditions for accessing and using Memberox, a membership-management platform intended for businesses operating in India.",
      "Memberox helps businesses organize member records, membership plans, renewals, payment records, and related administrative information.",
      "These terms are a draft and do not become effective until they are finalized and published with an effective date.",
    ],
  },
  {
    id: "eligibility",
    title: "2. Eligibility and accounts",
    paragraphs: [
      "Memberox is intended for business use. Users must be legally capable of entering into an agreement and authorized to act on behalf of the business they register.",
      "Account holders are responsible for providing accurate registration information, protecting their login credentials, and notifying Memberox of suspected unauthorized account access.",
      "A business is responsible for activity conducted through accounts it authorizes, subject to applicable law.",
    ],
  },
  {
    id: "services",
    title: "3. Use of the service",
    paragraphs: [
      "Memberox provides tools for organizing members, memberships, expiry dates, payment records, and business information.",
      "Features may change as the platform develops. Availability of a feature in a preview or demonstration does not mean it is available in the production service.",
      "Businesses remain responsible for their own membership agreements, pricing, customer relationships, and decisions made using information displayed in Memberox.",
    ],
  },
  {
    id: "data",
    title: "4. Member information and privacy",
    paragraphs: [
      "Businesses may enter personal information about their members, including contact details and membership records.",
      "Each business is responsible for ensuring it has the appropriate authority and legal basis to collect, enter, and use that information, including providing notices or obtaining consent where required.",
      "Memberox processes information to provide its services, subject to applicable law and its Privacy Policy. The respective legal responsibilities of Memberox and business customers will be confirmed before launch.",
    ],
  },
  {
    id: "acceptable-use",
    title: "5. Acceptable use",
    paragraphs: [
      "Users must not use Memberox for unlawful activities, unauthorized access, harassment, fraud, or activities that infringe the rights of others.",
      "Users must not attempt to bypass authentication, interfere with platform security, disrupt the service, or access another business's information without authorization.",
      "Users must not upload malicious code or misuse the platform to send unsolicited or unlawful communications.",
    ],
  },
  {
    id: "subscriptions",
    title: "6. Plans and subscription billing",
    paragraphs: [
      "Memberox may offer paid subscription plans for business owners. The current website displays proposed plan information, but subscription billing and plan enforcement are not yet active.",
      "Before paid subscriptions are introduced, Memberox will publish the applicable prices, billing frequency, taxes, payment arrangements, renewal conditions, and any usage limits.",
      "The specific terms governing recurring charges, failed payments, plan changes, and payment-provider processing will be finalized before billing is enabled.",
    ],
  },
  {
    id: "cancellations",
    title: "7. Cancellations and refunds",
    paragraphs: [
      "The cancellation and refund arrangements for paid Memberox subscriptions have not yet been finalized.",
      "Before accepting payments, Memberox will publish a separate Refund & Cancellation Policy describing how subscriptions can be canceled, when access ends, and whether refunds may be available, subject to applicable law.",
      "This section will be updated to reflect those published arrangements before paid launch.",
    ],
  },
  {
    id: "reminders",
    title: "8. Reminders and communications",
    paragraphs: [
      "Memberox includes functionality being developed for membership-expiry email reminders. Email delivery is currently configured in simulation mode.",
      "When live reminders are enabled, businesses will be responsible for ensuring that member contact information is accurate and that communications comply with applicable legal requirements.",
      "Memberox cannot guarantee that every email will reach its intended recipient, as delivery may depend on third-party systems and recipient settings.",
    ],
  },
  {
    id: "availability",
    title: "9. Service availability",
    paragraphs: [
      "Memberox may require maintenance, updates, or temporary interruptions as the platform is developed and operated.",
      "Specific service commitments, support arrangements, and any applicable limitations of liability must be finalized before public launch.",
      "Nothing in these terms is intended to exclude rights or remedies that cannot lawfully be excluded under applicable law.",
    ],
  },
  {
    id: "termination",
    title: "10. Account suspension and termination",
    paragraphs: [
      "Memberox may need to restrict access where there is suspected misuse, a security risk, or a legal requirement. The circumstances and procedures for suspension and termination will be defined in the final terms.",
      "Account closure, data export, deletion, and retention arrangements will be documented before launch and coordinated with the Privacy Policy.",
    ],
  },
  {
    id: "changes",
    title: "11. Changes to these terms",
    paragraphs: [
      "Memberox may update its Terms of Service to reflect changes to the platform, business arrangements, or applicable law.",
      "The final terms will explain when updates take effect and how users will be informed of material changes.",
    ],
  },
  {
    id: "law",
    title: "12. Governing law and contact",
    paragraphs: [
      "The service is initially intended for customers in India. The final agreement will identify the legal business operating Memberox and specify the applicable governing-law and dispute-resolution arrangements.",
      "Questions about these draft terms can be directed through the Contact Us page once a functioning support channel has been established.",
    ],
  },
];

const Terms = () => {
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
              <FileText size={27} />
            </div>

            <span className={styles.eyebrow}>LEGAL & SERVICE INFORMATION</span>

            <h1>
              Terms of <span>Service</span>
            </h1>

            <p className={styles.heroDescription}>
              The proposed guidelines and responsibilities for using Memberox as
              a business workspace.
            </p>

            <div className={styles.draftNotice}>
              <strong>Draft — not yet effective</strong>
              <p>
                These terms are being prepared for launch. They require review
                and finalization before they can govern customer accounts or
                payments.
              </p>
            </div>
          </div>
        </section>

        <section className={styles.contentSection}>
          <div className={styles.contentLayout}>
            <aside className={styles.sidebar}>
              <div className={styles.sidebarInner}>
                <span className={styles.sidebarTitle}>ON THIS PAGE</span>

                <nav aria-label="Terms of Service sections">
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
                  <span className={styles.eyebrow}>MORE INFORMATION</span>

                  <h2>Your information matters.</h2>

                  <p>
                    Learn more about how Memberox handles information in our
                    Privacy Policy.
                  </p>
                </div>

                <Link to="/privacy" className={styles.contactButton}>
                  Privacy Policy
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

export default Terms;
