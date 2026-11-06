"use client";

import Script from "next/script";
import { useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { asset } from "@/lib/asset";
import { useCart, type CartLine } from "@/lib/cart";
import { friendProductById } from "@/lib/friendCatalog";
import { useFriendPricing } from "@/lib/friendPricing";
import { MARKET } from "@/lib/market";
import cfLoader from "@/lib/cf-image-loader";
import { useFriend } from "./FriendProvider";
import { CartBanner, CartSummary, Recommendations } from "./FriendCartParts";
import friend from "./Friend.module.css";

/**
 * Корзина «Друга клуба» — приложение корзины (<cc-cart>, отдельная страница), гостевая корзина в браузере.
 * Свои блоки «Друга клуба» (экономия и доставка, «You may also like», итоги) вставлены в слоты; цены строк — по
 * правилам витрины (API каталога страны). «Checkout» ведёт на оформление /friend/checkout/.
 */
export function FriendCartPage() {
  const router = useRouter();
  const el = useRef<HTMLElement & { linePrice?: unknown; imageUrl?: unknown }>(null);
  const cart = useCart();
  const pr = useFriendPricing();
  const { friend: who } = useFriend();

  useEffect(() => {
    const node = el.current;
    if (!node) return;
    node.linePrice = (raw: CartLine) => {
      const p = friendProductById(raw.coralId);
      if (!p) return null;
      if (!pr.sold(p)) return { note: "Not sold here" };
      const saved = (pr.regular(p) - pr.club(p)) * raw.qty;
      return { now: pr.money(pr.club(p)), was: pr.money(pr.regular(p)), save: saved > 0 ? `${pr.money(saved)} savings` : "" };
    };
    node.imageUrl = (src: string) => cfLoader({ src, width: 256 });
  }, [pr]);
  useEffect(() => {
    const node = el.current;
    if (!node) return;
    const go = (e: Event) => {
      e.preventDefault(); // переход внутри приложения, без перезагрузки
      router.push("/friend/checkout/");
    };
    node.addEventListener("cc:cart:checkout", go);
    return () => node.removeEventListener("cc:cart:checkout", go);
  }, [router]);

  return (
    <div className={`appShell ${friend.page}`}>
      <Script src={asset("/cart/cart.js")} strategy="afterInteractive" />
      <cc-cart
        ref={el}
        cart="local"
        cart-key="coralclub.cart.friend"
        locale="en"
        currency={pr.currency || MARKET.currency}
        money-locale={MARKET.locale}
        links={JSON.stringify({ checkout: asset("/friend/checkout/"), shop: asset("/friend/") })}
        labels={JSON.stringify({ subtotal: "Subtotal at member prices" })}
      >
        <div slot="cart-banner">
          <CartBanner lines={cart} />
        </div>
        <div slot="cart-extra">
          <Recommendations />
        </div>
        <div slot="cart-summary">
          <CartSummary lines={cart} />
        </div>
        {who && (
          <p slot="cart-note" className={friend.drawerNote}>
            No sign-up needed. The sale goes to <strong>{who.name}</strong> · Coral ID {who.memberId}
          </p>
        )}
      </cc-cart>
    </div>
  );
}
