"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { cc4, normalizeProduct, type Product } from "@coral/api";
import { getStore } from "@coral/cart/store";
import { ProductCard } from "@/components/organisms";
import { Icon } from "@/components/ui";
import { useCart } from "@/lib/cart";
import { fetchProducts, HYDRATION_CODES, rub } from "@/lib/lk/catalog";
import { StoreFlag } from "./StoreFlag";
import styles from "./LkShop.module.css";

/**
 * Каталог и избранное участника (перенесено из кабинета на чистом JS, #/catalog и #/fav) в интерфейсе «Друга клуба»:
 * карточки ProductCard, цены участника, корзина — общее хранилище, избранное — API кабинета (/user/favorites).
 */
type Raw = Parameters<typeof normalizeProduct>[0];
/** Список из ответа API: массив, массив в типичном поле, либо объект «код → запись». */
function listOf(json: unknown): Raw[] {
  const d = (json as { data?: unknown })?.data ?? json;
  if (Array.isArray(d)) return d as Raw[];
  for (const k of ["items", "products", "list", "result", "data"]) {
    const v = (d as Record<string, unknown>)?.[k];
    if (Array.isArray(v)) return v as Raw[];
  }
  if (d && typeof d === "object") {
    const v = Object.values(d);
    if (v.length && v.every((x) => x && typeof x === "object")) return v as Raw[];
  }
  return [];
}

/** Избранное: что отмечено сердечком; переключает POST /user/favorites, верим его ответу. */
function useFavorites() {
  const [fav, setFav] = useState<Set<number>>(new Set());
  const remember = useCallback((list: Product[]) => setFav((s) => {
    const next = new Set(s);
    for (const p of list) {
      if (p.favorite) next.add(p.code);
      else next.delete(p.code);
    }
    return next;
  }), []);
  const toggle = useCallback(async (code: number) => {
    let before = false;
    setFav((s) => {
      before = s.has(code);
      const next = new Set(s);
      if (before) next.delete(code);
      else next.add(code);
      return next;
    });
    const r = await cc4<{ data?: { isFavorite?: boolean } }>("/user/favorites", { method: "POST", body: { offerCode: code } });
    const real = r.json?.data?.isFavorite;
    setFav((s) => {
      const next = new Set(s);
      const on = typeof real === "boolean" ? real : before; // не вышло — возвращаем как было
      if (on) next.add(code);
      else next.delete(code);
      return next;
    });
    return typeof real === "boolean" ? real : before;
  }, []);
  return { fav, remember, toggle };
}

function Card({ p, fav, onFav }: { p: Product; fav: boolean; onFav: () => void }) {
  const cart = useCart();
  const qty = cart.find((l) => l.coralId === String(p.code))?.qty ?? 0;
  const store = getStore();
  const off = p.club !== null && p.retail && p.retail > p.club ? Math.round((1 - p.club / p.retail) * 100) : 0;
  return (
    <ProductCard
      fluid
      title={p.note ? `${p.name} – ${p.note}` : p.name}
      tag={p.badges[0]}
      price={p.club !== null ? rub(p.club, p.currency) : "Цена при оформлении"}
      priceWas={off ? rub(p.retail ?? 0, p.currency) : undefined}
      priceTag={off ? `−${off}%` : undefined}
      images={p.image ? [{ src: p.image, alt: p.name }] : []}
      cartQty={qty}
      onSetQty={(next) => void store.setQty(String(p.code), next)}
      onAddToCart={p.available ? () => void store.add(p.code, 1) : undefined}
      favorite={{ on: fav, onToggle: onFav }}
    />
  );
}

const Skeleton = ({ n }: { n: number }) => (
  <div className={styles.grid} role="status" aria-label="Загрузка">
    {Array.from({ length: n }, (_, i) => (
      <i key={i} className={styles.sk} />
    ))}
  </div>
);

