"use client";

import { useEffect, useRef, type ReactNode } from "react";
import shop from "@/app/(shop)/products/[slug]/page.module.css";
import controls from "./controls.module.css";

/**
 * Круглые кнопки «назад» и «поделиться» над фото. Шапка проекта уезжает при скролле, поэтому кнопки
 * идут за её нижним краем: пока шапка видна — стоят под ней, когда ушла — поднимаются к верху экрана.
 */
export function PdpControls({ children }: { children: ReactNode }) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    // прямо на событие, без requestAnimationFrame: вычисление дешёвое, а кадры в фоновой вкладке не идут
    const sync = () => {
      const head = document.querySelector("cc-layout")?.shadowRoot?.querySelector(".head");
      const bottom = head ? Math.max(0, head.getBoundingClientRect().bottom) : 0;
      el.style.setProperty("--head-bottom", `${bottom}px`);
    };
    sync();
    window.addEventListener("scroll", sync, { passive: true });
    window.addEventListener("resize", sync);
    return () => {
      window.removeEventListener("scroll", sync);
      window.removeEventListener("resize", sync);
    };
  }, []);

  return (
    <div ref={ref} className={`${shop.imageControls} ${controls.controls}`}>
      {children}
    </div>
  );
}
