import type { Metadata } from "next";
import { LandingCheckout } from "@/components/landing/LandingCheckout";

export const metadata: Metadata = {
  title: "Оформление заказа — Coral Club",
  robots: { index: false, follow: false },
};

export default function LandingCheckoutPage() {
  return <LandingCheckout />;
}
