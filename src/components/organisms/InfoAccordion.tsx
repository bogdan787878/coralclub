"use client";

import { useState, type ReactNode } from "react";
import { Sheet } from "@/components/ui";
import styles from "./InfoAccordion.module.css";

export type InfoSection = {
  title: string;
  content: ReactNode;
};

export type InfoAccordionProps = {
  items: InfoSection[];
};

/**
 * InfoAccordion — a list of disclosure rows whose content opens in a Sheet
 * (bottom sheet on mobile, drawer on desktop) rather than expanding inline.
 */
export function InfoAccordion({ items }: InfoAccordionProps) {
  const [openIndex, setOpenIndex] = useState<number | null>(null);
  const active = openIndex !== null ? items[openIndex] : null;

  return (
    <>
      <div className={styles.list}>
        {items.map((item, i) => (
          <button
            key={item.title}
            type="button"
            className={styles.row}
            onClick={() => setOpenIndex(i)}
          >
            <span className={styles.title}>{item.title}</span>
            <svg
              className={styles.chevron}
              width="20"
              height="20"
              viewBox="0 0 20 20"
              aria-hidden="true"
            >
              <path
                d="M7.5 4.5 13 10l-5.5 5.5"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </button>
        ))}
      </div>

      <Sheet
        open={active !== null}
        onClose={() => setOpenIndex(null)}
        title={active?.title ?? ""}
      >
        {active?.content}
      </Sheet>
    </>
  );
}
