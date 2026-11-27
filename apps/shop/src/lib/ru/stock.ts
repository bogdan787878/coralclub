"use client";

/**
 * Наличие товара по складам магазина России. Склад выбирается по региону города (сайт магазина,
 * /restApi/v4/location/setLocation → distributionStore, проверено 2026-11-27):
 *   1010 — Москва, Петербург, Поволжье, Урал, Калининград, Мурманск;
 *   1021 — Юг и Северный Кавказ (Краснодар, Ростов, Ставрополь, Волгоград, Дагестан, Чечня, КБР);
 *   983  — Сибирь (Новосибирск, Омск, Красноярск, Иркутск, Бурятия);
 *   951  — Дальний Восток (Владивосток, Хабаровск, Якутия, Сахалин).
 * Наличие на складе — по гостевой сессии API в городе-представителе склада (у каждого города своя сессия).
 */
import { guestProducts } from "@coral/api";
import type { RuCity } from "./city";

export type Warehouse = { id: number; name: string; cities: string; at: RuCity };

export const WAREHOUSES: Warehouse[] = [
  { id: 1010, name: "Центр, Поволжье и Урал", cities: "Москва, Санкт-Петербург, Казань, Екатеринбург", at: { city: "Москва", area: "Москва" } },
  { id: 1021, name: "Юг и Северный Кавказ", cities: "Краснодар, Ростов-на-Дону, Махачкала", at: { city: "Краснодар", area: "Краснодарский край" } },
  { id: 983, name: "Сибирь", cities: "Новосибирск, Красноярск, Иркутск", at: { city: "Новосибирск", area: "Новосибирская область" } },
  { id: 951, name: "Дальний Восток", cities: "Владивосток, Хабаровск, Якутск", at: { city: "Владивосток", area: "Приморский край" } },
];

const cache = new Map<string, Promise<boolean | null>>();

/** Есть ли товар на складе: true / false; null — API не ответил. */
export function inStock(code: number, at: RuCity): Promise<boolean | null> {
  const key = `${code}:${at.city}|${at.area}`;
  let p = cache.get(key);
  if (!p) {
    p = guestProducts([String(code)], { country: "RU", language: "ru", location: at })
      .then((list) => {
        const hit = list.find((x) => x.code === code);
        return hit ? hit.available && hit.club !== null : false;
      })
      .catch(() => null);
    p.then((v) => v === null && cache.delete(key)); // не ответил — спросим снова
    cache.set(key, p);
  }
  return p;
}
