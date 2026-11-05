import { HomeView } from "@/components/organisms";
import { HOME_CONTENT, type SeriesItem } from "@/content/home";
import { getDomainCards, getDomains, getPhases, getSeries } from "@/lib/products";

export default function Home() {
  const phases = getPhases();
  const domains = getDomains();
  const domainCards = getDomainCards();
  // Personalization's own single-product spotlight, shown under its
  // product carousel — a "pack" like any other (content/series/b-luron.json).
  const bLuronPack = getSeries("b-luron") ?? null;

  const allSections = Object.values(HOME_CONTENT).flatMap((p) => p.sections);

  // resolve every series/pack id any phase references, once, on the server
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

  return (
    <HomeView
      phases={phases}
      domains={domains}
      domainCards={domainCards}
      bLuronPack={bLuronPack}
      seriesById={seriesById}
    />
  );
}
