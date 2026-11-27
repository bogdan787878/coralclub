import type { Metadata } from "next";
import { RuCatalog } from "@/components/ru/RuCatalog";

export const metadata: Metadata = { title: "Каталог — Coral Club", robots: { index: false, follow: false } };

/** Каталог магазина России: домены здоровья, фильтры и товары (см. components/ru/RuCatalog). */
export default function Page() {
  return (
    <div className="appShell">
      <RuCatalog />
    </div>
  );
}
