import type { ReactNode } from "react";
import styles from "./Accordion.module.css";

type AccordionProps = {
  children: ReactNode;
};

/** Stack of disclosure rows with hairline dividers. */
export function Accordion({ children }: AccordionProps) {
  return <div className={styles.root}>{children}</div>;
}

type AccordionItemProps = {
  title: ReactNode;
  children: ReactNode;
  /** Render expanded on load. */
  defaultOpen?: boolean;
  /** Groups items so only one stays open at a time (native <details name>). */
  name?: string;
};

/**
 * AccordionItem — a native <details> row: title + a "+" toggle that becomes
 * "−" when open. No JS, works in the static export.
 */
export function AccordionItem({
  title,
  children,
  defaultOpen = false,
  name,
}: AccordionItemProps) {
  return (
    <details className={styles.item} open={defaultOpen} name={name}>
      <summary className={styles.summary}>
        <span className={styles.title}>{title}</span>
        <span className={styles.icon} aria-hidden="true" />
      </summary>
      <div className={styles.panel}>{children}</div>
    </details>
  );
}
