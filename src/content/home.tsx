/**
 * Per-phase homepage content. Switching the phase in <PhasesSection> swaps
 * the whole page from HOME_CONTENT[phase] (see components/organisms/HomeView).
 *
 * `hydration` is the live content. `restart` and `personalization` are
 * scaffolded — same values as hydration — so the mechanism works end to end;
 * edit the TODO(copy) blocks below to give each phase its own story.
 */
import { asset } from "@/lib/asset";
import type { PhaseId } from "@/lib/phase";

export type HeroContent = {
  title: { lead: string; accent: string };
  body: string[];
  cta: { label: string; href: string };
  image: { src: string; alt: string };
};

export type EditorialItem = {
  kind: "editorial";
  title: { lead: string; accent: string };
  image: { src: string; alt: string };
  body: string[];
  badge?: { flag: string; text: string };
};

export type SeriesItem = { kind: "series"; id: string };

export type HomeSection = EditorialItem | SeriesItem;

export type ReelsContent = {
  title: { lead: string; accent: string };
  body: string;
  reels: { src: string; alt: string }[];
};

export type HomePhase = {
  hero: HeroContent;
  sections: HomeSection[];
  reels: ReelsContent;
};

/* Shared clip list — same reels for every phase, only the heading/body vary. */
const REELS = [
  { src: asset("/reels/reel1.mp4"), alt: "Coral Club member sharing her morning hydration routine" },
  { src: asset("/reels/reel2.mp4"), alt: "Member talking about how the Restart programme felt" },
  { src: asset("/reels/reel3.mp4"), alt: "Before-and-after story from a long-time member" },
  { src: asset("/reels/reel4.mp4"), alt: "Member showing the products she keeps on her counter" },
  { src: asset("/reels/reel5.mp4"), alt: "Ambassador explaining why she recommends Coral Club" },
];

const HYDRATION: HomePhase = {
  hero: {
    title: { lead: "Your health starts", accent: "with water" },
    body: [
      "Hydration is step one of your Coral Club routine — the phase everything else builds on.",
    ],
    cta: { label: "Build my set", href: "/quiz" },
    image: {
      src: `${asset("/images/hero-hydration.png")}?v=2`,
      alt: "Coral-Mine Silver sachet beside a glass of mineralized water",
    },
  },
  sections: [
    {
      kind: "editorial",
      title: {
        lead: "You Are 90% Water.",
        accent: "Everything Else Depends On It.",
      },
      image: {
        src: `${asset("/images/you-are-90-water.png")}?v=2`,
        alt: "Woman drinking a glass of water",
      },
      body: [
        "Most supplements skip the first step of your routine: the water you drink every day.",
        "You can take the best supplements, but if you're dehydrated, your body doesn't actually use them. That's why Coral Club starts with what matters first: the water you drink daily. Everything else builds on top of that.",
      ],
    },
    { kind: "series", id: "liumi" },
    {
      kind: "editorial",
      title: {
        lead: "Minerals from the Japan islands",
        accent: "where people live to 100",
      },
      image: {
        src: `${asset("/images/minerals-japan.png")}?v=1`,
        alt: "Sango fossil coral off the coast of Okinawa",
      },
      badge: { flag: "🇯🇵", text: "Okinawa, Japan" },
      body: [
        "Off the coast of Okinawa, one of the planet's five Blue Zones, lies Sango fossil coral, naturally rich in calcium, magnesium and 70+ trace minerals.",
      ],
    },
    { kind: "series", id: "privilege" },
  ],
  reels: {
    title: { lead: "The proof isn't on the label.", accent: "It's in the community." },
    body: "Real members, real routines. Most people start Coral Club because someone they already trust did first.",
    reels: REELS,
  },
};

// TODO(copy): Restart-specific hero + sections. Placeholder = Hydration content.
const RESTART: HomePhase = HYDRATION;

// TODO(copy): Personalization-specific hero + sections. Placeholder = Hydration content.
const PERSONALIZATION: HomePhase = HYDRATION;

export const HOME_CONTENT: Record<PhaseId, HomePhase> = {
  hydration: HYDRATION,
  restart: RESTART,
  personalization: PERSONALIZATION,
};
