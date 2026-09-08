"use client";

import { useState } from "react";
import { Accent, Container, Section } from "@/components/ui";
import { addItem, setQty, useCart } from "@/lib/cart";
import { Carousel } from "./Carousel";
import { DomainCarousel } from "./DomainCarousel";
import { PhaseSwitcher } from "./PhaseSwitcher";
import { ProductCard } from "./ProductCard";
import type { DomainContent, PhaseView } from "@/lib/products";
import { domainProductHref, productHref } from "@/lib/products";
import styles from "./PhasesSection.module.css";

export type PhasesSectionProps = {
  phases: PhaseView[];
  domains: DomainContent[];
};

/**
 * PhasesSection — the phase switcher plus a carousel that swaps its products
 * and colour theme with the selected Health Concept phase. On the
 * Personalization phase a row of abstract domain shapes appears; picking one
 * swaps the product carousel to that domain's set.
 */
export function PhasesSection({ phases, domains }: PhasesSectionProps) {
  const [activeId, setActiveId] = useState(phases[0]?.id);
  const [domainId, setDomainId] = useState(domains[0]?.id);
  const phase = phases.find((p) => p.id === activeId) ?? phases[0];
  const isPersonalization = phase.id === "personalization";
  const domain = domains.find((d) => d.id === domainId) ?? domains[0];

  const cart = useCart();
  const qtyOf = (coralId?: string) =>
    coralId ? (cart.find((l) => l.coralId === coralId)?.qty ?? 0) : 0;

  return (
    <div className={styles.themed} data-phase={phase.id}>
      <Section tone="surface">
        <div className={styles.inner}>
          <Container>
            <PhaseSwitcher
              phases={phases}
              value={phase.id}
              onChange={(id) => setActiveId(id as PhaseView["id"])}
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
                  Your route for{" "}
                  <Accent>{domain.label.toLowerCase()}</Accent>
                </>
              }
            >
              {domain.products.map((ref) => {
                const link = domainProductHref(ref);
                return (
                  <ProductCard
                    key={ref.slug}
                    title={ref.name}
                    category={ref.category}
                    price={ref.price}
                    priceWas={ref.clubPrice}
                    href={link.href}
                    images={[]}
                  />
                );
              })}
            </Carousel>
          ) : (
            <Carousel
              label={`Phase ${phase.index} — ${phase.name}`}
              title={
                <>
                  {phase.headline.lead}{" "}
                  <Accent>{phase.headline.accent}</Accent>
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
                            price: p.price,
                            image: p.images[0]?.src,
                          })
                      : undefined
                  }
                  cartQty={qtyOf(p.coralId)}
                  onSetQty={
                    p.coralId
                      ? (n) => setQty(p.coralId as string, n)
                      : undefined
                  }
                  images={p.images}
                />
              ))}
            </Carousel>
          )}
        </div>
      </Section>
    </div>
  );
}
