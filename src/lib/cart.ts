/**
 * Local cart — no backend. Everything the shopper adds on our site is kept
 * in localStorage. We don't have a checkout API to hand off to yet, so the
 * cart instead reuses coralclub.us's own "share your cart" link — the
 * mechanism their site offers for sending someone a cart pre-filled with
 * specific products, which accepts every `id=qty` pair in one URL (see
 * `basketHandoffUrl`). REF_MEMBER/REF_CODE/TYPE are hardcoded parameters
 * that link requires to work at all — they are NOT an affiliate/referral
 * commission mechanism, just how coralclub.us's share-cart feature is
 * addressed. We're building our own funnel on top of this borrowed
 * mechanism until we have a real checkout integration.
 *
 * TODO(backend): mirror writes to a real cart API once it exists.
 */

"use client";

import { useSyncExternalStore } from "react";

const STORAGE_KEY = "coralclub.cart";
/** The friend project (USD, US articles) keeps its own cart, apart from the
 *  Russian landing and the English prototype on the same origin. */
const FRIEND_STORAGE_KEY = "coralclub.cart.friend";
const storageKey = () =>
  typeof window !== "undefined" &&
  /\/friend(\/|$)/.test(window.location.pathname)
    ? FRIEND_STORAGE_KEY
    : STORAGE_KEY;
const EVENT = "coralclub:cart";
const CORAL_SHOP = "https://coralclub.us/shop/";
/** Hardcoded — required by coralclub.us's share-cart link format, not a
 *  referral/commission mechanism. See file header. */
const REF_MEMBER = "2804051";
const REF_CODE = "722779981462";

export type CartLine = {
  /** coralclub.us product id — required to hand the line off to their basket. */
  coralId: string;
  slug: string;
  name: string;
  /** Display price, e.g. "$21.99". */
  price: string;
  image?: string;
  qty: number;
};

export type CartAddItem = Omit<CartLine, "qty">;

/* ----------------------------- storage I/O ------------------------------ */

function read(): CartLine[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(storageKey());
    if (!raw) return [];
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) return [];
    return parsed.filter(
      (l): l is CartLine =>
        !!l &&
        typeof (l as CartLine).coralId === "string" &&
        typeof (l as CartLine).qty === "number",
    );
  } catch {
    return [];
  }
}

function write(lines: CartLine[]): void {
  try {
    window.localStorage.setItem(storageKey(), JSON.stringify(lines));
  } catch {
    /* storage unavailable — the in-memory snapshot below still updates */
  }
  snapshot = lines;
  window.dispatchEvent(new Event(EVENT));
}

/* --------------------------- store + snapshot -------------------------- */

let snapshot: CartLine[] = read();

function subscribe(cb: () => void): () => void {
  // same-tab: write() already refreshed `snapshot`, just notify React
  const onEvent = () => cb();
  // cross-tab: re-read from storage, then notify
  const onStorage = (e: StorageEvent) => {
    if (e.key !== storageKey()) return;
    snapshot = read();
    cb();
  };
  window.addEventListener(EVENT, onEvent);
  window.addEventListener("storage", onStorage);
  return () => {
    window.removeEventListener(EVENT, onEvent);
    window.removeEventListener("storage", onStorage);
  };
}

/* ------------------------------ mutations ----------------------------- */

export type CartChange = {
  type: "add" | "remove";
  coralId: string;
  /** Units added (add) or taken out (remove) — always positive. */
  qty: number;
};

/** Tells the analytics layer what just happened to the cart. */
function announce(change: CartChange): void {
  if (typeof window === "undefined" || change.qty <= 0) return;
  window.dispatchEvent(
    new CustomEvent<CartChange>("coralclub:cart:change", { detail: change }),
  );
}

/** The current lines, outside React. */
export function getCart(): CartLine[] {
  return read();
}

export function addItem(item: CartAddItem, qty = 1): void {
  const lines = read();
  const existing = lines.find((l) => l.coralId === item.coralId);
  if (existing) {
    existing.qty += qty;
  } else {
    lines.push({ ...item, qty });
  }
  write(lines);
  announce({ type: "add", coralId: item.coralId, qty });
}

