"use client";

import {
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { usePathname } from "next/navigation";
import { CoralClubLogo } from "@/components/landing/CoralClubLogo";
import { asset } from "@/lib/asset";
import { cartCount, openCart, useCart } from "@/lib/cart";
import {
  requestFriendCountry,
  useFriendCountries,
  useFriendCountry,
  useMultiSite,
} from "@/lib/friendCountry";
import { loginUrl, registrationUrl } from "@/lib/friend";
import { SHOP_SITES } from "@/lib/shopSites";
import { CountryMenu } from "@/components/checkout";
import { Icon } from "@/components/ui";
import { useFriend } from "./FriendProvider";
import styles from "./FriendHeader.module.css";


/**
 * The header of every page of the project: menu and logo on the left; the
 * country flag, the account and the cart (with the number of items) on the
 * right. It sits in the project's layout, so the pages share one.
 */
export function FriendHeader() {
  const homeHref = asset("/friend/");
  const { friend } = useFriend();
  const registerHref = friend ? registrationUrl(friend) : undefined;
  const loginHref = loginUrl();
  const count = cartCount(useCart());
  const pathname = usePathname() ?? "";
  // the checkout has its own cart (the page itself); an order that exists has
  // its country already
  const inCheckout = pathname.startsWith("/friend/checkout");
  const hasOrder =
    pathname.startsWith("/friend/checkout/pay") ||
    pathname.startsWith("/friend/checkout/done");

  const country = useFriendCountry();
  const known = useFriendCountries();
  // through the local proxy every country has a shop site of its own
  const multiSite = useMultiSite();
  const countries = useMemo<Record<string, string>>(
    () =>
      multiSite
        ? Object.fromEntries(
            Object.entries(SHOP_SITES).map(([code, v]) => [code, v.name]),
          )
        : known,
    [multiSite, known],
  );
  const countryControl = !hasOrder && (
    <CountryMenu
      countries={countries}
      value={country}
      onChange={requestFriendCountry}
    />
  );
  const cartIcon = (
    <>
      <Icon name="cart" />
      {count > 0 && <span className={styles.badge}>{count}</span>}
    </>
  );
  const cartCountLabel = `Cart: ${count} ${count === 1 ? "item" : "items"}`;

  const [open, setOpen] = useState(false);
  const wrap = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => {
      if (!wrap.current?.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("mousedown", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  return (
    <header className={styles.root} data-analytics-location="header">
      <div className={styles.left}>
        <div className={styles.menuWrap} ref={wrap}>
          <button
            type="button"
            className={styles.iconBtn}
            aria-label="Menu"
            aria-haspopup="menu"
            aria-expanded={open}
            onClick={() => setOpen((o) => !o)}
          >
            <Icon name="menu" />
          </button>
          {open && (
            <nav className={styles.menu} aria-label="Menu">
              <a className={styles.menuLink} href={homeHref}>
                Back to the shop
              </a>
              {registerHref && (
                <a className={styles.menuLink} href={registerHref}>
                  Create an account
                </a>
              )}
              <a className={styles.menuLink} href={loginHref}>
                Sign in
              </a>
            </nav>
          )}
        </div>
        <a
          href={homeHref}
          className={styles.brand}
          aria-label="Coral Club"
          data-analytics-id="header_logo"
        >
          <CoralClubLogo className={styles.logo} />
        </a>
      </div>
      <div className={styles.right}>
        {countryControl}
        <a
          className={styles.iconBtn}
          href={loginHref}
          aria-label="Account"
          data-analytics-id="header_account"
        >
          <span className={styles.avatar}>
            <Icon name="user" />
          </span>
        </a>
        {inCheckout ? (
          <a
            className={styles.iconBtn}
            href={homeHref}
            aria-label={cartCountLabel}
            data-analytics-id="header_cart"
          >
            {cartIcon}
          </a>
        ) : (
          <button
            type="button"
            className={styles.iconBtn}
            aria-label={cartCountLabel}
            data-analytics-id="header_cart"
            onClick={openCart}
          >
            {cartIcon}
          </button>
        )}
      </div>
    </header>
  );
}
