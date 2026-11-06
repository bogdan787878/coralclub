"use client";

import { useState, type ReactNode } from "react";
import { Sheet, Icon } from "@/components/ui";
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
            <Icon name="next" size={20} className={styles.chevron} />
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
