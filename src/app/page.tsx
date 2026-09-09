import { HomeView } from "@/components/organisms";
import { HOME_CONTENT, type SeriesItem } from "@/content/home";
import { getDomains, getPhases, getSeries } from "@/lib/products";

export default function Home() {
  const phases = getPhases();
  const domains = getDomains();

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
    <HomeView phases={phases} domains={domains} seriesById={seriesById} />
  );
}
