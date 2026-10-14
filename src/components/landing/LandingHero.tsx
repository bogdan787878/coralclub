"use client";

import { useState } from "react";
import { Accent } from "@/components/ui";
import { HeroCarousel } from "@/components/organisms";
import { useLeadModal } from "./LeadModal";

export type LandingHeroSlide = {
  id: string;
  /** Name of the slide (not shown while the switcher is off). */
  name: string;
  image: { desktopSrc: string; mobileSrc: string; alt: string };
};

/**
 * LandingHero — the shop's own hero: full-bleed photo with the progressive
 * blur at the top, white copy, a white CTA and swipeable slides with dots.
 * The CTA opens the consultation form.
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
    </>
  );
}
