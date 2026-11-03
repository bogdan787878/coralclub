"use client";

import {
  useId,
  useRef,
  useState,
  type KeyboardEvent,
  type ReactNode,
} from "react";
import styles from "./PdpTabs.module.css";

export type PdpTab = { id: string; label: string; content: ReactNode };

/**
 * Tabs under the product picture, as in a classic shop: one row of names,
 * the chosen tab's content below. All panels are in the page (the others
 * hidden), the arrow keys move between tabs.
 */
export function PdpTabs({ tabs }: { tabs: PdpTab[] }) {
  const base = useId();
  const [active, setActive] = useState(tabs[0]?.id ?? "");
  const refs = useRef<Record<string, HTMLButtonElement | null>>({});
  if (!tabs.length) return null;

  const move = (e: KeyboardEvent, i: number) => {
    const step =
      e.key === "ArrowRight"
        ? 1
        : e.key === "ArrowLeft"
          ? -1
          : e.key === "Home"
            ? -i
            : e.key === "End"
              ? tabs.length
              : 0;
    if (!step) return;
    e.preventDefault();
    const next =
      tabs[(i + step + tabs.length) % tabs.length] ?? tabs[tabs.length - 1];
    setActive(next.id);
    refs.current[next.id]?.focus();
  };

  return (
    <div className={styles.tabs}>
      <div className={styles.bar} role="tablist" aria-label="Product details">
        {tabs.map((t, i) => (
          <button
            key={t.id}
            ref={(el) => {
              refs.current[t.id] = el;
            }}
            type="button"
            role="tab"
            id={`${base}-tab-${t.id}`}
            aria-selected={active === t.id}
            aria-controls={`${base}-panel-${t.id}`}
            tabIndex={active === t.id ? 0 : -1}
            className={`${styles.tab} ${active === t.id ? styles.on : ""}`}
            data-analytics-id={`pdp_tab_${t.id}`}
            onClick={() => setActive(t.id)}
            onKeyDown={(e) => move(e, i)}
          >
            {t.label}
          </button>
        ))}
      </div>
      {tabs.map((t) => (
        <div
          key={t.id}
          role="tabpanel"
          id={`${base}-panel-${t.id}`}
          aria-labelledby={`${base}-tab-${t.id}`}
          data-tab={t.id}
          hidden={active !== t.id}
          className={styles.panel}
        >
          {t.content}
        </div>
      ))}
    </div>
  );
}
