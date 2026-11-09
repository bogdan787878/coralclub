"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { catalogProduct, similarProducts, type Product, type ProductDetail } from "@coral/api";
import { getStore } from "@coral/cart/store";
import { BodyLong, Container, Heading, Section, Stack } from "@/components/ui";
import { BuyBox, Carousel, InfoAccordion } from "@/components/organisms";
import { LandingGallery } from "@/components/landing/LandingGallery";
import { PdpTabs, type PdpTab } from "@/components/friend/PdpTabs";
import { ShopSkeleton } from "@/components/lk/LkShop";
import { rub } from "@/lib/lk/catalog";
import { BackButton } from "@/app/(shop)/products/[slug]/BackButton";
import { ShareButton } from "@/app/(shop)/products/[slug]/ShareButton";
import shop from "@/app/(shop)/products/[slug]/page.module.css";
import styles from "@/app/landing/product/[slug]/page.module.css";
import controls from "@/app/friend/product/[slug]/controls.module.css";
import grid from "@/app/friend/product/[slug]/grid.module.css";
import tabsCss from "@/app/friend/product/[slug]/tabs.module.css";
import facts from "@/components/friend/PdpBlocks.module.css";
import { MemberCard } from "./MemberCard";

/** Таблица активных веществ (как «Supplement Facts» на странице товара «Друга клуба»). */
function Facts({ p, headingId }: { p: ProductDetail; headingId: string }) {
  if (!p.ingredients.length && !p.composition) return null;
  const anyPercent = p.ingredients.some((r) => r.percent);
  return (
    <section className={facts.block} aria-labelledby={headingId}>
      <h2 id={headingId} className={shop.moreTitle} style={{ fontSize: "1.25rem" }}>
        Состав
      </h2>
      {p.ingredients.length > 0 && (
        <>
          {p.ingredientsHeader && <p className={facts.serving}>Содержание в {p.ingredientsHeader}</p>}
          <div className={facts.tableWrap}>
            <table className={facts.table}>
              <thead>
                <tr>
                  <th scope="col">Активные ингредиенты</th>
                  <th scope="col" className={facts.num}>
                    Количество
                  </th>
                  {anyPercent && (
                    <th scope="col" className={facts.num}>
                      % РУСП*
                    </th>
                  )}
                </tr>
              </thead>
              <tbody>
                {p.ingredients.map((r, i) => (
                  <tr key={i}>
                    <td>{r.name}</td>
                    <td className={facts.num}>{r.amount}</td>
                    {anyPercent && <td className={facts.num}>{r.percent || "—"}</td>}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {anyPercent && <p className={facts.note}>* Рекомендуемый уровень суточного потребления.</p>}
        </>
      )}
      {p.composition && (
        <p className={facts.text}>
          <b>Состав:</b> {p.composition}
        </p>
      )}
    </section>
  );
}

const Paragraphs = ({ items }: { items: string[] }) => (
  <>
    {items.map((t, i) => (
      <p key={i} style={{ whiteSpace: "pre-line" }}>
        {t}
      </p>
    ))}
  </>
);

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
  const disclaimer = p.isSupplement ? <p className={shop.disclaimer}>Биологически активная добавка. Не является лекарственным средством.</p> : null;
  const storage = [p.storage && `Хранение: ${p.storage}`, p.shelfLife && `Срок годности: ${p.shelfLife}`, p.country && `Страна производства: ${p.country}`].filter(Boolean) as string[];
  const sections: PdpTab[] = [
    ...(p.components ? [{ id: "about", label: "О продукте", content: <Paragraphs items={[p.components]} /> }] : []),
    ...(p.howToUse.length ? [{ id: "usage", label: "Способ применения", content: <Paragraphs items={p.howToUse} /> }] : []),
    ...(p.contraindications ? [{ id: "contra", label: "Противопоказания", content: <Paragraphs items={[p.contraindications]} /> }] : []),
    ...(storage.length ? [{ id: "storage", label: "Хранение", content: <Paragraphs items={storage} /> }] : []),
    ...(p.certificates.length
      ? [
          {
            id: "docs",
            label: "Сертификаты",
            content: (
              <ul>
                {p.certificates.map((c) => (
                  <li key={c.link}>
                    <a href={c.link} target="_blank" rel="noopener noreferrer">
                      {c.label}
                    </a>
                  </li>
                ))}
              </ul>
            ),
          },
        ]
      : []),
  ];
  const off = p.discountPercent ?? (p.club !== null && p.retail && p.retail > p.club ? Math.round((1 - p.club / p.retail) * 100) : 0);
  const club = p.club !== null ? rub(p.club, p.currency) : "—";
  const regular = p.retail ? rub(p.retail, p.currency) : club;

  return (
    <div className={`appShell ${grid.column}`}>
      <main className={shop.page} data-analytics-location="product_card">
        <div className={`${shop.imageControls} ${controls.controls}`}>
          <BackButton className={shop.circleBtn} fallbackHref="/lk/catalog/" />
          <ShareButton className={shop.circleBtn} title={p.name} />
        </div>

        <Section tone="surface">
          <div className={`${styles.wide} ${grid.wide}`}>
            <div className={`${shop.layout} ${styles.layout}`}>
              <div className={tabsCss.mediaCol}>
                <LandingGallery images={images} title={p.name} fit="contain" />
                {/* веб: подробности вкладками под фото, затем состав */}
                <div className={tabsCss.webCol}>
                  <PdpTabs tabs={sections} />
                  <Facts p={p} headingId="lk-facts-web" />
                  {disclaimer}
                </div>
              </div>

              <Stack gap="base" className={shop.infoCol}>
                <div className={shop.headGroup}>
                  <Heading className={`${shop.name} ${styles.pdpTitle}`}>{title}</Heading>
                  {p.description && <BodyLong>{p.description}</BodyLong>}
                  <div id="pdp-buy">
                    {p.available ? (
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
                    )}
                  </div>
                </div>
                {/* телефон: подробности сворачиваемыми строками, затем состав */}
                <div className={tabsCss.mobileOnly}>
                  <InfoAccordion items={sections.map((s) => ({ title: s.label, content: s.content }))} />
                </div>
                <div className={tabsCss.mobileOnly}>
                  <Facts p={p} headingId="lk-facts" />
                </div>
                <div className={tabsCss.mobileOnly}>{disclaimer}</div>
              </Stack>
            </div>
          </div>
        </Section>

        {similar.length > 0 && (
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
        )}
      </main>
    </div>
  );
}
