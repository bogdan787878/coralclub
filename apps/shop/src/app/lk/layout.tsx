import type { Metadata } from "next";
import type { ReactNode } from "react";
import { LkShell } from "@/components/lk/LkShell";
import "./lk.css";

export const metadata: Metadata = {
  title: "Личный кабинет — Coral Club",
  robots: { index: false },
};

/** The member area: signed in with the cabinet token, shop calls through the checkout gateway. */
export default function LkLayout({ children }: { children: ReactNode }) {
  return (
    <div className="appShell">
      <LkShell>{children}</LkShell>
    </div>
  );
}
