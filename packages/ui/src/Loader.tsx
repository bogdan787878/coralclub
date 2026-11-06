import type { ReactNode } from "react";
import styles from "./Loader.module.css";

/**
 * Loader: шимер на месте блока, который ждёт магазин. Подпись (`children`) читает экранный диктор;
 * `lines` — сколько полос показать (по умолчанию 2).
 */
export function Loader({ children, lines = 2 }: { children: ReactNode; lines?: number }) {
  return (
    <div className={styles.loader} role="status">
      <span className={styles.label}>{children}</span>
      {Array.from({ length: lines }, (_, i) => (
        <i key={i} className={styles.bar} style={{ width: `${[100, 72, 86][i % 3]}%` }} aria-hidden="true" />
      ))}
    </div>
  );
}
