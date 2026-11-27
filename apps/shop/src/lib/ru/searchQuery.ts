"use client";

/**
 * Запрос поиска магазина России — один на страницу: поле в шапке (веб) и поле страницы поиска (телефон) пишут и
 * читают его отсюда, поэтому всегда показывают одно и то же.
 */
import { useSyncExternalStore } from "react";

let query = "";
const listeners = new Set<() => void>();

export function setSearchQuery(q: string) {
  if (q === query) return;
  query = q;
  listeners.forEach((l) => l());
}

export const searchQueryNow = () => query;

export function useSearchQuery(): string {
  return useSyncExternalStore(
    (cb) => {
      listeners.add(cb);
      return () => listeners.delete(cb);
    },
    () => query,
    () => "",
  );
}
