"use client";

import { useRouter } from "next/navigation";
import { CartDrawer, type CartDrawerLabels } from "@/components/cart/CartDrawer";
import { useCart } from "@/lib/cart";
import { rub } from "@/lib/lk/catalog";
import { LkCartBanner, LkCartSummary, LkLinePrice, LkRecommendations } from "./LkCartParts";

const LABELS: CartDrawerLabels = {
  aria: "Корзина",
  closeCart: "Закрыть корзину",
  title: "Ваша корзина",
  close: "Закрыть",
  empty: "Корзина пуста.",
  remove: "Удалить",
  decrease: (name) => `Уменьшить: ${name}`,
  increase: (name) => `Добавить: ${name}`,
  subtotal: "Итого по ценам участника",
  note: "",
  checkout: "Оформить заказ",
  clear: "",
};

/**
 * The member's cart: the friend project's cart drawer, opened as the page. Its
 * lines mirror the cabinet basket (lib/lk/memberCart.ts); «Checkout» goes to the
 * member area's own checkout page.
 */
export function LkCart() {
  const router = useRouter();
  const cart = useCart();
  return (
    <CartDrawer
      open
      onClose={() => router.push("/lk/")}
      labels={LABELS}
      formatMoney={(v) => rub(v)}
      onCheckout={() => router.push("/lk/checkout/")}
      banner={<LkCartBanner lines={cart} />}
      renderPrice={(line) => <LkLinePrice line={line} />}
      recommendations={<LkRecommendations lines={cart} />}
      summary={<LkCartSummary lines={cart} />}
      binAtOne
      hideRemove
    />
  );
}
