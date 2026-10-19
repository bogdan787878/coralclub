import Image from "next/image";
import { Accent, Container, Heading, Section } from "@/components/ui";
import { asset } from "@/lib/asset";
import styles from "./Certificates.module.css";

type Logo = { slug: string; name: string; w: number; h: number; show: number };

/** Certificates and standards. `show` is the display height (px) —
 *  tuned so every mark carries about the same visual weight. */
const LOGOS: Logo[] = [
  { slug: "ifs", name: "IFS Food", w: 127, h: 80, show: 38 },
  { slug: "haccp", name: "HACCP", w: 80, h: 79, show: 40 },
  { slug: "fda", name: "FDA", w: 93, h: 40, show: 26 },
  { slug: "sedex", name: "Sedex", w: 174, h: 48, show: 22 },
  { slug: "sgs", name: "SGS", w: 82, h: 80, show: 40 },
  { slug: "nsf", name: "NSF", w: 96, h: 98, show: 40 },
  { slug: "sqf", name: "SQF", w: 158, h: 64, show: 30 },
  { slug: "gmp", name: "GMP", w: 89, h: 87, show: 40 },
  { slug: "brcgs", name: "BRCGS Food Safety", w: 260, h: 71, show: 26 },
  { slug: "brc-food", name: "BRC Food", w: 77, h: 79, show: 40 },
  { slug: "iso-9001", name: "ISO 9001:2015", w: 68, h: 68, show: 40 },
  { slug: "iso-22000", name: "ISO 22000:2018", w: 89, h: 86, show: 40 },
  { slug: "afepadi", name: "Afepadi", w: 163, h: 46, show: 24 },
];

/**
 * Certificates — a statement on the left and the quality / safety marks as
 * outlined pills on the right.
 */
export function Certificates() {
  return (
    <Section
      tone="surface"
      id="certificates"
      className={styles.section}
      data-analytics-section="certificates"
    >
      <Container>
        <div className={styles.inner}>
          <div className={styles.copy}>
            <Heading as="h2" className={styles.title}>
              Производство мирового уровня, подтвержденное{" "}
              <Accent>сертификатами</Accent>
            </Heading>
            <p className={styles.text}>
              Продукция Coral Club производится на ведущих предприятиях,
              соответствующих строгим международным стандартам качества
              и безопасности, включая:
            </p>
          </div>

          <div className={styles.logos}>
            <ul className={styles.row}>
              {LOGOS.map((l) => (
                <li className={styles.pill} key={l.slug}>
                  <Image
                    src={asset(`/images/landing/certificates/${l.slug}.webp`)}
                    alt={l.name}
                    width={l.w}
                    height={l.h}
                    sizes={`${Math.round((l.w / l.h) * l.show)}px`}
                    style={{
                      height: `calc(${l.show}px * var(--logo-scale, 1))`,
                      width: "auto",
                      maxWidth: "100%",
                    }}
                  />
                </li>
              ))}
            </ul>
          </div>
        </div>
      </Container>
    </Section>
  );
}
