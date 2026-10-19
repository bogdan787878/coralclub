import type { Metadata } from "next";
import { ConsultationPage } from "@/components/landing/ConsultationPage";

/** A link of its own to the consultation form — for ads, QR codes and
 *  messengers, where the landing's pop-up is not reachable. */
export const metadata: Metadata = {
  title: "Консультация нутрициолога — Coral Club",
  robots: { index: false, follow: false },
};

export default function LandingConsultationPage() {
  return <ConsultationPage />;
}
