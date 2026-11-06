/** Кабинет (/lk): куда идут его запросы. Сами адреса живут в общем пакете @coral/api. */
import { configureApi } from "@coral/api";

configureApi({ production: process.env.NODE_ENV === "production" });

export { CC4_BASE, GATEWAY_URL, LEGACY_LK_URL, LOGIN_URL, cc4Base, gatewayUrl } from "@coral/api";
