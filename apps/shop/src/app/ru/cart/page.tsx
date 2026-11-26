import type { Metadata } from "next";
import { RuCart } from "@/components/ru/RuCart";

export const metadata: Metadata = { title: "Корзина — Coral Club", robots: { index: false, follow: false } };

export default function Page() {
  return <RuCart />;
}
