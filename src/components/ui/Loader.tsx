import type { ReactNode } from "react";
import styles from "./Loader.module.css";

/** Loader: a spinner with a label while a block waits for the shop. */
export function Loader({ children }: { children: ReactNode }) {
  return (
    <p className={styles.loader} role="status">
      <span className={styles.spinner} aria-hidden="true" />
      {children}
    </p>
  );
}
