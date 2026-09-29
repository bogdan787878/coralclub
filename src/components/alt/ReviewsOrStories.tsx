"use client";

import type { MouseEvent } from "react";
import styles from "./ReviewsOrStories.module.css";

export type ReviewsOrStoriesProps = {
  rating?: number;
  reviewsCount?: number;
  /** Fallback social proof while there are no written reviews yet. */
  stories: { src: string; alt: string }[];
};

function StarIcon({ filled }: { filled: boolean }) {
  return (
    <svg width="16" height="16" viewBox="0 0 20 20" fill={filled ? "currentColor" : "none"} aria-hidden="true">
      <path
        d="M10 1.5l2.6 5.4 5.9.8-4.3 4.2 1 5.9-5.2-2.8-5.2 2.8 1-5.9L1.5 7.7l5.9-.8L10 1.5z"
        stroke="currentColor"
        strokeWidth="1.2"
        strokeLinejoin="round"
      />
    </svg>
  );
}

/**
 * ReviewsOrStories — shows a rating summary when the product has one; while
 * we have no written reviews yet, falls back to a row of short community
 * clips as social proof instead of leaving the spot empty.
 */
export function ReviewsOrStories({ rating, reviewsCount, stories }: ReviewsOrStoriesProps) {
  const toggle = (e: MouseEvent<HTMLVideoElement>) => {
    const v = e.currentTarget;
    if (v.paused) void v.play().catch(() => {});
    else v.pause();
  };

  if (rating && reviewsCount) {
    return (
      <div className={styles.wrap}>
        <div className={styles.ratingRow}>
          <span className={styles.stars}>
            {[1, 2, 3, 4, 5].map((n) => (
              <StarIcon key={n} filled={n <= Math.round(rating)} />
            ))}
          </span>
          <span className={styles.count}>
            {rating.toFixed(1)} · {reviewsCount} reviews
          </span>
        </div>
      </div>
    );
  }

  if (!stories.length) return null;

  return (
    <div className={styles.wrap}>
      <span className={styles.heading}>What members say</span>
      <span className={styles.note}>No written reviews yet — hear it from the community instead.</span>
      <div className={styles.track}>
        {stories.map((s, i) => (
          <button type="button" className={styles.item} key={i} aria-label={s.alt}>
            <video src={s.src} muted loop playsInline preload="metadata" onClick={toggle} />
          </button>
        ))}
      </div>
    </div>
  );
}
