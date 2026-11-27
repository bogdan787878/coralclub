"use client";

/**
 * Доставка в город покупателя — сразу на странице товара: способы и цены сайта магазина (sv-api/delivery по
 * гостевой сессии шлюза; корзина не нужна). У способа: цена, срок в днях (TRANSIT «3-4»), порог бесплатной
 * доставки (FREE_DELIVERY).
 */
import type { RuCity } from "./city";
import { shop } from "./site";

export type DeliveryOption = { group: "COURIER" | "PICK_POINT" | "POST" | "OFFICE" | string; name: string; price: number; days: string; free: number | null };

type Raw = { result?: { ID?: string; ITEMS?: { NAME?: string; TYPE?: string; PRICE?: number; TRANSIT?: string; FREE_DELIVERY?: number | null }[] }[] };

const cache = new Map<string, Promise<DeliveryOption[]>>();

export function loadDelivery(c: RuCity): Promise<DeliveryOption[]> {
  const key = `${c.city}|${c.area}`;
  let p = cache.get(key);
  if (!p) {
    const q = new URLSearchParams({ COUNTRY: "RU", CITY: c.city, AREA: c.area, language: "ru" });
    p = shop<Raw>(`/sv-api/delivery?${q}`)
      .then((d) =>
        (d?.result ?? []).flatMap((g) =>
          (g.ITEMS ?? [])
            .filter((i) => typeof i.PRICE === "number")
            .map((i) => ({
              // самовывоз из офиса компании — своя строка, не «пункт выдачи»
              group: /офис/i.test(String(i.NAME ?? "")) ? "OFFICE" : String(i.TYPE ?? g.ID ?? ""),
              name: String(i.NAME ?? ""),
              price: i.PRICE as number,
              days: String(i.TRANSIT ?? "").trim(),
              free: typeof i.FREE_DELIVERY === "number" && i.FREE_DELIVERY > 0 ? i.FREE_DELIVERY : null,
            })),
        ),
      )
      .catch(() => []);
    p.then((list) => !list.length && cache.delete(key)); // не ответил — спросим снова
    cache.set(key, p);
  }
  return p;
}

/** Самый дешёвый способ в группе (при равной цене — самый быстрый). */
export function cheapest(list: DeliveryOption[], group: string): DeliveryOption | undefined {
  const firstDay = (d: string) => Number(/\d+/.exec(d)?.[0] ?? 99);
  return list
    .filter((o) => o.group === group)
    .sort((a, b) => a.price - b.price || firstDay(a.days) - firstDay(b.days))[0];
}

/** «3-4» → «3–4 дня», «1» → «1 день». */
export function daysText(d: string): string {
  if (!d) return "";
  const n = Number(/(\d+)\s*$/.exec(d)?.[1] ?? NaN);
  const word = Number.isNaN(n) ? "дн." : n % 10 === 1 && n % 100 !== 11 ? "день" : [2, 3, 4].includes(n % 10) && ![12, 13, 14].includes(n % 100) ? "дня" : "дней";
  return `${d.replace("-", "–")} ${word}`;
}
