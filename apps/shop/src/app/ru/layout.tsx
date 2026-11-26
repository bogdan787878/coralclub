import type { Metadata } from "next";
import { Analytics } from "@/components/landing/Analytics";
import { RuShell } from "@/components/ru/RuShell";
import grid from "@/components/friend/FriendGrid.module.css";

export const metadata: Metadata = {
  title: "Coral Club — магазин",
  robots: { index: false, follow: false },
};

/** Новый магазин России: общий Layout (шапка и нижнее меню), вход участника, корзина, оформление. */
export default function RuLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <div className={`appShell ${grid.edge}`}>
        <RuShell>{children}</RuShell>
      </div>
      <Analytics />
    </>
  );
}
