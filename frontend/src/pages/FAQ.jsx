import { useState } from "react";
import { Link } from "react-router-dom";
import {
  ArrowLeft,
  ArrowRight,
  ChevronDown,
  CircleHelp,
  Search,
  X,
} from "lucide-react";

import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import styles from "./FAQ.module.css";

const faqGroups = [
  {
    category: "Getting started",
    questions: [
      {
        question: "What is Memberox?",
        answer:
          "Memberox is a membership-management platform designed to help businesses organize member records, memberships, renewals, payment records, and business information in one workspace.",
      },
      {
        question: "Who can use Memberox?",
        answer:
          "Memberox is designed primarily for gyms, fitness centers, yoga studios, and other membership-based businesses. We're initially focusing on businesses in India.",
      },
      {
        question: "Do I need technical knowledge to use Memberox?",
        answer:
          "Memberox is designed around a straightforward dashboard and simple record-management workflows. You don't need programming knowledge to use the interface.",
      },
    ],
  },
  {
    category: "Members & memberships",
    questions: [
      {
        question: "Can I manage my members in Memberox?",
        answer:
          "Yes. The current dashboard includes member records and membership-management features, including information about membership periods and expiry dates.",
      },
      {
        question: "Can I see which memberships are expiring?",
        answer:
          "Yes. Memberox includes membership-expiry tracking to help you identify upcoming renewals and expired memberships.",
      },
      {
        question: "Does Memberox collect payments from my gym members?",
        answer:
          "No. Memberox is not a payment gateway for gym-member payments. It provides administrative payment records that you can manage for your business.",
      },
      {
        question: "Can Memberox send renewal reminders?",
        answer:
          "The reminder workflow is under development. Email reminders are currently configured in simulation mode, so live delivery isn't available yet. We'll update this answer when sending is enabled.",
      },
    ],
  },
  {
    category: "Pricing & billing",
    questions: [
      {
        question: "How much does Memberox cost?",
        answer:
          "Our proposed monthly plans are Pro at ₹499 and Business at ₹999. These prices are displayed on the website, but subscription billing is not yet active.",
      },
      {
        question: "What's the difference between Pro and Business?",
        answer:
          "The proposed Pro plan supports up to 100 members, while Business is intended to support unlimited members and additional benefits. Plan limits and billing controls are not yet enforced in the application.",
      },
      {
        question: "Can I cancel my subscription?",
        answer:
          "Once paid subscriptions launch, the intended policy is to allow cancellation at any time, with access continuing until the end of the current paid period. The cancellation system isn't available yet.",
      },
      {
        question: "Does Memberox offer refunds?",
        answer:
          "Our proposed policy is that subscription payments are generally non-refundable after payment, except where applicable law requires otherwise. The final policy will be published before billing goes live.",
      },
    ],
  },
  {
    category: "Account & data",
    questions: [
      {
        question: "Do I need an account to use Memberox?",
        answer:
          "Yes. Memberox uses account authentication to provide access to its business dashboard.",
      },
      {
        question: "Where is my business information stored?",
        answer:
          "Memberox currently uses Supabase for authentication and database functionality. More information about data handling is available in our draft Privacy Policy.",
      },
      {
        question: "Can I delete my account and data?",
        answer:
          "We're still finalizing account-closure and data-deletion procedures. The available options and applicable retention rules will be documented before public launch.",
      },
    ],
  },
];

const allQuestions = faqGroups.flatMap((group) =>
  group.questions.map((item) => ({
    ...item,
    category: group.category,
  })),
);

