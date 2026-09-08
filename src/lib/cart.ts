/**
 * Local cart — no backend. Everything the shopper adds on our site is kept
 * in localStorage. We don't check out here: the cart hands off to
 * coralclub.ru's basket via their share-cart link, which accepts every
 * `id=qty` pair in one URL (see `basketHandoffUrl`).
 *
 * TODO(backend): mirror writes to a real cart API once it exists.
 */

"use client";

import { useSyncExternalStore } from "react";

const STORAGE_KEY = "coralclub.cart";
const EVENT = "coralclub:cart";
const CORAL_SHOP = "https://coralclub.ru/shop/";

export type CartLine = {
  /** coralclub.ru product id — required to hand the line off to their basket. */
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
    const raw = window.localStorage.getItem(STORAGE_KEY);
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
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(lines));
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
    if (e.key !== STORAGE_KEY) return;
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

export function addItem(item: CartAddItem, qty = 1): void {
  const lines = read();
  const existing = lines.find((l) => l.coralId === item.coralId);
  if (existing) {
    existing.qty += qty;
  } else {
    lines.push({ ...item, qty });
  }
  write(lines);
}

export function setQty(coralId: string, qty: number): void {
  let lines = read();
  if (qty <= 0) {
    lines = lines.filter((l) => l.coralId !== coralId);
  } else {
    const line = lines.find((l) => l.coralId === coralId);
    if (line) line.qty = qty;
  }
  write(lines);
}

export function removeItem(coralId: string): void {
  write(read().filter((l) => l.coralId !== coralId));
}

export function clearCart(): void {
  write([]);
}

/* --------------------------- open the drawer ------------------------- */

const OPEN_EVENT = "coralclub:cart:open";

/** Ask the cart drawer (wherever it lives) to open. */
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

/** Numeric value of a "$21.99"-style price string; 0 if unparseable. */
export function priceValue(price: string): number {
  const n = parseFloat(price.replace(/[^0-9.]/g, ""));
  return Number.isFinite(n) ? n : 0;
}

export function cartSubtotal(lines: CartLine[]): number {
  return lines.reduce((sum, l) => sum + priceValue(l.price) * l.qty, 0);
}

export function formatUsd(value: number): string {
  return `$${value.toFixed(2)}`;
}

/**
 * One URL that drops the whole cart into coralclub.ru's basket, using their
 * share-cart link format: `shop_basket.php?<id1>=<q1>&<id2>=<q2>&utm...`.
 * Lines without a coralId can't be handed off and are skipped.
 */
export function basketHandoffUrl(lines: CartLine[]): string {
  const pairs = lines
    .filter((l) => l.coralId && l.qty > 0)
    .map((l) => `${l.coralId}=${l.qty}`);
  const query = [...pairs, "utm_source=copy-link", "utm_medium=cart-recom"].join(
    "&",
  );
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