const TABS = [
  { id: "hydration", label: "Гидратация" },
  { id: "hit", label: "Хиты" },
  { id: "new", label: "Новинки" },
  { id: "sale", label: "Распродажа" },
] as const;
type Tab = (typeof TABS)[number]["id"];

export const ShopSkeleton = Skeleton;

export function CatalogPage() {
  const [tab, setTab] = useState<Tab>("hydration");
  const [lists, setLists] = useState<Partial<Record<Tab, Product[] | { error: string }>>>({});
  const { fav, remember, toggle } = useFavorites();
  useEffect(() => {
    if (lists[tab]) return;
    let alive = true;
    (async () => {
      let list: Product[] | { error: string };
      if (tab === "hydration") {
        const got = await fetchProducts(HYDRATION_CODES);
        list = got.length ? got : { error: "каталог не ответил" };
      } else {
        const r = await cc4(`/personal-new/shop?type=${tab}`);
        list = r.ok ? listOf(r.json).map(normalizeProduct).filter((p): p is Product => !!p) : { error: `ошибка ${r.status || "сети"}` };
      }
      if (!alive) return;
      if (Array.isArray(list)) remember(list);
      setLists((s) => ({ ...s, [tab]: list }));
    })();
    return () => {
      alive = false;
    };
  }, [tab, lists, remember]);
  const cur = lists[tab];
  return (
    <main className={styles.page}>
      <div className={styles.head}>
        <h1 className={styles.title}>Каталог</h1>
        <StoreFlag />
      </div>
      <div className={styles.chips} role="tablist">
        {TABS.map((t) => (
          <button key={t.id} type="button" role="tab" aria-selected={t.id === tab} className={`${styles.chip}${t.id === tab ? ` ${styles.chipOn}` : ""}`} onClick={() => setTab(t.id)}>
            {t.label}
          </button>
        ))}
      </div>
      {!cur ? (
        <Skeleton n={4} />
      ) : "error" in cur ? (
        <p className={styles.note}>Не удалось загрузить: {cur.error}.</p>
      ) : cur.length ? (
        <div className={styles.grid}>
          {cur.map((p) => (
            <Card key={p.code} p={p} fav={fav.has(p.code)} onFav={() => void toggle(p.code)} />
          ))}
        </div>
      ) : (
        <p className={styles.note}>В этом разделе пока ничего нет.</p>
      )}
    </main>
  );
}

export function FavoritesPage() {
  const [list, setList] = useState<Product[] | { error: string } | null>(null);
  const { fav, remember, toggle } = useFavorites();
  useEffect(() => {
    let alive = true;
    cc4("/user/favorites").then((r) => {
      if (!alive) return;
      if (!r.ok) return setList({ error: `ошибка ${r.status || "сети"}` });
      const items = listOf(r.json).map(normalizeProduct).filter((p): p is Product => !!p).map((p) => ({ ...p, favorite: true }));
      remember(items);
      setList(items);
    });
    return () => {
      alive = false;
    };
  }, [remember]);
  // снятое сердечко убирает товар из списка
  const shown = Array.isArray(list) ? list.filter((p) => fav.has(p.code)) : list;
  return (
    <main className={styles.page}>
      <h1 className={styles.title}>Избранное</h1>
      {!shown ? (
        <Skeleton n={2} />
      ) : "error" in shown ? (
        <p className={styles.note}>Не удалось получить избранное: {shown.error}.</p>
      ) : shown.length ? (
        <div className={styles.grid}>
          {shown.map((p) => (
            <Card key={p.code} p={p} fav onFav={() => void toggle(p.code)} />
          ))}
        </div>
      ) : (
        <div className={styles.empty}>
          <Icon name="heart" size={40} />
          <p>Здесь появятся товары, которые вы отметили сердечком.</p>
          <Link href="/lk/catalog/">Перейти в каталог</Link>
        </div>
      )}
    </main>
  );
}