export function setQty(coralId: string, qty: number): void {
  let lines = read();
  const before = lines.find((l) => l.coralId === coralId)?.qty ?? 0;
  if (qty <= 0) {
    lines = lines.filter((l) => l.coralId !== coralId);
  } else {
    const line = lines.find((l) => l.coralId === coralId);
    if (line) line.qty = qty;
  }
  write(lines);
  const next = Math.max(0, qty);
  if (next > before) announce({ type: "add", coralId, qty: next - before });
  else if (next < before)
    announce({ type: "remove", coralId, qty: before - next });
}

export function removeItem(coralId: string): void {
  const before = read().find((l) => l.coralId === coralId)?.qty ?? 0;
  write(read().filter((l) => l.coralId !== coralId));
  announce({ type: "remove", coralId, qty: before });
}

export function clearCart(): void {
  write([]);
}

/* --------------------------- open the drawer ------------------------- */

const OPEN_EVENT = "coralclub:cart:open";

/** Ask the cart drawer (wherever it lives) to open. */
/** Re-read the cart from storage (a render may have run on a stale snapshot). */
export function refreshCart(): void {
  if (typeof window === "undefined") return;
  snapshot = read();
  window.dispatchEvent(new Event(EVENT));
}

export function openCart(): void {
  if (typeof window !== "undefined") {
    window.dispatchEvent(new Event(OPEN_EVENT));
  }
}

/** Subscribe the drawer host to open requests. Returns an unsubscribe fn. */
export function onCartOpen(cb: () => void): () => void {
  window.addEventListener(OPEN_EVENT, cb);
  return () => window.removeEventListener(OPEN_EVENT, cb);
}

/* ------------------------------ selectors ---------------------------- */

export function cartCount(lines: CartLine[]): number {
  return lines.reduce((n, l) => n + l.qty, 0);
}

/** Numeric value of a "$21.99" / "3 762,50 ₽"-style price string; 0 if unparseable. */
export function priceValue(price: string): number {
  const compact = price.replace(/[\s\u00a0\u202f]/g, "");
  // "3762,50" is a decimal comma; "1,299.00" is a thousands comma
  const decimalComma = /,\d{1,2}(?!\d)/.test(compact) && !compact.includes(".");
  const normalized = decimalComma
    ? compact.replace(",", ".")
    : compact.replace(/,/g, "");
  const n = parseFloat(normalized.replace(/[^0-9.]/g, ""));
  return Number.isFinite(n) ? n : 0;
}

export function cartSubtotal(lines: CartLine[]): number {
  return lines.reduce((sum, l) => sum + priceValue(l.price) * l.qty, 0);
}

export function formatUsd(value: number): string {
  return `$${value.toFixed(2)}`;
}

/**
 * One URL that drops the whole cart into coralclub.us's basket, using their
 * share-cart link format: `shop_basket.php?<id1>=<q1>&<id2>=<q2>&REF_MEMBER=
 * ...&REF_CODE=...&TYPE=REF-BASKET&utm...`. REF_MEMBER/REF_CODE/TYPE are
 * hardcoded — required by that link format, not a referral/commission
 * mechanism (see the file header). Lines without a coralId can't be handed
 * off and are skipped.
 */
export function basketHandoffUrl(lines: CartLine[]): string {
  const pairs = lines
    .filter((l) => l.coralId && l.qty > 0)
    .map((l) => `${l.coralId}=${l.qty}`);
  const query = [
    ...pairs,
    `REF_MEMBER=${REF_MEMBER}`,
    `REF_CODE=${REF_CODE}`,
    "TYPE=REF-BASKET",
    "utm_source=copy-link",
    "utm_medium=cart-recom",
  ].join("&");
  return `${CORAL_SHOP}shop_basket.php?${query}`;
}

/* ------------------------------- hook ------------------------------- */

const EMPTY: CartLine[] = [];

/** Subscribe a component to the cart. SSR-safe (returns [] on the server). */
export function useCart(): CartLine[] {
  return useSyncExternalStore(
    subscribe,
    () => snapshot,
    () => EMPTY,
  );
}
