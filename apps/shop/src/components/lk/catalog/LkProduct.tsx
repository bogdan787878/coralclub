"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { catalogProduct, similarProducts, type Product, type ProductDetail } from "@coral/api";
import { getStore } from "@coral/cart/store";
import { Container, Heading, Section } from "@/components/ui";
import { BuyBox, Carousel } from "@/components/organisms";
import { ProductDetailView } from "@/components/catalog/ProductDetailView";
import { ShopSkeleton } from "@/components/lk/LkShop";
import { rub } from "@/lib/lk/catalog";
import shop from "@/app/(shop)/products/[slug]/page.module.css";
import styles from "@/app/landing/product/[slug]/page.module.css";
import { MemberCard } from "./MemberCard";

/**
 * Страница товара кабинета — страница товара «Друга клуба» (галерея, заголовок, текст, блок покупки, вкладки на
 * вебе и сворачиваемые строки на телефоне, состав, «Похожие товары»), данные — API каталога (товар по коду, цены
 * участника по витрине сессии). Корзина — корзина участника (общее хранилище).
 */
export function LkProduct() {
  const code = useSearchParams()?.get("code") ?? "";
  const [p, setP] = useState<ProductDetail | null | "missing">(null);
  const [similar, setSimilar] = useState<Product[]>([]);
  const store = getStore();
  useEffect(() => {
    if (!/^\d+$/.test(code)) return;
    let alive = true;
    catalogProduct(code).then((x) => alive && setP(x ?? "missing"));
    similarProducts(code).then((x) => alive && setSimilar(x));
    return () => {
      alive = false;
    };
  }, [code]);

  if (!/^\d+$/.test(code) || p === "missing") {
    return (
      <main className={shop.page}>
        <Container>
          <p style={{ padding: "48px 0", fontFamily: "var(--font-sans)" }}>Товар не найден на витрине вашей страны.</p>
        </Container>
      </main>
    );
  }
  if (!p) {
    return (
      <main className={shop.page}>
        <Container>
          <div style={{ padding: "24px 0" }}>
            <ShopSkeleton n={2} />
          </div>
        </Container>
      </main>
    );
  }

  const title = p.note ? `${p.name} – ${p.note}` : p.name;
  const images = p.pictures.map((src) => ({ src, alt: p.name }));
  const off = p.discountPercent ?? (p.club !== null && p.retail && p.retail > p.club ? Math.round((1 - p.club / p.retail) * 100) : 0);
  const club = p.club !== null ? rub(p.club, p.currency) : "—";
  const regular = p.retail ? rub(p.retail, p.currency) : club;

  return (
    <ProductDetailView
      p={p}
      title={title}
      images={images}
      backHref="/lk/catalog/"
      idPrefix="lk"
      buy={
        p.available ? (
          <BuyBox
            tagByWas
            steady
            product={{ coralId: String(p.code), slug: String(p.code), name: title, image: p.image }}
            options={[
              { id: "club", label: "Цена участника", note: off ? `−${off}%` : undefined, price: club, cta: { label: "В корзину", href: "#" } },
              { id: "regular", label: "Обычная цена", price: regular, cta: { label: "В корзину", href: "#" } },
            ]}
            labels={{ add: "В корзину", inCart: "В корзине", openCart: "Открыть корзину", removeOne: "Убрать одну", addOne: "Добавить ещё" }}
            onAdd={() => void store.add(p.code, 1)}
            onSetQty={(next) => void store.setQty(String(p.code), next)}
          />
        ) : (
          <p className={shop.disclaimer}>Сейчас нет в наличии.</p>
        )
      }
      more={
        similar.length > 0 && (
          <Section tone="default" className={styles.more}>
            <Container>
              <Heading as="h2" className={shop.moreTitle}>
                Похожие товары
              </Heading>
            </Container>
            <Carousel label="Похожие товары" maxCols={4} minCols={2} stretchFew>
              {similar.map((x) => (
                <MemberCard key={x.code} p={x} />
              ))}
            </Carousel>
          </Section>
        )
      }
    />
  );
}
