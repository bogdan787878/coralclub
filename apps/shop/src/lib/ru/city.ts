"use client";

/**
 * Город магазина России. От него зависит склад, а значит наличие: сайт магазина сопоставляет регион со складом
 * (Москва и область → 1010, Дагестан → 1021, Новосибирская область → 983, Приморье → 951…), API каталога — по
 * городу своей сессии (`PATCH /auth/session { location: { city, area } }`). Регион нужен полным, как его пишет
 * Google: «Новосибирская область», не «Новосибирская обл.» — иначе склад по умолчанию (Москва).
 *
 * Определение: по IP (шлюз, `GET /geo` → координаты → город через геокодер Google, без ключа — ближайший город
 * списка), по кнопке — геолокацией браузера. Поиск — Google Places (ключ из шлюза, как поиск адреса), без ключа —
 * по списку ниже. Город хранится в браузере; пока человек его не подтвердил, это догадка (`chosen: false`).
 */
import { useSyncExternalStore } from "react";
import type { SessionLocation } from "@coral/api";
import { gatewayUrl } from "@/lib/lk/config";
import type { AddressComponent } from "@/lib/addressSearch";

/** Поиск и геокодер Google — по требованию: в общий JS каждой страницы не входят. */
const places = () => import("@/lib/addressSearch");

export type RuCity = SessionLocation;
export type RuCityState = RuCity & { chosen: boolean };

const KEY = "coralclub.ru.city";
const EVENT = "cc:ru:city";

export const DEFAULT_CITY: RuCity = { city: "Москва", area: "Москва" };

/** Первые в списке выбора — как на сайте магазина. */
export const POPULAR: RuCity[] = [
  { city: "Москва", area: "Москва" },
  { city: "Санкт-Петербург", area: "Санкт-Петербург" },
  { city: "Махачкала", area: "Республика Дагестан" },
  { city: "Челябинск", area: "Челябинская область" },
  { city: "Краснодар", area: "Краснодарский край" },
  { city: "Новосибирск", area: "Новосибирская область" },
];

/**
 * Центры регионов и крупные города — запасной поиск без ключа Google и ближайший город по координатам IP.
 * [город, регион как у Google, широта, долгота]
 */
