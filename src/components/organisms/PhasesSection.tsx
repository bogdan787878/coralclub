"use client";

import { useState } from "react";
import { Accent, Container, Section } from "@/components/ui";
import { Carousel } from "./Carousel";
import { PhaseSwitcher } from "./PhaseSwitcher";
import { ProductCard } from "./ProductCard";
import type { PhaseView } from "@/lib/products";
import { productHref } from "@/lib/products";
import styles from "./PhasesSection.module.css";

export type PhasesSectionProps = {
  phases: PhaseView[];
};

/**
 * PhasesSection — the phase switcher plus a carousel that swaps its products
 * and colour theme with the selected Health Concept phase.
 */
export function PhasesSection({ phases }: PhasesSectionProps) {
  const [activeId, setActiveId] = useState(phases[0]?.id);
  const phase = phases.find((p) => p.id === activeId) ?? phases[0];

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
                title={p.title}
                price={p.price}
                href={productHref(p.slug)}
                image={
                  p.image
                    ? { src: p.image, alt: p.name, position: p.imagePosition }
                    : undefined
                }
                cta={{ label: "Shop" }}
              />
            ))}
          </Carousel>
        </div>
      </Section>
    </div>
  );
}
