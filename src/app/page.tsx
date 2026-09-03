import { Accent } from "@/components/ui";
import {
  CommunityReels,
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

const COMMUNITY_REELS = [
  { src: asset("/reels/reel1.mp4"), alt: "Coral Club member sharing her morning hydration routine" },
  { src: asset("/reels/reel2.mp4"), alt: "Member talking about how the Restart programme felt" },
  { src: asset("/reels/reel3.mp4"), alt: "Before-and-after story from a long-time member" },
  { src: asset("/reels/reel4.mp4"), alt: "Member showing the products she keeps on her counter" },
  { src: asset("/reels/reel5.mp4"), alt: "Ambassador explaining why she recommends Coral Club" },
];

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
        cta={{ label: "Learn about hydration", href: "/quiz" }}
      />

      <div id="phases">
        <PhasesSection phases={phases} />
      </div>

      <FeaturedSeries {...HYDRATION_SERIES} />

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
