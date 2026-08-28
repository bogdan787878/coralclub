import { Accent } from "@/components/ui";
import { Hero, PhasesSection, SiteHeader } from "@/components/organisms";
import { getPhases } from "@/lib/products";
import { asset } from "@/lib/asset";

const HERO_IMAGE = {
  src: asset("/images/hero-hydration.png"),
  alt: "Coral-Mine Silver sachet beside a glass of mineralized water",
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
    </main>
  );
}
