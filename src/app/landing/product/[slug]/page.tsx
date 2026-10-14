import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { BodyLong, Container, Heading, Section, Stack } from "@/components/ui";
import {
  BuyBox,
  DietaryBadges,
  FullDescription,
  InfoAccordion,
  PeriodicElements,
} from "@/components/organisms";
import { ShowWhenScrolledPast } from "@/components/landing/ShowWhenScrolledPast";
import { LandingGallery } from "@/components/landing/LandingGallery";
import { LandingHeader } from "@/components/landing/LandingHeader";
import { IncludedProductDetails } from "@/components/landing/IncludedProductDetails";
import { IncludedProductSheet } from "@/components/landing/IncludedProductSheet";
import { LandingCards } from "@/components/landing/LandingCards";
import { LandingCartDrawer } from "@/components/landing/LandingCartButton";
import { asset } from "@/lib/asset";
import { BEAUTY_SLUGS, MAIN_SITE_URL } from "@/lib/beautySystem";
import {
  BADGE_LABELS_RU,
  DISCLAIMERS,
  INCLUDED_PRODUCTS_RU,
  LANDING_PRODUCTS_RU,
  HYDRAMAX_PACKSHOT,
  discountTag,
  formatRub,
  sitePhotos,
  type BeautySlug,
} from "@/lib/landingCatalogRu";
import {
  getProduct,
  getProductCards,
  resolveIncludedProducts,
} from "@/lib/products";
import {
  ManufacturingDetails,
  SupplementFacts,
} from "../../../(shop)/products/[slug]/ManufacturingDetails";
import { BackButton } from "../../../(shop)/products/[slug]/BackButton";
import { ShareButton } from "../../../(shop)/products/[slug]/ShareButton";
// the page chrome (full-bleed image, floating back/share, sticky buy column)
// is the shop PDP's own — same classes, same look
import shop from "../../../(shop)/products/[slug]/page.module.css";
import styles from "./page.module.css";

type Params = { slug: string };

export function generateStaticParams(): Params[] {
  return BEAUTY_SLUGS.map((slug) => ({ slug }));
}

const isBeautySlug = (slug: string): slug is BeautySlug =>
  slug in LANDING_PRODUCTS_RU;

export async function generateMetadata({
  params,
}: {
  params: Promise<Params>;
}): Promise<Metadata> {
  const { slug } = await params;
  if (!isBeautySlug(slug)) return {};
  const ru = LANDING_PRODUCTS_RU[slug];
  return {
    title: `${ru.name} — Coral Club`,
    description: ru.lead,
    robots: { index: false, follow: false },
  };
}

