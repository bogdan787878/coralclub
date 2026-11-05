import { asset } from "@/lib/asset";
import styles from "./TopSellerBadge.module.css";

/**
 * TopSellerBadge — matches coralclub.us's own "Top Seller" plate (laurel
 * leaves flanking the label). Shown on the PDP, between the description
 * and the dietary badges, for products flagged `topSeller` in the CMS —
 * i.e. ones that actually carry the badge on the real product page.
 */
export function TopSellerBadge() {
  return (
    <div className={styles.badge}>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        className={styles.leaf}
        src={asset("/images/badges/top-seller-leaf-left.svg")}
        alt=""
        width={16}
        height={35}
      />
      <span className={styles.label}>Top Seller</span>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        className={styles.leaf}
        src={asset("/images/badges/top-seller-leaf-right.svg")}
        alt=""
        width={16}
        height={35}
      />
    </div>
  );
}
