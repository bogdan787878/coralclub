import type { Metadata } from "next";
import { RuCheckout } from "@/components/ru/RuCheckout";

export const metadata: Metadata = { title: "Оформление заказа — Coral Club", robots: { index: false, follow: false } };

export default function Page() {
  return <RuCheckout />;
}
