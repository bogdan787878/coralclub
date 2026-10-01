/**
 * Cart store for the /proto checkout-flow prototype — deliberately separate
 * from lib/cart.ts (the real USD cart, which hands off to coralclub.us's
 * basket). This one is RUB, self-contained, and never touches the real
 * site's storage key or checkout — purely to demo the add-to-cart →
 * cart → checkout flow end to end without registration.
 */

"use client";

import { useSyncExternalStore } from "react";

const STORAGE_KEY = "coralclub.proto.cart";
const EVENT = "coralclub:proto-cart";

export type ProtoVariant = "single" | "course";

export type ProtoCartLine = {
  variant: ProtoVariant;
  name: string;
  variantLabel: string;
  image: string;
  price: number;
  priceWas: number;
  qty: number;
};

function read(): ProtoCartLine[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as unknown;
    return Array.isArray(parsed) ? (parsed as ProtoCartLine[]) : [];
  } catch {
    return [];
  }
}

function write(lines: ProtoCartLine[]): void {
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(lines));
  } catch {
    /* storage unavailable — in-memory snapshot below still updates */
  }
  snapshot = lines;
  window.dispatchEvent(new Event(EVENT));
}

let snapshot: ProtoCartLine[] = read();

function subscribe(cb: () => void): () => void {
  const onEvent = () => cb();
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

/** Single-product demo — setting a line replaces any existing one instead
 *  of accumulating, so re-visiting the PDP with a different variant just
 *  swaps the cart's one line rather than growing it. */
export function setLine(line: ProtoCartLine): void {
  write([line]);
}

export function setQty(variant: ProtoVariant, qty: number): void {
  const lines = read();
  if (qty <= 0) {
    write(lines.filter((l) => l.variant !== variant));
    return;
  }
  const line = lines.find((l) => l.variant === variant);
  if (line) {
    line.qty = qty;
    write(lines);
  }
}

export function clearProtoCart(): void {
  write([]);
}

const EMPTY: ProtoCartLine[] = [];

export function useProtoCart(): ProtoCartLine[] {
  return useSyncExternalStore(
    subscribe,
    () => snapshot,
    () => EMPTY,
  );
}

export function protoCartTotal(lines: ProtoCartLine[]): number {
  return lines.reduce((sum, l) => sum + l.price * l.qty, 0);
}

export function formatRub(value: number): string {
  return `${Math.round(value).toLocaleString("ru-RU")} ₽`;
}
