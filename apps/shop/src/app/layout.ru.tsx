import type { Metadata, Viewport } from "next";
import RuLayout from "./ru/layout";
import "./globals.css";

// Корневой layout отдельной сборки магазина России (DEPLOY_TARGET=ru): в сборке только страницы *.ru.tsx —
// главная, товар, корзина, вход и оформление — в корне сайта. Сами страницы те же, что /ru в общем сайте.
export const metadata: Metadata = {
  title: "Coral Club — магазин",
  description: "Система здоровья Coral Club: гидратация, красота и баланс.",
  robots: { index: false, follow: false },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

export default function RuRootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ru">
      <body>
        <RuLayout>{children}</RuLayout>
      </body>
    </html>
  );
}
