"use client";

/** Магазин России на клиенте: вошёл ли участник, живые цены витрины, баннеры акций (см. ./shop). */
import "@/lib/lk/config";
import { useEffect, useSyncExternalStore } from "react";
import { cc4Base, fetchProducts, getToken, guestProducts, guestToken, type Product } from "@coral/api";
import { RU_PRODUCTS, RU_SITE } from "./shop";
import { applyMemberCity, cityKey, useRuCity, type RuCity } from "./city";

/* ---------------------------------- вход ---------------------------------- */

const onAuth = (cb: () => void) => {
  window.addEventListener("cc:auth:changed", cb);
  return () => window.removeEventListener("cc:auth:changed", cb);
};

/** Вошёл ли участник: `null` при сборке на сервере (sessionStorage там нет), затем да/нет. */
export function useRuMember(): boolean | null {
  return useSyncExternalStore<boolean | null>(onAuth, () => Boolean(getToken()), () => null);
}

/* ---------------------------------- цены ---------------------------------- */

type Prices = ReadonlyMap<number, Product>;
const EMPTY: Prices = new Map();
/** цены и наличие — по входу и городу (склад города): «guest:Москва|Москва» */
const cache = new Map<string, Prices>();
const loading = new Set<string>();
const listeners = new Set<() => void>();
const emit = () => listeners.forEach((l) => l());

function load(mode: "guest" | "member", city: RuCity, attempt = 0) {
  const key = `${mode}:${cityKey(city)}`;
  if (cache.has(key) || (attempt === 0 && loading.has(key))) return;
  loading.add(key);
  const codes = RU_PRODUCTS.map((p) => p.code);
  const ask =
    mode === "member"
      ? applyMemberCity(city).then(() => fetchProducts(codes))
      : guestProducts(codes.map(String), { country: "RU", language: "ru", location: city });
  ask.then((list) => {
    if (list.length) {
      cache.set(key, new Map(list.map((p) => [p.code, p])));
      loading.delete(key);
      emit();
      return;
    }
    // API не ответил (сбой сессии, сеть): ещё пара попыток с паузой
    if (attempt < 2) setTimeout(() => load(mode, city, attempt + 1), 1200 * (attempt + 1));
    else loading.delete(key);
  });
}

/** Цены и наличие товаров главной для города магазина: по сессии участника, если он вошёл, иначе — гостя России. */
export function useRuPrices(): Prices {
  const member = useRuMember();
  const city = useRuCity();
  const mode = member ? "member" : "guest";
  const key = city ? `${mode}:${cityKey(city)}` : "";
  useEffect(() => {
    if (member !== null && city) load(mode, city);
    // city — новый объект на каждый рендер: следим за ключом
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [member, mode, key]);
  return useSyncExternalStore(
    (cb) => {
      listeners.add(cb);
      return () => listeners.delete(cb);
    },
    () => (member === null || !key ? EMPTY : (cache.get(key) ?? EMPTY)),
    () => EMPTY,
  );
}

/* ------------------------------ баннеры акций ------------------------------ */

export type RuBanner = { image: string; title: string; button: string; href: string; logo?: string };

/** Пустые подписи баннеров сайта: заголовок и логотип, которые сайт рисует поверх картинки сам. */
const KNOWN: { test: RegExp; title: string; logo?: string }[] = [
  { test: /healthy-friday/, title: "Healthy Friday", logo: `${RU_SITE}/images/hf_center_ru.svg` },
];

/** Баннеры главной сайта России (API 2.0 GET /home, блок BANNER_CAROUSEL — то же, что в слайдере coralclub.ru). */
export async function loadRuBanners(): Promise<RuBanner[]> {
  for (let attempt = 0; attempt < 2; attempt++) {
    const token = await guestToken("RU", "ru");
    if (!token) return [];
    try {
      const r = await fetch(`${cc4Base()}/home`, { headers: { accept: "application/json", authorization: `Bearer ${token}` } });
      if (r.status === 401) {
        try {
          window.sessionStorage.removeItem("cc_guest:RU:ru");
        } catch {
          /* без хранилища */
        }
        continue;
      }
      const j = (await r.json().catch(() => null)) as {
        data?: { type?: string; items?: { imageUrl?: string; text?: string; buttonText?: string; buttonLink?: string }[] }[];
      } | null;
      const block = j?.data?.find((b) => b.type === "BANNER_CAROUSEL");
      return (block?.items ?? [])
        .filter((it) => it.imageUrl)
        .map((it) => {
          const link = it.buttonLink ?? "";
          const known = KNOWN.find((k) => k.test.test(link));
          return {
            image: it.imageUrl as string,
            title: it.text?.trim() || known?.title || "Акция",
            button: it.buttonText?.trim() || "Подробнее",
            href: /^https?:/.test(link) ? link : `${RU_SITE}${link.startsWith("/") ? link : `/${link}`}`,
            logo: it.text?.trim() ? undefined : known?.logo,
          };
        });
    } catch {
      return [];
    }
  }
  return [];
}
