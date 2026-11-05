"use client";

import { useEffect, useRef, useState } from "react";
import { Chip, Chips } from "@/components/ui";
import styles from "./page.module.css";

export type CatalogNavProps = {
  domains: { id: string; label: string }[];
};

// matches the sections' own scrollMarginTop in page.tsx (header 56px +
// chip row ~63px + a little breathing room) — the y-coordinate a
// section's top has to cross to count as "current"
const ANCHOR_PX = 135;

/**
 * CatalogNav — the sticky chip row under the header. Tracks which
 * domain's product section is currently at the anchor line (just under
 * the sticky bars) and keeps that chip both highlighted and scrolled
 * into view within the row, so the row follows the page instead of
 * needing a manual swipe.
 */
export function CatalogNav({ domains }: CatalogNavProps) {
  const [activeId, setActiveId] = useState<string | null>(null);
  const rowRef = useRef<HTMLDivElement>(null);
  const chipRefs = useRef<Record<string, HTMLAnchorElement | HTMLButtonElement | null>>({});

  useEffect(() => {
    const sections = domains
      .map((d) => ({ id: d.id, el: document.getElementById(d.id) }))
      .filter((s): s is { id: string; el: HTMLElement } => s.el !== null);
    if (sections.length === 0) return;

    let ticking = false;
    const update = () => {
      ticking = false;
      // the active section is the last one (in document order) whose
      // top has already crossed the anchor line — i.e. what the reader
      // is currently looking at, just under the sticky header/chip row
      let current: string | null = null;
      for (const s of sections) {
        if (s.el.getBoundingClientRect().top <= ANCHOR_PX) {
          current = s.id;
        } else {
          break;
        }
      }
      setActiveId(current);
    };
    const onScroll = () => {
      if (ticking) return;
      ticking = true;
      requestAnimationFrame(update);
    };

    update();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
    };
  }, [domains]);

  useEffect(() => {
    if (!activeId) return;
    const row = rowRef.current;
    const chip = chipRefs.current[activeId];
    if (!row || !chip) return;

    const chipLeft = chip.offsetLeft;
    const chipRight = chipLeft + chip.offsetWidth;
    const viewLeft = row.scrollLeft;
    const viewRight = viewLeft + row.clientWidth;

    if (chipLeft < viewLeft) {
      row.scrollTo({ left: chipLeft - 16, behavior: "smooth" });
    } else if (chipRight > viewRight) {
      row.scrollTo({ left: chipRight - row.clientWidth + 16, behavior: "smooth" });
    }
  }, [activeId]);

  return (
    <div className={styles.stickyNav}>
      <Chips ref={rowRef} className={styles.stickyNavRow} aria-label="Jump to category">
        {domains.map((d) => (
          <Chip
            key={d.id}
            href={`#${d.id}`}
            active={d.id === activeId}
            ref={(el) => {
              chipRefs.current[d.id] = el;
            }}
          >
            {d.label}
          </Chip>
        ))}
      </Chips>
    </div>
  );
}
