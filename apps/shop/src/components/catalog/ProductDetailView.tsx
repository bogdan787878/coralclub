"use client";

import type { ReactNode } from "react";
import type { ProductDetail } from "@coral/api";
import { BodyLong, Heading, Section, Stack } from "@/components/ui";
import { InfoAccordion } from "@/components/organisms";
import { LandingGallery } from "@/components/landing/LandingGallery";
import { PdpTabs, type PdpTab } from "@/components/friend/PdpTabs";
import { BackButton } from "@/app/(shop)/products/[slug]/BackButton";
import { ShareButton } from "@/app/(shop)/products/[slug]/ShareButton";
import shop from "@/app/(shop)/products/[slug]/page.module.css";
import styles from "@/app/landing/product/[slug]/page.module.css";
import controls from "@/app/friend/product/[slug]/controls.module.css";
import grid from "@/app/friend/product/[slug]/grid.module.css";
import tabsCss from "@/app/friend/product/[slug]/tabs.module.css";
import facts from "@/components/friend/PdpBlocks.module.css";

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
 * Страница товара на русском по данным API каталога (товар по коду): галерея, заголовок, текст, блок покупки,
 * подробности вкладками на вебе и сворачиваемыми строками на телефоне, состав. Общая для кабинета и витрины
 * «Друга клуба» (Россия): каждая подставляет свой блок покупки, фото и «Похожие товары».
 */
export function ProductDetailView({
  p,
  title,
  images,
  lead,
  backHref,
  buy,
  more,
  idPrefix = "pdp",
}: {
  p: ProductDetail;
  title: string;
  images: { src: string; alt: string }[];
  /** текст под заголовком (по умолчанию — описание товара) */
  lead?: string;
  backHref: string;
  buy: ReactNode;
  more?: ReactNode;
  idPrefix?: string;
}) {
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
  const text = lead ?? p.description;

  return (
    <div className={`appShell ${grid.column}`}>
      <main className={shop.page} data-analytics-location="product_card">
        <div className={`${shop.imageControls} ${controls.controls}`}>
          <BackButton className={shop.circleBtn} fallbackHref={backHref} />
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
                  <Facts p={p} headingId={`${idPrefix}-facts-web`} />
                  {disclaimer}
                </div>
              </div>

              <Stack gap="base" className={shop.infoCol}>
                <div className={shop.headGroup}>
                  <Heading className={`${shop.name} ${styles.pdpTitle}`}>{title}</Heading>
                  {text && <BodyLong>{text}</BodyLong>}
                  <div id="pdp-buy">{buy}</div>
                </div>
                {/* телефон: подробности сворачиваемыми строками, затем состав */}
                <div className={tabsCss.mobileOnly}>
                  <InfoAccordion items={sections.map((s) => ({ title: s.label, content: s.content }))} />
                </div>
                <div className={tabsCss.mobileOnly}>
                  <Facts p={p} headingId={`${idPrefix}-facts`} />
                </div>
                <div className={tabsCss.mobileOnly}>{disclaimer}</div>
              </Stack>
            </div>
          </div>
        </Section>

        {more}
      </main>
    </div>
  );
}
