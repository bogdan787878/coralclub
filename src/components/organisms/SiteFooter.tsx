import { Container, Section } from "@/components/ui";
import { asset } from "@/lib/asset";
import styles from "./SiteFooter.module.css";

const ext = { target: "_blank", rel: "noopener noreferrer" } as const;

/**
 * SiteFooter — company contact block on navy, two columns, closing with the
 * "The Art of Being Healthy" line.
 */
export function SiteFooter() {
  return (
    <Section as="footer" tone="primary" className={styles.footer}>
      <Container>
        <address className={styles.address}>
          5260 W Sunset Rd, Las Vegas, Nevada 89118
          <span className={styles.muted}> · Closed until 09:00</span>
        </address>

        <div className={styles.grid}>
          <div className={styles.col}>
            <div className={styles.group}>
              <p className={styles.label}>Telephone</p>
              <a href="tel:+18442249987" className={styles.link}>
                +1 (844) 224-9987
              </a>
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
          </div>

          <div className={styles.col}>
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
          </div>
        </div>

        <div className={styles.legal}>
          <span>1999 – 2026 © Coral Club. All rights reserved</span>
          <a href="https://coralclub.us/faq/privacy/" {...ext}>
            Legal Info
          </a>
        </div>

        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          className={styles.line}
          src={asset("/images/footer-line.svg")}
          alt="Coral Club — The Art of Being Healthy"
          width={375}
          height={193}
        />
      </Container>
    </Section>
  );
}