const FAQ = () => {
  const [search, setSearch] = useState("");
  const [activeCategory, setActiveCategory] = useState("All");
  const [openQuestion, setOpenQuestion] = useState(null);

  const categories = ["All", ...faqGroups.map((group) => group.category)];

  const filteredQuestions = allQuestions.filter((item) => {
    const matchesCategory =
      activeCategory === "All" || item.category === activeCategory;

    const query = search.trim().toLowerCase();

    const matchesSearch =
      !query ||
      item.question.toLowerCase().includes(query) ||
      item.answer.toLowerCase().includes(query) ||
      item.category.toLowerCase().includes(query);

    return matchesCategory && matchesSearch;
  });

  const handleCategoryChange = (category) => {
    setActiveCategory(category);
    setOpenQuestion(null);
  };

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
              <CircleHelp size={27} />
            </div>

            <span className={styles.eyebrow}>HELP CENTER</span>

            <h1>
              Questions? <span>Answers.</span>
            </h1>

            <p className={styles.heroDescription}>
              Everything you need to know about getting started with Memberox,
              managing memberships, and understanding our plans.
            </p>

            <div className={styles.searchBox}>
              <Search size={21} />

              <input
                type="search"
                aria-label="Search frequently asked questions"
                placeholder="Search for an answer..."
                value={search}
                onChange={(event) => {
                  setSearch(event.target.value);
                  setOpenQuestion(null);
                }}
              />

              {search && (
                <button
                  type="button"
                  aria-label="Clear search"
                  onClick={() => setSearch("")}
                >
                  <X size={18} />
                </button>
              )}
            </div>
          </div>
        </section>

        <section className={styles.faqSection}>
          <div className={styles.faqContainer}>
            <div className={styles.sectionHeader}>
              <div>
                <span className={styles.eyebrow}>COMMON QUESTIONS</span>

                <h2>Find what you're looking for.</h2>
              </div>

              <p>Browse by topic or search for something specific.</p>
            </div>

            <div className={styles.categoryList}>
              {categories.map((category) => (
                <button
                  key={category}
                  type="button"
                  className={
                    activeCategory === category
                      ? `${styles.categoryButton} ${styles.activeCategory}`
                      : styles.categoryButton
                  }
                  onClick={() => handleCategoryChange(category)}
                >
                  {category}
                </button>
              ))}
            </div>

            <div className={styles.questionsList}>
              {filteredQuestions.length > 0 ? (
                filteredQuestions.map((item) => {
                  const questionKey = `${item.category}-${item.question}`;

                  const isOpen = openQuestion === questionKey;

                  return (
                    <div
                      key={questionKey}
                      className={`${styles.questionCard} ${
                        isOpen ? styles.questionOpen : ""
                      }`}
                    >
                      <button
                        type="button"
                        className={styles.questionButton}
                        aria-expanded={isOpen}
                        onClick={() =>
                          setOpenQuestion(isOpen ? null : questionKey)
                        }
                      >
                        <span className={styles.questionText}>
                          <span className={styles.questionCategory}>
                            {item.category}
                          </span>

                          <span className={styles.questionTitle}>
                            {item.question}
                          </span>
                        </span>

                        <span className={styles.chevron}>
                          <ChevronDown size={20} />
                        </span>
                      </button>

                      {isOpen && (
                        <div className={styles.answer}>
                          <p>{item.answer}</p>
                        </div>
                      )}
                    </div>
                  );
                })
              ) : (
                <div className={styles.emptyState}>
                  <Search size={26} />

                  <h3>No matching questions</h3>

                  <p>Try another search term or select a different category.</p>

                  <button
                    type="button"
                    onClick={() => {
                      setSearch("");
                      setActiveCategory("All");
                      setOpenQuestion(null);
                    }}
                  >
                    Clear filters
                  </button>
                </div>
              )}
            </div>

            <div className={styles.draftNote}>
              Some billing, reminder, and account-management features are still
              under development. This FAQ will be updated as those features
              become available.
            </div>
          </div>
        </section>

        <section className={styles.contactSection}>
          <div className={styles.contactContent}>
            <span className={styles.eyebrow}>STILL HAVE QUESTIONS?</span>

            <h2>Didn't find your answer?</h2>

            <p>
              Visit our Contact Us page for more information about getting in
              touch with the Memberox team.
            </p>

            <Link to="/contact" className={styles.contactButton}>
              Contact us
              <ArrowRight size={18} />
            </Link>
          </div>
        </section>
      </main>

      <Footer />
    </>
  );
};

export default FAQ;
