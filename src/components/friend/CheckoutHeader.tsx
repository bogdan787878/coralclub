"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import { CoralClubLogo } from "@/components/landing/CoralClubLogo";
import styles from "./CheckoutHeader.module.css";

const Icon = ({ d }: { d: ReactNode }) => (
  <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
    {d}
  </svg>
);

/**
 * The checkout's header: menu and logo on the left; the country flag, the
 * account and the cart (with the number of items) on the right.
 */
export function CheckoutHeader({
  homeHref,
  loginHref,
  registerHref,
  cartCount,
  country,
}: {
  homeHref: string;
  /** the shop's sign-in */
  loginHref: string;
  /** the shop's sign-up as an invitation from the friend, when known */
  registerHref?: string;
  cartCount: number;
  /** the country control (a flag with its list) */
  country: ReactNode;
}) {
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
        {country}
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
        <a
          className={styles.iconBtn}
          href={homeHref}
          aria-label={`Cart: ${cartCount} ${cartCount === 1 ? "item" : "items"}`}
          data-analytics-id="header_cart"
        >
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
          {cartCount > 0 && <span className={styles.badge}>{cartCount}</span>}
        </a>
      </div>
    </header>
  );
}
