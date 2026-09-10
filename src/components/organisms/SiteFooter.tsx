import { Container, Section } from "@/components/ui";
import styles from "./SiteFooter.module.css";

const ext = { target: "_blank", rel: "noopener noreferrer" } as const;

/**
 * SiteFooter — company contact block on navy, closing with the
 * "The Art of Being Healthy" brand lockup.
 */
export function SiteFooter() {
  return (
    <Section as="footer" tone="primary" className={styles.footer}>
      <Container>
        <div className={styles.cols}>
          <div className={styles.group}>
            <address className={styles.address}>
              5260 W Sunset Rd,
              <br />
              Las Vegas, Nevada 89118
            </address>
            <p className={styles.muted}>Closed until 09:00</p>
          </div>

          <div className={styles.group}>
            <p className={styles.label}>Telephone</p>
            <a href="tel:+18442249987" className={styles.link}>
              +1 (844) 224-9987
            </a>
          </div>

          <div className={styles.group}>
            <p className={styles.label}>Hours</p>
            <p className={styles.hours}>
              9:00 am – 5:00 pm EST
              <span>Monday – Friday</span>
            </p>
            <p className={styles.hours}>
              9:00 am – 3:00 pm EST
              <span>Saturday – Sunday</span>
            </p>
          </div>

          <div className={styles.group}>
            <p className={styles.label}>E-mail</p>
            <a
              href="mailto:support.us@coral-club.com"
              className={styles.link}
            >
              support.us@coral-club.com
            </a>
          </div>

          <div className={styles.group}>
            <p className={styles.label}>Messengers</p>
            <a href="https://wa.me/14372293572" className={styles.link} {...ext}>
              WhatsApp
            </a>
            <a
              href="https://telegram.me/+14372293572"
              className={styles.link}
              {...ext}
            >
              Telegram
            </a>
          </div>

          <nav className={styles.legal}>
            <a href="https://coralclub.us/faq/privacy/" {...ext}>
              Privacy Policy
            </a>
            <a href="https://coralclub.us/faq/terms/" {...ext}>
              Terms
            </a>
          </nav>
        </div>

        <div
          className={styles.mark}
          aria-label="Coral Club — The Art of Being Healthy, est. MCMXCVIII"
        >
          <span className={styles.wordmark}>coralclub</span>
          <span className={styles.lockup} aria-hidden="true">
            <b>THE</b> <i>art</i> <i>of</i> <b>BEING</b> <i>healthy</i>
          </span>
          <span className={styles.year}>MCMXCVIII</span>
        </div>
      </Container>
    </Section>
  );
}
