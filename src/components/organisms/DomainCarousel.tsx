"use client";

import Image from "next/image";
import type { DomainContent } from "@/lib/products";
import { asset } from "@/lib/asset";
import { DOMAIN_ICONS } from "./domainIcons";
import styles from "./DomainCarousel.module.css";

export type DomainCarouselProps = {
  domains: DomainContent[];
  value: string;
  onChange: (id: string) => void;
};

/** Flip to false to bring back the uploaded glass-style PNGs
 *  (/images/domains/<id>.png) instead of the line icons below —
 *  nothing else needs to change. */
const USE_LINE_ICONS = true;

/**
 * DomainCarousel — the row of category icons under the Personalization
 * circle. Tap one to swap the product carousel below to that domain's set.
 */
export function DomainCarousel({ domains, value, onChange }: DomainCarouselProps) {
  return (
    <div
      className={styles.track}
      role="tablist"
      aria-label="Personalisation domains"
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
              {USE_LINE_ICONS ? (
                (() => {
                  const Icon = DOMAIN_ICONS[d.id];
                  return Icon ? <Icon className={styles.icon} /> : null;
                })()
              ) : (
                <Image
                  src={`${asset(`/images/domains/${d.id}.png`)}?v=3`}
                  alt=""
                  width={88}
                  height={88}
                />
              )}
            </span>
            <span className={styles.label}>{d.label}</span>
          </button>
        );
      })}
    </div>
  );
}
