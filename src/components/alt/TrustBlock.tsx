import { Container, Section } from "@/components/ui";
import styles from "./TrustBlock.module.css";

export type TrustPillar = { title: string; body: string };

export type TrustBlockProps = {
  title: string;
  body: string;
  pillars: TrustPillar[];
};

/**
 * TrustBlock — the "what makes us different" statement block: a plain-spoken
 * claim about the category's trust problem, plus a row of concrete pillars
 * backing it up. Sits early on the homepage, before any product grid.
 */
export function TrustBlock({ title, body, pillars }: TrustBlockProps) {
  return (
    <Section tone="default">
      <Container>
        <div className={styles.inner}>
          <div className={styles.copy}>
            <h2 className={styles.title}>{title}</h2>
            <p className={styles.body}>{body}</p>
          </div>
          <ul className={styles.pillars}>
            {pillars.map((p) => (
              <li className={styles.pillar} key={p.title}>
                <span className={styles.pillarTitle}>{p.title}</span>
                <span className={styles.pillarBody}>{p.body}</span>
              </li>
            ))}
          </ul>
        </div>
      </Container>
    </Section>
  );
}
