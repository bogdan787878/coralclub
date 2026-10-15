import type { Metadata } from "next";
import { V2Home } from "@/components/v2/V2Home";
import { HOME_CONTENT } from "@/content/home";
import { getV2Hydration } from "@/lib/v2Hydration";

/** The reworked homepage (one phase, one pack, three-plus-one products).
 *  Not linked from anywhere and kept out of search while it is being tested. */
export const metadata: Metadata = {
  title: "Hydration — Coral Club",
  robots: { index: false, follow: false },
};

export default function HomeV2() {
  const { pack, skus } = getV2Hydration();
  const hydration = HOME_CONTENT.hydration;
  const board = hydration.sections.find((s) => s.kind === "advisory-board");

  return (
    <V2Home
      hero={hydration.hero.image}
      pack={pack}
      skus={skus}
      advisory={{
        title: board?.title ?? {
          lead: "Backed by a",
          accent: "Scientific Advisory Board",
        },
        members: board?.members ?? [],
      }}
    />
  );
}
