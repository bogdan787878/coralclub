/**
 * Сессия участника в API кабинета. Токен лежит в sessionStorage под ключом кабинета на чистом JS (`lk_direct_token`),
 * поэтому один вход работает во всех сервисах на одном origin.
 */
import { cc4Base } from "./config";

export const TOKEN_KEY = "lk_direct_token";

export function getToken(): string | null {
  try {
    return typeof window === "undefined" ? null : window.sessionStorage.getItem(TOKEN_KEY);
  } catch {
    return null;
  }
}

export type Cc4Answer<T> = { status: number; ok: boolean; json: T | null };

/**
 * Токен больше не действует (API ответил 401 на запрос с ним — например, сессия истекла за ночь, а вкладка его
 * помнит): забываем его и сессию магазина, сообщаем сервисам — `cc:auth:expired` (страница может перезагрузиться
 * гостем) и `cc:auth:changed`.
 */
function dropExpiredToken(token: string) {
  try {
    if (window.sessionStorage.getItem(TOKEN_KEY) !== token) return; // уже вошли заново
    window.sessionStorage.removeItem(TOKEN_KEY);
    window.sessionStorage.removeItem("lk_shop_sid");
  } catch {
    return;
  }
  window.dispatchEvent(new Event("cc:auth:expired"));
  window.dispatchEvent(new Event("cc:auth:changed"));
}

/** Запрос к API кабинета с токеном участника. Не бросает исключений: сбой сети это `status: 0`. */
export async function cc4<T = unknown>(path: string, init: { method?: string; body?: unknown } = {}): Promise<Cc4Answer<T>> {
  const token = getToken();
  try {
    const r = await fetch(`${cc4Base()}${path}`, {
      method: init.method ?? "GET",
      headers: {
        accept: "application/json",
        ...(init.body !== undefined ? { "content-type": "application/json" } : {}),
        ...(token ? { authorization: `Bearer ${token}` } : {}),
      },
      ...(init.body !== undefined ? { body: JSON.stringify(init.body) } : {}),
    });
    const json = (await r.json().catch(() => null)) as T | null;
    if (token && r.status === 401) dropExpiredToken(token);
    return { status: r.status, ok: r.ok, json };
  } catch {
    return { status: 0, ok: false, json: null };
  }
}
