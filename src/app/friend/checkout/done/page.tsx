import type { Metadata } from "next";
import { Suspense } from "react";
import { FriendDone } from "@/components/friend/FriendDone";

export const metadata: Metadata = {
  title: "Thank you — Coral Club",
  robots: { index: false, follow: false },
};

export default function FriendDonePage() {
  return (
    <Suspense>
      <FriendDone />
    </Suspense>
  );
}
