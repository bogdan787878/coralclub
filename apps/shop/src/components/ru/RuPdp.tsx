"use client";

import { useEffect, useState } from "react";
import { catalogProduct, guestProductDetail, type ProductDetail } from "@coral/api";
import { Container, Heading, Section } from "@/components/ui";
import { ProductDetailView } from "@/components/catalog/ProductDetailView";
import { ShopSkeleton } from "@/components/lk/LkShop";
import { RU_BASE, RU_PRODUCTS, ruProduct, ruTitle } from "@/lib/ru/shop";
import { useRuMember } from "@/lib/ru/live";
import shop from "@/app/(shop)/products/[slug]/page.module.css";
import styles from "@/app/landing/product/[slug]/page.module.css";
import { RuBuyBox } from "./RuBuyBox";
import { RuCards } from "./RuCards";

/**
 * Страница товара магазина России (как у «Друга клуба»): галерея, текст, блок покупки, подробности, состав,
 * «Ещё для гидратации». Тексты и цены — API каталога России: гостю по анонимной сессии (обе цены), участнику
 * по его сессии (его цена). Фото — наши пэкшоты, затем фото товара из API.
 */
export function RuPdp({ slug }: { slug: string }) {
  const p = ruProduct(slug);
  const member = useRuMember();
  const [got, setGot] = useState<{ key: string; detail: ProductDetail | null } | null>(null);
  const key = `${slug}:${member ? "m" : "g"}`;

  useEffect(() => {
    if (!p || member === null) return;
    let alive = true;
    const ask = member ? catalogProduct(p.code) : guestProductDetail(String(p.code), { country: "RU", language: "ru" });
    ask.then((detail) => alive && setGot({ key, detail }));
    return () => {
      alive = false;
    };
  }, [p, member, key]);

  if (!p) return null;
  const detail = got?.key === key ? got.detail : undefined;

  if (detail === undefined) {
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
  if (detail === null) {
    return (
      <main className={shop.page}>
        <Container>
          <p style={{ padding: "48px 0", fontFamily: "var(--font-sans)" }}>Не удалось загрузить товар. Обновите страницу.</p>
        </Container>
      </main>
    );
  }

  const title = ruTitle(p);
  const images = p.gallery ?? [...p.images, ...detail.pictures.map((src) => ({ src, alt: title }))];
  const others = RU_PRODUCTS.filter((x) => x.slug !== slug);
  return (
    <ProductDetailView
      p={detail}
      title={title}
      lead={detail.description || detail.components.split(/(?<=[.!?])\s+/)[0] || ""}
      images={images}
      backHref={`${RU_BASE}/`}
      idPrefix="ru"
      buy={<RuBuyBox p={p} member={Boolean(member)} club={detail.club} retail={detail.retail} available={detail.available} />}
      more={
        <Section tone="default" className={styles.more}>
          <Container>
            <Heading as="h2" className={shop.moreTitle}>
              Ещё для гидратации
            </Heading>
          </Container>
          <RuCards products={others} listId="pdp_similar" label="Ещё для гидратации" />
        </Section>
      }
    />
  );
}
