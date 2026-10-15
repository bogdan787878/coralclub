"use client";

import {
  useCallback,
  useEffect,
  useId,
  useMemo,
  useRef,
  useState,
} from "react";
import Link from "next/link";
import {
  addItem,
  priceValue,
  refreshCart,
  useCart,
  type CartLine,
} from "@/lib/cart";
import { FRIEND_REF_CODE, FRIEND_USER_ID } from "@/lib/beautySystem";
import {
  LANDING_PRODUCTS_RU,
  formatRub,
  fullTitle,
} from "@/lib/landingCatalogRu";
import { BackButton } from "../../app/(shop)/products/[slug]/BackButton";
import styles from "./LandingCheckout.module.css";

/**
 * LandingCheckout — prototype of an own checkout UI on top of the shop's
 * internal JSON API (/sv-api/*). It works only on the shop's own origin:
 * on coralclub.ru, or locally through `npm run dev:proxy`
 * (http://localhost:3200/landing/checkout/).
 *
 * Flow: sync our cart into the shop's session cart → read delivery /
 * payment options and totals → POST /sv-api/order (only on the shopper's
 * click) → open the payment page (/order/payment/<id>/) of the shop.
 */

type PayMethod = { ID: string; NAME: string; IMAGE?: string | null };
type DeliveryItem = {
  ID: string;
  NAME: string;
  TYPE: string;
  TRANSIT?: string;
  PRICE?: number;
  FREE_DELIVERY?: number;
  PAYSYSTEMS: PayMethod[];
};
type DeliveryGroup = {
  ID: string;
  NAME: string;
  DESCRIPTION?: string;
  ITEMS: DeliveryItem[];
};
type Totals = Record<string, string | number | null | undefined>;

/**
 * Which shop site serves which country. Picking one in the test panel makes
 * the dev proxy talk to that site (cookie `cc_shop_site`) with its own
 * session, products, currency, delivery and payment methods.
 */
const SHOP_SITES: Record<string, string> = {
  RU: "coralclub.ru",
  KZ: "coralclub.ru",
  US: "coralclub.us",
};
/** Other countries: their regional site, <cc>.coral.club (de, fr, it, pl …). */
const siteFor = (code: string) =>
  SHOP_SITES[code] ?? `${code.toLowerCase()}.coral.club`;
const SITE_COOKIE = "cc_shop_site";

/**
 * The product the page starts with when the cart is empty: a mask — the one
 * product that every country site (RU, US, UA, GB, DE, FR, IT, ES, CZ, BY,
 * KG, UZ …) sells under the same article, so any country can be tested.
 */
const DEFAULT_SLUG = "hydro-boost-biocellulose-facial-mask";

/**
 * Courier time slots, as the shop's own checkout builds them. The tables come
 * from /init (moscowDeliveryTimes / spbDeliveryTimes): per weekday (Mon…Sun)
 * an order cut-off hour, a "skip" flag and the available intervals.
 */
type Interval = {
  beforeTime?: number | string;
  skip?: number;
  times?: string[];
};
type TimeTable = {
  mkad?: Interval[];
  outside?: Interval[];
  express?: Interval[];
  restricted?: string[];
};
type Slot = { date: string; text: string; chip: string; times: string[] };

const EXPRESS_SERVICE = "I_COURIER_1DAY";

/** Now in Moscow time (the shop counts cut-offs in it). */
function moscowNow() {
  const parts = new Intl.DateTimeFormat("en-GB", {
    timeZone: "Europe/Moscow",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  }).formatToParts(new Date());
  const n = (t: string) => Number(parts.find((p) => p.type === t)?.value);
  const date = new Date(Date.UTC(n("year"), n("month") - 1, n("day")));
  return {
    date,
    hour: n("hour"),
    hhmm: `${String(n("hour")).padStart(2, "0")}:${String(n("minute")).padStart(2, "0")}`,
    weekday: (date.getUTCDay() + 6) % 7, // 0 = Monday
  };
}

function buildSlots(
  table: TimeTable | undefined,
  { express, mkad }: { express: boolean; mkad: boolean },
): Slot[] {
  const intervals = table?.[express ? "express" : mkad ? "mkad" : "outside"];
  if (!intervals?.length) return [];
  const now = moscowNow();
  const cutoff = Number(intervals[now.weekday]?.beforeTime);
  const passed = Number.isFinite(cutoff) && now.hour >= cutoff;
  const startDay = express ? (passed ? 1 : 0) : passed ? 2 : 1;
  const endDay = express ? startDay + 1 : startDay + 7;
  const restricted = table?.restricted ?? [];
  const out: Slot[] = [];
  for (let c = startDay; c < endDay; c++) {
    const wd = (now.weekday + c) % 7;
    const day = intervals[wd];
    if (day?.skip !== 1) continue;
    const d = new Date(now.date.getTime() + c * 86_400_000);
    let times = day.times ?? [];
    if (c === 0) times = times.filter((t) => t.split("-")[0] > now.hhmm);
    const dd = String(d.getUTCDate()).padStart(2, "0");
    const mm = String(d.getUTCMonth() + 1).padStart(2, "0");
    if (
      !times.length ||
      restricted.includes(`${dd}.${mm}.${d.getUTCFullYear()}`)
    )
      continue;
    const label = new Intl.DateTimeFormat("ru-RU", {
      timeZone: "UTC",
      weekday: "long",
      day: "numeric",
      month: "long",
    }).format(d);
    // chip: "Сегодня, 15 окт" / "Завтра, 16 окт" / "Сб, 17 окт"
    const short = new Intl.DateTimeFormat("ru-RU", {
      timeZone: "UTC",
      weekday: "short",
      day: "numeric",
      month: "short",
    })
      .formatToParts(d)
      .reduce<Record<string, string>>((acc, p) => {
        acc[p.type] = p.value.replace(".", "");
        return acc;
      }, {});
    const weekday =
      c === 0
        ? "Сегодня"
        : c === 1
          ? "Завтра"
          : short.weekday.charAt(0).toUpperCase() + short.weekday.slice(1);
    out.push({
      date: `${d.getUTCFullYear()}${mm}${dd}`,
      text: label,
      chip: `${weekday}, ${short.day} ${short.month}`,
      times,
    });
  }
  return out;
}

