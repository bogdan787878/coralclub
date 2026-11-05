import type { Metadata } from "next";
import { Suspense } from "react";
import { FriendPayment } from "@/components/friend/FriendPayment";

export const metadata: Metadata = {
  title: "Payment — Coral Club",
  robots: { index: false, follow: false },
};

export default function FriendPaymentPage() {
  return (
    <Suspense>
      <FriendPayment />
    </Suspense>
  );
}
