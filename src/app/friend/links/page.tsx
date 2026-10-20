import type { Metadata } from "next";
import { FriendLinks } from "@/components/friend/FriendLinks";

/** Internal: turns a table of Coral IDs into unique referral links. */
export const metadata: Metadata = {
  title: "Referral links — Friend of the club",
  robots: { index: false, follow: false },
};

export default function FriendLinksPage() {
  return <FriendLinks />;
}
