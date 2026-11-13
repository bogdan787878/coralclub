/** Кабинет (/lk): куда идут его запросы. Сами адреса живут в общем пакете @coral/api. */
import { configureApi } from "@coral/api";

configureApi({
  production: process.env.NODE_ENV === "production",
  // локально: NEXT_PUBLIC_GATEWAY_URL=http://localhost:8787 (npm run dev:gateway); пусто — развёрнутый Worker
  gateway: process.env.NEXT_PUBLIC_GATEWAY_URL ?? "",
});

export { CC4_BASE, GATEWAY_URL, LEGACY_LK_URL, LOGIN_URL, cc4Base, gatewayUrl } from "@coral/api";
