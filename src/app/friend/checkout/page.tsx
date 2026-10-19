import type { Metadata } from "next";
import { FriendCheckout } from "@/components/friend/FriendCheckout";

export const metadata: Metadata = {
  title: "Оформление заказа — Coral Club",
  robots: { index: false, follow: false },
};

export default function FriendCheckoutPage() {
  return <FriendCheckout />;
}
