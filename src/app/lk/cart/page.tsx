"use client";

import { useEffect } from "react";
import Link from "next/link";

/** Корзина живёт в общем Layout: страница просто открывает её (адрес /lk/cart/ остаётся рабочим). */
export default function LkCartPage() {
  useEffect(() => {
    let alive = true;
    customElements.whenDefined("cc-layout").then(() => alive && window.coralLayout?.cart.open());
    return () => {
      alive = false;
    };
  }, []);
  return (
    <main style={{ padding: "32px 16px", fontFamily: "var(--font-sans)" }}>
      <p>Корзина открыта в общем меню.</p>
      <p>
        <Link href="/lk/checkout/">Перейти к оформлению</Link>
      </p>
    </main>
  );
}