const CITIES: [string, string, number, number][] = [
  ["Москва", "Москва", 55.756, 37.617],
  ["Санкт-Петербург", "Санкт-Петербург", 59.939, 30.316],
  ["Новосибирск", "Новосибирская область", 55.03, 82.92],
  ["Бердск", "Новосибирская область", 54.758, 83.107],
  ["Екатеринбург", "Свердловская область", 56.838, 60.605],
  ["Нижний Тагил", "Свердловская область", 57.91, 59.981],
  ["Казань", "Республика Татарстан", 55.796, 49.106],
  ["Набережные Челны", "Республика Татарстан", 55.743, 52.396],
  ["Нижнекамск", "Республика Татарстан", 55.634, 51.809],
  ["Альметьевск", "Республика Татарстан", 54.901, 52.297],
  ["Нижний Новгород", "Нижегородская область", 56.327, 44.006],
  ["Челябинск", "Челябинская область", 55.16, 61.403],
  ["Магнитогорск", "Челябинская область", 53.407, 58.98],
  ["Красноярск", "Красноярский край", 56.01, 92.852],
  ["Норильск", "Красноярский край", 69.349, 88.201],
  ["Самара", "Самарская область", 53.196, 50.101],
  ["Тольятти", "Самарская область", 53.508, 49.42],
  ["Сызрань", "Самарская область", 53.155, 48.475],
  ["Уфа", "Республика Башкортостан", 54.735, 55.958],
  ["Стерлитамак", "Республика Башкортостан", 53.63, 55.93],
  ["Ростов-на-Дону", "Ростовская область", 47.222, 39.72],
  ["Таганрог", "Ростовская область", 47.236, 38.897],
  ["Шахты", "Ростовская область", 47.709, 40.216],
  ["Волгодонск", "Ростовская область", 47.516, 42.198],
  ["Омск", "Омская область", 54.989, 73.369],
  ["Краснодар", "Краснодарский край", 45.035, 38.975],
  ["Сочи", "Краснодарский край", 43.585, 39.723],
  ["Новороссийск", "Краснодарский край", 44.724, 37.769],
  ["Армавир", "Краснодарский край", 44.999, 41.129],
  ["Воронеж", "Воронежская область", 51.672, 39.184],
  ["Пермь", "Пермский край", 58.01, 56.229],
  ["Волгоград", "Волгоградская область", 48.708, 44.513],
  ["Волжский", "Волгоградская область", 48.786, 44.752],
  ["Саратов", "Саратовская область", 51.533, 46.034],
  ["Энгельс", "Саратовская область", 51.485, 46.126],
  ["Тюмень", "Тюменская область", 57.153, 65.534],
  ["Махачкала", "Республика Дагестан", 42.983, 47.504],
  ["Каспийск", "Республика Дагестан", 42.881, 47.638],
  ["Дербент", "Республика Дагестан", 42.058, 48.29],
  ["Хасавюрт", "Республика Дагестан", 43.25, 46.587],
  ["Барнаул", "Алтайский край", 53.348, 83.78],
  ["Бийск", "Алтайский край", 52.539, 85.214],
  ["Ижевск", "Удмуртская Республика", 56.853, 53.212],
  ["Хабаровск", "Хабаровский край", 48.48, 135.072],
  ["Комсомольск-на-Амуре", "Хабаровский край", 50.55, 137.008],
  ["Ульяновск", "Ульяновская область", 54.317, 48.403],
  ["Иркутск", "Иркутская область", 52.287, 104.305],
  ["Братск", "Иркутская область", 56.151, 101.634],
  ["Ангарск", "Иркутская область", 52.544, 103.888],
  ["Владивосток", "Приморский край", 43.116, 131.882],
  ["Уссурийск", "Приморский край", 43.797, 131.952],
  ["Находка", "Приморский край", 42.824, 132.893],
  ["Ярославль", "Ярославская область", 57.626, 39.894],
  ["Ставрополь", "Ставропольский край", 45.044, 41.969],
  ["Пятигорск", "Ставропольский край", 44.049, 43.059],
  ["Кисловодск", "Ставропольский край", 43.905, 42.716],
  ["Томск", "Томская область", 56.484, 84.948],
  ["Кемерово", "Кемеровская область", 55.355, 86.087],
  ["Новокузнецк", "Кемеровская область", 53.757, 87.136],
  ["Оренбург", "Оренбургская область", 51.768, 55.097],
  ["Рязань", "Рязанская область", 54.629, 39.736],
  ["Балашиха", "Московская область", 55.796, 37.938],
  ["Подольск", "Московская область", 55.431, 37.545],
  ["Химки", "Московская область", 55.889, 37.445],
  ["Мытищи", "Московская область", 55.91, 37.736],
  ["Королёв", "Московская область", 55.922, 37.854],
  ["Люберцы", "Московская область", 55.676, 37.898],
  ["Красногорск", "Московская область", 55.831, 37.33],
  ["Одинцово", "Московская область", 55.678, 37.264],
  ["Пенза", "Пензенская область", 53.195, 45.018],
  ["Липецк", "Липецкая область", 52.61, 39.594],
  ["Киров", "Кировская область", 58.603, 49.668],
  ["Чебоксары", "Чувашская Республика", 56.146, 47.251],
  ["Астрахань", "Астраханская область", 46.348, 48.033],
  ["Тула", "Тульская область", 54.193, 37.617],
  ["Калининград", "Калининградская область", 54.71, 20.452],
  ["Курск", "Курская область", 51.73, 36.193],
  ["Улан-Удэ", "Республика Бурятия", 51.834, 107.584],
  ["Тверь", "Тверская область", 56.859, 35.912],
  ["Иваново", "Ивановская область", 57.0, 40.973],
  ["Брянск", "Брянская область", 53.243, 34.364],
  ["Белгород", "Белгородская область", 50.596, 36.587],
  ["Сургут", "Ханты-Мансийский автономный округ", 61.254, 73.396],
  ["Нижневартовск", "Ханты-Мансийский автономный округ", 60.939, 76.57],
  ["Ханты-Мансийск", "Ханты-Мансийский автономный округ", 61.003, 69.019],
  ["Владимир", "Владимирская область", 56.129, 40.407],
  ["Чита", "Забайкальский край", 52.034, 113.5],
  ["Архангельск", "Архангельская область", 64.54, 40.544],
  ["Северодвинск", "Архангельская область", 64.563, 39.818],
  ["Калуга", "Калужская область", 54.514, 36.262],
  ["Смоленск", "Смоленская область", 54.782, 32.045],
  ["Якутск", "Республика Саха (Якутия)", 62.028, 129.732],
  ["Саранск", "Республика Мордовия", 54.187, 45.184],
  ["Вологда", "Вологодская область", 59.22, 39.891],
  ["Череповец", "Вологодская область", 59.127, 37.909],
  ["Курган", "Курганская область", 55.441, 65.341],
  ["Орёл", "Орловская область", 52.97, 36.064],
  ["Владикавказ", "Республика Северная Осетия — Алания", 43.024, 44.682],
  ["Грозный", "Чеченская Республика", 43.318, 45.698],
  ["Мурманск", "Мурманская область", 68.97, 33.075],
  ["Тамбов", "Тамбовская область", 52.721, 41.452],
  ["Петрозаводск", "Республика Карелия", 61.785, 34.346],
  ["Кострома", "Костромская область", 57.768, 40.927],
  ["Йошкар-Ола", "Республика Марий Эл", 56.632, 47.896],
  ["Сыктывкар", "Республика Коми", 61.668, 50.836],
  ["Нальчик", "Кабардино-Балкарская Республика", 43.485, 43.607],
  ["Великий Новгород", "Новгородская область", 58.522, 31.27],
  ["Благовещенск", "Амурская область", 50.29, 127.527],
  ["Псков", "Псковская область", 57.819, 28.332],
  ["Южно-Сахалинск", "Сахалинская область", 46.959, 142.738],
  ["Петропавловск-Камчатский", "Камчатский край", 53.024, 158.643],
  ["Абакан", "Республика Хакасия", 53.721, 91.442],
  ["Майкоп", "Республика Адыгея", 44.609, 40.106],
  ["Черкесск", "Карачаево-Черкесская Республика", 44.227, 42.047],
  ["Элиста", "Республика Калмыкия", 46.308, 44.256],
  ["Назрань", "Республика Ингушетия", 43.226, 44.766],
  ["Кызыл", "Республика Тыва", 51.719, 94.437],
  ["Горно-Алтайск", "Республика Алтай", 51.958, 85.96],
  ["Биробиджан", "Еврейская автономная область", 48.789, 132.925],
  ["Магадан", "Магаданская область", 59.568, 150.808],
  ["Анадырь", "Чукотский автономный округ", 64.733, 177.509],
  ["Нарьян-Мар", "Ненецкий автономный округ", 67.638, 53.007],
  ["Салехард", "Ямало-Ненецкий автономный округ", 66.53, 66.602],
  ["Новый Уренгой", "Ямало-Ненецкий автономный округ", 66.084, 76.68],
];

