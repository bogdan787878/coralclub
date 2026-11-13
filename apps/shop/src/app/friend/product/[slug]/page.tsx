import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { BodyLong, Container, Heading, Section, Stack } from "@/components/ui";
import {
  DietaryBadges,
  FullDescription,
  InfoAccordion,
  PeriodicElements,
} from "@/components/organisms";
import { LandingGallery } from "@/components/landing/LandingGallery";
import { TrackViewItem } from "@/components/landing/TrackViewItem";
import { FriendCards } from "@/components/friend/FriendCards";
import { PdpDelivery } from "@/components/friend/PdpDelivery";
import { PdpSubscribe } from "@/components/friend/PdpSubscribe";
import { PdpFacts } from "@/components/friend/PdpFacts";
import { PdpTabs, type PdpTab } from "@/components/friend/PdpTabs";
import {
  FRIEND_PRODUCTS,
  friendPdpHref,
  friendProduct,
} from "@/lib/friendCatalog";
import { ManufacturingDetails } from "../../../(shop)/products/[slug]/ManufacturingDetails";
import { BackButton } from "../../../(shop)/products/[slug]/BackButton";
import { ShareButton } from "../../../(shop)/products/[slug]/ShareButton";
// the page chrome is the shop PDP's own, the wide frame is the landing's
import shop from "../../../(shop)/products/[slug]/page.module.css";
import styles from "../../../landing/product/[slug]/page.module.css";
import { FriendBuyBox } from "@/components/friend/FriendBuyBox";
import { FriendPdpLang } from "@/components/friend/FriendPdpLang";
import controls from "./controls.module.css";
import grid from "./grid.module.css";
import tabsCss from "./tabs.module.css";

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
  const title = p.form ? `${p.name} – ${p.form}` : p.name;

  const howToUse = {
    title: "How to Use",
    content: (
      <p style={{ whiteSpace: "pre-line" }}>
        {p.howToUse || "Details coming soon."}
      </p>
    ),
  };
  const manufacturing = {
    title: "Manufacturing details",
    content: <ManufacturingDetails data={p.manufacturing} />,
  };
  const disclaimer = (
    <p className={shop.disclaimer}>
      Food supplements are not a substitute for a varied and balanced diet and a
      healthy lifestyle. Do not exceed the recommended daily intake. Keep out of
      the reach of young children.
    </p>
  );
  // on the web these details are tabs under the picture (Key Elements and
  // Supplement Facts stay in the info column)
  const tabs: PdpTab[] = [
    ...(p.fullDescription
      ? [
          {
            id: "description",
            label: "Full Description",
            // the whole text, no «See more» (a phone keeps the folded block)
            content: <p>{p.fullDescription}</p>,
          },
        ]
      : []),
    {
      id: "usage",
      label: "How to Use",
      content: <p>{p.howToUse || "Details coming soon."}</p>,
    },
    {
      id: "manufacturing",
      label: "Manufacturing details",
      content: <ManufacturingDetails data={p.manufacturing} />,
    },
  ];

  return (
    <FriendPdpLang slug={slug}>
      <div className={`appShell ${grid.column}`}>
        <main className={shop.page} data-analytics-location="product_card">
          <TrackViewItem coralId={p.coralId} />

          <div className={`${shop.imageControls} ${controls.controls}`}>
            <BackButton className={shop.circleBtn} fallbackHref="/friend/" />
            <ShareButton className={shop.circleBtn} title={p.name} />
          </div>

          <Section tone="surface">
            <div className={`${styles.wide} ${grid.wide}`}>
              <div className={`${shop.layout} ${styles.layout}`}>
                <div className={tabsCss.mediaCol}>
                  <LandingGallery
                    images={p.images}
                    title={p.name}
                    fit="contain"
                  />

                  {/* web: the details as tabs under the picture, then the key
                    elements, the supplement facts and the notice */}
                  <div className={tabsCss.webCol}>
                    <PdpTabs tabs={tabs} />
                    {p.elements.length > 0 && (
                      <PeriodicElements items={p.elements} />
                    )}
                    <PdpFacts slug={slug} headingId="pdp-facts-web" />
                    {disclaimer}
                  </div>
                </div>

                <Stack gap="base" className={shop.infoCol}>
                  <div className={shop.headGroup}>
                    <Heading className={`${shop.name} ${styles.pdpTitle}`}>
                      {title}
                    </Heading>

                    <BodyLong>{p.lead}</BodyLong>

                    {/* in a div of its own: the shop's «badge row sits further from the
                      text» rule (24px) is for a bare list, here title · text · tags
                      · price keep the same 16px */}
                    {p.dietaryBadges.length > 0 && (
                      <div>
                        <DietaryBadges items={p.dietaryBadges} />
                      </div>
                    )}

                    <div id="pdp-buy">
                      <FriendBuyBox
                        href={href}
                        product={{
                          coralId: p.coralId,
                          slug,
                          name: title,
                          image: p.images[0]?.src,
                        }}
                      />
                    </div>

                    <PdpSubscribe />

                    <PdpDelivery />

                    {/* a phone keeps the key elements here; on the web they are under the tabs */}
                    {p.elements.length > 0 && (
                      <div
                        className={`${tabsCss.mobileOnly} ${tabsCss.keyEls}`}
                      >
                        <PeriodicElements items={p.elements} />
                      </div>
                    )}
                  </div>

                  {/* a phone keeps How to Use and Manufacturing as folded rows */}
                  <div className={tabsCss.mobileOnly}>
                    <InfoAccordion items={[howToUse, manufacturing]} />
                  </div>

                  <div className={tabsCss.mobileOnly}>
                    <PdpFacts slug={slug} />
                  </div>

                  {p.fullDescription && (
                    <div className={tabsCss.mobileOnly}>
                      <FullDescription text={p.fullDescription} />
                    </div>
                  )}

                  <div className={tabsCss.mobileOnly}>{disclaimer}</div>
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
        </main>
      </div>
    </FriendPdpLang>
  );
}
