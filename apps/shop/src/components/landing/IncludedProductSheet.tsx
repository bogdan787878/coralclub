"use client";

import { useState, type ReactNode } from "react";
import { IncludedProducts } from "@/components/organisms";
import { Sheet } from "@/components/ui";
import type { IncludedProductCard } from "@/lib/products";

export type IncludedProductDetail = { title: string; content: ReactNode };

/**
 * IncludedProductSheet — the "Состав набора" strip of a set. Tapping a tile
 * opens a bottom sheet (drawer on desktop) with everything about that
 * product — description, components, usage, manufacturing, facts. The
 * details are prepared on the server and passed in; there is deliberately
 * no price and no buy button in the sheet.
 */
export function IncludedProductSheet({
  heading,
  items,
  details,
}: {
  heading: string;
  items: IncludedProductCard[];
  details: Record<string, IncludedProductDetail>;
}) {
  const [slug, setSlug] = useState<string | null>(null);
  const active = slug ? details[slug] : undefined;

  return (
    <>
      <IncludedProducts
        items={items}
        heading={heading}
        onSelect={(s) => details[s] && setSlug(s)}
      />
      <Sheet
        open={Boolean(active)}
        onClose={() => setSlug(null)}
        title={active?.title ?? ""}
        closeLabel="Закрыть"
      >
        {active?.content}
      </Sheet>
    </>
  );
}