export default async function LandingProductPage({
  params,
}: {
  params: Promise<Params>;
}) {
  const { slug } = await params;
  if (!isBeautySlug(slug)) notFound();

  const ru = LANDING_PRODUCTS_RU[slug];
  const product = getProduct(slug);
  if (!product) notFound();

  const [card] = getProductCards([slug]);
  const homeHref = MAIN_SITE_URL;
  const shopPdpHref = `${MAIN_SITE_URL}/products/${slug}/`;

  // other products of the set → the "ещё" carousel, linking to their RU pages
  const others = getProductCards(BEAUTY_SLUGS.filter((s) => s !== slug)).map(
    (c) => {
      const r = LANDING_PRODUCTS_RU[c.slug as BeautySlug];
      return r
        ? {
            ...c,
            name: r.name,
            headline: r.headline,
            category: r.category,
            images:
              c.slug === "hydramax"
                ? [{ src: asset(HYDRAMAX_PACKSHOT), alt: r.name }]
                : c.images,
            price: formatRub(r.priceRub.club),
            priceWas: formatRub(r.priceRub.regular),
          }
        : c;
    },
  );

  // set contents: shop packshots under Russian names, as non-link tiles
  const included = (ru.included ?? []).map((item) => {
    const resolved = resolveIncludedProducts([item.slug])[0];
    return {
      slug: item.slug,
      name: item.name,
      image: resolved?.image && { ...resolved.image, alt: item.name },
    };
  });
  // tap a tile → bottom sheet with everything about that product (no price,
  // no buy button)
  const includedDetails = Object.fromEntries(
    included.flatMap((item) => {
      const details = INCLUDED_PRODUCTS_RU[item.slug];
      if (!details) return [];
      return [
        [
          item.slug,
          {
            title: details.name,
            content: (
              <IncludedProductDetails
                ru={details}
                image={item.image}
                badges={getProduct(item.slug)?.dietaryBadges ?? []}
              />
            ),
          },
        ],
      ];
    }),
  );

  const hasFacts = (ru.facts?.rows.length ?? 0) > 0;
  // catalog photos first, then every photo from the original coralclub.ru
  // page (Hydramax's catalog photo shows the "Plus" box, so it leads with
  // the real packshot from the site instead)
  const catalogPhotos = slug === "hydramax" ? [] : product.pdpImages;
  const sitePhotoUrls = sitePhotos(slug).map((src) => asset(src));
  const orderedSite =
    slug === "hydramax"
      ? [
          asset(HYDRAMAX_PACKSHOT),
          ...sitePhotoUrls.filter((u) => u !== asset(HYDRAMAX_PACKSHOT)),
        ]
      : sitePhotoUrls;
  const images = [...catalogPhotos, ...orderedSite].map((src) => ({
    src,
    alt: ru.name,
  }));
  // fall back to the shared packshot if a product has no PDP gallery yet
  if (!images.length && product.image)
    images.push({ src: product.image, alt: ru.name });

  // price + CTA: the same props feed the inline block and the web top bar
  const buyProps = {
    product: {
      coralId: card.coralId,
      slug,
      name: ru.name,
      image: product.image ?? images[0]?.src,
    },
    options: [
      {
        id: "club",
        label: "Цена",
        note: discountTag(slug),
        price: formatRub(ru.priceRub.club),
        cta: { label: "В корзину", href: shopPdpHref },
      },
      {
        id: "regular",
        label: "Обычная цена",
        price: formatRub(ru.priceRub.regular),
        cta: { label: "В корзину", href: shopPdpHref },
      },
    ],
    labels: {
      add: "В корзину",
      removeOne: "Убрать одну штуку",
      addOne: "Добавить ещё одну",
      openCart: "Открыть корзину",
    },
  };

  return (
    <div className="appShell">
      <main className={shop.page}>
        {/* desktop only (see .desktopHeader) — on mobile/tablet the floating
            back + share controls below do this job instead */}
        <div className={shop.desktopHeader}>
          <LandingHeader homeHref={homeHref} />
        </div>

        <div className={shop.imageControls}>
          <BackButton className={shop.circleBtn} fallbackHref="/landing/" />
          <ShareButton className={shop.circleBtn} title={ru.name} />
        </div>

        <Section tone="surface">
          <div className={styles.wide}>
            <div className={`${shop.layout} ${styles.layout}`}>
              <LandingGallery images={images} title={ru.name} fit="contain" />

              <Stack gap="base" className={shop.infoCol}>
                <div className={shop.headGroup}>
                  <Heading className={shop.name}>{ru.name}</Heading>

                  {/* mobile/tablet: fixed bottom bar; web: plain inline block under the title */}
                  <div id="pdp-buy">
                    <BuyBox pinned {...buyProps} />
                  </div>

                  <BodyLong>{ru.lead}</BodyLong>
                  {ru.bullets && (
                    <ul className={styles.bullets}>
                      {ru.bullets.map((b) => (
                        <li key={b}>{b}</li>
                      ))}
                    </ul>
                  )}
                  {ru.extra && <BodyLong>{ru.extra}</BodyLong>}
                  {ru.more?.map((p) => (
                    <BodyLong key={p}>{p}</BodyLong>
                  ))}

                  {ru.origins.length > 0 && (
                    <div className={shop.originTags}>
                      {ru.origins.map((o) => (
                        <span className={shop.originTag} key={o.label}>
                          <span aria-hidden="true">{o.flag} </span>
                          {o.label}
                        </span>
                      ))}
                    </div>
                  )}
                  {product.dietaryBadges.length > 0 && (
                    <DietaryBadges
                      items={product.dietaryBadges}
                      labels={BADGE_LABELS_RU}
                    />
                  )}
                  {ru.elements.length > 0 && (
                    <PeriodicElements
                      items={ru.elements}
                      heading="Ключевые компоненты"
                    />
                  )}
                  <p className={shop.disclaimer}>
                    {DISCLAIMERS[ru.disclaimer]}
                  </p>
                  {included.length > 0 && (
                    <IncludedProductSheet
                      items={included}
                      heading="Состав набора"
                      details={includedDetails}
                    />
                  )}
                </div>

                <InfoAccordion
                  items={[
                    {
                      title: "Как применять",
                      content: (
                        <p style={{ whiteSpace: "pre-line" }}>{ru.howToUse}</p>
                      ),
                    },
                    {
                      title: "Производство и хранение",
                      content: (
                        <ManufacturingDetails
                          data={{
                            countryOfOrigin: ru.manufacturing.country,
                            shippingWeight: "",
                            expiration: ru.manufacturing.expiration,
                            storage: ru.manufacturing.storage,
                            ingredients: ru.manufacturing.ingredients ?? "",
                            supplementFacts: { servingLabel: "", rows: [] },
                          }}
                          labels={{
                            country: "Страна происхождения",
                            weight: "Вес",
                            expiration: "Срок годности",
                            storage: "Условия хранения",
                            ingredients: "Состав",
                          }}
                        />
                      ),
                    },
                    ...(hasFacts && ru.facts
                      ? [
                          {
                            title: "Пищевая ценность",
                            content: (
                              <SupplementFacts
                                data={{
                                  servingLabel: ru.facts.servingLabel,
                                  rows: ru.facts.rows.map((r) => ({
                                    name: r.name,
                                    amount: r.amount,
                                    dv: r.dv ?? "",
                                  })),
                                }}
                                labels={{
                                  perServing: "В одной порции",
                                  dv: "% от суточной нормы",
                                  footnote:
                                    "* Процент от рекомендуемой суточной нормы потребления.",
                                }}
                              />
                            ),
                          },
                        ]
                      : []),
                  ]}
                />

                {ru.fullDescription && (
                  <FullDescription
                    text={ru.fullDescription}
                    title="Полное описание"
                    moreLabel="Читать полностью"
                    lessLabel="Свернуть"
                  />
                )}
              </Stack>
            </div>
          </div>
        </Section>

        {/* web: price + CTA stay in reach once the inline block is gone */}
        <ShowWhenScrolledPast watchId="pdp-buy">
          <BuyBox top {...buyProps} />
        </ShowWhenScrolledPast>

        <LandingCartDrawer />

        <Section tone="default">
          <Container>
            <Heading as="h2" className={shop.moreTitle}>
              Ещё из системы красоты
            </Heading>
          </Container>
          <LandingCards cards={others} />
        </Section>
      </main>
    </div>
  );
}
