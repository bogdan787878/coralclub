"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cartCount, openCart, useCart } from "@/lib/cart";
import { BagIcon } from "@/components/cart/icons";
import { CatalogIcon, HomeIcon, UserIcon } from "./navIcons";
import styles from "./TabBar.module.css";

/**
 * TabBar — bottom tab navigation (mobile/tablet; hidden at desktop, where
 * the same four destinations live in <SiteHeader> instead). Rendered on
 * the home, catalog, account and PDP screens — on the PDP, BuyBox's own
 * fixed bar sits just above it (see BuyBox.module.css), not competing for
 * the same spot. The Cart tab has no drawer of its own — it just calls
 * openCart(), and relies on SiteHeader's CartButton (always mounted, even
 * where its icon row is hidden by CSS) to actually host the drawer.
 */
export function TabBar() {
  const count = cartCount(useCart());
  const pathname = usePathname();

  const tabClass = (active: boolean) =>
    `${styles.tab}${active ? ` ${styles.tabOn}` : ""}`;

  const isHome = pathname === "/";
  const isCatalog = pathname?.startsWith("/catalog") ?? false;
  const isAccount = pathname?.startsWith("/account") ?? false;

  return (
    <>
      <div className={styles.spacer} aria-hidden="true" />
      <nav className={styles.bar} aria-label="Primary">
        <Link
          href="/"
          className={tabClass(isHome)}
          aria-current={isHome ? "page" : undefined}
        >
          <HomeIcon />
          <span>Home</span>
        </Link>
        <Link
          href="/catalog"
          className={tabClass(isCatalog)}
          aria-current={isCatalog ? "page" : undefined}
        >
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
        <Link
          href="/account"
          className={tabClass(isAccount)}
          aria-current={isAccount ? "page" : undefined}
        >
          <UserIcon />
          <span>Sign in</span>
        </Link>
      </nav>
    </>
  );
}
