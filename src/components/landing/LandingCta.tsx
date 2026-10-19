"use client";

import { useState } from "react";
import { Button } from "@/components/ui";
import { useLeadModal } from "./LeadModal";

export type LandingCtaProps = {
  source: string;
  children: React.ReactNode;
  variant?: "primary" | "secondary";
  className?: string;
};

/** A CTA that opens the consultation form (see LeadModalProvider). */
export function LandingCta({
  source,
  children,
  variant = "primary",
  className,
}: LandingCtaProps) {
  const { open } = useLeadModal();
  return (
    <Button
      variant={variant}
      className={className}
      data-analytics-id={`consult_cta_${source}`}
      onClick={() => open(source)}
    >
      {children}
    </Button>
  );
}

/** The promo code chip — tap to copy. */
export function PromoCode({
  code,
  className,
  analyticsId = "promo_code_btn",
}: {
  code: string;
  className?: string;
  analyticsId?: string;
}) {
  const [copied, setCopied] = useState(false);
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1800);
    } catch {
      /* clipboard unavailable — the code stays visible to copy by hand */
    }
  };
  return (
    <button
      type="button"
      className={className}
      onClick={copy}
      aria-label={`Скопировать промокод ${code}`}
      data-analytics-id={analyticsId}
    >
      {code}
      <span aria-live="polite">{copied ? " · скопировано" : ""}</span>
    </button>
  );
}
