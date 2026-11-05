import type { Metadata, Viewport } from "next";
import { Analytics } from "@/components/landing/Analytics";
import "./globals.css";

// Root layout of the coralclub.ru build (DEPLOY_TARGET=coralclub): the
// "Система красоты" landing alone. Same as layout.tsx + the analytics runtime
// that app/landing/layout.tsx adds for the GitHub Pages build.
export const metadata: Metadata = {
  title: "Ваша система красоты — Coral Club",
  description:
    "Всё для красоты кожи в одной системе от Coral Club: коллаген, гидратация и маски.",
  robots: { index: false, follow: false },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

export default function LabspaceLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ru">
      <body>
        {children}
        <Analytics />
      </body>
    </html>
  );
}
