"use client";

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
