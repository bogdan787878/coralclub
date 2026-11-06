/**
 * Вход участника в API кабинета: сессия приложения (applicationToken, страна, язык) → логин и пароль → токен.
 * Пароль уходит только в API Coral Club. Токен — в sessionStorage (`lk_direct_token`), общий для сервисов на одном origin.
 * Витрина (страна магазина) — свойство сессии: её меняет PATCH /auth/session с deliveryId.
 */
import { cc4Base } from "./config";
import { cc4, getToken, TOKEN_KEY } from "./session";
import { normalizeProduct, type Product } from "./catalog";

/** Идентификатор приложения кабинета для открытия сессии (публичный, как у сайта). */
export const APPLICATION_TOKEN = "1ec82603-8332-6dd2-9af6-4309c012a93e";
const SHOP_SID_KEY = "lk_shop_sid";

const store = (key: string, value: string | null) => {
  try {
    if (value) window.sessionStorage.setItem(key, value);
    else window.sessionStorage.removeItem(key);
  } catch {
    /* без хранилища вход живёт до перезагрузки */
  }
};

/** Токен в ответе API лежит по-разному (data.access_token, data.token.access_token…): ищем access_token. */
function findToken(o: unknown): string | undefined {
  if (!o || typeof o !== "object") return undefined;
  const rec = o as Record<string, unknown>;
  if (typeof rec.access_token === "string") return rec.access_token;
  for (const v of Object.values(rec)) {
    const t = findToken(v);
    if (t) return t;
  }
  return undefined;
}

async function post(path: string, body: unknown, bearer?: string) {
  try {
    const r = await fetch(`${cc4Base()}${path}`, {
      method: "POST",
      headers: { accept: "application/json", "content-type": "application/json", ...(bearer ? { authorization: `Bearer ${bearer}` } : {}) },
      body: JSON.stringify(body),
    });
    return { status: r.status, ok: r.ok, json: (await r.json().catch(() => null)) as Record<string, unknown> | null };
  } catch {
    return { status: 0, ok: false, json: null };
  }
}

export type LoginResult = { ok: true } | { ok: false; step: "session" | "auth"; status: number; message: string };

/** Вход: открыть сессию приложения и войти по логину (Coral ID или e-mail) и паролю. */
export async function login({ login: user, password, country = "RU", language = "ru", applicationToken = APPLICATION_TOKEN }: { login: string; password: string; country?: string; language?: string; applicationToken?: string }): Promise<LoginResult> {
  const s = await post("/auth/session", { applicationToken, country, language });
  const sessionToken = findToken(s.json);
  if (!sessionToken) return { ok: false, step: "session", status: s.status, message: String(s.json?.message ?? `Не открыли сессию API (${s.status || "нет связи"})`) };
  const l = await post("/auth/login", { login: user, password }, sessionToken);
  if (!l.ok || l.json?.success === false) return { ok: false, step: "auth", status: l.status, message: String(l.json?.message ?? l.json?.error ?? `API ответил ${l.status || "нет связи"}`) };
  store(TOKEN_KEY, findToken(l.json) ?? sessionToken);
  window.dispatchEvent(new Event("cc:auth:changed"));
  return { ok: true };
}

/** Выход: закрыть сессию в API и забыть токен и сессию магазина в шлюзе. */
export async function logout(): Promise<void> {
  if (getToken()) await cc4("/auth/session", { method: "DELETE" });
  store(TOKEN_KEY, null);
  store(SHOP_SID_KEY, null);
  window.dispatchEvent(new Event("cc:auth:changed"));
}

export type Store = { id: string; name: string };

/** Витрины магазина по странам (публичный список): { RU: { id: "RUSSIA", name: "Россия" }, … }. */
export async function loadStores(): Promise<Record<string, Store>> {
  const r = await cc4<{ data?: { regionalDelivery?: { country?: string; locationCode?: string; id?: string; name?: string }[]; globalDelivery?: { country?: string; locationCode?: string; id?: string; name?: string }[] } }>(
    "/country/languages?deliveryId=RUSSIA&language=ru",
  );
  const d = r.json?.data ?? {};
  const out: Record<string, Store> = {};
  for (const e of [...(d.regionalDelivery ?? []), ...(d.globalDelivery ?? [])]) {
    if (!e?.country || !e.id) continue;
    // у страны может быть две витрины (Беларусь из России и coral-club.by): берём ту, что совпадает с витриной 2.0
    if (out[e.country] && e.locationCode !== e.country) continue;
    out[e.country] = { id: e.id, name: String(e.name ?? e.country).trim() };
  }
  return out;
}

/** Страна текущей сессии (по ней идут каталог, цены и корзина). */
export async function sessionCountry(): Promise<string | null> {
  const r = await cc4<{ data?: { country?: string } }>("/auth/session");
  return r.json?.data?.country ?? null;
}

/** Переключить витрину сессии; сессия магазина в шлюзе после этого открывается заново. */
export async function switchStore(deliveryId: string): Promise<boolean> {
  const r = await cc4("/auth/session", { method: "PATCH", body: { deliveryId } });
  if (r.ok) store(SHOP_SID_KEY, null);
  return r.ok;
}

/* ---------- гость: каталог без входа участника ---------- */
const guestKey = (country: string, language: string) => `cc_guest:${country}:${language}`;
const read = (key: string) => {
  try {
    return window.sessionStorage.getItem(key);
  } catch {
    return null;
  }
};

/**
 * Анонимная сессия приложения для страны: по ней API каталога отдаёт цены и наличие витрины страны (Германия —
 * EUR, deliveryId GERMANY), без входа участника. Токен хранится на вкладку; кэш по стране и языку.
 */
export async function guestToken(country: string, language = "en"): Promise<string | null> {
  const key = guestKey(country, language);
  const have = typeof window === "undefined" ? null : read(key);
  if (have) return have;
  const s = await post("/auth/session", { applicationToken: APPLICATION_TOKEN, country, language });
  const t = findToken(s.json) ?? null;
  if (t) store(key, t);
  return t;
}

/** Товары витрины страны для гостя (GET /catalog/products по анонимной сессии). Кодов, которых нет, в ответе нет. */
export async function guestProducts(codes: string[], { country, language = "en" }: { country: string; language?: string }): Promise<Product[]> {
  if (!codes.length) return [];
  for (let attempt = 0; attempt < 2; attempt++) {
    const token = await guestToken(country, language);
    if (!token) return [];
    try {
      const r = await fetch(`${cc4Base()}/catalog/products?${codes.map((c) => `products[]=${encodeURIComponent(c)}`).join("&")}`, {
        headers: { accept: "application/json", authorization: `Bearer ${token}` },
      });
      if (r.status === 401) {
        store(guestKey(country, language), null); // сессия истекла: откроем новую, один раз
        continue;
      }
      const j = (await r.json().catch(() => null)) as { data?: Parameters<typeof normalizeProduct>[0][] } | null;
      return (j?.data ?? []).map(normalizeProduct).filter((p): p is Product => !!p);
    } catch {
      return [];
    }
  }
  return [];
}
