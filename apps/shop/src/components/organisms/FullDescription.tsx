"use client";

import { Icon } from "@/components/ui";
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
        <Icon name="down" size={20} className={`${styles.chevron}${expanded ? ` ${styles.chevronUp}` : ""}`} />
      </button>
    </div>
  );
}
