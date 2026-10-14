"use client";

import { useState } from "react";
import styles from "./Reviews.module.css";

/**
 * ReviewText — the review's full text, paragraph by paragraph. With `clamp`
 * (landing cards) long reviews are folded to a few lines and open in place
 * with "Читать полностью"; the text itself is never shortened.
 */
export function ReviewText({
  text,
  clamp = false,
}: {
  text: string;
  clamp?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const paragraphs = text.split(/\n{2,}/);
  const long = text.length > 420;
  const folded = clamp && long && !open;

  return (
    <div className={styles.textWrap}>
      <div className={`${styles.textBody}${folded ? ` ${styles.folded}` : ""}`}>
        {paragraphs.map((p, i) => (
          <p className={styles.text} key={i}>
            {p}
          </p>
        ))}
      </div>
      {clamp && long && (
        <button
          type="button"
          className={styles.unfold}
          aria-expanded={open}
          onClick={() => setOpen((o) => !o)}
        >
          {open ? "Свернуть" : "Читать полностью"}
        </button>
      )}
    </div>
  );
}
