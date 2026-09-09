"use client";

import { useState } from "react";
import { ShareIcon } from "@/components/cart/icons";

/**
 * ShareButton — round control floating over the PDP image, left of the cart.
 * Uses the native share sheet where available; otherwise copies the page URL
 * to the clipboard and flips the label to "Link copied" for a moment.
 */
export function ShareButton({
  className,
  title,
}: {
  className?: string;
  title?: string;
}) {
  const [copied, setCopied] = useState(false);

  const onShare = async () => {
    if (typeof window === "undefined") return;
    const url = window.location.href;

    if (typeof navigator !== "undefined" && navigator.share) {
      try {
        await navigator.share({ title: title ?? document.title, url });
      } catch {
        /* user dismissed the share sheet — nothing to do */
      }
      return;
    }

    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1500);
    } catch {
      /* clipboard blocked — no-op */
    }
  };

  return (
    <button
      type="button"
      className={className}
      onClick={onShare}
      aria-label={copied ? "Link copied" : "Share"}
    >
      <ShareIcon />
    </button>
  );
}
