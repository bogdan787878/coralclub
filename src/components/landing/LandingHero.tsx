"use client";

import { useState } from "react";
import { Accent } from "@/components/ui";
import { HeroCarousel, PhaseSwitcherPills } from "@/components/organisms";
import { useLeadModal } from "./LeadModal";
import styles from "./LandingHero.module.css";

export type LandingHeroSlide = {
  id: string;
  /** Switcher label, e.g. "Маски". */
  name: string;
  image: { desktopSrc: string; mobileSrc: string; alt: string };
};

/**
 * LandingHero — the shop's own hero: full-bleed photo with the progressive
 * blur at the top, white copy, a white CTA, swipeable slides with dots, and
 * the glass pill switcher straddling the seam under it. The CTA opens the
 * consultation form.
 */
export function LandingHero({ slides }: { slides: LandingHeroSlide[] }) {
  const [active, setActive] = useState(0);
  const { open } = useLeadModal();

  return (
    <>
      <HeroCarousel
        activeIndex={active}
        onSelect={setActive}
        labels={{ dots: "Слайды", dot: (n) => `Слайд ${n}` }}
        slides={slides.map((s) => ({
          title: (
            <>
              Ваша <Accent>система красоты</Accent>
            </>
          ),
          body: (
            <p>
              Уход изнутри и снаружи в одной системе от Coral Club: коллаген,
              гидратация и маски для естественного сияния кожи.
            </p>
          ),
          image: s.image,
          cta: {
            label: "Записаться на консультацию",
            onClick: () => open("hero"),
          },
        }))}
      />

      {/* a direct child of <main> so the sticky pill has room to stay stuck */}
      <div className={styles.switcher}>
        <PhaseSwitcherPills
          phases={slides.map((s) => ({ id: s.id, name: s.name }))}
          value={slides[active]?.id ?? slides[0].id}
          onChange={(id) => {
            const i = slides.findIndex((s) => s.id === id);
            if (i >= 0) setActive(i);
          }}
          label="Выберите раздел"
        />
      </div>
    </>
  );
}
