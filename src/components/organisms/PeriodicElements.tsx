import type { ElementInfo } from "@/lib/products";
import styles from "./PeriodicElements.module.css";

export type PeriodicElementsProps = {
  /** Elements to show, in order. */
  items: ElementInfo[];
  /** Small heading above the tiles. */
  heading?: string;
};

/**
 * PeriodicElements — the product's active elements as periodic-table-style
 * tiles: big symbol, full name underneath. Presentational; render only when
 * `items` is non-empty.
 */
export function PeriodicElements({
  items,
  heading = "Key elements",
}: PeriodicElementsProps) {
  if (!items.length) return null;

  return (
    <section className={styles.wrap}>
      <h3 className={styles.heading}>{heading}</h3>
      <ul className={styles.grid}>
        {items.map((el) => (
          <li className={styles.tile} key={`${el.symbol}-${el.name}`}>
            <span className={styles.symbol}>{el.symbol}</span>
            <span className={styles.name}>{el.name}</span>
          </li>
        ))}
      </ul>
    </section>
  );
}