/** Serialises the cart syncs (see the sync effect). */
let syncChain: Promise<void> = Promise.resolve();

/** Product ids that differ from the Russian site's, per site. */
const FOREIGN_IDS: Record<string, string> = {
  hydramax: "803801",
  "hydramax-plus": "807201",
};

/** Currency symbol of the shop site (by the country it serves). */
const CURRENCY: Record<string, string> = {
  RU: "₽",
  US: "$",
  GB: "£",
  KZ: "₸",
  BY: "Br",
  UA: "₴",
  PL: "zł",
  CZ: "Kč",
};

/**
 * Countries offered before (or without) the shop's own list from /init, so
 * the selector never disappears when the shop does not answer.
 */
const FALLBACK_COUNTRIES: Record<string, string> = {
  RU: "Россия",
  US: "США",
  UA: "Украина",
  KZ: "Казахстан",
  BY: "Беларусь",
  DE: "Германия",
  FR: "Франция",
  ES: "Испания",
  IT: "Италия",
  PL: "Польша",
  CZ: "Чехия",
  GB: "Великобритания",
  CA: "Канада",
};

/** City to start with when a country is picked in the test panel. */
const DEFAULT_CITY: Record<string, string> = {
  RU: "Москва",
  KZ: "Алматы",
  BY: "Минск",
  UA: "Киев",
  AM: "Ереван",
  KG: "Бишкек",
  US: "New York",
  CA: "Toronto",
  GB: "London",
  FR: "Paris",
  CZ: "Praha",
  NL: "Amsterdam",
  AT: "Wien",
  BE: "Bruxelles",
  PT: "Lisboa",
  DE: "Berlin",
  PL: "Warszawa",
  ES: "Madrid",
  IT: "Roma",
};

/**
 * Friend-of-the-club session (every price is the club price). Off: the
 * shopper pays the shop's ordinary prices, and the totals below are exactly
 * what the shop charges.
 */
const USE_FRIEND_CLUB = false;
const FRIEND_QUERY = USE_FRIEND_CLUB
  ? `&REF_CODE=${FRIEND_REF_CODE}&langss=ru&user=${FRIEND_USER_ID}&f=y`
  : "";

/** { a: 1, PROFILE: { CITY: "x" } } → "a=1&PROFILE[CITY]=x" */
function qs(params: Record<string, unknown>): string {
  const out: string[] = [];
  const add = (key: string, value: unknown) => {
    if (value === undefined || value === null) return;
    if (typeof value === "object") {
      for (const [k, v] of Object.entries(value as object))
        add(`${key}[${k}]`, v);
    } else {
      out.push(
        `${encodeURIComponent(key)}=${encodeURIComponent(String(value))}`,
      );
    }
  };
  for (const [k, v] of Object.entries(params)) add(k, v);
  return out.join("&");
}

/**
 * fetch() addressed to one shop site. The site travels in a header of the
 * request itself (not only in a cookie), so overlapping requests of two
 * country switches can never end up on each other's site.
 */
function shopFetch(site: string, url: string, init: RequestInit = {}) {
  return fetch(url, {
    credentials: "same-origin",
    cache: "no-store",
    ...init,
    headers: {
      ...(site ? { "x-shop-site": site } : {}),
      ...((init.headers as Record<string, string> | undefined) ?? {}),
    },
  });
}

async function api<T = unknown>(
  path: string,
  params: Record<string, unknown> = {},
  site = "",
): Promise<T> {
  const r = await shopFetch(
    site,
    `/sv-api${path}?${qs({ ...params, language: "ru" })}`,
  );
  const text = await r.text();
  try {
    return JSON.parse(text) as T;
  } catch {
    // an empty / HTML body (Safari: "The string did not match the expected pattern")
    return {
      error: `Магазин ответил не JSON (HTTP ${r.status}) на ${path}`,
    } as T;
  }
}

