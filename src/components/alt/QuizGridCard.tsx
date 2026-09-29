import Link from "next/link";
import styles from "./QuizGridCard.module.css";

/**
 * QuizGridCard — a 2×2 grid cell that sits inline among product cards,
 * pointing at the quiz instead of a separate banner section — the market
 * pattern of surfacing the quiz as a native grid tile rather than a strip.
 */
export function QuizGridCard() {
  return (
    <Link href="/quiz" className={styles.card}>
      <span className={styles.kicker}>60-second quiz</span>
      <div>
        <div className={styles.title}>Not sure where to start?</div>
        <p className={styles.body}>Answer a few questions and we&rsquo;ll build your set.</p>
      </div>
      <span className={styles.cta}>Take the quiz →</span>
    </Link>
  );
}
