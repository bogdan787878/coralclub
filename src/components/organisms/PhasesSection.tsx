"use client";

import { useState } from "react";
import { Accent, Container, Section } from "@/components/ui";
import { addItem, setQty, useCart } from "@/lib/cart";
import { usePhase, type PhaseId } from "@/lib/phase";
import { Carousel } from "./Carousel";
import { DomainCarousel } from "./DomainCarousel";
import { PhaseSwitcher } from "./PhaseSwitcher";
import { ProductCard } from "./ProductCard";
import { SeriesFeature } from "./SeriesFeature";
import type { DomainContent, PhaseView, Product } from "@/lib/products";
import { getProduct, productHref, shortCategory } from "@/lib/products";
import styles from "./PhasesSection.module.css";

export type PhasesSectionProps = {
  phases: PhaseView[];
  domains: DomainContent[];
};

/**
 * PhasesSection — the phase switcher plus a carousel that swaps its products
 * with the selected Health Concept phase. On the Personalization phase a row
 * of abstract domain shapes appears; picking one swaps the product carousel
 * to that domain's set.
 */
export function PhasesSection({ phases, domains }: PhasesSectionProps) {
  const { phase: activeId, setPhase } = usePhase();
  const [domainId, setDomainId] = useState(domains[0]?.id);
  const phase = phases.find((p) => p.id === activeId) ?? phases[0];
  const isPersonalization = phase.id === "personalization";
  const domain = domains.find((d) => d.id === domainId) ?? domains[0];

  const cart = useCart();
  const qtyOf = (coralId?: string) =>
    coralId ? (cart.find((l) => l.coralId === coralId)?.qty ?? 0) : 0;

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
            {domain.products
              .map((slug) => getProduct(slug))
              .filter((p): p is Product => Boolean(p))
              .map((p) => (
                <ProductCard
                  key={p.slug}
                  title={p.headline}
                  category={shortCategory(p.category)}
                  price={p.prices[0].price}
                  priceWas={p.prices[1].price}
                  href={productHref(p.slug)}
                  cartHref={p.prices[1].cta.href}
                  onAddToCart={
                    p.coralId
                      ? () =>
                          addItem({
                            coralId: p.coralId as string,
                            slug: p.slug,
                            name: p.name,
                            price: p.prices[1].price,
                            image: p.carouselImages[0],
                          })
                      : undefined
                  }
                  cartQty={qtyOf(p.coralId)}
                  onSetQty={
                    p.coralId
                      ? (n) => setQty(p.coralId as string, n)
                      : undefined
                  }
                  images={p.carouselImages.map((src) => ({
                    src,
                    alt: p.name,
                  }))}
                />
              ))}
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
            {phase.products.map((p) => (
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
                onSetQty={
                  p.coralId ? (n) => setQty(p.coralId as string, n) : undefined
                }
                images={p.images}
              />
            ))}
          </Carousel>
        )}

        {!isPersonalization &&
          (() => {
            const rep = getProduct(
              phase.seriesSlug ?? phase.products[0]?.slug ?? "",
            );
            return rep ? (
              <SeriesFeature seriesName={phase.name} product={rep} />
            ) : null;
          })()}
      </div>
    </Section>
  );
}
