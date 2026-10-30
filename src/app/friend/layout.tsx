import { Analytics } from "@/components/landing/Analytics";
import { FriendCartDrawer } from "@/components/friend/FriendCart";
import { FriendHeader } from "@/components/friend/FriendHeader";
import { FriendProvider } from "@/components/friend/FriendProvider";

/**
 * Everything under /friend: who invited the visitor, the one header of the
 * project (with the cart it opens) and the analytics runtime.
 */
export default function FriendLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <FriendProvider>
      <div className="appShell">
        <FriendHeader />
        {children}
      </div>
      <FriendCartDrawer />
      <Analytics />
    </FriendProvider>
  );
}
