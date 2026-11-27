"use client";

import { useEffect, useState } from "react";
import { catalogProduct, guestProductDetail, type ProductDetail } from "@coral/api";
import { Container, Heading, Section } from "@/components/ui";
import { RU_BASE, RU_PRODUCTS, ruProduct, ruProducts, ruTitle, type RuProduct } from "@/lib/ru/shop";
import { DETOX_PACKS, HYDRATION_PACK } from "@/lib/ru/home";
import { useRuMember } from "@/lib/ru/live";
import { cityKey, useRuCity } from "@/lib/ru/city";
import shop from "@/app/(shop)/products/[slug]/page.module.css";
import styles from "@/app/landing/product/[slug]/page.module.css";
import { RuProductSkeleton, RuProductView } from "./RuProductView";
import { RuCards } from "./RuCards";

/** Состав наборов главной — как на витрине (у канона он бывает другим). */
const PACK_PARTS = new Map([HYDRATION_PACK, ...DETOX_PACKS].map((x) => [x.code, x.parts]));

/** Низ страницы: у набора — что в него входит, у товара — товары той же фазы или домена. */
function moreFor(p: RuProduct): { heading: string; list: RuProduct[] } {
  const parts = ruProducts(PACK_PARTS.get(p.code) ?? p.parts);
  if (p.set && parts.length) return { heading: "Что входит в набор", list: parts };
  const same = (x: RuProduct) =>
    x.code !== p.code &&
    ((p.phase.includes("hydration") && x.phase.includes("hydration")) ||
      (p.phase.includes("reset") && x.phase.includes("reset")) ||
      (p.domains[0] !== undefined && x.domains.includes(p.domains[0])));
  return { heading: "Вам может подойти", list: RU_PRODUCTS.filter(same).slice(0, 8) };
}

/**
 * Страница товара магазина России (как у «Друга клуба»): галерея, текст, блок покупки, подробности, состав,
 * «Ещё для гидратации». Тексты и цены — API каталога России: гостю по анонимной сессии (обе цены), участнику
 * по его сессии (его цена). Фото — наши пэкшоты, затем фото товара из API.
 */
export function RuPdp({ slug }: { slug: string }) {
  const p = ruProduct(slug);
  const member = useRuMember();
  const city = useRuCity();
  const [got, setGot] = useState<{ key: string; detail: ProductDetail | null } | null>(null);
  // наличие — со склада города: другой город, другой ответ
  const key = `${slug}:${member ? "m" : "g"}:${city ? cityKey(city) : ""}`;

  useEffect(() => {
    if (!p || member === null || !city) return;
    let alive = true;
    const ask = member
      ? // цены участника — его сессия; наличие — склад города (город в сессию участника не пишем: там его корзина)
        Promise.all([catalogProduct(p.code), guestProductDetail(String(p.code), { country: "RU", language: "ru", location: city })]).then(([mine, stock]) =>
          mine && stock ? { ...mine, available: stock.available } : mine,
        )
      : guestProductDetail(String(p.code), { country: "RU", language: "ru", location: city });
    ask.then((detail) => alive && setGot({ key, detail }));
    return () => {
      alive = false;
    };
    // city — новый объект на каждый рендер: следим за ключом
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [p, member, key]);

  if (!p) return null;
  const detail = got?.key === key ? got.detail : undefined;

  const title = ruTitle(p);
  if (detail === undefined) return <RuProductSkeleton p={p} title={title} images={p.gallery ?? p.images} backHref={`${RU_BASE}/`} />;
  if (detail === null) {
    return (
      <main className={shop.page}>
        <Container>
          <p style={{ padding: "48px 0", fontFamily: "var(--font-sans)" }}>Не удалось загрузить товар. Обновите страницу.</p>
        </Container>
      </main>
    );
  }

  const seen = new Set<string>();
  const images = p.gallery ?? [...p.images, ...detail.pictures.map((src) => ({ src, alt: title }))].filter((i) => !seen.has(i.src) && seen.add(i.src));
  const { heading, list } = moreFor(p);
  return (
    <RuProductView
      p={p}
      d={detail}
      title={title}
      images={images}
      member={Boolean(member)}
      backHref={`${RU_BASE}/`}
      more={
        <Section tone="default" className={styles.more}>
          <Container>
            <Heading as="h2" className={shop.moreTitle}>
              {heading}
            </Heading>
          </Container>
          <RuCards products={list} listId="pdp_similar" label={heading} />
        </Section>
      }
    />
  );
}
