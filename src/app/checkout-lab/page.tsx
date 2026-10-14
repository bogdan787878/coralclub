import type { Metadata } from "next";
import { CheckoutLab } from "@/components/checkout-lab/CheckoutLab";

export const metadata: Metadata = {
  title: "Checkout lab",
  robots: { index: false, follow: false },
};

export default function CheckoutLabPage() {
  return <CheckoutLab />;
}
