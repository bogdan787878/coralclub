"use client";

import Link from "next/link";
import { cartCount, openCart, useCart } from "@/lib/cart";
import { BagIcon } from "@/components/cart/icons";
import { CatalogIcon, HomeIcon, UserIcon } from "./navIcons";
import styles from "./TabBar.module.css";

/**
 * TabBar — bottom tab navigation, homepage-only (mobile/tablet; hidden at
 * desktop, where the same four destinations live in <SiteHeader> instead).
 * The Cart tab has no drawer of its own — it just calls openCart(), and
 * relies on SiteHeader's CartButton (always mounted, even where its icon
 * row is hidden by CSS) to actually host the drawer.
 */
export function TabBar() {
  const count = cartCount(useCart());

  return (
    <>
      <div className={styles.spacer} aria-hidden="true" />
      <nav className={styles.bar} aria-label="Primary">
        <Link href="/" className={`${styles.tab} ${styles.tabOn}`} aria-current="page">
          <HomeIcon />
          <span>Home</span>
        </Link>
        <Link href="/catalog" className={styles.tab}>
          <CatalogIcon />
          <span>Catalog</span>
        </Link>
        <button type="button" className={styles.tab} onClick={openCart}>
          <span className={styles.iconWithBadge}>
            <BagIcon />
            {count > 0 && <span className={styles.badge}>{count}</span>}
          </span>
          <span>Cart</span>
        </button>
        <Link href="/account" className={styles.tab}>
          <UserIcon />
          <span>Sign in</span>
        </Link>
      </nav>
    </>
  );
}
