import { Button, Container, Section } from "@/components/ui";
import styles from "./QuizPromo.module.css";

/**
 * QuizPromo — homepage CTA block pointing at /quiz. Replaces the Liumi
 * series showcase in the Hydration phase's section list.
 */
export function QuizPromo() {
  return (
    <Section tone="surface">
      <Container>
        <div className={styles.card}>
          <h2 className={styles.title}>
            Not sure where to start?
            <br />
            Take the quiz.
          </h2>
          <p className={styles.body}>
            Answer a few questions about how you feel — get a personal
            protocol by phase, built around your goals.
          </p>
          <Button href="/quiz" variant="secondary" className={styles.cta}>
            Take the quiz
          </Button>
        </div>
      </Container>
    </Section>
  );
}
