import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Button, Container, Heading, Section } from "@/components/ui";
import {
  DietaryBadges,
  FullDescription,
  ImageSlider,
  IncludedProducts,
  InfoAccordion,
  PeriodicElements,
} from "@/components/organisms";
import { LandingHeader } from "@/components/landing/LandingHeader";
import { LandingCards } from "@/components/landing/LandingCards";
import { BEAUTY_SLUGS, MAIN_SITE_URL } from "@/lib/beautySystem";
import {
  BADGE_LABELS_RU,
  DISCLAIMERS,
  LANDING_PRODUCTS_RU,
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
  const buyHref = `${MAIN_SITE_URL}/beauty-system/#${slug}`;
  const homeHref = MAIN_SITE_URL;

  // other products of the set → the "ещё" carousel, linking to their RU pages
  const others = getProductCards(BEAUTY_SLUGS.filter((s) => s !== slug)).map(
    (c) => {
      const r = LANDING_PRODUCTS_RU[c.slug as BeautySlug];
      return r
        ? { ...c, name: r.name, headline: r.headline, category: r.category }
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

  const hasFacts = (ru.facts?.rows.length ?? 0) > 0;
  const images = product.pdpImages.map((src) => ({ src, alt: ru.name }));
  // fall back to the shared packshot if a product has no PDP gallery yet
  if (!images.length && product.image)
    images.push({ src: product.image, alt: ru.name });

  return (
    <div className="appShell">
      <LandingHeader homeHref={homeHref} />
      <main className={styles.page}>
        <Section tone="surface">
          <Container>
            <Link href="/landing/" className={styles.back}>
              <svg
                width="20"
                height="20"
                viewBox="0 0 20 20"
                aria-hidden="true"
              >
                <path
                  d="M12.5 4.5 7 10l5.5 5.5"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
              Система красоты
            </Link>

            <div className={styles.layout}>
              <div className={styles.media}>
                <div className={styles.mediaInner}>
                  <ImageSlider
                    images={images}
                    sizes="(max-width: 1023px) 100vw, 480px"
                    fit={slug === "hydramax" ? "cover" : "contain"}
                    priority
                    lightDots
                  />
                </div>
              </div>

              <div className={styles.info}>
                <span className={styles.category}>{ru.category}</span>
                <Heading className={styles.name}>{ru.name}</Heading>

                <div className={styles.copy}>
                  <p>{ru.lead}</p>
                  {ru.bullets && (
                    <ul className={styles.bullets}>
                      {ru.bullets.map((b) => (
                        <li key={b}>{b}</li>
                      ))}
                    </ul>
                  )}
                  {ru.extra && <p>{ru.extra}</p>}
                  {ru.more?.map((p) => (
                    <p key={p}>{p}</p>
                  ))}
                </div>

                <div className={styles.buy}>
                  <div className={styles.priceRow}>
                    <span className={styles.price}>{card.price}</span>
                    {card.priceWas && (
                      <span className={styles.priceWas}>{card.priceWas}</span>
                    )}
                    <span className={styles.tag}>Цена друга клуба −20%</span>
                  </div>
                  <Button
                    variant="primary"
                    href={buyHref}
                    className={styles.cta}
                  >
                    Купить без регистрации
                  </Button>
                  <p className={styles.buyNote}>
                    Оформить заказ можно на основном сайте Coral Club,
                    регистрация не нужна.
                  </p>
                </div>

                {ru.origins.length > 0 && (
                  <div className={styles.originTags}>
                    {ru.origins.map((o) => (
                      <span className={styles.originTag} key={o.label}>
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
                {included.length > 0 && (
                  <IncludedProducts
                    items={included}
                    heading="Состав набора"
                    linked={false}
                  />
                )}

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

                <p className={styles.disclaimer}>
                  {DISCLAIMERS[ru.disclaimer]}
                </p>
              </div>
            </div>
          </Container>
        </Section>

        <Section tone="default">
          <Container>
            <Heading as="h2" className={styles.moreTitle}>
              Ещё из системы красоты
            </Heading>
          </Container>
          <LandingCards cards={others} />
        </Section>
      </main>
    </div>
  );
}
