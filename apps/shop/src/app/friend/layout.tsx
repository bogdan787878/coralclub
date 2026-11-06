import { Analytics } from "@/components/landing/Analytics";
import { FriendLayout as SharedLayout } from "@/components/friend/FriendLayout";
import { FriendProvider } from "@/components/friend/FriendProvider";
import grid from "@/components/friend/FriendGrid.module.css";

/**
 * Everything under /friend: who invited the visitor, the product's shared Layout (header and menu, the cart is
 * its own page /friend/cart/) and the analytics runtime.
 */
export default function FriendLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <FriendProvider>
      <div className={`appShell ${grid.edge}`}>
        <SharedLayout />
        {children}
      </div>
      <Analytics />
    </FriendProvider>
  );
}
