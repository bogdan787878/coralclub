import type { Metadata, Viewport } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Coral Club",
  description: "Coral Club — wellness store & content",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  // lets env(safe-area-inset-*) resolve to real values — needed so content
  // can pad itself clear of iOS Safari's floating bottom toolbar/home indicator
  viewportFit: "cover",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="ru">
      <body>{children}</body>
    </html>
  );
}
