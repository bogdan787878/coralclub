/**
 * Живые данные о товарах «Друга клуба» из API каталога (анонимная сессия страны, @coral/api guestProducts):
 * цена участника, обычная цена, наличие — по витрине выбранной страны. Статичный контент (тексты, фото, состав)
 * остаётся из каталога проекта; сгенерированные цены (friendCatalog.generated) — запас, пока API не ответил.
 */
import { useEffect, useSyncExternalStore } from "react";
import { guestProducts } from "@coral/api";
import { FRIEND_PRODUCTS } from "./friendCatalog";
import { articleFor } from "./siteArticles";

/** По артикулу каталога проекта (рынок): что сказал API витрины страны. */
export type LiveProduct = { club: number | null; retail: number | null; available: boolean; currency: string };
export type LiveCatalog = ReadonlyMap<string, LiveProduct>;

const EMPTY: LiveCatalog = new Map();
const byCountry = new Map<string, LiveCatalog>();
const loading = new Set<string>();
const listeners = new Set<() => void>();
const emit = () => listeners.forEach((l) => l());

/** Запросить данные страны (один раз за загрузку страницы). */
export function loadLive(country: string): void {
  if (typeof window === "undefined" || byCountry.has(country) || loading.has(country)) return;
  loading.add(country);
  const pairs = FRIEND_PRODUCTS.map((p) => [p.coralId, articleFor(country, p.coralId)] as const).filter((x): x is readonly [string, string] => !!x[1]);
  guestProducts(
    pairs.map(([, local]) => local),
    { country },
  )
    .then((list) => {
      const local = new Map(list.map((p) => [String(p.code), p]));
      const out = new Map<string, LiveProduct>();
      for (const [canon, art] of pairs) {
        const p = local.get(String(Number(art)));
        if (p) out.set(canon, { club: p.club, retail: p.retail, available: p.available, currency: p.currency });
      }
      if (out.size) {
        byCountry.set(country, out);
        emit();
      }
    })
    .finally(() => loading.delete(country));
}

export const liveSnapshot = (country: string): LiveCatalog => byCountry.get(country) ?? EMPTY;

/** Живые данные страны в компоненте (перерисовка, когда пришёл ответ API). */
export function useFriendLive(country: string): LiveCatalog {
  useEffect(() => loadLive(country), [country]);
  return useSyncExternalStore(
    (cb) => {
      listeners.add(cb);
      return () => listeners.delete(cb);
    },
    () => liveSnapshot(country),
    () => EMPTY,
  );
}
