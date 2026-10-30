"use client";

import {
  useEffect,
  useMemo,
  useRef,
  useState,
  useSyncExternalStore,
  type ReactNode,
} from "react";
import { usePathname } from "next/navigation";
import { CoralClubLogo } from "@/components/landing/CoralClubLogo";
import { asset } from "@/lib/asset";
import { cartCount, openCart, useCart } from "@/lib/cart";
import {
  requestFriendCountry,
  useFriendCountries,
  useFriendCountry,
} from "@/lib/friendCountry";
import { loginUrl, registrationUrl } from "@/lib/friend";
import { onShopOrigin } from "@/lib/shopApi";
import { SHOP_SITES } from "@/lib/shopSites";
import { CountryMenu } from "./CountryMenu";
import { useFriend } from "./FriendProvider";
import styles from "./FriendHeader.module.css";

const Icon = ({ d }: { d: ReactNode }) => (
  <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
    {d}
  </svg>
);

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
  const multiSite = useSyncExternalStore(
    () => () => {},
    () => onShopOrigin() && window.location.hostname === "localhost",
    () => false,
  );
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
      <Icon
        d={
          <path
            d="M3 4h2.4l2 10.2h9.8l2-7.7H6.6M9.5 19.2h.01M16.5 19.2h.01"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        }
      />
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
            <Icon
              d={
                <path
                  d="M4 7h16M4 12h16M4 17h16"
                  stroke="currentColor"
                  strokeWidth="1.8"
                  strokeLinecap="round"
                />
              }
            />
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
            <Icon
              d={
                <>
                  <circle
                    cx="12"
                    cy="8.5"
                    r="3.6"
                    stroke="currentColor"
                    strokeWidth="1.7"
                  />
                  <path
                    d="M4.8 19.5c.9-3.4 3.6-5 7.2-5s6.3 1.6 7.2 5"
                    stroke="currentColor"
                    strokeWidth="1.7"
                    strokeLinecap="round"
                  />
                </>
              }
            />
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
