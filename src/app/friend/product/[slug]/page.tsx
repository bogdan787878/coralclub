import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { BodyLong, Container, Heading, Section, Stack } from "@/components/ui";
import {
  BuyBox,
  FullDescription,
  InfoAccordion,
  PeriodicElements,
} from "@/components/organisms";
import { ProductTitle } from "@/components/landing/ProductTitle";
import { LandingGallery } from "@/components/landing/LandingGallery";
import { LandingHeader } from "@/components/landing/LandingHeader";
import { TrackViewItem } from "@/components/landing/TrackViewItem";
import { FriendBanner } from "@/components/friend/FriendProvider";
import { FriendCards } from "@/components/friend/FriendCards";
import { FriendCartButton } from "@/components/friend/FriendCart";
import { FriendRegisterCta } from "@/components/friend/FriendRegisterCta";
import { asset } from "@/lib/asset";
import {
  FRIEND_PRODUCTS,
  friendPdpHref,
  friendProduct,
} from "@/lib/friendCatalog";
import { DISCLAIMERS, formatRub } from "@/lib/landingCatalogRu";
import {
  ManufacturingDetails,
  SupplementFacts,
} from "../../../(shop)/products/[slug]/ManufacturingDetails";
import { BackButton } from "../../../(shop)/products/[slug]/BackButton";
import { ShareButton } from "../../../(shop)/products/[slug]/ShareButton";
// the page chrome is the shop PDP's own, the wide frame is the landing's
import shop from "../../../(shop)/products/[slug]/page.module.css";
import styles from "../../../landing/product/[slug]/page.module.css";

type Params = { slug: string };

export function generateStaticParams(): Params[] {
  return FRIEND_PRODUCTS.map((p) => ({ slug: p.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<Params>;
}): Promise<Metadata> {
  const { slug } = await params;
  const p = friendProduct(slug);
  if (!p) return {};
  return {
    title: `${p.name} — Coral Club`,
    description: p.lead,
    robots: { index: false, follow: false },
  };
}

export default async function FriendProductPage({
  params,
}: {
  params: Promise<Params>;
}) {
  const { slug } = await params;
  const p = friendProduct(slug);
  if (!p) notFound();

  const others = FRIEND_PRODUCTS.filter((x) => x.slug !== slug);
  const href = friendPdpHref(slug);
  const hasFacts = (p.facts?.rows.length ?? 0) > 0;

  const buyProps = {
    product: {
      coralId: p.ruId,
      slug,
      name: `${p.name} – ${p.form}`,
      image: p.images[0]?.src,
    },
    options: [
      {
        id: "club",
        label: "Клубная цена",
        note: "−20% по ссылке друга",
        price: formatRub(p.club),
        cta: { label: "В корзину", href },
      },
      {
        id: "regular",
        label: "Обычная цена",
        price: formatRub(p.regular),
        cta: { label: "В корзину", href },
      },
    ],
    labels: {
      add: "В корзину",
      inCart: "В корзине",
      openCart: "Открыть корзину",
    },
  };

  return (
    <div className="appShell">
      <main className={shop.page} data-analytics-location="product_card">
        <div className={shop.desktopHeader}>
          <LandingHeader homeHref={asset("/friend/")} />
        </div>
        <TrackViewItem coralId={p.ruId} />

        <div className={shop.imageControls}>
          <BackButton className={shop.circleBtn} fallbackHref="/friend/" />
          <ShareButton className={shop.circleBtn} title={p.name} />
        </div>

        <FriendBanner />

        <Section tone="surface">
          <div className={styles.wide}>
            <div className={`${shop.layout} ${styles.layout}`}>
              <LandingGallery images={p.images} title={p.name} fit="contain" />

              <Stack gap="base" className={shop.infoCol}>
                <div className={shop.headGroup}>
                  <Heading className={`${shop.name} ${styles.pdpTitle}`}>
                    <ProductTitle title={p.name} form={{ label: p.form }} />
                  </Heading>

                  <div id="pdp-buy">
                    <BuyBox pinned {...buyProps} />
                  </div>

                  <BodyLong>{p.lead}</BodyLong>
                  {p.bullets && (
                    <ul className={styles.bullets}>
                      {p.bullets.map((b) => (
                        <li key={b}>{b}</li>
                      ))}
                    </ul>
                  )}

                  {p.elements.length > 0 && (
                    <PeriodicElements
                      items={p.elements}
                      heading="Ключевые компоненты"
                    />
                  )}
                </div>

                <InfoAccordion
                  items={[
                    {
                      title: "Как применять",
                      content: (
                        <p style={{ whiteSpace: "pre-line" }}>{p.howToUse}</p>
                      ),
                    },
                    {
                      title: "Производство и хранение",
                      content: (
                        <ManufacturingDetails
                          data={{
                            countryOfOrigin: p.manufacturing.country,
                            shippingWeight: "",
                            expiration: p.manufacturing.expiration,
                            storage: p.manufacturing.storage,
                            ingredients: p.manufacturing.ingredients ?? "",
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
                    ...(hasFacts && p.facts
                      ? [
                          {
                            title: "Пищевая ценность",
                            content: (
                              <SupplementFacts
                                data={{
                                  servingLabel: p.facts.servingLabel,
                                  rows: p.facts.rows.map((r) => ({
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

                {p.fullDescription && (
                  <FullDescription
                    text={p.fullDescription}
                    title="Полное описание"
                    moreLabel="Читать полностью"
                    lessLabel="Свернуть"
                  />
                )}

                <p className={shop.disclaimer}>{DISCLAIMERS.supplement}</p>
              </Stack>
            </div>
          </div>
        </Section>

        <Section tone="default" className={styles.more}>
          <Container>
            <Heading as="h2" className={shop.moreTitle}>
              Ещё из первой фазы
            </Heading>
          </Container>
          <FriendCards
            products={others}
            listId="pdp_similar"
            listName="Ещё из первой фазы"
            label="Ещё из первой фазы"
          />
        </Section>

        <Section tone="default">
          <Container>
            <FriendRegisterCta where="home" />
          </Container>
        </Section>

        <FriendCartButton aboveBar />
      </main>
    </div>
  );
}
