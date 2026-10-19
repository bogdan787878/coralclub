import { Analytics } from "@/components/landing/Analytics";
import { FriendProvider } from "@/components/friend/FriendProvider";

/** Everything under /friend: who invited the visitor + the analytics runtime. */
export default function FriendLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <FriendProvider>
      {children}
      <Analytics />
    </FriendProvider>
  );
}
