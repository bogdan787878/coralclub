"use client";

import type { DomainContent } from "@/lib/products";
import { DOMAIN_SHAPE } from "./DomainShapes";
import styles from "./DomainCarousel.module.css";

// experiment: all domain shapes in one mid DS blue (was per-domain colours)
const SHAPE_COLOR = "var(--color-primary-50)";

export type DomainCarouselProps = {
  domains: DomainContent[];
  value: string;
  onChange: (id: string) => void;
};

/**
 * DomainCarousel — the row of abstract flat shapes under the Personalization
 * circle. Tap one to swap the product carousel below to that domain's set.
 */
export function DomainCarousel({ domains, value, onChange }: DomainCarouselProps) {
  return (
    <div
      className={styles.track}
      role="tablist"
      aria-label="Personalization domains"
    >
      {domains.map((d) => {
        const active = d.id === value;
        return (
          <button
            key={d.id}
            type="button"
            role="tab"
            aria-selected={active}
            className={`${styles.item} ${active ? styles.itemOn : ""}`}
            style={{ color: SHAPE_COLOR }}
            onClick={() => onChange(d.id)}
          >
            <span className={styles.shape}>{DOMAIN_SHAPE[d.id]}</span>
            <span className={styles.label}>{d.label}</span>
          </button>
        );
      })}
    </div>
  );
}
