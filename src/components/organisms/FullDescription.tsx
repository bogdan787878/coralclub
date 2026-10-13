"use client";

import { useState } from "react";
import styles from "./FullDescription.module.css";

export type FullDescriptionProps = {
  text: string;
  /** Overrides for a translated storefront. */
  title?: string;
  moreLabel?: string;
  lessLabel?: string;
};

/**
 * FullDescription — the scraped coralclub.us "Description" tab text,
 * inline on the page (not tucked into a Sheet like the rest of
 * InfoAccordion): collapsed to a fixed 240px with a bottom gradient
 * fade, a "See more" toggle underneath expands it in place.
 */
export function FullDescription({
  text,
  title = "Full Description",
  moreLabel = "See more",
  lessLabel = "See less",
}: FullDescriptionProps) {
  const [expanded, setExpanded] = useState(false);

  return (
    <div className={styles.root}>
      <h3 className={styles.title}>{title}</h3>
      <div className={`${styles.textWrap} ${expanded ? styles.expanded : ""}`}>
        <p className={styles.text}>{text}</p>
        {!expanded && <div className={styles.fade} aria-hidden="true" />}
      </div>
      <button
        type="button"
        className={styles.toggle}
        aria-expanded={expanded}
        onClick={() => setExpanded((e) => !e)}
      >
        {expanded ? lessLabel : moreLabel}
        <svg
          className={`${styles.chevron}${expanded ? ` ${styles.chevronUp}` : ""}`}
          width="20"
          height="20"
          viewBox="0 0 20 20"
          aria-hidden="true"
        >
          <path
            d="M4.5 7.5 10 13l5.5-5.5"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </button>
    </div>
  );
}
