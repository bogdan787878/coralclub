import type { ReactNode } from "react";
import Link from "next/link";
import { CartButton } from "@/components/cart/CartButton";
import { CatalogIcon, HomeIcon, UserIcon } from "./navIcons";
import styles from "./SiteHeader.module.css";

export type SiteHeaderProps = {
  /** Brand lockup. Defaults to the "coralclub" wordmark. */
  brand?: ReactNode;
};

/**
 * SiteHeader — the centred brand lockup that sits above every page. Below
 * 1024px it's just the wordmark (mobile navigation is the bottom TabBar
 * instead). At >=1024px the same four destinations as TabBar — Home,
 * Catalog, Cart, Sign in — show as icon links, since there's no bottom
 * tab bar on desktop.
 *
 * The desktop CartButton is the one and only cart-drawer host on any page
 * that renders this header (it's always mounted, even where its icon row
 * is hidden by CSS) — don't also mount a CartBar/CartDrawerHost alongside
 * it, or the drawer will open twice.
 */
export function SiteHeader({ brand = "coralclub" }: SiteHeaderProps) {
  return (
    <div className={styles.root}>
      <div className={styles.brandBar}>
        <Link href="/" className={styles.brand}>
          {brand}
        </Link>

        <nav className={styles.actionsDesktop} aria-label="Primary">
          <Link href="/" className={styles.navIcon} aria-label="Home">
            <HomeIcon />
          </Link>
          <Link href="/catalog" className={styles.navIcon} aria-label="Catalog">
            <CatalogIcon />
          </Link>
          <CartButton className={styles.navIcon} />
          <Link href="/account" className={styles.navIcon} aria-label="Sign in">
            <UserIcon />
          </Link>
        </nav>
      </div>
    </div>
  );
}
