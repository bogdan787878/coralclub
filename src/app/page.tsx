import { Accent } from "@/components/ui";
import {
  FeaturedSeries,
  Hero,
  PhasesSection,
  SiteHeader,
} from "@/components/organisms";
import { getPhases } from "@/lib/products";
import { asset } from "@/lib/asset";

const HERO_IMAGE = {
  src: asset("/images/hero-hydration.png"),
  alt: "Coral-Mine Silver sachet beside a glass of mineralized water",
};

const HYDRATION_SERIES = {
  title: { lead: "The Hydration Series.", accent: "Step by Step" },
  feature: {
    src: asset("/images/hydration-series-feature.png"),
    alt: "Hydramax Plus — 30-day hydration set on a bright desk",
  },
  items: [
    { alt: "Hydration Series item" },
    { alt: "Hydration Series item" },
  ],
  cta: { label: "Shop", href: "#shop" },
};

export default function Home() {
  const phases = getPhases();

  return (
    <main>
      <SiteHeader />

      <Hero
        title={
          <>
            Your health starts
            <br />
            <Accent>with water</Accent>
          </>
        }
        body="Hydration is step one of your Coral Club routine — the phase everything else builds on."
        image={HERO_IMAGE}
        cta={{ label: "Learn about hydration", href: "#phases" }}
      />

      <div id="phases">
        <PhasesSection phases={phases} />
      </div>

      <FeaturedSeries {...HYDRATION_SERIES} />
    </main>
  );
}
