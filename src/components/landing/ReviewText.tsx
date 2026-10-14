"use client";

import { useLayoutEffect, useRef, useState } from "react";
import styles from "./Reviews.module.css";

/** How many lines of a review show before the "…ещё" spoiler. */
const LINES = 10;

/**
 * ReviewText — the review's full text, unedited. It shows the first 10 lines;
 * if there is more, a "…ещё" button opens the rest in place.
 */
export function ReviewText({ text }: { text: string }) {
  const [open, setOpen] = useState(false);
  const [overflow, setOverflow] = useState(false);
  const ref = useRef<HTMLParagraphElement>(null);

  // does the text need more than 10 lines at the current width?
  useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;
    const measure = () => {
      if (open) return;
      setOverflow(el.scrollHeight - el.clientHeight > 1);
    };
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    return () => ro.disconnect();
  }, [text, open]);

  return (
    <div className={styles.textWrap}>
      <p
        ref={ref}
        className={`${styles.text} ${styles.clampText}${open ? ` ${styles.clampOpen}` : ""}`}
        style={{ ["--review-lines" as string]: LINES }}
      >
        {text}
      </p>
      {(overflow || open) && (
        <button
          type="button"
          className={styles.unfold}
          aria-expanded={open}
          onClick={() => setOpen((o) => !o)}
        >
          {open ? "Свернуть" : "…ещё"}
        </button>
      )}
    </div>
  );
}