/** Empty the shop's session cart, then put our lines into it. */
async function syncShopCart(
  lines: CartLine[],
  site: string,
): Promise<string[]> {
  const main = !site || site === "coralclub.ru";
  const ids = main ? {} : FOREIGN_IDS;
  const skipped: string[] = [];
  const html = await (await shopFetch(site, "/basket/")).text();
  const doc = new DOMParser().parseFromString(html, "text/html");
  const items = [
    ...doc.querySelectorAll<HTMLElement>(".basket-member__basic-item"),
  ];
  if (items.length) {
    const body = new URLSearchParams();
    items.forEach((el, i) => {
      body.append(
        `basket_products[${i}][basket_id]`,
        el.dataset.basket_id ?? "",
      );
      body.append(`basket_products[${i}][member_id]`, el.dataset.member ?? "");
      body.append(`basket_products[${i}][vendor_code]`, el.dataset.code ?? "");
    });
    body.append("basket_count", String(items.length));
    body.append("basket_member_count", "1");
    await shopFetch(site, "/ajax/deleteBasketItems.php", {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded; charset=UTF-8",
      },
      body,
    });
  }
  if (main) {
    // the Russian site takes the whole cart in one request
    const pairs = lines
      .filter((l) => l.qty > 0)
      .map((l) => `${encodeURIComponent(l.coralId)}=${l.qty}`);
    if (pairs.length) {
      await shopFetch(
        site,
        `/shop/shop_basket.php?${pairs.join("&")}${FRIEND_QUERY}`,
      );
    }
    return skipped;
  }
  // other sites: one line at a time, keeping only what actually landed in
  // their cart — not every product (and no bundle) is sold in every country
  let have = 0;
  for (const l of lines) {
    if (l.qty <= 0) continue;
    if (l.slug.startsWith("set-")) {
      skipped.push(l.name);
      continue;
    }
    const id = encodeURIComponent(ids[l.slug] ?? l.coralId);
    await shopFetch(
      site,
      `/shop/shop_basket.php?${id}=${l.qty}${FRIEND_QUERY}`,
    );
    const o = await api<{ result?: { QUANTITY?: number | string } }>(
      "/order",
      {},
      site,
    );
    const q = Number(o.result?.QUANTITY ?? 0);
    if (q > have) have = q;
    else skipped.push(l.name);
  }
  return skipped;
}

/**
 * Text input with its label inside the field: the label sits like a
 * placeholder, on focus (or with a value) it floats up and the real
 * placeholder fades in. An error colours the border and adds a message.
 */
function FloatInput({
  label,
  value,
  onChange,
  onBlur,
  placeholder,
  error,
  inputMode,
  autoComplete,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  onBlur?: () => void;
  placeholder?: string;
  error?: string;
  inputMode?: "text" | "tel" | "email" | "numeric";
  autoComplete?: string;
}) {
  const id = useId();
  return (
    <div className={styles.float}>
      <div
        className={`${styles.floatBox} ${error ? styles.floatBoxError : ""}`}
      >
        <input
          id={id}
          className={styles.floatInput}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onBlur={onBlur}
          placeholder={placeholder ?? " "}
          inputMode={inputMode}
          autoComplete={autoComplete}
          aria-invalid={error ? true : undefined}
        />
        <label htmlFor={id} className={styles.floatLabel}>
          {label}
        </label>
      </div>
      {error && <span className={styles.floatMsg}>{error}</span>}
    </div>
  );
}

