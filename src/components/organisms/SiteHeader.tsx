import type { ReactNode } from "react";
import Link from "next/link";
import { CartButton } from "@/components/cart/CartButton";
import styles from "./SiteHeader.module.css";

export type SiteHeaderProps = {
  /** Brand lockup. Defaults to the "coralclub" wordmark. */
  brand?: ReactNode;
};

/**
 * SiteHeader — the centred brand lockup that sits above every page, with the
 * primary "Get start" action on the right. The wordmark links home.
 */
export function SiteHeader({ brand = "coralclub" }: SiteHeaderProps) {
  return (
    <div className={styles.root}>
      <div className={styles.brandBar}>
        <Link href="/" className={styles.brand}>
          {brand}
        </Link>
        <div className={styles.actions}>
          <Link href="/account" className={styles.cta}>
            Get start
          </Link>
          <CartButton />
        </div>
      </div>
    </div>
  );
}
