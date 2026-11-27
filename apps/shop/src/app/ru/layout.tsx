import type { Metadata } from "next";
import { RuShell } from "@/components/ru/RuShell";
import grid from "@/components/friend/FriendGrid.module.css";

export const metadata: Metadata = {
  title: "Coral Club — магазин",
  robots: { index: false, follow: false },
};

/**
 * Магазин России: общий Layout (шапка и нижнее меню), вход участника, корзина, оформление.
 * Аналитика лендингов (components/landing/Analytics) здесь не подключена: на /ru она ничего не отправляет, а в
 * бандл тянет каталоги «Друга клуба» и лендинга. Аналитику магазина подключить отдельно.
 */
export default function RuLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <div className={`appShell ${grid.edge}`}>
        <RuShell>{children}</RuShell>
      </div>
    </>
  );
}
