import type { ElementInfo } from "@/lib/products";
import styles from "./KeyElementsVisual.module.css";

export type KeyElementsVisualProps = {
  items: ElementInfo[];
  heading?: string;
};

/**
 * KeyElementsVisual — PeriodicElements' /alt counterpart: the same active
 * elements, but as picture-like circular badges instead of flat
 * periodic-table tiles, matching the market pattern of illustrating Key
 * Elements rather than just naming them.
 */
export function KeyElementsVisual({ items, heading = "Key Elements" }: KeyElementsVisualProps) {
  if (!items.length) return null;

  return (
    <div className={styles.wrap}>
      <h3 className={styles.heading}>{heading}</h3>
      <ul className={styles.grid}>
        {items.map((el) => (
          <li className={styles.tile} key={`${el.symbol}-${el.name}`}>
            <span className={styles.badge} aria-hidden="true">
              {el.symbol}
            </span>
            <span className={styles.name}>{el.name}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
