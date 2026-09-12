"use client";

import { useRouter } from "next/navigation";
import { ChevronLeft } from "@/components/account/icons";

/** Round back control floating over the PDP image. Goes back, or home. */
export function BackButton({ className }: { className?: string }) {
  const router = useRouter();

  const goBack = () => {
    if (typeof window !== "undefined" && window.history.length > 1) {
      router.back();
    } else {
      router.push("/");
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
