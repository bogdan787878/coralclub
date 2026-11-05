"use client";

import {
  useEffect,
  useState,
  useSyncExternalStore,
  type ReactNode,
} from "react";
import { refreshCart } from "@/lib/cart";
import { LkLayout } from "./LkLayout";
import { forgetGatewaySession, gatewayTransport } from "@/lib/gateway";
import { setShopTransport } from "@/lib/shopApi";
import { LOGIN_URL, gatewayUrl } from "@/lib/lk/config";
import { followLayoutCart, loadMemberCart } from "@/lib/lk/memberCart";
import { getToken } from "@/lib/lk/session";
import { Loader } from "@/components/ui";

/**
 * Рамка кабинета: общий Layout (шапка, меню, корзина) сверху, запросы магазина через шлюз чек-аута
 * с токеном кабинета. Без токена показывать нечего: сначала вход.
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
    let alive = true;
    const stop = followLayoutCart(); // корзиной владеет Layout, здесь её копия для экранов кабинета
    loadMemberCart().then(() => alive && setReady(true));
    return () => {
      alive = false;
      stop();
      setShopTransport(null);
      forgetGatewaySession();
    };
  }, [signedIn]);

  if (signedIn === false) {
    return (
      <>
        <LkLayout />
        <div style={{ padding: "48px 16px", fontFamily: "var(--font-sans)" }}>
          <p>
            Чтобы пользоваться корзиной и оформлением, сначала войдите в личный
            кабинет.
          </p>
          <p>
            <a href={LOGIN_URL}>Войти в личный кабинет</a>
          </p>
        </div>
      </>
    );
  }
  if (!ready) {
    return (
      <>
        <LkLayout />
        <div style={{ padding: "48px 16px" }}>
          <Loader>Загружаем корзину…</Loader>
        </div>
      </>
    );
  }
  return (
    <>
      <LkLayout />
      {children}
    </>
  );
}
