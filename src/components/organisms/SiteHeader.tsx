import type { ReactNode } from "react";
import Link from "next/link";
import { CartButton } from "@/components/cart/CartButton";
import styles from "./SiteHeader.module.css";

export type SiteHeaderProps = {
  /** Brand lockup. Defaults to the "coralclub" wordmark. */
  brand?: ReactNode;
  /** Show the cart icon in the header. Off on the homepage (it uses the
   *  bottom CartBar instead). */
  cart?: boolean;
};

/**
 * SiteHeader — the centred brand lockup that sits above every page, with the
 * primary "Get start" action on the right. The wordmark links home.
 */
export function SiteHeader({ brand = "coralclub", cart = true }: SiteHeaderProps) {
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
          {cart && <CartButton />}
        </div>
      </div>
    </div>
  );
}
