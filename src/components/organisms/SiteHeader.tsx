import type { ReactNode } from "react";
import Link from "next/link";
import styles from "./SiteHeader.module.css";

export type SiteHeaderProps = {
  /** Promo line in the top bar. Hidden when null. */
  announcement?: ReactNode;
  /** Brand lockup. Defaults to the "coralclub" wordmark. */
  brand?: ReactNode;
};

/**
 * SiteHeader — the shared announcement bar + centred brand lockup that sits
 * above every page. The wordmark links home.
 */
export function SiteHeader({
  announcement = "Free shipping on orders over $100",
  brand = "coralclub",
}: SiteHeaderProps) {
  return (
    <div className={styles.root}>
      {announcement != null && (
        <div className={styles.announce}>
          <span>{announcement}</span>
          <svg
            className={styles.announceChevron}
            width="12"
            height="12"
            viewBox="0 0 12 12"
            aria-hidden="true"
          >
            <path
              d="M2.5 4.5 6 8l3.5-3.5"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </div>
      )}

      <div className={styles.brandBar}>
        <Link href="/" className={styles.brand}>
          {brand}
        </Link>
        <Link href="/quiz" className={styles.quiz}>
          <span className={styles.quizFull}>Пройти квиз</span>
          <span className={styles.quizShort}>Квиз</span>
          <span aria-hidden="true"> →</span>
        </Link>
      </div>
    </div>
  );
}
