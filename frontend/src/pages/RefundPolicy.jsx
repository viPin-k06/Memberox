import { Link } from "react-router-dom";
import { ArrowLeft, ReceiptText } from "lucide-react";

import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import styles from "./Privacy.module.css";

const sections = [
  {
    id: "overview",
    title: "1. Overview",
    paragraphs: [
      "This Refund & Cancellation Policy describes the proposed rules for paid Memberox subscriptions.",
      "Memberox is a membership-management platform for businesses in India. Subscription billing is not yet active, and this policy is a draft that must be finalized before paid subscriptions are offered.",
    ],
  },
  {
    id: "plans",
    title: "2. Subscription plans",
    paragraphs: [
      "Memberox currently displays two proposed monthly plans: Pro at ₹499 per month and Business at ₹999 per month.",
      "The applicable subscription price, taxes, billing frequency, renewal conditions, and included features will be confirmed during checkout once paid subscriptions are enabled.",
    ],
  },
  {
    id: "cancellation",
    title: "3. Subscription cancellation",
    paragraphs: [
      "Customers will be able to cancel their subscriptions at any time using a cancellation method provided by Memberox.",
      "An effective cancellation will prevent future subscription renewals. Cancellation will not normally end access immediately.",
      "The exact cancellation process will be published before subscription billing is activated.",
    ],
  },
  {
    id: "access",
    title: "4. Access after cancellation",
    paragraphs: [
      "Customers who cancel a paid subscription will generally retain access to the subscribed service until the end of their current paid billing period.",
      "Once that period ends, paid features may become unavailable. The treatment of stored business and member records, including any export or deletion options, will be explained before launch.",
    ],
  },
  {
    id: "refunds",
    title: "5. Refund policy",
    paragraphs: [
      "Subscription payments are generally non-refundable once successfully charged, including where a customer cancels before the end of a billing period.",
      "Memberox will provide refunds or other remedies where required by applicable law. Nothing in this policy limits statutory consumer rights or remedies that cannot lawfully be excluded.",
      "Any additional refund exceptions, including treatment of duplicate or incorrect charges, will be finalized before billing is enabled.",
    ],
  },
  {
    id: "billing",
    title: "6. Billing and renewals",
    paragraphs: [
      "Paid subscriptions are expected to renew according to the billing terms accepted by the customer during checkout.",
      "Renewal authorization, billing notifications, payment failures, and cancellation controls will be implemented and disclosed before recurring payments are enabled.",
      "After an effective cancellation, Memberox will not initiate further subscription renewals for that canceled subscription.",
    ],
  },
  {
    id: "changes",
    title: "7. Policy changes",
    paragraphs: [
      "Memberox may update this policy as its subscription service develops or applicable legal requirements change.",
      "The final policy will include an effective date and explain how material changes are communicated to customers.",
    ],
  },
  {
    id: "contact",
    title: "8. Questions and billing issues",
    paragraphs: [
      "Customers will be provided with a functioning support channel for subscription cancellation questions, billing errors, and refund requests before paid launch.",
      "Until that support process is established, this document remains a draft and should not be treated as an operational refund-request procedure.",
    ],
  },
];

const RefundPolicy = () => {
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
              <ReceiptText size={27} />
            </div>

            <span className={styles.eyebrow}>BILLING & SUBSCRIPTIONS</span>

            <h1>
              Refund & <span>Cancellation</span>
            </h1>

            <p className={styles.heroDescription}>
              Learn how subscription cancellations, billing periods, and refund
              requests are intended to work with Memberox.
            </p>

            <div className={styles.draftNotice}>
              <strong>Draft — not yet effective</strong>
              <p>
                Subscription billing is not active. This policy must be
                finalized before Memberox begins accepting payments.
              </p>
            </div>
          </div>
        </section>

        <section className={styles.contentSection}>
          <div className={styles.contentLayout}>
            <aside className={styles.sidebar}>
              <div className={styles.sidebarInner}>
                <span className={styles.sidebarTitle}>ON THIS PAGE</span>

                <nav aria-label="Refund policy sections">
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
                  <span className={styles.eyebrow}>NEED ASSISTANCE?</span>

                  <h2>Have a billing question?</h2>

                  <p>Visit our Contact Us page for support information.</p>
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

export default RefundPolicy;
