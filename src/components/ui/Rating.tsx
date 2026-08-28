import styles from "./Rating.module.css";

export type RatingProps = {
  /** 0–5. */
  value: number;
  ratingsCount?: number;
  reviewsCount?: number;
  /** Hide the numeric score before the stars. */
  hideScore?: boolean;
};

function Star({ filled }: { filled: boolean }) {
  return (
    <svg
      className={`${styles.star} ${filled ? "" : styles.starEmpty}`}
      width="16"
      height="16"
      viewBox="0 0 16 16"
      aria-hidden="true"
    >
      <path
        d="M8 1.5l1.98 4.01 4.42.64-3.2 3.12.76 4.4L8 11.99 4.04 14.07l.76-4.4L1.6 6.55l4.42-.64z"
        fill="currentColor"
      />
    </svg>
  );
}

/** Star rating with an optional score and ratings/reviews counts. */
export function Rating({
  value,
  ratingsCount,
  reviewsCount,
  hideScore = false,
}: RatingProps) {
  const rounded = Math.round(value);
  const parts: string[] = [];
  if (ratingsCount != null) parts.push(`${ratingsCount} ratings`);
  if (reviewsCount != null) parts.push(`${reviewsCount} reviews`);

  return (
    <div
      className={styles.root}
      aria-label={`Rated ${value} out of 5${
        parts.length ? `, ${parts.join(", ")}` : ""
      }`}
    >
      {!hideScore && (
        <span className={styles.score}>{value.toFixed(1)}</span>
      )}
      <span className={styles.stars} aria-hidden="true">
        {Array.from({ length: 5 }, (_, i) => (
          <Star key={i} filled={i < rounded} />
        ))}
      </span>
      {parts.length > 0 && (
        <span className={styles.counts}>{parts.join(", ")}</span>
      )}
    </div>
  );
}
