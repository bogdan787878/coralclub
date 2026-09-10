"use client";

import Image from "next/image";
import type { DomainContent } from "@/lib/products";
import { asset } from "@/lib/asset";
import styles from "./DomainCarousel.module.css";

export type DomainCarouselProps = {
  domains: DomainContent[];
  value: string;
  onChange: (id: string) => void;
};

/**
 * DomainCarousel — the row of category icons under the Personalization
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
            onClick={() => onChange(d.id)}
          >
            <span className={styles.shape}>
              <Image
                src={`${asset(`/images/domains/${d.id}.png`)}?v=3`}
                alt=""
                width={88}
                height={88}
              />
            </span>
            <span className={styles.label}>{d.label}</span>
          </button>
        );
      })}
    </div>
  );
}
