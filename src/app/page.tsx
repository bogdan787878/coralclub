import { Accent } from "@/components/ui";
import {
  Editorial,
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
        body={
          <>
            Hydration is step one of your Coral Club <br />
            routine — the phase everything else builds on.
          </>
        }
        image={HERO_IMAGE}
        cta={{ label: "Learn about hydration", href: "#phases" }}
      />

      <Editorial
        title={{
          lead: "You Are 90% Water.",
          accent: "Everything Else Depends On It.",
        }}
        image={{
          src: asset("/images/core-idea.png"),
          alt: "Woman drinking a glass of water",
          position: "38% 50%",
        }}
        body={
          <>
            <p>
              Most supplements skip the first step of your routine: the water you
              drink every day.
            </p>
            <p>
              You can take the best supplements, but if you&apos;re dehydrated,
              your body doesn&apos;t actually use them. That&apos;s why Coral Club
              starts with what matters first: the water you drink daily.
              Everything else builds on top of that.
            </p>
          </>
        }
      />

      <div id="phases">
        <PhasesSection phases={phases} />
      </div>

      <FeaturedSeries {...HYDRATION_SERIES} />
    </main>
  );
}
