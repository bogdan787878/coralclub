import type { ReactNode } from "react";
import styles from "./OptionCards.module.css";

/** A row of radio cards that scrolls sideways (delivery services, payment methods). */
export function OptionCards({
  label,
  children,
}: {
  label: string;
  children: ReactNode;
}) {
  return (
    <div className={styles.row} role="radiogroup" aria-label={label}>
      {children}
    </div>
  );
}

/**
 * One card: the title on top, the details at the bottom left and the round
 * check at the bottom right (under the right thumb).
 */
export function OptionCard({
  name,
  checked,
  onChange,
  title,
  lines,
  good,
  footer,
}: {
  name: string;
  checked: boolean;
  onChange: () => void;
  title: ReactNode;
  /** small lines under the title (days, price …) */
  lines?: ReactNode;
  /** the last line is a good thing (free): shown in green */
  good?: boolean;
  /** replaces the lines: a logo, card badges */
  footer?: ReactNode;
}) {
  return (
    <label className={`${styles.card} ${checked ? styles.on : ""}`}>
      <input
        className={styles.input}
        type="radio"
        name={name}
        checked={checked}
        onChange={onChange}
      />
      <span className={styles.title}>{title}</span>
      <span className={styles.foot}>
        <span className={`${styles.lines} ${good ? styles.good : ""}`}>
          {footer ?? lines}
        </span>
        <svg className={styles.check} viewBox="0 0 28 28" aria-hidden="true">
          <circle cx="14" cy="14" r="14" />
          {checked && (
            <path
              d="M8.5 14.5l3.8 3.8 7.2-7.6"
              fill="none"
              stroke="#fff"
              strokeWidth="2.2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          )}
        </svg>
      </span>
    </label>
  );
}
