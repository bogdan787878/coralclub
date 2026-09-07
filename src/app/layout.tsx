import type { Metadata, Viewport } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Coral Club",
  description: "Coral Club — wellness store & content",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  // makes env(safe-area-inset-*) resolve to real values so account
  // screens can pad the legal text clear of iOS Safari's floating toolbar
  viewportFit: "cover",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="ru">
      <body>{children}</body>
    </html>
  );
}