/* ------------------------------ хранение ------------------------------ */

let raw: string | null | undefined;
let parsed: RuCityState | null = null;
let memory: string | null = null;

function snapshot(): RuCityState | null {
  let now: string | null = null;
  try {
    now = window.localStorage.getItem(KEY);
  } catch {
    /* без хранилища — город на одну загрузку (memory) */
    now = memory;
  }
  if (now !== raw) {
    raw = now;
    try {
      const v = now ? (JSON.parse(now) as Partial<RuCityState>) : null;
      parsed = v?.city && typeof v.area === "string" ? { city: v.city, area: v.area || v.city, chosen: Boolean(v.chosen) } : null;
    } catch {
      parsed = null;
    }
  }
  return parsed;
}

function save(v: RuCityState) {
  const s = JSON.stringify(v);
  memory = s;
  try {
    window.localStorage.setItem(KEY, s);
  } catch {
    /* без хранилища */
  }
  window.dispatchEvent(new Event(EVENT));
}

const subscribe = (cb: () => void) => {
  window.addEventListener(EVENT, cb);
  window.addEventListener("storage", cb);
  return () => {
    window.removeEventListener(EVENT, cb);
    window.removeEventListener("storage", cb);
  };
};

/**
 * Город магазина: `undefined` при сборке на сервере, `null` — ещё не определён (идёт определение),
 * иначе город и подтвердил ли его человек.
 */
export function useRuCityState(): RuCityState | null | undefined {
  return useSyncExternalStore<RuCityState | null | undefined>(subscribe, snapshot, () => undefined);
}

/** Город для запросов каталога: пока не определён — Москва (склад по умолчанию, как у сайта). */
export function useRuCity(): RuCity | undefined {
  const s = useRuCityState();
  if (s === undefined) return undefined;
  return s ? { city: s.city, area: s.area } : DEFAULT_CITY;
}

export const cityKey = (c: RuCity) => `${c.city}|${c.area}`;
export const sameCity = (a: RuCity, b: RuCity) => cityKey(a) === cityKey(b);

/** Человек выбрал или подтвердил город. */
export function chooseRuCity(c: RuCity) {
  save({ city: c.city, area: c.area || c.city, chosen: true });
}

/** Догадка (по IP), пока человек не подтвердил. */
function guessRuCity(c: RuCity) {
  if (snapshot()) return;
  save({ ...c, chosen: false });
}

/* ----------------------------- определение ----------------------------- */

const norm = (s: string) => s.toLowerCase().replace(/ё/g, "е").replace(/[\s-]+/g, " ").trim();

/** Ключ Google (из шлюза): есть — поиск и геокодер Google; нет — список выше. */
export async function placesReady(): Promise<boolean> {
  const g = await places();
  if (g.addressSearchEnabled()) return true;
  return g.loadPlacesKeyFromGateway(gatewayUrl()).catch(() => false);
}

