import { Accent } from "@/components/ui";
import {
  CommunityReels,
  Editorial,
  Hero,
  PhasesSection,
  SeriesShowcase,
  SiteHeader,
} from "@/components/organisms";
import { getDomains, getPhases, getSeries } from "@/lib/products";
import { asset } from "@/lib/asset";

const HERO_IMAGE = {
  // ?v bump = cache-bust when the file is swapped in place
  src: `${asset("/images/hero-hydration.png")}?v=2`,
  alt: "Coral-Mine Silver sachet beside a glass of mineralized water",
};

const COMMUNITY_REELS = [
  { src: asset("/reels/reel1.mp4"), alt: "Coral Club member sharing her morning hydration routine" },
  { src: asset("/reels/reel2.mp4"), alt: "Member talking about how the Restart programme felt" },
  { src: asset("/reels/reel3.mp4"), alt: "Before-and-after story from a long-time member" },
  { src: asset("/reels/reel4.mp4"), alt: "Member showing the products she keeps on her counter" },
  { src: asset("/reels/reel5.mp4"), alt: "Ambassador explaining why she recommends Coral Club" },
];


export default function Home() {
  const phases = getPhases();
  const domains = getDomains();
  const liumi = getSeries("liumi");
  const privilege = getSeries("privilege");

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
            Hydration is step one of your Coral Club routine — the phase
            everything else builds on.
          </>
        }
        image={HERO_IMAGE}
        cta={{ label: "Build my set", href: "/quiz" }}
      />

      <div id="phases">
        <PhasesSection phases={phases} domains={domains} />
      </div>


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

      {liumi && <SeriesShowcase series={liumi} />}

      {privilege && <SeriesShowcase series={privilege} tone="surface" />}

      <CommunityReels
        title={{
          lead: "The proof isn't on the label.",
          accent: "It's in the community.",
        }}
        body="Real members, real routines. Most people start Coral Club because someone they already trust did first."
        reels={COMMUNITY_REELS}
      />
    </main>
  );
}
