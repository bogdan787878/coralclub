/**
 * Куда ходят сервисы. Значения по умолчанию: живой бэкенд Coral Club и наш шлюз чек-аута.
 * Для разработки адреса меняются ключами sessionStorage `lk_cc4_base`, `lk_gateway` (сборка для продакшена их не читает).
 */
export const CC4_BASE = "https://api.coral.club/api/v1";
export const GATEWAY_URL = "https://coral-lk-checkout.bogdan787878.workers.dev";
/** Адрес магазина и кабинета на Next (GitHub Pages). */
export const PAGES_URL = "https://bogdan787878.github.io/coralclub";
/** Вход участника: кабинет на Next (токен общий через sessionStorage, пока сервисы на одном origin). */
export const LOGIN_URL = `${PAGES_URL}/lk/login/`;
/** Кабинет на чистом JS: в нём ещё живут каталог, избранное и структура, пока не перенесены в Next. */
export const LEGACY_LK_URL = "https://bogdan787878.github.io/coralclub-lk/docs/";

type Env = { production: boolean };
let env: Env = { production: true };
/** Сервис сообщает пакету, собран ли он для продакшена (в Next: process.env.NODE_ENV). */
export function configureApi(next: Partial<Env>): void {
  env = { ...env, ...next };
}

const devOverride = (key: string): string | null => {
  if (env.production || typeof window === "undefined") return null;
  try {
    return window.sessionStorage.getItem(key);
  } catch {
    return null;
  }
};
export const cc4Base = (): string => devOverride("lk_cc4_base") ?? CC4_BASE;
export const gatewayUrl = (): string => devOverride("lk_gateway") ?? GATEWAY_URL;