/** Компоненты адреса Google → город и регион, как их берёт сайт магазина. Не Россия — null. */
export function cityFromComponents(comps: AddressComponent[]): RuCity | null {
  const find = (...types: string[]) => comps.find((c) => types.every((t) => c.types.includes(t)));
  const city = find("locality") ?? find("administrative_area_level_3", "political") ?? find("administrative_area_level_2", "political");
  if (!city) return null;
  if (find("country")?.short.toUpperCase() !== "RU") return null;
  const area = find("administrative_area_level_1", "political") ?? find("administrative_area_level_2", "political") ?? find("administrative_area_level_3", "political");
  const clean = (s: string) => s.replace(/́/g, "").split(",")[0].trim();
  return { city: clean(city.long), area: clean(area?.long ?? city.long) };
}

/** Ближайший город списка (без ключа Google). */
function nearest(lat: number, lng: number): RuCity {
  let best = CITIES[0];
  let d = Infinity;
  for (const c of CITIES) {
    const dx = (c[3] - lng) * Math.cos((lat * Math.PI) / 180);
    const dy = c[2] - lat;
    const dd = dx * dx + dy * dy;
    if (dd < d) {
      d = dd;
      best = c;
    }
  }
  return { city: best[0], area: best[1] };
}

/** Город в точке: геокодер Google, без ключа — ближайший город списка. */
export async function cityAt(lat: number, lng: number): Promise<RuCity | null> {
  if (await placesReady()) {
    try {
      for (const comps of await (await places()).componentsAt({ lat, lng })) {
        const c = cityFromComponents(comps);
        if (c) return c;
      }
      return null;
    } catch {
      /* геокодер не ответил — список */
    }
  }
  return nearest(lat, lng);
}

let detecting: Promise<void> | null = null;
/** Догадаться о городе по IP (один раз, если город ещё не известен). Не Россия или нет ответа — Москва. */
export function detectRuCity(): Promise<void> {
  if (snapshot()) return Promise.resolve();
  detecting ??= (async () => {
    let found: RuCity | null = null;
    try {
      const r = await fetch(`${gatewayUrl()}/geo`, { headers: { accept: "application/json" } });
      const g = (await r.json().catch(() => null)) as { country?: string; lat?: number; lng?: number } | null;
      if (g?.country === "RU" && typeof g.lat === "number" && typeof g.lng === "number") found = await cityAt(g.lat, g.lng);
    } catch {
      /* шлюз без /geo или нет связи */
    }
    guessRuCity(found ?? DEFAULT_CITY);
  })();
  return detecting;
}

const GEO_ASKED = "coralclub.ru.geoAsked";

/**
 * Город по геолокации сразу при первом заходе: браузер показывает свой баннер разрешения. Один раз на браузер
 * (разрешение уже дано — определяем молча, запрещено — не спрашиваем). Нашли город России — он выбран; отказ,
 * ошибка или не Россия — null (остаётся догадка по IP и вопрос «Ваш город — …?»).
 */
export async function autoGeolocateRuCity(): Promise<RuCity | null> {
  if (typeof navigator === "undefined" || !navigator.geolocation) return null;
  const st = snapshot();
  if (st && st.chosen) return null;
  let perm: PermissionState | "" = "";
  try {
    perm = (await navigator.permissions?.query({ name: "geolocation" }))?.state ?? "";
  } catch {
    /* Permissions API нет (старый Safari) */
  }
  if (perm === "denied") return null;
  try {
    if (perm !== "granted" && window.localStorage.getItem(GEO_ASKED)) return null;
    window.localStorage.setItem(GEO_ASKED, "1");
  } catch {
    /* без хранилища — спросим */
  }
  const c = await cityByGeolocation().catch(() => null);
  if (c && !snapshot()?.chosen) chooseRuCity(c);
  return c;
}

/** Город по геолокации браузера (браузер спросит разрешение). */
export function cityByGeolocation(): Promise<RuCity | null> {
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) {
      reject(new Error("Браузер не умеет определять местоположение"));
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => resolve(cityAt(pos.coords.latitude, pos.coords.longitude)),
      (e) => reject(new Error(e.code === e.PERMISSION_DENIED ? "Нет доступа к геолокации — разрешите его в браузере" : "Не удалось определить местоположение")),
      { enableHighAccuracy: false, timeout: 10000, maximumAge: 600000 },
    );
  });
}

/** Поиск по списку городов (без ключа Google): сначала по началу названия, потом по вхождению и региону. */
export function searchLocalCities(q: string): RuCity[] {
  const n = norm(q);
  if (!n) return POPULAR;
  const scored = CITIES.map(([city, area]) => {
    const c = norm(city);
    const a = norm(area);
    const s = c.startsWith(n) ? 0 : c.includes(n) ? 1 : a.includes(n) ? 2 : -1;
    return { city, area, s };
  }).filter((x) => x.s >= 0);
  scored.sort((x, y) => x.s - y.s || x.city.localeCompare(y.city, "ru"));
  return scored.slice(0, 12).map(({ city, area }) => ({ city, area }));
}
