import type { Metadata } from "next";
import { AdvisoryBoard, SiteFooter, SiteHeader, TabBar } from "@/components/organisms";
import { AltHero } from "@/components/alt/AltHero";
import { TrustBlock } from "@/components/alt/TrustBlock";
import { Bestsellers } from "@/components/alt/Bestsellers";
import { InstagramStories } from "@/components/alt/InstagramStories";
import { HOME_CONTENT } from "@/content/home";
import { asset } from "@/lib/asset";
import { PRODUCTS, getSeries, productHref, shortCategory } from "@/lib/products";

export const metadata: Metadata = {
  title: "Coral Club — Hydration, rebuilt",
  description: "An alternative homepage exploring the market's catch-up patterns.",
};

const REELS = [
  { src: asset("/reels/reel1.mp4"), alt: "Coral Club member sharing her morning hydration routine", label: "Morning routine" },
  { src: asset("/reels/reel2.mp4"), alt: "Member talking about how the Restart programme felt", label: "The Restart" },
  { src: asset("/reels/reel3.mp4"), alt: "Before-and-after story from a long-time member", label: "Before & after" },
  { src: asset("/reels/reel4.mp4"), alt: "Member showing the products she keeps on her counter", label: "My counter" },
  { src: asset("/reels/reel5.mp4"), alt: "Ambassador explaining why she recommends Coral Club", label: "Why I recommend" },
];

export default function AltHome() {
  const heroImage = HOME_CONTENT.hydration.hero.image;
  const bestsellers = PRODUCTS.filter((p) => p.topSeller).slice(0, 4);
  const privilege = getSeries("privilege");

  return (
    <main>
      <SiteHeader />

      <AltHero
        kicker="Hydration, rebuilt"
        title="Hydration your body actually uses."
        body="Most supplements skip the first step: the water you drink every day. Coral Club starts there — minerals your cells can absorb, not just swallow."
        cta={{ label: "Build my set", href: "/quiz" }}
        secondaryCta={{ label: "Shop bestsellers", href: "/alt/catalog" }}
        image={{ src: heroImage.mobileSrc || heroImage.desktopSrc, alt: heroImage.alt }}
      />

      <TrustBlock
        title="You shouldn't have to guess if a supplement brand is legit."
        body="Wellness is full of vague claims and MLM language that make it hard to tell who's actually behind a product. We publish exactly what's inside, who formulated it, and why — so you can check the work instead of taking our word for it."
        pillars={[
          { title: "Real people, named", body: "Every formula is signed off by our Scientific Advisory Board — not an anonymous team." },
          { title: "Ingredients you can pronounce", body: "Clinically dosed minerals and actives, listed in full on every product page." },
          { title: "No pressure to join anything", body: "Buy a product. That's the whole transaction — no recruitment, no structure." },
          { title: "A phase for where you are", body: "Hydration, Restart or Personalisation — one clear next step, not fifty SKUs." },
        ]}
      />

      {bestsellers.length > 0 && privilege && (
        <Bestsellers
          title="What we're known for"
          viewAllHref="/alt/catalog"
          products={bestsellers.map((p) => ({
            slug: p.slug,
            name: p.name,
            headline: p.headline,
            category: shortCategory(p.category),
            price: p.prices[0].price,
            priceWas: p.prices[1].price,
            coralId: p.coralId,
            cartHref: p.prices[1].cta.href,
            goals: p.goals,
            images: p.carouselImages.map((src) => ({ src: asset(src), alt: p.name })),
          }))}
          spotlight={{
            kicker: "Key pack",
            title: privilege.titleLead || "Privilege",
            blurb: privilege.blurb || "",
            image: { src: privilege.images[0], alt: privilege.titleLead || "Privilege" },
            cta: { label: "Shop the set", href: productHref("privilege-milk-cleanser") },
          }}
        />
      )}

      <AdvisoryBoard
        title={{ lead: "Backed by a", accent: "Scientific Advisory Board" }}
        members={[
          {
            name: "Michael Lila",
            credentials: "PhD, MS",
            photo: { src: `${asset("/images/advisors/michael-lila.png")}?v=1`, alt: "Portrait of Dr. Michael Lila" },
          },
          {
            name: "Ralph Jager",
            credentials: "PhD, MBA, FISSN",
            photo: { src: `${asset("/images/advisors/ralph-jager.png")}?v=1`, alt: "Portrait of Dr. Ralph Jager" },
          },
          {
            name: "Tori Parker",
            credentials: "PhD, MS",
            photo: { src: `${asset("/images/advisors/tori-parker.png")}?v=1`, alt: "Portrait of Dr. Tori Parker" },
          },
        ]}
      />

      <InstagramStories
        title="From the community"
        body="Real members, real routines — tap a story to watch."
        stories={REELS}
      />

      <SiteFooter />
      <TabBar />
    </main>
  );
}
