/**
 * Сайт магазина России (coralclub.ru) через шлюз чек-аута: страница на GitHub Pages не может держать сессию
 * сайта, её держит шлюз (гостевая сессия coralclub.ru). Регистрация, расчёт доставки.
 */
import { gatewayUrl } from "@/lib/lk/config";

const SITE = "coralclub.ru";
const SID_KEY = "ru_reg_sid";


const read = () => {
  try {
    return window.sessionStorage.getItem(SID_KEY);
  } catch {
    return null;
  }
};
const save = (sid: string | null) => {
  try {
    if (sid) window.sessionStorage.setItem(SID_KEY, sid);
    else window.sessionStorage.removeItem(SID_KEY);
  } catch {
    /* вкладка без хранилища — сессия на одну загрузку */
  }
};

let opening: Promise<string> | null = null;
async function session(fresh = false): Promise<string> {
  const have = fresh ? null : read();
  if (have) return have;
  opening ??= fetch(`${gatewayUrl()}/session/guest`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ site: SITE }),
  })
    .then(async (r) => {
      const j = (await r.json().catch(() => null)) as { sid?: string; error?: string } | null;
      if (!j?.sid) throw new Error(j?.error || `шлюз ответил ${r.status}`);
      save(j.sid);
      return j.sid;
    })
    .finally(() => {
      opening = null;
    });
  return opening;
}

/** Запрос к сайту магазина через шлюз; JSON ответа или null. Истёкшая сессия — одна повторная попытка. */
export async function shop<T>(path: string, init: { method?: "GET" | "POST"; form?: Record<string, string> } = {}): Promise<T | null> {
  for (let attempt = 0; attempt < 2; attempt++) {
    const sid = await session(attempt > 0);
    const r = await fetch(`${gatewayUrl()}/shop${path}`, {
      method: init.method ?? "GET",
      headers: {
        "x-lk-sid": sid,
        accept: "application/json",
        ...(init.form ? { "content-type": "application/x-www-form-urlencoded" } : {}),
      },
      ...(init.form ? { body: new URLSearchParams(init.form).toString() } : {}),
    });
    if (r.status === 401) {
      save(null);
      continue;
    }
    const text = await r.text();
    try {
      return JSON.parse(text) as T;
    } catch {
      return null;
    }
  }
  return null;
}

