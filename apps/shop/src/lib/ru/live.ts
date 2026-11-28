"use client";

/** Магазин России на клиенте: вошёл ли участник, живые цены витрины, баннеры акций (см. ./shop). */
import "@/lib/lk/config";
import { useEffect, useSyncExternalStore } from "react";
import { cc4Base, fetchProducts, getToken, guestProducts, guestToken, type Product } from "@coral/api";
import { RU_PRODUCTS, RU_SITE } from "./shop";
import { cityKey, useRuCity, type RuCity } from "./city";

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
      ? // цены участника — его сессия (город в неё не пишем: в той же сессии его корзина), наличие — склад города
        Promise.all([fetchProducts(codes), guestProducts(codes.map(String), { country: "RU", language: "ru", location: city })]).then(([mine, stock]) => {
          const avail = new Map(stock.map((g) => [g.code, g.available]));
          return mine.map((p) => (avail.has(p.code) ? { ...p, available: avail.get(p.code) as boolean } : p));
        })
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

/* ------------------------- главная сайта: акции и хиты ------------------------- */

export type RuBanner = { image: string; title: string; button: string; href: string; logo?: string };

/** Акция по ссылке баннера: последняя часть адреса («…/promo/healthy-friday/» → «healthy-friday»). */
export const promoSlug = (href: string) => href.replace(/[?#].*$/, "").split("/").filter(Boolean).pop() ?? "";

/** Пустые подписи баннеров сайта: заголовок и логотип, которые сайт рисует поверх картинки сам. */
const KNOWN: { test: RegExp; title: string; logo?: string }[] = [
  { test: /healthy-friday/, title: "Healthy Friday", logo: `${RU_SITE}/images/hf_center_ru.svg` },
];

type HomeBlock = {
  type?: string;
  title?: string;
  items?: {
    imageUrl?: string;
    text?: string;
    buttonText?: string;
    buttonLink?: string;
    code?: number;
    clubAmount?: number;
    originalAmount?: number;
    badges?: { text?: string }[];
  }[];
};

let homeLoad: Promise<HomeBlock[]> | null = null;
/** Блоки главной сайта России (API 2.0 GET /home) — один запрос на страницу. */
function loadHome(): Promise<HomeBlock[]> {
  homeLoad ??= (async () => {
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
        const j = (await r.json().catch(() => null)) as { data?: HomeBlock[] } | null;
        return j?.data ?? [];
      } catch {
        return [];
      }
    }
    return [];
  })().then((blocks) => {
    if (!blocks.length) homeLoad = null; // не ответил — в следующий раз спросим снова
    return blocks;
  });
  return homeLoad;
}

/** Баннеры главной сайта России (блок BANNER_CAROUSEL — то же, что в слайдере coralclub.ru). */
export async function loadRuBanners(): Promise<RuBanner[]> {
  const block = (await loadHome()).find((b) => b.type === "BANNER_CAROUSEL");
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
}

/** Подборка товаров главной сайта России по названию блока: артикулы по порядку сайта. */
async function loadRuCarousel(title: RegExp): Promise<number[]> {
  const block = (await loadHome()).find((b) => b.type === "PRODUCTS_CAROUSEL" && title.test(b.title ?? ""));
  return (block?.items ?? []).map((it) => Number(it.code)).filter((c) => Number.isFinite(c) && c > 0);
}
/** Хиты продаж (блок «Хиты продаж» главной сайта). */
export const loadRuHits = () => loadRuCarousel(/хит/i);
/** Акционные товары (блок «Акции» главной сайта). */
export const loadRuSale = () => loadRuCarousel(/акци/i);

/** Цена акции: цена по акции, цена до акции, скидка акции («−25%»), сроки («13–30.11»). */
export type RuSaleInfo = { price: number; was: number; tag: string; dates: string };

let saleInfo: Map<number, RuSaleInfo> | null = null;
let saleInfoLoad: Promise<void> | null = null;
const saleListeners = new Set<() => void>();
const EMPTY_SALE = new Map<number, RuSaleInfo>();

/** Цены акции по артикулу — из блока «Акции» главной сайта (clubAmount, originalAmount, значки). */
function loadRuSaleInfo(): Promise<void> {
  saleInfoLoad ??= (async () => {
    const block = (await loadHome()).find((b) => b.type === "PRODUCTS_CAROUSEL" && /акци/i.test(b.title ?? ""));
    const map = new Map<number, RuSaleInfo>();
    for (const it of block?.items ?? []) {
      const code = Number(it.code);
      if (!Number.isFinite(code) || typeof it.clubAmount !== "number" || typeof it.originalAmount !== "number") continue;
      if (it.originalAmount <= it.clubAmount) continue;
      const texts = (it.badges ?? []).map((b) => String(b.text ?? "").trim()).filter(Boolean);
      const pct = texts.find((t) => /%/.test(t));
      const off = Math.round((1 - it.clubAmount / it.originalAmount) * 100);
      map.set(code, {
        price: it.clubAmount,
        was: it.originalAmount,
        tag: pct ? pct.replace(/^[-–]/, "−") : `−${off}%`,
        dates: (texts.find((t) => !/%/.test(t) && /\d/.test(t)) ?? "").replace(/\s*-\s*/, "–"),
      });
    }
    saleInfo = map;
    saleListeners.forEach((l) => l());
  })();
  return saleInfoLoad;
}

/** Цены акции по артикулу (пусто, пока не загрузились или акций нет). */
export function useRuSaleInfo(): ReadonlyMap<number, RuSaleInfo> {
  useEffect(() => {
    void loadRuSaleInfo();
  }, []);
  return useSyncExternalStore(
    (cb) => {
      saleListeners.add(cb);
      return () => saleListeners.delete(cb);
    },
    () => saleInfo ?? EMPTY_SALE,
    () => EMPTY_SALE,
  );
}
