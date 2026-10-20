import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { BodyLong, Container, Heading, Section, Stack } from "@/components/ui";
import {
  BuyBox,
  FullDescription,
  InfoAccordion,
  PeriodicElements,
} from "@/components/organisms";
import { LandingGallery } from "@/components/landing/LandingGallery";
import { LandingHeader } from "@/components/landing/LandingHeader";
import { TrackViewItem } from "@/components/landing/TrackViewItem";
import { FriendBanner } from "@/components/friend/FriendProvider";
import { FriendCards } from "@/components/friend/FriendCards";
import { FriendCartButton } from "@/components/friend/FriendCart";
import { FriendMemberBlock } from "@/components/friend/FriendMemberBlock";
import { asset } from "@/lib/asset";
import {
  FRIEND_PRODUCTS,
  formatUsd,
  friendPdpHref,
  friendProduct,
} from "@/lib/friendCatalog";
import {
  ManufacturingDetails,
  SupplementFacts,
  hasSupplementFacts,
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
  const facts = p.manufacturing.supplementFacts;
  const hasFacts = hasSupplementFacts(facts);
  const title = p.form ? `${p.name} – ${p.form}` : p.name;

  const buyProps = {
    product: {
      coralId: p.coralId,
      slug,
      name: title,
      image: p.images[0]?.src,
    },
    options: [
      {
        id: "club",
        label: "Member price",
        note: "−20% with a friend link",
        price: formatUsd(p.club),
        cta: { label: "Add to cart", href },
      },
      {
        id: "regular",
        label: "Regular price",
        price: formatUsd(p.regular),
        cta: { label: "Add to cart", href },
      },
    ],
    labels: {
      add: "Add to cart",
      inCart: "In cart",
      openCart: "Open cart",
    },
  };

  return (
    <div className="appShell">
      <main className={shop.page} data-analytics-location="product_card">
        <div className={shop.desktopHeader}>
          <LandingHeader homeHref={asset("/friend/")} />
        </div>
        <TrackViewItem coralId={p.coralId} />

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
                    {title}
                  </Heading>

                  <div id="pdp-buy">
                    <BuyBox pinned {...buyProps} />
                  </div>

                  <BodyLong>{p.lead}</BodyLong>

                  {p.elements.length > 0 && (
                    <PeriodicElements items={p.elements} />
                  )}
                </div>

                <InfoAccordion
                  items={[
                    {
                      title: "How to Use",
                      content: (
                        <p style={{ whiteSpace: "pre-line" }}>
                          {p.howToUse || "Details coming soon."}
                        </p>
                      ),
                    },
                    {
                      title: "Manufacturing details",
                      content: <ManufacturingDetails data={p.manufacturing} />,
                    },
                    ...(hasFacts
                      ? [
                          {
                            title: "Supplement Facts",
                            content: <SupplementFacts data={facts} />,
                          },
                        ]
                      : []),
                  ]}
                />

                {p.fullDescription && (
                  <FullDescription text={p.fullDescription} />
                )}

                <p className={shop.disclaimer}>
                  This statement has not been evaluated by the Food and Drug
                  Administration. This product is not intended to diagnose,
                  treat, cure, or prevent any disease.
                </p>
              </Stack>
            </div>
          </div>
        </Section>

        <Section tone="default" className={styles.more}>
          <Container>
            <Heading as="h2" className={shop.moreTitle}>
              More from Hydration
            </Heading>
          </Container>
          <FriendCards
            products={others}
            listId="pdp_similar"
            listName="More from Hydration"
            label="More from Hydration"
          />
        </Section>

        <Section tone="default">
          <Container>
            <FriendMemberBlock />
          </Container>
        </Section>

        <FriendCartButton aboveBar />
      </main>
    </div>
  );
}
