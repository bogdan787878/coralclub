/**
 * The member's cabinet session. The token lives in sessionStorage under the key
 * the plain-JS member area (coralclub-lk) already uses, so one sign-in serves
 * both while they share an origin (github.io).
 */
import { cc4Base } from "./config";

const KEY = "lk_direct_token";

export function getToken(): string | null {
  try {
    return typeof window === "undefined" ? null : window.sessionStorage.getItem(KEY);
  } catch {
    return null;
  }
}

export type Cc4Answer<T> = { status: number; ok: boolean; json: T | null };

/** A call to the cabinet API with the member's token. Never throws: network trouble is `status: 0`. */
export async function cc4<T = unknown>(
  path: string,
  init: { method?: string; body?: unknown } = {},
): Promise<Cc4Answer<T>> {
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
    return { status: r.status, ok: r.ok, json };
  } catch {
    return { status: 0, ok: false, json: null };
  }
}
