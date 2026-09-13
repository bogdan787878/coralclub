import { HomeView } from "@/components/organisms";
import { HOME_CONTENT, type SeriesItem, type SpotlightItem } from "@/content/home";
import {
  getDomainCards,
  getDomains,
  getPhases,
  getProduct,
  getSeries,
} from "@/lib/products";

export default function Home() {
  const phases = getPhases();
  const domains = getDomains();
  const domainCards = getDomainCards();
  const featureProduct = getProduct("b-luron") ?? null;

  const allSections = Object.values(HOME_CONTENT).flatMap((p) => p.sections);

  // resolve every series id any phase references, once, on the server
  const seriesIds = [
    ...new Set(
      allSections
        .filter((s): s is SeriesItem => s.kind === "series")
        .map((s) => s.id),
    ),
  ];
  const seriesById = Object.fromEntries(
    seriesIds.map((id) => [id, getSeries(id) ?? null]),
  );

  // same for single-product spotlight sections (B-Luron-style)
  const spotlightSlugs = [
    ...new Set(
      allSections
        .filter((s): s is SpotlightItem => s.kind === "spotlight")
        .map((s) => s.slug),
    ),
  ];
  const spotlightBySlug = Object.fromEntries(
    spotlightSlugs.map((slug) => [slug, getProduct(slug) ?? null]),
  );

  return (
    <HomeView
      phases={phases}
      domains={domains}
      domainCards={domainCards}
      featureProduct={featureProduct}
      seriesById={seriesById}
      spotlightBySlug={spotlightBySlug}
    />
  );
}
