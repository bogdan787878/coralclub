"use client";

import type { ReactNode } from "react";
import { SheetProvider } from "./Sheet";

/** Рамка экранов кабинета: стили кабинета (.lkapp, src/app/lk/lk.css) и нижний лист. */
export function CabinetFrame({ children }: { children: ReactNode }) {
  return (
    <div className="lkapp">
      <SheetProvider>{children}</SheetProvider>
    </div>
  );
}
