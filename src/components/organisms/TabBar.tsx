"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cartCount, openCart, useCart } from "@/lib/cart";
import { BagIcon } from "@/components/cart/icons";
import { CatalogIcon, HomeIcon, UserIcon } from "./navIcons";
import styles from "./TabBar.module.css";

export type TabBarProps = {
  /** When set, the bar starts hidden and only fades in once the element
   *  with this id scrolls into view — e.g. the homepage's hero, so the
   *  bar doesn't sit fixed over the hero photo from first paint. Omit for
   *  the normal always-visible bar. */
  revealAfterId?: string;
};

/**
 * TabBar — bottom tab navigation (mobile/tablet; hidden at desktop, where
 * the same four destinations live in <SiteHeader> instead). Rendered on
 * the home, catalog, account and PDP screens — on the PDP, BuyBox's own
 * fixed bar sits just above it (see BuyBox.module.css), not competing for
 * the same spot. The Cart tab has no drawer of its own — it just calls
 * openCart(), and relies on SiteHeader's CartButton (always mounted, even
 * where its icon row is hidden by CSS) to actually host the drawer.
 */
export function TabBar({ revealAfterId }: TabBarProps = {}) {
  const count = cartCount(useCart());
  const pathname = usePathname();
  const [revealed, setRevealed] = useState(!revealAfterId);

  useEffect(() => {
    if (!revealAfterId) return;
    const el = document.getElementById(revealAfterId);
    // no matching element (shouldn't happen for a valid id) — fall back
    // to always-visible rather than hidden forever, but not as a direct
    // setState call in the effect body itself
    if (!el) {
      const id = requestAnimationFrame(() => setRevealed(true));
      return () => cancelAnimationFrame(id);
    }
    // Revealed once the anchor has been reached OR scrolled past — not
    // just "currently on screen". A plain `entry.isIntersecting` hides
    // the bar again as soon as the (comparatively short) anchor section
    // itself scrolls out of view further down the page, instead of
    // staying revealed for the rest of the page below it.
    const observer = new IntersectionObserver(
      ([entry]) =>
        setRevealed(entry.isIntersecting || entry.boundingClientRect.top < 0),
      { rootMargin: "0px" },
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [revealAfterId]);

  const tabClass = (active: boolean) =>
    `${styles.tab}${active ? ` ${styles.tabOn}` : ""}`;

  const isHome = pathname === "/";
  const isCatalog = pathname?.startsWith("/catalog") ?? false;
  const isAccount = pathname?.startsWith("/account") ?? false;

  return (
    <>
      <div className={styles.spacer} aria-hidden="true" />
      <nav
        className={`${styles.bar}${revealed ? "" : ` ${styles.barHidden}`}`}
        aria-label="Primary"
      >
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
