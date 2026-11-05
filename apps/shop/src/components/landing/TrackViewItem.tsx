"use client";

import { useEffect } from "react";
import { track, trackOnce } from "@/lib/analytics";
import { CURRENCY, itemFor } from "@/lib/analyticsRu";

/** Reports "view_item" when a product page is opened (renders nothing). */
export function TrackViewItem({ coralId }: { coralId: string }) {
  useEffect(() => {
    const item = itemFor(coralId);
    if (!item) return;
    trackOnce(`view_item:${coralId}:${window.location.pathname}`, () =>
      track(
        "view_item",
        {},
        { currency: CURRENCY, value: item.price, items: [item] },
      ),
    );
  }, [coralId]);
  return null;
}
