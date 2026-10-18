import { Link } from "react-router-dom";
import { ArrowRight, Mail, MessageSquareText, Clock3 } from "lucide-react";

import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import styles from "./Contact.module.css";

const Contact = () => {
  return (
    <>
      <Navbar />

      <main className={styles.contactPage}>
        <section className={styles.hero}>
          <span className={styles.eyebrow}>CONTACT MEMBEROX</span>

          <h1>
            Have a question?
            <br />
            <span>We're here to help.</span>
          </h1>

          <p>
            Curious about Memberox, have a suggestion, or need help getting
            started? We'd love to hear from you.
          </p>
        </section>

        <section className={styles.contactSection}>
          <div className={styles.contactInfo}>
            <span className={styles.eyebrow}>GET IN TOUCH</span>

            <h2>
              Let's start a<span> conversation.</span>
            </h2>

            <p className={styles.infoDescription}>
              Whether you're exploring Memberox for your business or have a
              question about the platform, this is the place to reach out.
            </p>

            <div className={styles.infoCards}>
              <div className={styles.infoCard}>
                <div className={styles.infoIcon}>
                  <Mail size={21} />
                </div>

                <div>
                  <h3>Email support</h3>
                  <p>Our support email will be available here soon.</p>
                </div>
              </div>

              <div className={styles.infoCard}>
                <div className={styles.infoIcon}>
                  <MessageSquareText size={21} />
                </div>

                <div>
                  <h3>Questions & feedback</h3>
                  <p>
                    Tell us what you'd like to know or what we could improve.
                  </p>
                </div>
              </div>

              <div className={styles.infoCard}>
                <div className={styles.infoIcon}>
                  <Clock3 size={21} />
                </div>

                <div>
                  <h3>Support availability</h3>
                  <p>Support hours will be announced before launch.</p>
                </div>
              </div>
            </div>
          </div>

          <div className={styles.formCard}>
            <div className={styles.formHeader}>
              <span className={styles.formBadge}>CONTACT FORM</span>

              <h2>Send us a message</h2>

              <p>Share a few details about your question.</p>
            </div>

            <form
              className={styles.form}
              onSubmit={(event) => event.preventDefault()}
            >
              <div className={styles.inputRow}>
                <div className={styles.field}>
                  <label htmlFor="contact-name">Your name</label>

                  <input
                    id="contact-name"
                    name="name"
                    type="text"
                    placeholder="Enter your name"
                    autoComplete="name"
                  />
                </div>

                <div className={styles.field}>
                  <label htmlFor="contact-email">Email address</label>

                  <input
                    id="contact-email"
                    name="email"
                    type="email"
                    placeholder="you@example.com"
                    autoComplete="email"
                  />
                </div>
              </div>

              <div className={styles.field}>
                <label htmlFor="contact-subject">Subject</label>

                <select id="contact-subject" name="subject" defaultValue="">
                  <option value="" disabled>
                    What can we help with?
                  </option>
                  <option value="general">General inquiry</option>
                  <option value="product">Product question</option>
                  <option value="support">Technical support</option>
                  <option value="feedback">Feedback or suggestion</option>
                  <option value="other">Something else</option>
                </select>
              </div>

              <div className={styles.field}>
                <label htmlFor="contact-message">Your message</label>

                <textarea
                  id="contact-message"
                  name="message"
                  rows={6}
                  placeholder="Tell us a little about what you need..."
                />
              </div>

              <button className={styles.submitButton} type="button" disabled>
                Send message
                <ArrowRight size={18} />
              </button>

              <p className={styles.formNote}>
                Message submission is coming soon. This form is currently a
                preview.
              </p>
            </form>
          </div>
        </section>

        <section className={styles.bottomSection}>
          <h2>New to Memberox?</h2>

          <p>
            Explore the platform and see how it can simplify your membership
            workflow.
          </p>

          <Link to="/#features" className={styles.exploreLink}>
            Explore features
            <ArrowRight size={18} />
          </Link>
        </section>
      </main>

      <Footer />
    </>
  );
};

export default Contact;