export function LandingCheckout() {
  const cart = useCart();

  const [ready, setReady] = useState<"idle" | "sync" | "ok" | "error">("idle");
  const [error, setError] = useState("");
  const [groups, setGroups] = useState<DeliveryGroup[]>([]);
  const [payments, setPayments] = useState<PayMethod[]>([]);
  const [totals, setTotals] = useState<Totals | null>(null);

  const [country, setCountry] = useState("RU");
  const [shopCountry, setShopCountry] = useState("RU");
  const [countries, setCountries] =
    useState<Record<string, string>>(FALLBACK_COUNTRIES);
  const [deliveryError, setDeliveryError] = useState("");
  // which request each block was last loaded for — "loading" is derived by
  // comparing with the request the current inputs ask for
  const [deliveryLoadedKey, setDeliveryLoadedKey] = useState("");
  const [paymentsLoadedKey, setPaymentsLoadedKey] = useState("");
  const [totalsLoadedKey, setTotalsLoadedKey] = useState("");
  const [city, setCity] = useState("Москва");
  const [area, setArea] = useState("Москва");
  const [cityDraft, setCityDraft] = useState("Москва");
  const [fio, setFio] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [street, setStreet] = useState("");
  const [build, setBuild] = useState("");
  const [apartment, setApartment] = useState("");
  const [postindex, setPostindex] = useState("");
  const [comment, setComment] = useState("");
  // fields the shopper has left — only those get an error message
  const [touched, setTouched] = useState<Record<string, boolean>>({});
  const touch = (k: string) =>
    setTouched((t) => (t[k] ? t : { ...t, [k]: true }));
  const [timeTables, setTimeTables] = useState<{
    moscow?: TimeTable;
    spb?: TimeTable;
  }>({});
  const [outsideMkad, setOutsideMkad] = useState(false);
  const [slotDate, setSlotDate] = useState("");
  const [slotTime, setSlotTime] = useState("");
  const [deliveryId, setDeliveryId] = useState("");
  const [paymentId, setPaymentId] = useState("");
  const [acceptTerms, setAcceptTerms] = useState(false);
  const [agreeData, setAgreeData] = useState(false);
  const [sending, setSending] = useState(false);

  // which shop site the dev proxy talks to ("" — the proxy's default)
  const [site, setSite] = useState(() => {
    if (typeof document === "undefined") return "";
    const m = new RegExp(`(?:^|;\\s*)${SITE_COOKIE}=([^;]+)`).exec(
      document.cookie,
    );
    return m ? decodeURIComponent(m[1]) : "";
  });
  const [skipped, setSkipped] = useState<string[]>([]);
  const [siteNote, setSiteNote] = useState("");
  const picked = useRef(false);
  const synced = useRef("");
  const deliveryKey = `${site}|${country}|${city}|${area}`;
  const paymentsKey = `${deliveryId}|${deliveryKey}`;
  const totalsKey = `${deliveryId}|${paymentId}|${deliveryKey}`;
  const cartKey = useMemo(
    () => cart.map((l) => `${l.coralId}:${l.qty}`).join(","),
    [cart],
  );

  // a first render may have used a stale cart snapshot — re-read the storage
  useEffect(() => {
    refreshCart();
  }, []);

  // an empty cart starts with the default product (checked in the storage
  // itself, so a not-yet-hydrated render cannot add a second one)
  useEffect(() => {
    try {
      const raw = window.localStorage.getItem("coralclub.cart");
      const lines = raw ? (JSON.parse(raw) as unknown) : [];
      if (Array.isArray(lines) && lines.length > 0) return;
    } catch {
      /* storage unavailable — fall through and seed the default */
    }
    const ru = LANDING_PRODUCTS_RU[DEFAULT_SLUG];
    if (!ru) return;
    addItem({
      coralId: ru.ruId,
      slug: DEFAULT_SLUG,
      name: fullTitle(DEFAULT_SLUG),
      price: formatRub(ru.priceRub.club),
    });
  }, []);

  // 1) our cart → the shop's session cart; 2) location + delivery options
  useEffect(() => {
    const key = `${site}|${cartKey}`;
    if (!cart.length || synced.current === key) return;
    synced.current = key;
    let cancelled = false;
    // syncs run strictly one after another and a superseded run is skipped:
    // overlapping syncs would clear / refill the same shop cart
    syncChain = syncChain.then(async () => {
      if (cancelled) return;
      setReady("sync");
      setError("");
      try {
        const sk = await syncShopCart(cart, site || "coralclub.ru");
        setSkipped(sk);
        if (cancelled) return;
        if (sk.length >= cart.length) {
          // none of the cart's products is sold on this site
          setReady("error");
          setError(
            `На сайте ${site || "coralclub.ru"} не продаётся ничего из вашей корзины.`,
          );
          return;
        }
        const locText = await (
          await shopFetch(site, "/restApi/v4/location/getLocation?language=ru")
        ).text();
        let loc: { city?: string; area?: string } = {};
        try {
          loc = JSON.parse(locText);
        } catch {
          /* no location — the picked / default city is used */
        }
        const c = loc.city || "Москва";
        const a = loc.area || c;
        const init = await api<{
          result?: {
            CUR_LOCATION?: { CODE?: string; ALPHA2?: string };
            CHECKOUT_OPTIONS?: {
              countries?: Record<string, string>;
              moscowDeliveryTimes?: TimeTable;
              spbDeliveryTimes?: TimeTable;
            };
          };
        }>("/init", {}, site);
        if (cancelled) return;
        if (!init.result?.CUR_LOCATION && site && site !== "coralclub.ru") {
          // that regional site did not answer — fall back to the main one
          document.cookie = `${SITE_COOKIE}=coralclub.ru; path=/; max-age=86400`;
          setSiteNote(`Сайт ${site} не ответил, показан coralclub.ru`);
          setSite("coralclub.ru");
          return;
        }
        setSiteNote("");
        const list = init.result?.CHECKOUT_OPTIONS?.countries;
        if (list && Object.keys(list).length) setCountries(list);
        setTimeTables({
          moscow: init.result?.CHECKOUT_OPTIONS?.moscowDeliveryTimes,
          spb: init.result?.CHECKOUT_OPTIONS?.spbDeliveryTimes,
        });
        // some sites report their code as "BY_BY", the UAE one as "OT"
        // (other territories) — ALPHA2 is the real country there
        const cur = init.result?.CUR_LOCATION;
        const siteCountry = (cur?.ALPHA2 || cur?.CODE)?.split("_")[0];
        if (siteCountry) {
          setShopCountry(siteCountry);
          if (!picked.current) setCountry(siteCountry);
        }
        if (!picked.current) {
          // the geo-detected city belongs to the visitor's IP, not to the
          // site's country — outside Russia start from that country's city
          const start =
            siteCountry && siteCountry !== "RU"
              ? (DEFAULT_CITY[siteCountry] ?? list?.[siteCountry] ?? c)
              : c;
          setCity(start);
          setCityDraft(start);
          setArea(start === c ? a : start);
        }
        setReady("ok");
      } catch (e) {
        if (!cancelled) {
          setReady("error");
          setError(
            `Не удалось связаться с магазином (${e instanceof Error ? e.message : String(e)}). Страница работает только на coralclub.ru или через локальный прокси — проверьте, что npm run dev:proxy запущен.`,
          );
          console.error(e);
        }
      }
    });
    return () => {
      cancelled = true;
    };
  }, [cart, cartKey, site]);

  // delivery options for the chosen country / city
  useEffect(() => {
    if (ready !== "ok" || !city.trim()) return;
    let cancelled = false;
    api<{ result?: DeliveryGroup[]; error?: string }>(
      "/delivery",
      {
        COUNTRY: country,
        CITY: city,
        AREA: area,
      },
      site,
    ).then((d) => {
      if (cancelled) return;
      const list = Array.isArray(d.result)
        ? d.result.map((g) => ({
            ...g,
            ITEMS: Array.isArray(g.ITEMS) ? g.ITEMS : [],
          }))
        : [];
      setGroups(list);
      setDeliveryLoadedKey(deliveryKey);
      setDeliveryError(list.length ? "" : d.error || "Нет способов доставки");
      const all = list.flatMap((g) => g.ITEMS);
      setDeliveryId((cur) =>
        all.some((i) => i.ID === cur)
          ? cur
          : (list.find((g) => g.ID === "COURIER")?.ITEMS[0]?.ID ??
            all[0]?.ID ??
            ""),
      );
      if (!list.length) {
        setPayments([]);
        setPaymentId("");
        setTotals(null);
      }
    });
    return () => {
      cancelled = true;
    };
  }, [country, city, area, ready, site, deliveryKey]);

  const activeItem = groups
    .flatMap((g) => g.ITEMS)
    .find((i) => i.ID === deliveryId);

  // payments of the chosen delivery
  useEffect(() => {
    if (!deliveryId || ready !== "ok") return;
    let cancelled = false;
    api<{ result?: PayMethod[] }>(
      "/payments",
      {
        deliveryId,
        COUNTRY: country,
        CITY: city,
        AREA: area,
      },
      site,
    ).then((p) => {
      if (cancelled) return;
      const list = Array.isArray(p.result) ? p.result : [];
      setPayments(list);
      setPaymentsLoadedKey(paymentsKey);
      setPaymentId((cur) =>
        list.some((x) => x.ID === cur) ? cur : (list[0]?.ID ?? ""),
      );
    });
    return () => {
      cancelled = true;
    };
  }, [deliveryId, country, city, area, ready, site, paymentsKey]);

  const profile = useCallback(
    () => ({
      COUNTRY: country,
      COUNTRY_NAME: countries[country] ?? country,
      CITY: city,
      AREA: area,
      STREET: street,
      BUILD: build,
      APARTMENT: apartment,
      POSTINDEX: postindex,
      DELIVERY_TYPE: activeItem?.TYPE ?? "COURIER",
      EMAIL: email,
      FIO: fio,
      PHONE: phone.replace(/[^0-9+]/g, ""),
    }),
    [
      country,
      countries,
      city,
      area,
      street,
      build,
      apartment,
      postindex,
      activeItem,
      email,
      fio,
      phone,
    ],
  );

  // totals: re-read on every change of delivery / payment / address
  useEffect(() => {
    if (!deliveryId || !paymentId || ready !== "ok") return;
    let cancelled = false;
    const t = setTimeout(() => {
      api<{ result?: Totals; error?: string }>(
        "/order",
        {
          bonusUseValue: 0,
          promo: "",
          deliveryId,
          paymentId,
          pickPoint: false,
          COUNTRY: country,
          CITY: city,
          AREA: area,
          PROFILE: profile(),
          dutyEnabled: true,
        },
        site,
      ).then((r) => {
        if (cancelled) return;
        if (r.result) setTotals(r.result);
        setTotalsLoadedKey(totalsKey);
      });
    }, 250);
    return () => {
      cancelled = true;
      clearTimeout(t);
    };
  }, [
    deliveryId,
    paymentId,
    country,
    city,
    area,
    profile,
    ready,
    site,
    totalsKey,
  ]);

  const valid =
    fio.trim().length > 2 &&
    phone.replace(/\D/g, "").length >= 10 &&
    /\S+@\S+\.\S+/.test(email) &&
    street.trim() !== "" &&
    build.trim() !== "" &&
    postindex.trim().length >= 5 &&
    deliveryId !== "" &&
    activeItem?.TYPE !== "PICK_POINT" &&
    paymentId !== "" &&
    acceptTerms &&
    agreeData;

  // the only place that creates a real order — runs on the shopper's click
  async function submit() {
    if (!valid || sending) return;
    setSending(true);
    setError("");
    try {
      const body = {
        deliveryId,
        paymentId,
        EMAIL: email,
        FIO: fio,
        PHONE: phone.replace(/[^0-9+]/g, ""),
        PROFILE: {
          ...profile(),
          MANUAL: 1,
          ...(comment ? { COMMENT: comment } : {}),
        },
        // the shopper's two consents, exactly as the shop's own form sends them
        additionalOrderInfo: {
          orderComment: comment,
          needToContact: false,
          contactMethod: "",
          chosenMessenger: "",
          receiveEmails: false,
          acceptTerms,
          acceptTerms2: false,
          agreePersonalData: agreeData,
        },
        ...(slot && chosenTime
          ? {
              DELIVERY_DATE: slot.date,
              DELIVERY_FROM: chosenTime.split("-")[0],
              DELIVERY_TO: chosenTime.split("-")[1],
            }
          : {}),
        dutyEnabled: true,
      };
      const r = await shopFetch(site, `/sv-api/order?language=ru`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = (await r.json()) as {
        result?: string | number;
        error?: string;
      };
      if (data.result) {
        // the shop's own payment page → payment gateway
        window.location.assign(`/order/payment/${data.result}/?new_checkout=1`);
        return;
      }
      setError(data.error || "Магазин не принял заказ. Проверьте данные.");
    } catch (e) {
      console.error(e);
      setError("Не удалось отправить заказ.");
    }
    setSending(false);
  }

  const symbol = CURRENCY[shopCountry] ?? "€";
  const fmt = (n: number) => formatRub(n).replace("₽", symbol);
  const money = (v: unknown) => {
    const n = priceValue(String(v ?? ""));
    return n > 0 ? fmt(n) : "—";
  };
  const num = (v: unknown) =>
    parseFloat(
      String(v ?? "")
        .replace(/\s/g, "")
        .replace(",", "."),
    ) || 0;

  const deliveryPrice =
    totals && totals.TOTAL_PRICE !== undefined && totals.PRICE !== undefined
      ? num(totals.TOTAL_PRICE) - num(totals.PRICE)
      : null;

  const allItems = groups.flatMap((g) =>
    g.ITEMS.map((it) => ({ ...it, group: g.NAME })),
  );
  const pickup = activeItem?.TYPE === "PICK_POINT";

  // date & time of the courier — Moscow and St Petersburg, like on the site
  const cityKind =
    country === "RU" && /москва|moscow/i.test(city)
      ? "moscow"
      : country === "RU" && /петербург|petersburg|spb/i.test(city)
        ? "spb"
        : null;
  const isCourier = activeItem?.TYPE === "COURIER";
  const slots =
    cityKind && isCourier
      ? buildSlots(timeTables[cityKind], {
          express: activeItem?.ID === EXPRESS_SERVICE,
          mkad: !outsideMkad,
        })
      : [];
  const slot = slots.find((x) => x.date === slotDate) ?? slots[0];
  const slotTimes = slot?.times ?? [];
  const chosenTime = slotTimes.includes(slotTime) ? slotTime : slotTimes[0];

  // loaders: the site is being switched / the cart synced, or a block still
  // shows data of an earlier country
  const switching = cart.length > 0 && (ready === "idle" || ready === "sync");
  const deliveryLoading =
    switching ||
    (ready === "ok" && city.trim() !== "" && deliveryLoadedKey !== deliveryKey);
  const paymentsLoading =
    deliveryLoading ||
    (ready === "ok" && deliveryId !== "" && paymentsLoadedKey !== paymentsKey);
  const totalsLoading =
    paymentsLoading ||
    (ready === "ok" &&
      deliveryId !== "" &&
      paymentId !== "" &&
      totalsLoadedKey !== totalsKey);

  return (
    <main className={styles.page}>
      <div className={styles.shell}>
        <aside className={styles.aside}>
          <h2 className={styles.h2}>Тест: страна доставки</h2>
          <label className={styles.field}>
            Страна
            <select
              value={country}
              onChange={(e) => {
                const code = e.target.value;
                // no known city: the shop accepts the country name (or any city) —
                // an empty city would leave the delivery list unrequested
                const c = DEFAULT_CITY[code] ?? countries[code] ?? code;
                picked.current = true;
                const host = siteFor(code);
                if (host && host !== (site || "coralclub.ru")) {
                  // that country has its own shop site: switch the proxy to it
                  document.cookie = `${SITE_COOKIE}=${host}; path=/; max-age=86400`;
                  setReady("idle");
                  setGroups([]);
                  setPayments([]);
                  setTotals(null);
                  setSite(host);
                }
                setCountry(code);
                setCity(c);
                setArea(c);
                setCityDraft(c);
              }}
            >
              {Object.entries(countries)
                .sort((a, b) => a[1].localeCompare(b[1], "ru"))
                .map(([code, name]) => (
                  <option key={code} value={code}>
                    {name} ({code})
                  </option>
                ))}
            </select>
          </label>
          <label className={styles.field}>
            Город
            <input
              value={cityDraft}
              onChange={(e) => setCityDraft(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  setCity(cityDraft.trim());
                  setArea(cityDraft.trim());
                }
              }}
            />
          </label>
          <button
            type="button"
            className={styles.apply}
            onClick={() => {
              setCity(cityDraft.trim());
              setArea(cityDraft.trim());
            }}
          >
            Применить
          </button>
          <dl className={styles.debug}>
            <div>
              <dt>Сайт магазина</dt>
              <dd>{ready === "idle" ? "…" : site || "по умолчанию"}</dd>
            </div>
            <div>
              <dt>Способов доставки</dt>
              <dd>{allItems.length}</dd>
            </div>
            <div>
              <dt>Способов оплаты</dt>
              <dd>{payments.length}</dd>
            </div>
            {totals &&
              ["PRICE", "TOTAL_PRICE", "FULL_PRICE", "DUTY", "TAX"].map((k) => (
                <div key={k}>
                  <dt>{k}</dt>
                  <dd>{String(totals[k] ?? "—")}</dd>
                </div>
              ))}
          </dl>
          {deliveryError && <p className={styles.error}>{deliveryError}</p>}
        </aside>
        <div className={styles.wrap}>
          <div className={styles.top}>
            <BackButton className={styles.back} fallbackHref="/landing/" />
            <h1 className={styles.h1}>Оформление заказа</h1>
          </div>

          {ready === "sync" && <p className={styles.muted}>Готовим заказ…</p>}
          {error && <p className={styles.error}>{error}</p>}
          {siteNote && <p className={styles.error}>{siteNote}</p>}
          {skipped.length > 0 && (
            <p className={styles.error}>
              На этом сайте нет: {skipped.join(", ")}. Эти позиции в заказ не
              попали.
            </p>
          )}

          <section className={styles.card}>
            <h2 className={styles.h2}>Ваш заказ</h2>
            {cart.length === 0 && (
              <p className={styles.muted}>
                Корзина пуста. Добавьте товары на{" "}
                <Link href="/landing/" className={styles.link}>
                  главной лендинга
                </Link>
                .
              </p>
            )}
            <ul className={styles.lines}>
              {cart.map((l) => (
                <li key={l.coralId}>
                  <span>{l.name}</span>
                  <span>× {l.qty}</span>
                </li>
              ))}
            </ul>
          </section>

          <section className={styles.card}>
            <h2 className={styles.h2}>Получатель</h2>
            <FloatInput
              label="ФИО"
              placeholder="Иванов Иван Иванович"
              value={fio}
              onChange={setFio}
              onBlur={() => touch("fio")}
              error={
                touched.fio && fio.trim().length < 3 ? "Введите ФИО" : undefined
              }
              autoComplete="name"
            />
            <FloatInput
              label="Телефон"
              placeholder="+7 900 000-00-00"
              value={phone}
              onChange={setPhone}
              onBlur={() => touch("phone")}
              error={
                touched.phone && phone.replace(/\D/g, "").length < 10
                  ? "Введите телефон"
                  : undefined
              }
              inputMode="tel"
              autoComplete="tel"
            />
            <FloatInput
              label="Email"
              placeholder="name@example.com"
              value={email}
              onChange={setEmail}
              onBlur={() => touch("email")}
              error={
                touched.email && !/\S+@\S+\.\S+/.test(email)
                  ? "Введите email"
                  : undefined
              }
              inputMode="email"
              autoComplete="email"
            />
          </section>

          <section className={styles.card}>
            <h2 className={styles.h2}>Способ доставки</h2>
            <p className={styles.muted}>
              {countries[country] ?? country}, {city || "город не указан"}
            </p>
            {deliveryLoading && (
              <p className={styles.loader} role="status">
                <span className={styles.spinner} aria-hidden="true" />
                Загружаем способы доставки…
              </p>
            )}
            {deliveryLoading ? null : allItems.length > 0 ? (
              <div className={styles.options}>
                {allItems.map((it) => (
                  <label key={it.ID} className={styles.option}>
                    <input
                      type="radio"
                      name="delivery"
                      checked={deliveryId === it.ID}
                      onChange={() => setDeliveryId(it.ID)}
                    />
                    <span>
                      {it.NAME || it.group}
                      {it.TRANSIT ? ` · ${it.TRANSIT} дн.` : ""}
                      <small>
                        {it.PRICE ? fmt(it.PRICE) : "бесплатно"}
                        {it.FREE_DELIVERY
                          ? `, бесплатно от ${fmt(it.FREE_DELIVERY)}`
                          : ""}
                      </small>
                    </span>
                  </label>
                ))}
              </div>
            ) : (
              <p className={styles.muted}>
                Для этой страны и города магазин не вернул способов доставки.
              </p>
            )}
            {pickup && (
              <p className={styles.muted}>
                Для самовывоза нужен выбор пункта выдачи — в прототипе пока не
                сделан, можно смотреть расчёт и способы оплаты.
              </p>
            )}
            {slots.length > 0 && (
              <div className={styles.slots}>
                <h3 className={styles.h3}>Дата и время доставки</h3>
                <div
                  className={styles.chips}
                  role="radiogroup"
                  aria-label="День доставки"
                >
                  {slots.map((x) => (
                    <button
                      key={x.date}
                      type="button"
                      role="radio"
                      aria-checked={slot?.date === x.date}
                      className={`${styles.chip} ${
                        slot?.date === x.date ? styles.chipOn : ""
                      }`}
                      onClick={() => setSlotDate(x.date)}
                    >
                      {x.chip}
                    </button>
                  ))}
                </div>
                <div
                  className={styles.chips}
                  role="radiogroup"
                  aria-label="Время доставки"
                >
                  {slotTimes.map((t) => (
                    <button
                      key={t}
                      type="button"
                      role="radio"
                      aria-checked={chosenTime === t}
                      className={`${styles.chip} ${
                        chosenTime === t ? styles.chipOn : ""
                      }`}
                      onClick={() => setSlotTime(t)}
                    >
                      {t.replace("-", " — ")}
                    </button>
                  ))}
                </div>
                {cityKind === "moscow" &&
                  activeItem?.ID !== EXPRESS_SERVICE && (
                    <label className={styles.check}>
                      <input
                        type="checkbox"
                        checked={outsideMkad}
                        onChange={(e) => setOutsideMkad(e.target.checked)}
                      />
                      <span>Адрес за МКАД (другие интервалы)</span>
                    </label>
                  )}
              </div>
            )}
          </section>

          <section className={styles.card}>
            <h2 className={styles.h2}>Адрес доставки</h2>
            <FloatInput
              label="Улица"
              placeholder="Например, Тверская"
              value={street}
              onChange={setStreet}
              onBlur={() => touch("street")}
              error={
                touched.street && street.trim() === ""
                  ? "Введите улицу"
                  : undefined
              }
              autoComplete="address-line1"
            />
            <div className={styles.row}>
              <FloatInput
                label="Дом"
                placeholder="12"
                value={build}
                onChange={setBuild}
                onBlur={() => touch("build")}
                error={
                  touched.build && build.trim() === ""
                    ? "Введите дом"
                    : undefined
                }
              />
              <FloatInput
                label="Квартира"
                placeholder="34"
                value={apartment}
                onChange={setApartment}
              />
              <FloatInput
                label="Индекс"
                placeholder="101000"
                value={postindex}
                onChange={setPostindex}
                onBlur={() => touch("postindex")}
                error={
                  touched.postindex && postindex.trim().length < 5
                    ? "Введите индекс"
                    : undefined
                }
                inputMode="numeric"
                autoComplete="postal-code"
              />
            </div>
            <FloatInput
              label="Комментарий курьеру"
              placeholder="Код домофона, ориентир…"
              value={comment}
              onChange={setComment}
            />
          </section>

          <section className={styles.card}>
            <h2 className={styles.h2}>Оплата</h2>
            {paymentsLoading && (
              <p className={styles.loader} role="status">
                <span className={styles.spinner} aria-hidden="true" />
                Загружаем способы оплаты…
              </p>
            )}
            <div className={styles.options}>
              {(paymentsLoading ? [] : payments).map((p) => (
                <label key={p.ID} className={styles.option}>
                  <input
                    type="radio"
                    name="payment"
                    checked={paymentId === p.ID}
                    onChange={() => setPaymentId(p.ID)}
                  />
                  <span>{p.NAME}</span>
                </label>
              ))}
            </div>
          </section>

          <section className={styles.card}>
            <h2 className={styles.h2}>Итого</h2>
            {totalsLoading && (
              <p className={styles.loader} role="status">
                <span className={styles.spinner} aria-hidden="true" />
                Считаем стоимость…
              </p>
            )}
            <dl
              className={`${styles.totals} ${totalsLoading ? styles.dim : ""}`}
            >
              <div>
                <dt>Товары</dt>
                <dd>{totals ? money(totals.PRICE) : "—"}</dd>
              </div>
              <div>
                <dt>Доставка</dt>
                <dd>
                  {deliveryPrice === null
                    ? "—"
                    : deliveryPrice > 0
                      ? fmt(deliveryPrice)
                      : "бесплатно"}
                </dd>
              </div>
              <div className={styles.grand}>
                <dt>К оплате</dt>
                <dd>{totals ? money(totals.TOTAL_PRICE) : "—"}</dd>
              </div>
            </dl>
            <label className={styles.check}>
              <input
                type="checkbox"
                checked={acceptTerms}
                onChange={(e) => setAcceptTerms(e.target.checked)}
              />
              <span>
                Я принимаю{" "}
                <a href="/faq/terms/" target="_blank" rel="noopener noreferrer">
                  условия использования сервиса
                </a>{" "}
                и{" "}
                <a
                  href="/faq/privacy/"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  политику конфиденциальности
                </a>
              </span>
            </label>
            <label className={styles.check}>
              <input
                type="checkbox"
                checked={agreeData}
                onChange={(e) => setAgreeData(e.target.checked)}
              />
              <span>
                Даю согласие на{" "}
                <a
                  href="/faq/personalinformation/"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  обработку персональных данных
                </a>
              </span>
            </label>
            <button
              type="button"
              className={styles.pay}
              disabled={!valid || sending || ready !== "ok" || totalsLoading}
              onClick={submit}
            >
              {sending ? "Создаём заказ…" : "Перейти к оплате"}
            </button>
            <p className={styles.muted}>
              После нажатия создаётся заказ в магазине и открывается страница
              оплаты.
            </p>
          </section>
        </div>
      </div>
    </main>
  );
}
