"use client";

import { useState } from "react";
import { Accent, Section } from "@/components/ui";
import { addItem, setQty, useCart } from "@/lib/cart";
import { productHref } from "@/lib/catalog";
import { usePhase } from "@/lib/phase";
import { Carousel } from "./Carousel";
import { DomainCarousel } from "./DomainCarousel";
import { ProductCard } from "./ProductCard";
import { SeriesFeature } from "./SeriesFeature";
import type {
  DomainContent,
  PhaseProductCard,
  PhaseView,
  SeriesView,
} from "@/lib/products";
import styles from "./PhasesSection.module.css";

export type PhasesSectionProps = {
  phases: PhaseView[];
  domains: DomainContent[];
  /** Resolved product cards per personalization domain (keyed by domain id). */
  domainCards: Record<string, PhaseProductCard[]>;
  /** The pack spotlighted under the Personalization carousel — a bare
   *  heading + product card (content/series/b-luron.json). */
  bLuronPack: SeriesView | null;
};

/**
 * PhasesSection — the phase switcher plus a carousel that swaps its products
 * with the selected Health Concept phase. On the Personalization phase a row
 * of abstract domain shapes appears; picking one swaps the product carousel
 * to that domain's set. All product data is resolved on the server and
 * passed in — this component never imports the catalogue.
 */
export function PhasesSection({
  phases,
  domains,
  domainCards,
  bLuronPack,
}: PhasesSectionProps) {
  const { phase: activeId } = usePhase();
  const [domainId, setDomainId] = useState(domains[0]?.id);
  const phase = phases.find((p) => p.id === activeId) ?? phases[0];
  const isPersonalization = phase.id === "personalization";
  const domain = domains.find((d) => d.id === domainId) ?? domains[0];

  const cart = useCart();
  const qtyOf = (coralId?: string) =>
    coralId ? (cart.find((l) => l.coralId === coralId)?.qty ?? 0) : 0;

  const renderCard = (p: PhaseProductCard) => (
    <ProductCard
      key={p.slug}
      fluid
      title={p.headline}
      category={p.category}
      price={p.price}
      priceWas={p.priceWas}
      href={productHref(p.slug)}
      cartHref={p.cartHref}
      onAddToCart={
        p.coralId
          ? () =>
              addItem({
                coralId: p.coralId as string,
                slug: p.slug,
                name: p.name,
                price: p.price,
                image: p.images[0]?.src,
              })
          : undefined
      }
      cartQty={qtyOf(p.coralId)}
      onSetQty={p.coralId ? (n) => setQty(p.coralId as string, n) : undefined}
      images={p.images}
    />
  );

  const cards =
    isPersonalization && domain ? (domainCards[domain.id] ?? []) : phase.products;

  return (
    <Section tone="surface" className={styles.section}>
      <div className={styles.inner}>
        {isPersonalization && domain && (
          <DomainCarousel
            domains={domains}
            value={domain.id}
            onChange={setDomainId}
          />
        )}

        {isPersonalization && domain && (
          <Carousel
            key={domain.id}
            label={`Personalisation — ${domain.label}`}
            title={
              <>
                Your route for <Accent>{domain.label.toLowerCase()}</Accent>
              </>
            }
          >
            {cards.map(renderCard)}
          </Carousel>
        )}

        {/* Hydration (the only phase with a series block): heading +
            description come from its content/series/*.json entry, above
            the image, and the product carousel moves inside it too (see
            carouselItems) — on desktop that puts text on the left, card +
            carousel on the right. Restart (no series block here — its own
            series render further down the homepage) keeps the heading on
            its own carousel, same as before. */}
        {!isPersonalization &&
          (phase.series ? (
            <SeriesFeature
              seriesName={phase.name}
              product={phase.series.product}
              images={phase.series.images.map((src) => ({
                src,
                alt: phase.series!.titleLead,
              }))}
              blurbTitle={{ lead: phase.series.titleLead, accent: phase.series.titleAccent }}
              blurbBody={phase.series.blurb}
              carouselItems={cards.map(renderCard)}
              tightTop
            />
          ) : (
            <Carousel
              label={phase.name}
              title={
                <>
                  {phase.headline.lead} <Accent>{phase.headline.accent}</Accent>
                </>
              }
            >
              {cards.map(renderCard)}
            </Carousel>
          ))}

        {isPersonalization && bLuronPack?.product && (
          <SeriesFeature
            seriesName={bLuronPack.heading || bLuronPack.id}
            heading={bLuronPack.heading || undefined}
            product={bLuronPack.product}
          />
        )}
      </div>
    </Section>
  );
}
