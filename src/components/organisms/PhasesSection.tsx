"use client";

import { useState } from "react";
import { Accent, Container, Section } from "@/components/ui";
import { addItem, setQty, useCart } from "@/lib/cart";
import { productHref } from "@/lib/catalog";
import { usePhase, type PhaseId } from "@/lib/phase";
import { Carousel } from "./Carousel";
import { DomainCarousel } from "./DomainCarousel";
import { PhaseSwitcher } from "./PhaseSwitcher";
import { ProductCard } from "./ProductCard";
import { SeriesFeature } from "./SeriesFeature";
import type {
  DomainContent,
  PhaseProductCard,
  PhaseView,
  Product,
} from "@/lib/products";
import styles from "./PhasesSection.module.css";

export type PhasesSectionProps = {
  phases: PhaseView[];
  domains: DomainContent[];
  /** Resolved product cards per personalization domain (keyed by domain id). */
  domainCards: Record<string, PhaseProductCard[]>;
  /** The product spotlighted under the Personalization carousel. */
  featureProduct: Product | null;
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
  featureProduct,
}: PhasesSectionProps) {
  const { phase: activeId, setPhase } = usePhase();
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
                price: p.priceWas,
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
    <Section tone="surface">
      <div className={styles.inner}>
        <Container>
          <PhaseSwitcher
            phases={phases}
            value={phase.id}
            onChange={(id) => setPhase(id as PhaseId)}
          />
        </Container>

        {isPersonalization && domain && (
          <DomainCarousel
            domains={domains}
            value={domain.id}
            onChange={setDomainId}
          />
        )}

        {isPersonalization && domain ? (
          <Carousel
            key={domain.id}
            label={`Personalization — ${domain.label}`}
            title={
              <>
                Your route for <Accent>{domain.label.toLowerCase()}</Accent>
              </>
            }
          >
            {cards.map(renderCard)}
          </Carousel>
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
        )}

        {!isPersonalization && phase.seriesProduct && (
          <SeriesFeature seriesName={phase.name} product={phase.seriesProduct} />
        )}

        {isPersonalization && featureProduct && (
          <SeriesFeature
            seriesName="B-Luron"
            heading="The B-Luron Course"
            product={featureProduct}
          />
        )}
      </div>
    </Section>
  );
}
