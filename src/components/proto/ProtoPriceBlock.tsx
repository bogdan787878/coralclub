import { formatRub } from "@/lib/protoCart";
import styles from "./ProtoPriceBlock.module.css";

export type ProtoPriceBlockProps = {
  price: number;
  priceWas: number;
  /** Extra tag shown alongside the standing club discount — e.g. the
   *  course's own additional savings. Omit for the single-pack variant. */
  extraTag?: string;
};

/**
 * ProtoPriceBlock — club price, crossed-out reference price, and the
 * discount tag(s) underneath. Shared between the single-pack and course
 * variants; only the numbers and the extra tag change.
 */
export function ProtoPriceBlock({ price, priceWas, extraTag }: ProtoPriceBlockProps) {
  return (
    <div className={styles.root}>
      <div className={styles.row}>
        <span className={styles.now}>{formatRub(price)}</span>
        <span className={styles.was}>{formatRub(priceWas)}</span>
      </div>
      <div className={styles.tags}>
        <span className={`${styles.tag} ${styles.tagClub}`}>Скидка друга клуба −20%</span>
        {extraTag && <span className={`${styles.tag} ${styles.tagCourse}`}>{extraTag}</span>}
      </div>
    </div>
  );
}
