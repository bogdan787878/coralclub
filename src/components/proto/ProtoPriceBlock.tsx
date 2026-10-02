import { formatRub } from "@/lib/protoCart";
import styles from "./ProtoPriceBlock.module.css";

export type ProtoPriceBlockProps = {
  price: number;
  priceWas: number;
};

/**
 * ProtoPriceBlock — club price, crossed-out reference price, and the
 * discount tag underneath. Shared between the single-pack and course
 * variants; only the numbers change.
 */
export function ProtoPriceBlock({ price, priceWas }: ProtoPriceBlockProps) {
  return (
    <div className={styles.root}>
      <div className={styles.row}>
        <span className={styles.now}>{formatRub(price)}</span>
        <span className={styles.was}>{formatRub(priceWas)}</span>
      </div>
      <div className={styles.tags}>
        <span className={`${styles.tag} ${styles.tagClub}`}>Скидка друга клуба −20%</span>
      </div>
    </div>
  );
}
