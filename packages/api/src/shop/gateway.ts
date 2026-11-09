/**
 * The checkout gateway client (the Cloudflare Worker, packages/gateway). The shop accepts checkout calls
 * only by its own session, which a page on another origin can neither get nor
 * send; the gateway keeps that session for the page.
 *
 *   POST {base}/session            Authorization: Bearer <cabinet API token>  →  { sid }
 *   GET|POST {base}/shop/<path>    X-Lk-Sid: <sid>                            →  the shop's answer
 *
 * No password is involved: the shop opens the member's session from the
 * cabinet token (web_views link + x-access-token header).
 */
import type { ShopTransport } from "./client";

const SID_KEY = "lk_shop_sid";
const readSid = (): string | null => {
  try {
    return sessionStorage.getItem(SID_KEY);
  } catch {
    return null;
  }
};
const saveSid = (sid: string | null): void => {
  try {
    if (sid) sessionStorage.setItem(SID_KEY, sid);
    else sessionStorage.removeItem(SID_KEY);
  } catch {
    /* without storage the session is opened again after a reload */
  }
};

/** Ошибка шлюза с HTTP-статусом: 401 — вход истёк (токен кабинета не принят), остальное — шлюз или магазин. */
export class GatewayError extends Error {
  constructor(
    message: string,
    readonly status: number,
  ) {
    super(message);
    this.name = "GatewayError";
  }
}

export type GatewayOptions = {
  /** e.g. https://coral-lk-checkout.<account>.workers.dev */
  baseUrl: string;
  /** the member's cabinet API token; `null` when signed out */
  getToken: () => string | null;
};

export function gatewayTransport({ baseUrl, getToken }: GatewayOptions): ShopTransport {
  const base = baseUrl.replace(/\/+$/, "");

  async function session(force = false): Promise<string> {
    const have = force ? null : readSid();
    if (have) return have;
    const token = getToken();
    if (!token) throw new GatewayError("нужно войти", 401);
    const r = await fetch(`${base}/session`, {
      method: "POST",
      headers: { authorization: `Bearer ${token}` },
    });
    const j = (await r.json().catch(() => null)) as { sid?: string; error?: string } | null;
    if (!j?.sid) throw new GatewayError(j?.error || `шлюз ответил ${r.status}`, r.status);
    const sid = j.sid;
    saveSid(sid);
    return sid;
  }

  const send = async (url: string, init: RequestInit, force: boolean) =>
    fetch(`${base}/shop${url}`, {
      ...init,
      headers: {
        ...((init.headers as Record<string, string> | undefined) ?? {}),
        "x-lk-sid": await session(force),
      },
    });

  return async (url, init) => {
    let r = await send(url, init, false);
    if (r.status === 401) {
      // the session expired (an hour without calls): open it again, once
      const body = (await r.clone().json().catch(() => null)) as { error?: string } | null;
      if (body?.error === "session") r = await send(url, init, true);
    }
    return r;
  };
}

/** Forget the shop session (sign-out). */
export const forgetGatewaySession = (): void => saveSid(null);
