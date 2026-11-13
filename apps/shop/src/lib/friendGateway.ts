/**
 * «Друг клуба» вне домена магазина (localhost:3100, GitHub Pages): вызовы чек-аута идут через наш шлюз
 * (packages/gateway) в гостевой сессии сайта магазина — без входа и без перехода на coral.club.
 * На самом домене магазина и через локальный прокси (3200) шлюз не нужен.
 */
import { gatewayTransport } from "@/lib/gateway";
import { gatewayUrl } from "@/lib/lk/config";
import { getShopSite, onShopDomain, setShopTransport } from "@/lib/shopApi";

/** Включить шлюз для страниц «Друга клуба». Вызывается до первого рендера чек-аута (FriendProvider). */
export function enableFriendGateway(): void {
  if (typeof window === "undefined" || onShopDomain()) return;
  setShopTransport(gatewayTransport({ baseUrl: gatewayUrl(), getToken: () => null, guestSite: getShopSite }));
}
