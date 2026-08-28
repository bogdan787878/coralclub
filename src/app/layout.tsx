import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Coral Club",
  description: "Coral Club — wellness store & content",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="ru">
      <body>{children}</body>
    </html>
  );
}
