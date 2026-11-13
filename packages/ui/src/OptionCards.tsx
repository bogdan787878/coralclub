import type { ReactNode } from "react";
import styles from "./OptionCards.module.css";

/**
 * Radio options (delivery services, payment methods): a row of cards that
 * scrolls sideways, or `layout="list"` — one option per line, stacked.
 */
export function OptionCards({
  label,
  children,
  layout = "row",
}: {
  label: string;
  children: ReactNode;
  layout?: "row" | "list";
}) {
  return (
    <div className={layout === "list" ? styles.list : styles.row} role="radiogroup" aria-label={label}>
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
  icon,
  price,
  priceNote,
  priceGood,
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
  /** a small logo before the title (a payment system's icon) */
  icon?: ReactNode;
  /** the price at the right of the card (the delivery cost), larger than the lines */
  price?: ReactNode;
  /** a small hint under the price («free over 60 €») */
  priceNote?: ReactNode;
  /** the price is a good thing (free): shown in green */
  priceGood?: boolean;
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
      <span className={styles.title}>
        {icon && <span className={styles.icon}>{icon}</span>}
        {title}
      </span>
      <span className={styles.foot}>
        <span className={`${styles.lines} ${good ? styles.good : ""}`}>
          {footer ?? lines}
        </span>
        {(price || priceNote) && (
          <span
            className={`${styles.side} ${priceGood ? styles.sideGood : ""}`}
          >
            {price && <span className={styles.price}>{price}</span>}
            {priceNote && (
              <span className={styles.priceNote}>{priceNote}</span>
            )}
          </span>
        )}
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

/** The only option: nothing to choose, so the data is just shown (no radio card). */
export function OptionInfo({
  title,
  detail,
  aside,
  asideNote,
  good,
}: {
  title: ReactNode;
  detail?: ReactNode;
  aside?: ReactNode;
  /** a small hint under the aside («free over 60 €») */
  asideNote?: ReactNode;
  /** the aside is a good thing (free): shown in green */
  good?: boolean;
}) {
  return (
    <div className={styles.info}>
      <div className={styles.infoText}>
        <span className={styles.infoTitle}>{title}</span>
        {detail && <span className={styles.infoDetail}>{detail}</span>}
      </div>
      {(aside || asideNote) && (
        <span className={styles.infoAsideBox}>
          {aside && (
            <span
              className={`${styles.infoAside} ${good ? styles.infoGood : ""}`}
            >
              {aside}
            </span>
          )}
          {asideNote && (
            <span className={styles.infoAsideNote}>{asideNote}</span>
          )}
        </span>
      )}
    </div>
  );
}
