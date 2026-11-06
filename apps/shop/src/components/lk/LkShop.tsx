"use client";

import { useEffect, useState } from "react";
import { cc4, normalizeProduct, type Product } from "@coral/api";
import { getStore } from "@coral/cart/store";
import { ProductCard } from "@/components/organisms";
import { useCart } from "@/lib/cart";
import { fetchProducts, HYDRATION_CODES, rub } from "@/lib/lk/catalog";
import { StoreFlag } from "./StoreFlag";
import styles from "./LkShop.module.css";

/**
 * Каталог участника (перенесено из кабинета на чистом JS, #/catalog) в интерфейсе «Друга клуба»:
 * карточки ProductCard, цены участника, корзина — общее хранилище.
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

function Card({ p }: { p: Product }) {
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
      setLists((s) => ({ ...s, [tab]: list }));
    })();
    return () => {
      alive = false;
    };
  }, [tab, lists]);
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
            <Card key={p.code} p={p} />
          ))}
        </div>
      ) : (
        <p className={styles.note}>В этом разделе пока ничего нет.</p>
      )}
    </main>
  );
}
