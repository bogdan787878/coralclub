import type { Metadata } from "next";
import { FriendCartPage } from "@/components/friend/FriendCartPage";

export const metadata: Metadata = { title: "Your cart — Coral Club", robots: { index: false, follow: false } };

export default function Page() {
  return <FriendCartPage />;
}
