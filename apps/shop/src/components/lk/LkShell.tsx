"use client";

import {
  useEffect,
  useState,
  useSyncExternalStore,
  type ReactNode,
} from "react";
import { usePathname, useRouter } from "next/navigation";
import { refreshCart } from "@/lib/cart";
import { LkLayout } from "./LkLayout";
import { forgetGatewaySession, gatewayTransport } from "@/lib/gateway";
import { setShopTransport } from "@/lib/shopApi";
import { gatewayUrl } from "@/lib/lk/config";
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
    (cb) => {
      // вход и выход сообщают о себе (@coral/api: cc:auth:changed)
      window.addEventListener("cc:auth:changed", cb);
      return () => window.removeEventListener("cc:auth:changed", cb);
    },
    () => Boolean(getToken()),
    () => null,
  );
  const [ready, setReady] = useState(false);
  const path = usePathname() ?? "";
  const router = useRouter();
  const onLogin = path.startsWith("/lk/login");

  // без входа — на страницу входа, а после него обратно сюда
  useEffect(() => {
    if (signedIn === false && !onLogin) router.replace(`/lk/login/?next=${encodeURIComponent(path)}`);
  }, [signedIn, onLogin, path, router]);

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

  if (onLogin) return <>{children}</>;
  if (signedIn === false) return null;
  // корзину ждём только перед оформлением (оно считает итог по её копии); остальные экраны грузят свои данные сами
  if (!ready && path.startsWith("/lk/checkout")) {
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
