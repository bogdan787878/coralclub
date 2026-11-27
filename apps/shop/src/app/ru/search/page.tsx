import type { Metadata } from "next";
import { RuSearch } from "@/components/ru/RuSearch";

export const metadata: Metadata = { title: "Поиск — Coral Club", robots: { index: false, follow: false } };

/** Поиск магазина России (см. components/ru/RuSearch, движок — @coral/search). */
export default function Page() {
  return (
    <div className="appShell">
      <RuSearch />
    </div>
  );
}
