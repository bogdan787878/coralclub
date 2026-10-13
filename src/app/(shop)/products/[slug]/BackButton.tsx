"use client";

import { useRouter } from "next/navigation";
import { ChevronLeft } from "@/components/account/icons";

/** Round back control floating over the PDP image. Goes back, or home. */
export function BackButton({
  className,
  fallbackHref = "/",
}: {
  className?: string;
  /** Where to go when there is no history to go back to. */
  fallbackHref?: string;
}) {
  const router = useRouter();

  const goBack = () => {
    if (typeof window !== "undefined" && window.history.length > 1) {
      router.back();
    } else {
      router.push(fallbackHref);
    }
  };

  return (
    <button
      type="button"
      className={className}
      onClick={goBack}
      aria-label="Back"
    >
      <ChevronLeft />
    </button>
  );
}
