import type { Metadata } from "next";
import { Suspense } from "react";
import { RuLogin } from "@/components/ru/RuLogin";

export const metadata: Metadata = { title: "Вход — Coral Club", robots: { index: false, follow: false } };

export default function Page() {
  return (
    <Suspense>
      <RuLogin />
    </Suspense>
  );
}
