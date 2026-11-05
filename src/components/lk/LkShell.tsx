"use client";

import { useEffect, useState, useSyncExternalStore, type ReactNode } from "react";
import { refreshCart } from "@/lib/cart";
import { forgetGatewaySession, gatewayTransport } from "@/lib/gateway";
import { setShopTransport } from "@/lib/shopApi";
import { LOGIN_URL, gatewayUrl } from "@/lib/lk/config";
import { loadMemberCart, startMemberCartSync } from "@/lib/lk/memberCart";
import { getToken } from "@/lib/lk/session";
import { Loader } from "@/components/ui";

/**
 * The member area's frame: the shop's calls go through the checkout gateway
 * with the member's cabinet token, and the cart mirrors the cabinet basket.
 * Without a token there is nothing to show yet: the member signs in first.
 */
export function LkShell({ children }: { children: ReactNode }) {
  // `null` while rendering on the server (no sessionStorage there), then whether a token exists
  const signedIn = useSyncExternalStore<boolean | null>(
    () => () => {},
    () => Boolean(getToken()),
    () => null,
  );
  const [ready, setReady] = useState(false);

  useEffect(() => {
    if (!signedIn) return;
    setShopTransport(gatewayTransport({ baseUrl: gatewayUrl(), getToken }));
    refreshCart();
    let stop = () => {};
    let alive = true;
    loadMemberCart().then(() => {
      if (!alive) return;
      stop = startMemberCartSync();
      setReady(true);
    });
    return () => {
      alive = false;
      stop();
      setShopTransport(null);
      forgetGatewaySession();
    };
  }, [signedIn]);

  if (signedIn === false) {
    return (
      <div style={{ padding: "48px 16px", fontFamily: "var(--font-sans)" }}>
        <p>Чтобы пользоваться корзиной и оформлением, сначала войдите в личный кабинет.</p>
        <p>
          <a href={LOGIN_URL}>Войти в личный кабинет</a>
        </p>
      </div>
    );
  }
  if (!ready) {
    return (
      <div style={{ padding: "48px 16px" }}>
        <Loader>Загружаем корзину…</Loader>
      </div>
    );
  }
  return <>{children}</>;
}
