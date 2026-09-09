import { HomeView } from "@/components/organisms";
import { HOME_CONTENT, type SeriesItem } from "@/content/home";
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

  // resolve every series id any phase references, once, on the server
  const seriesIds = [
    ...new Set(
      Object.values(HOME_CONTENT)
        .flatMap((p) => p.sections)
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
      featureProduct={featureProduct}
      seriesById={seriesById}
    />
  );
}
