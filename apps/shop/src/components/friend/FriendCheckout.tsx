"use client";

import Image from "next/image";
import Link from "next/link";
import {
  useEffect,
  useMemo,
  useRef,
  useState,
  useSyncExternalStore,
} from "react";
import { asset } from "@/lib/asset";
import { track, trackOnce } from "@/lib/analytics";
import { summarize } from "@/lib/analyticsRu";
import { refreshCart, useCart } from "@/lib/cart";
import { formatMoney, friendProductById } from "@/lib/friendCatalog";
import {
  deliverySlots,
  isMoscow,
  slotRegion,
  type DeliveryTimes,
} from "@/lib/deliverySlots";
import { shopBasketUrl } from "@/lib/friend";
import { articleFor } from "@/lib/siteArticles";
import { getGatewayTarget, goToGateway } from "@/lib/shopPay";
import { currentPricing, pricingFor } from "@/lib/friendPricing";
import {
  friendSiteList,
  onCountryRequest,
  rememberFriendCountries,
  setFriendCountry,
  useFriendCountries,
  useFriendCountry,
  useMultiSite,
} from "@/lib/friendCountry";
import { MARKET, REGIONS, phoneForShop } from "@/lib/market";
import { SHOP_SITES, orderPaymentPath } from "@/lib/shopSites";
import { readContact, saveContact } from "@/lib/friendContact";
import {
  apiLanguageFor,
  getFriendLang,
  tr,
  useFriendLang,
} from "@/lib/friendLang";
import { friendForm, friendName } from "@/lib/friendRu";
import { MAP_RU, PICKUP_RU } from "@/components/checkout/labels";
import {
  api,
  emptyShopBasket,
  enqueueBasketSync,
  fillShopBasket,
  language,
  onShopOrigin,
  setShopLanguage,
  setShopSite,
  shopFetch,
} from "@/lib/shopApi";
import {
  AddressSearch,
  CourierSlots,
  DeliveryModeSwitch,
  MapPicker,
  PickupPointButton,
  PickupSheet,
  StateCombobox,
  type PickPoint,
} from "@/components/checkout";
import {
  splitStreet,
  streetLine,
  type ResolvedAddress,
} from "@/lib/addressSearch";
import { useAddressSearchEnabled } from "@/lib/useAddressSearch";
import {
  FloatInput,
  OptionCard,
  OptionCards,
  OptionInfo,
  Icon,
} from "@/components/ui";
import { CardBadges } from "./PayBadges";
import { useFriend } from "./FriendProvider";
import co from "../landing/LandingCheckout.module.css";
import styles from "@/components/checkout/CheckoutPage.module.css";
import extra from "@/components/checkout/CheckoutExtras.module.css";

/**
 * The project's real checkout (Germany, see lib/market.ts): the visitor's cart is put into the shop's
 * own basket tied to the friend's REF_CODE (member prices, no sign-up, the
 * sale is counted for that member), then delivery, payment and totals are read
 * from the shop's checkout API, and the order is created on the shopper's
 * click — followed by the shop's own payment page.
 *
 * It needs the shop's origin (the shop's own domain, or `npm run dev:proxy` →
 * http://localhost:3200/friend/checkout/). Anywhere else it falls back to
 * handing the cart to the shop's basket page.
 */

type PayMethod = {
  ID: string;
  NAME: string;
  DESCRIPTION?: string | null;
  IMAGE?: string | null;
};
type DeliveryItem = {
  ID: string;
  NAME: string;
  TYPE: string;
  TRANSIT?: string;
  PRICE?: number;
  FREE_DELIVERY?: number;
};
type DeliveryGroup = { ID: string; NAME: string; ITEMS: DeliveryItem[] };
type Totals = Record<string, string | number | null | undefined>;
const num = (v: unknown) =>
  parseFloat(
    String(v ?? "")
      .replace(/\s/g, "")
      .replace(",", "."),
  ) || 0;

const paymentTypeCode = (name: string) =>
  /paypal/i.test(name)
    ? "paypal"
    : /transfer|invoice|überweis|перевод/i.test(name)
      ? "bank_transfer"
      : "bank_card";

/** The shop's own picture (a method logo): a path of the shop's site gets its host, so it loads off the shop's domain too. */
const shopAsset = (src: string, site: string): string =>
  src.startsWith("/") && !src.startsWith("//") ? `https://${site}${src}` : src;

/** Latin letters, digits and the usual symbols only: a look-alike Cyrillic letter in an address breaks the payment gateway. */
const EMAIL_RE = /^[\x21-\x7E]+@[\x21-\x7E]+\.[\x21-\x7E]+$/;

const Chevron = () => <Icon name="down" size={16} />;

export function FriendCheckout() {
  const lang = useFriendLang();
  const ru = lang === "ru";
  /** text in the page's language */
  const T = (en: string, ruText: string) => tr(lang, en, ruText);
  const cart = useCart();
  // a render can run on a stale snapshot: re-read the cart once on mount
  useEffect(() => refreshCart(), []);

  const { friend, source } = useFriend();
  const refCode = friend?.refCode ?? "";
  const memberId = friend?.memberId ?? "";

  // only what this project sells (the cart is shared with other prototypes)
  const lines = useMemo(
    () => cart.filter((l) => friendProductById(l.coralId) && l.qty > 0),
    [cart],
  );
  const cartKey = lines.map((l) => `${l.coralId}:${l.qty}`).join(",");
  const goods = useMemo(() => summarize(lines), [lines]);

  /** `null` until the first render on the client (SSR has no window). */
  const live = useSyncExternalStore<boolean | null>(
    () => () => {},
    onShopOrigin,
    () => null,
  );

  const [ready, setReady] = useState<"idle" | "sync" | "ok" | "error">("idle");
  const [error, setError] = useState("");
  // what the shop counted for the basket (the country's own currency), before the delivery is known
  const [basketSum, setBasketSum] = useState(0);
  const [missing, setMissing] = useState<string[]>([]);

  const [email, setEmail] = useState("");
  // one «Full name» field; first and last name are its parts: the first word
  // and the rest (the shop gets the whole name, the saved contact the parts)
  const [fullName, setFullName] = useState("");
  const nameWords = fullName.trim().split(/\s+/).filter(Boolean);
  const first = nameWords[0] ?? "";
  const last = nameWords.slice(1).join(" ");
  const [phone, setPhone] = useState("");
  const [state, setState] = useState("");
  const [city, setCity] = useState("");
  const [cityDraft, setCityDraft] = useState("");
  const [address, setAddress] = useState(""); // street and house number
  const [apartment, setApartment] = useState("");
  const [mapOpen, setMapOpen] = useState(false);
  // one search line by default; the separate fields are filled in the
  // background from the picked address and only shown for manual entry.
  // A key arriving from the gateway mid-page flips to search unless the
  // shopper has already switched by hand.
  const searchOn = useAddressSearchEnabled();
  const [manualChoice, setManual] = useState<boolean | null>(null);
  const manual = manualChoice ?? !searchOn;
  const [picked, setPicked] = useState(false);
  const [searchText, setSearchText] = useState("");
  const { street, build } = splitStreet(address);
  const addressLine = (st: string, plz: string, town: string) =>
    `${st}, ${plz} ${town}`;
  const [zip, setZip] = useState("");
  // the country the order goes to: the shop prices delivery and payment by it
  const country = useFriendCountry();
  const countries = useFriendCountries();
  // Through the local proxy every country has a shop site of its own (with its
  // own delivery, payment methods and currency); on the shop's own domain there
  // is the one site, and its own list of countries.
  // every country of the list has its own shop site (through our gateway or the local proxy)
  const multiSite = useMultiSite();
  const countryMap = useMemo<Record<string, string>>(
    () => (multiSite ? friendSiteList() : countries),
    [multiSite, countries],
  );
  // Russia: the courier's days and hours (from the shop's /init) and the shopper's pick
  const [slotCfg, setSlotCfg] = useState<{
    moscow?: DeliveryTimes;
    spb?: DeliveryTimes;
  }>({});
  const [slotDate, setSlotDate] = useState("");
  const [slotTime, setSlotTime] = useState("");
  const countryName = countryMap[country] ?? MARKET.country;
  const site = multiSite
    ? (SHOP_SITES[country]?.host ?? MARKET.site)
    : MARKET.site;
  // the calls go to the site of the country
  useEffect(() => {
    setShopSite(site);
    setShopLanguage(country === "RU" ? "ru" : null);
  }, [site, country]);

  // the countries the shop ships to (its own list for this site); asked once
  // the basket is in, and again a moment later if the shop is not ready yet
  useEffect(() => {
    if (!live || ready !== "ok") return;
    let alive = true;
    let timer: ReturnType<typeof setTimeout> | undefined;
    const ask = (left: number) => {
      api<{
        result?: {
          COUNTRIES_FILTERED?: Record<string, string>;
          CHECKOUT_OPTIONS?: {
            moscowDeliveryTimes?: DeliveryTimes;
            spbDeliveryTimes?: DeliveryTimes;
          };
        };
      }>("/init")
        .then((d) => {
          if (!alive) return;
          // the courier schedules of Russia sit in the checkout options
          setSlotCfg({
            moscow: d.result?.CHECKOUT_OPTIONS?.moscowDeliveryTimes,
            spb: d.result?.CHECKOUT_OPTIONS?.spbDeliveryTimes,
          });
          const list = Object.entries(
            d.result?.COUNTRIES_FILTERED ?? {},
          ).filter(([code]) => /^[A-Z]{2}$/.test(code));
          if (list.length) rememberFriendCountries(Object.fromEntries(list));
          else if (left > 0) timer = setTimeout(() => ask(left - 1), 1500);
        })
        .catch(() => {
          if (alive && left > 0) timer = setTimeout(() => ask(left - 1), 1500);
        });
    };
    ask(3);
    return () => {
      alive = false;
      clearTimeout(timer);
    };
  }, [live, ready]);
  const [acceptTerms, setAcceptTerms] = useState(false);
  const [agreeData, setAgreeData] = useState(false);

  const [groups, setGroups] = useState<DeliveryGroup[]>([]);
  // courier to an address, or a pick-up point
  const [mode, setMode] = useState<"courier" | "pickup">("courier");
  // the courier service the shopper picked (the pick-up service is only one)
  const [deliveryChoice, setDeliveryChoice] = useState("");
  const [points, setPoints] = useState<PickPoint[]>([]);
  const [pointsFor, setPointsFor] = useState("");
  const [pointCode, setPointCode] = useState("");
  const [sheetOpen, setSheetOpen] = useState(false);
  const [deliveryErr, setDeliveryErr] = useState("");
  const [payments, setPayments] = useState<PayMethod[]>([]);
  const [paymentId, setPaymentId] = useState("");
  const [totals, setTotals] = useState<Totals | null>(null);
  // which request each block shows the answer of (for the loaders)
  const [deliveryFor, setDeliveryFor] = useState("");
  const [paymentsFor, setPaymentsFor] = useState("");
  const [totalsFor, setTotalsFor] = useState("");

  // Delivery and payment wait for the address in every country: until it is
  // chosen, both blocks show «Choose your address…» (the shop prices them by place).
  const byPlace = true;
  const placeCity = byPlace ? city || state : "";
  const placeArea = byPlace ? state : "";
  const cityForShop = city || state;
  const place = byPlace
    ? placeCity
      ? `${country}|${placeCity}|${state}`
      : ""
    : country;
  const deliveryKey = `${cartKey}|${place}`;

  // courier services and the pick-up service come in separate groups
  // the cheapest service first, so that it is the one chosen by default
  // Moscow's same-day service is offered only while the day's cut-off has not passed
  const expressOff =
    country === "RU" &&
    isMoscow(city) &&
    !!slotCfg.moscow &&
    deliverySlots(slotCfg.moscow, { express: true, mkad: true, lang })
      .length === 0;
  const courierItems = groups
    .filter((g) => g.ID !== "PICK_POINT")
    .flatMap((g) => g.ITEMS)
    .filter((i) => !(expressOff && i.ID === "I_COURIER_1DAY"))
    .sort((a, b) => (a.PRICE ?? 0) - (b.PRICE ?? 0));
  const pickupItems = groups
    .filter((g) => g.ID === "PICK_POINT")
    .flatMap((g) => g.ITEMS);
  // pick-up needs a site that has it; a site with nothing else sends everyone there
  // the site answered for this place and has no pick-up: there is nothing to switch to
  const pickupNone = deliveryFor === deliveryKey && pickupItems.length === 0;
  const pickup =
    !pickupNone &&
    (mode === "pickup" ||
      (courierItems.length === 0 && pickupItems.length > 0));
  const items = pickup ? pickupItems : courierItems;
  const chosenPoint = pickup
    ? points.find((p) => p.CODE === pointCode)
    : undefined;
  const deliveryId = pickup
    ? pickupItems.some((i) => i.ID === chosenPoint?.TYPE)
      ? (chosenPoint?.TYPE ?? "")
      : (pickupItems[0]?.ID ?? "")
    : courierItems.some((i) => i.ID === deliveryChoice)
      ? deliveryChoice
      : (courierItems[0]?.ID ?? "");
  const activeItem = items.find((i) => i.ID === deliveryId);
  // the courier's days and hours (Moscow, St. Petersburg), when the service has them
  const slotArea =
    country === "RU" && !pickup ? slotRegion(city, deliveryId) : null;
  const slotDays = slotArea
    ? deliverySlots(slotArea === "moscow" ? slotCfg.moscow : slotCfg.spb, {
        express: deliveryId === "I_COURIER_1DAY",
        mkad: true,
        lang,
      })
    : [];
  const slotDay = slotDays.find((d) => d.date === slotDate) ?? slotDays[0];
  const slotHours = slotDay?.times.includes(slotTime)
    ? slotTime
    : slotDay?.times[0];
  const point = pickup ? points.find((p) => p.CODE === pointCode) : undefined;
  const pickPointParam = point ? point.CODE : false;

  // discount code: typed → checked with the shop → applied
  const [promoOpen, setPromoOpen] = useState(false);
  const [promoDraft, setPromoDraft] = useState("");
  const [promo, setPromo] = useState("");
  const [promoMsg, setPromoMsg] = useState("");

  const [attempted, setAttempted] = useState(false);
  const [shaking, setShaking] = useState("");
  const shakeTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [sending, setSending] = useState(false);

  // contact details live in this browser: filled in from the last visit …
  const [contactLoaded, setContactLoaded] = useState(false);
  useEffect(() => {
    const t = setTimeout(() => {
      const c = readContact();
      if (c) {
        setEmail((v) => v || c.email);
        setFullName((v) => v || [c.first, c.last].filter(Boolean).join(" "));
        setPhone((v) => v || c.phone);
      }
      setContactLoaded(true);
    }, 0);
    return () => clearTimeout(t);
  }, []);
  // … and kept as the shopper types (for the next order and for sign-up)
  useEffect(() => {
    if (!contactLoaded) return;
    const t = setTimeout(
      () =>
        saveContact({
          first: first.trim(),
          last: last.trim(),
          phone: phone.trim(),
          email: email.trim(),
        }),
      400,
    );
    return () => clearTimeout(t);
  }, [contactLoaded, first, last, phone, email]);

  // the city is read after the shopper stops typing
  useEffect(() => {
    const t = setTimeout(() => setCity(cityDraft.trim()), 450);
    return () => clearTimeout(t);
  }, [cityDraft]);

  const paymentsKey = `${deliveryKey}|${deliveryId}`;
  const totalsKey = `${paymentsKey}|${paymentId}|${promo}|${pickup ? pointCode : ""}`;

  // 1 ─ the cart into the shop's basket, tied to the friend
  useEffect(() => {
    if (!live || !refCode || !memberId || !cartKey) return;
    // the articles of the country's own site; what it does not sell stays out
    const unsold: string[] = [];
    const wanted = cartKey.split(",").flatMap((part) => {
      const [coralId, qty] = part.split(":");
      const article = multiSite ? articleFor(country, coralId) : coralId;
      if (article === null) {
        unsold.push(friendProductById(coralId)?.name ?? coralId);
        return [];
      }
      return [{ coralId: article, qty: Number(qty) }];
    });
    const unsoldNote = unsold.length
      ? tr(
          getFriendLang(),
          `${unsold.join(", ")} ${unsold.length > 1 ? "are" : "is"} not sold on the ${countryName} site.`,
          `Нет в продаже в вашей стране: ${unsold.join(", ")}.`,
        )
      : "";
    let cancelled = false;
    enqueueBasketSync(async () => {
      // a newer run (or leaving the page) made this one stale: do nothing
      if (cancelled) return;
      if (!wanted.length) {
        setReady("error");
        setError(unsoldNote);
        return;
      }
      setReady("sync");
      setBasketSum(0);
      setError("");
      try {
        await emptyShopBasket();
        if (cancelled) return;
        await fillShopBasket(
          wanted,
          { refCode, memberId },
          site === MARKET.site ? MARKET.linkLanguage : apiLanguageFor(country),
        );
        const o = await api<{
          result?: { QUANTITY?: number | string; PRICE?: number | string };
        }>("/order");
        if (cancelled) return;
        setBasketSum(Number(o.result?.PRICE ?? 0) || 0);
        const want = wanted.reduce((n, l) => n + l.qty, 0);
        const got = Number(o.result?.QUANTITY ?? 0);
        if (got <= 0) {
          setReady("error");
          setError(
            site === MARKET.site
              ? tr(
                  getFriendLang(),
                  "The shop did not take the items from your cart.",
                  "Магазин не принял товары из корзины.",
                )
              : tr(
                  getFriendLang(),
                  `These products are not available on the ${countryName} site yet.`,
                  "Этих товаров пока нет в магазине вашей страны.",
                ),
          );
          return;
        }
        setMissing([
          ...(unsoldNote ? [unsoldNote] : []),
          ...(got < want
            ? [
                tr(
                  getFriendLang(),
                  "Some items from your cart are not available in the shop right now.",
                  "Часть товаров из корзины сейчас нет в наличии.",
                ),
              ]
            : []),
        ]);
        setReady("ok");
      } catch (e) {
        if (!cancelled) {
          setReady("error");
          setError(
            tr(
              getFriendLang(),
              "We couldn’t reach the shop. Please reload the page and try again.",
              "Не удалось связаться с магазином. Обновите страницу и попробуйте снова.",
            ),
          );
          console.error(e);
        }
      }
    });
    return () => {
      cancelled = true;
    };
  }, [live, refCode, memberId, cartKey, site, country, countryName, multiSite]);

  // begin_checkout, once, when the checkout is open with the cart in it
  useEffect(() => {
    if (ready !== "ok" || !goods.items.length) return;
    trackOnce("begin_checkout", () =>
      track(
        "begin_checkout",
        { bonus_points: goods.bonus_points },
        {
          currency: currentPricing().currency,
          value: goods.value,
          items: goods.items,
        },
      ),
    );
  }, [ready, goods]);

  // 2 ─ delivery options for the state / city
  useEffect(() => {
    if (ready !== "ok" || !place) return;
    let cancelled = false;
    api<{ result?: DeliveryGroup[]; error?: string }>("/delivery", {
      COUNTRY: country,
      CITY: placeCity,
      AREA: placeArea,
    }).then((d) => {
      if (cancelled) return;
      const list = (Array.isArray(d.result) ? d.result : [])
        .map((g) => ({ ...g, ITEMS: Array.isArray(g.ITEMS) ? g.ITEMS : [] }))
        .filter((g) => g.ITEMS.length);
      setGroups(list);
      setDeliveryFor(deliveryKey);
      setDeliveryErr(
        list.length
          ? ""
          : byPlace
            ? tr(
                getFriendLang(),
                "No delivery options for this address.",
                "Для этого адреса нет способов доставки.",
              )
            : tr(
                getFriendLang(),
                "No delivery options for this country.",
                "Для этой страны нет способов доставки.",
              ),
      );
      const all = list.flatMap((g) => g.ITEMS);
      if (!all.length) {
        setPayments([]);
        setPaymentId("");
        setTotals(null);
      }
    });
    return () => {
      cancelled = true;
    };
  }, [ready, place, country, byPlace, placeCity, placeArea, deliveryKey]);

  // 3 ─ payment methods of the chosen delivery
  useEffect(() => {
    if (ready !== "ok" || !deliveryId || !place) return;
    let cancelled = false;
    api<{ result?: PayMethod[] }>("/payments", {
      deliveryId,
      COUNTRY: country,
      CITY: placeCity,
      AREA: placeArea,
    }).then((p) => {
      if (cancelled) return;
      // «PayPal Plus» repeats «PayPal» word for word: one PayPal is enough
      const list = (Array.isArray(p.result) ? p.result : []).filter(
        (x) => !/paypal plus/i.test(x.NAME),
      );
      setPayments(list);
      setPaymentsFor(paymentsKey);
      setPaymentId((cur) =>
        list.some((x) => x.ID === cur) ? cur : (list[0]?.ID ?? ""),
      );
    });
    return () => {
      cancelled = true;
    };
  }, [ready, deliveryId, place, country, placeCity, placeArea, paymentsKey]);

  // 3b ─ pick-up points near the city (the shop answers per city)
  const pointsKey = `${state}|${city}`;
  useEffect(() => {
    if (ready !== "ok" || !pickup || !city) return;
    let cancelled = false;
    api<{ result?: PickPoint[] }>("/pickpoints", {
      COUNTRY: country,
      CITY: city,
      AREA: state,
    }).then((d) => {
      if (cancelled) return;
      setPoints(Array.isArray(d.result) ? d.result : []);
      setPointsFor(pointsKey);
    });
    return () => {
      cancelled = true;
    };
  }, [ready, pickup, country, state, city, pointsKey]);
  const pointsLoading = pickup && !!city && pointsFor !== pointsKey;

  // an address from a suggestion or from the map fills the whole form in the background
  function applyAddress(a: ResolvedAddress) {
    const st = streetLine(country, a.street, a.houseNumber);
    setAddress(st);
    setApartment(a.unit);
    setCityDraft(a.city);
    setCity(a.city);
    setState(a.state);
    setZip(a.zip);
    if (a.street && a.houseNumber && a.zip && a.city && a.state) {
      setSearchText(addressLine(st, a.zip, a.city));
      setPicked(true);
    } else {
      // something is missing: let the shopper complete it
      setManual(true);
    }
  }

  // another country: the address is for the old one, the shop recounts delivery and payment
  function changeCountry(code: string) {
    if (!code || code === country) return;
    setFriendCountry(code);
    setGroups([]);
    setPayments([]);
    setPaymentId("");
    setDeliveryChoice("");
    setTotals(null);
    setPoints([]);
    setPointsFor("");
    setPointCode("");
    setSheetOpen(false);
    setAddress("");
    setSearchText("");
    setPicked(false);
    setApartment("");
    setZip("");
    setCityDraft("");
    setCity("");
    setState("");
  }
  // the header's flag asks this page to change the country (it has work to redo)
  const changeCountryRef = useRef(changeCountry);
  useEffect(() => {
    changeCountryRef.current = changeCountry;
  });
  useEffect(
    () => onCountryRequest((code) => changeCountryRef.current(code)),
    [],
  );

  const fio = `${first.trim()} ${last.trim()}`.trim();
  const digits = phone.replace(/\D/g, "");
  const phoneShop = phoneForShop(phone, country);
  const profile = pickup
    ? {
        COUNTRY: country,
        COUNTRY_NAME: countryName,
        CITY: city || cityForShop,
        AREA: state || city,
        // what the shop's own checkout sends for a pick-up point
        STREET: point?.ADDRESS ?? "",
        DELIVERY_TYPE: activeItem?.TYPE ?? "PICK_POINT",
        PICK_POINT_SERVICE: point?.TYPE ?? "",
        PICK_POINT_CODE: point?.CODE ?? "",
        EMAIL: email.trim(),
        FIO: fio,
        PHONE: phoneShop,
      }
    : {
        COUNTRY: country,
        COUNTRY_NAME: countryName,
        CITY: city,
        AREA: state,
        STREET: street,
        BUILD: build,
        APARTMENT: apartment.trim(),
        POSTINDEX: zip.trim(),
        DELIVERY_TYPE: activeItem?.TYPE ?? "COURIER",
        EMAIL: email.trim(),
        FIO: fio,
        PHONE: phoneShop,
      };

  // 4 ─ totals, re-read on every change of delivery / payment / address / code
  const profileKey = JSON.stringify(profile);
  useEffect(() => {
    if (ready !== "ok" || !deliveryId || !paymentId || !place) return;
    let cancelled = false;
    const t = setTimeout(() => {
      api<{ result?: Totals }>("/order", {
        bonusUseValue: 0,
        promo,
        deliveryId,
        paymentId,
        pickPoint: pickPointParam,
        COUNTRY: country,
        CITY: city,
        AREA: state,
        PROFILE: JSON.parse(profileKey),
        dutyEnabled: true,
      }).then((r) => {
        if (cancelled) return;
        if (r.result) setTotals(r.result);
        setTotalsFor(totalsKey);
      });
    }, 250);
    return () => {
      cancelled = true;
      clearTimeout(t);
    };
  }, [
    ready,
    deliveryId,
    paymentId,
    place,
    country,
    city,
    state,
    promo,
    profileKey,
    pickPointParam,
    totalsKey,
  ]);

  async function applyPromo() {
    const code = promoDraft.trim();
    if (!code || !deliveryId) return;
    setPromoMsg("");
    // the order calculation answers 500 for an unknown code, so ask first
    const r = await api<{
      result?: { DISCOUNT?: number | string } | number;
      error?: string;
    }>("/promo", {
      promo: code,
      deliveryId,
      COUNTRY: country,
      CITY: city,
      AREA: state,
    });
    const discount =
      typeof r.result === "object" && r.result ? num(r.result.DISCOUNT) : 0;
    if (discount > 0) {
      setPromo(code);
      setPromoMsg("");
    } else {
      setPromo("");
      setPromoMsg(T("This code isn’t valid.", "Промокод не подходит."));
    }
  }

  // required fields in page order — the first empty one gets the shake
  const required: { key: string; bad: boolean }[] = [
    ...(pickup
      ? [
          { key: "city", bad: !city },
          { key: "point", bad: !point },
        ]
      : [
          {
            key: "address",
            bad: manual ? street === "" || build === "" : !picked,
          },
          { key: "zip", bad: zip.trim() === "" },
          { key: "city", bad: !city },
          { key: "state", bad: !state },
        ]),
    { key: "email", bad: !EMAIL_RE.test(email.trim()) },
    { key: "first", bad: first === "" || last === "" },
    { key: "phone", bad: digits.length < 6 },
    { key: "terms", bad: !acceptTerms },
    { key: "data", bad: !agreeData },
  ];
  const nonLatinEmail = /[^\x00-\x7F]/.test(email);
  const canOrder = deliveryId !== "" && paymentId !== "";

  function pointAt(key: string) {
    const el = document.querySelector<HTMLElement>(`[data-field="${key}"]`);
    if (!el) return;
    const reduce = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;
    el.scrollIntoView({
      behavior: reduce ? "auto" : "smooth",
      block: "center",
    });
    setTimeout(() => {
      const r = el.getBoundingClientRect();
      if (r.top < 0 || r.bottom > window.innerHeight) {
        el.scrollIntoView({ block: "center" });
      }
    }, 700);
    setShaking("");
    if (shakeTimer.current) clearTimeout(shakeTimer.current);
    shakeTimer.current = setTimeout(() => {
      setShaking(key);
      shakeTimer.current = setTimeout(() => setShaking(""), 600);
    }, 30);
    el.querySelector<HTMLElement>("input:not([type=checkbox]), select")?.focus({
      preventScroll: true,
    });
  }

  // the only place that creates a real order — runs on the shopper's click
  async function submit() {
    if (sending || !canOrder) return;
    const gaps = required.filter((f) => f.bad);
    if (gaps.length) {
      setAttempted(true);
      pointAt(gaps[0].key);
      return;
    }
    setSending(true);
    setError("");
    try {
      const body = {
        deliveryId,
        paymentId,
        EMAIL: email.trim(),
        FIO: fio,
        PHONE: phoneShop,
        PROFILE: { ...profile, MANUAL: 1 },
        ...(promo ? { promo } : {}),
        // the shopper's two consents, exactly as the shop's own form sends them
        additionalOrderInfo: {
          orderComment:
            slotDay && slotHours
              ? `${T("Delivery", "Доставка")}: ${slotDay.label}, ${slotHours}`
              : "",
          needToContact: false,
          contactMethod: "",
          chosenMessenger: "",
          receiveEmails: false,
          acceptTerms,
          acceptTerms2: false,
          agreePersonalData: agreeData,
        },
        dutyEnabled: true,
        ...(slotDay && slotHours
          ? {
              DELIVERY_DATE: slotDay.date,
              DELIVERY_FROM: slotHours.split("-")[0],
              DELIVERY_TO: slotHours.split("-")[1],
            }
          : {}),
      };
      const r = await shopFetch(`/sv-api/order?language=${language}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = (await r.json()) as {
        result?: string | number;
        error?: string;
      };
      if (data.result) {
        track("payment_start", {
          order_id: String(data.result),
          payment_type_code: paymentTypeCode(
            payments.find((x) => x.ID === paymentId)?.NAME ?? "",
          ),
          payment_gateway: "shop_payment_page",
          order_total: num(grand) || goods.value,
          currency: siteCurrency,
        });
        saveContact({
          first: first.trim(),
          last: last.trim(),
          phone: phone.trim(),
          email: email.trim(),
        });
        // step 2 — the payment form of the shop, shown inside our page
        const method = payments.find((x) => x.ID === paymentId);
        const code = method ? paymentTypeCode(method.NAME) : "bank_card";
        const kind =
          code === "paypal"
            ? "paypal"
            : code === "bank_transfer"
              ? "transfer"
              : "card";
        if (kind === "card" && MARKET.cardForm === "shop") {
          // the shop's gateway has its own card page: straight there, no page of ours in between
          const shopPage = orderPaymentPath(
            multiSite ? country : MARKET.code,
            String(data.result),
            paymentId,
          );
          // the shop's order page is only a second checkout: its «Pay» goes to
          // the gateway, so go there directly (the page itself when it has none)
          const gateway = await getGatewayTarget(shopPage);
          if (gateway) goToGateway(gateway);
          else window.location.assign(shopPage);
          return;
        }
        // step 2 is a full page load, on purpose: the card page runs without
        // analytics and without any script left over from the pages before it
        window.location.assign(
          asset(
            `/friend/checkout/pay/?order=${encodeURIComponent(String(data.result))}&pm=${encodeURIComponent(paymentId)}&kind=${kind}&site=${encodeURIComponent(site)}`,
          ),
        );
        return;
      }
      setError(
        data.error ||
          T(
            "The shop did not accept the order. Please check the details.",
            "Магазин не принял заказ. Проверьте данные.",
          ),
      );
    } catch (e) {
      console.error(e);
      setError(
        T(
          "We couldn’t send the order. Please try again.",
          "Не удалось отправить заказ. Попробуйте ещё раз.",
        ),
      );
    }
    setSending(false);
  }

  // loaders
  const switching = lines.length > 0 && (ready === "idle" || ready === "sync");
  const deliveryLoading =
    switching ||
    (ready === "ok" && place !== "" && deliveryFor !== deliveryKey);
  const paymentsLoading =
    deliveryLoading ||
    (ready === "ok" && deliveryId !== "" && paymentsFor !== paymentsKey);
  const totalsLoading =
    paymentsLoading ||
    (ready === "ok" &&
      deliveryId !== "" &&
      paymentId !== "" &&
      totalsFor !== totalsKey);

  // the catalogue's prices of the country's own site (only through the proxy
  // is there more than the market's site)
  const pr = pricingFor(multiSite ? country : MARKET.code);
  const prices = pr.totals(lines);
  const siteCurrency = String(totals?.CURRENCY ?? pr.currency);
  // a product the country's site does not sell has no price here: the shop's numbers alone
  const ownPrices = lines.every((l) => pr.sold(l));
  const money = (n: number) => formatMoney(n, siteCurrency);
  const goodsSum = totals
    ? num(totals.PRICE)
    : ownPrices
      ? prices.club
      : basketSum;
  const deliveryPrice =
    totals && totals.TOTAL_PRICE !== undefined && totals.PRICE !== undefined
      ? num(totals.TOTAL_PRICE) - num(totals.PRICE)
      : null;
  const grand = totals
    ? promo && totals.TOTAL_PRICE_WITH_PROMO !== undefined
      ? totals.TOTAL_PRICE_WITH_PROMO
      : totals.TOTAL_PRICE
    : null;
  const promoOff = totals
    ? Math.max(0, num(totals.TOTAL_PRICE) - num(totals.TOTAL_PRICE_WITH_PROMO))
    : 0;
  const memberSaving = ownPrices ? prices.saving : 0;
  const totalSaving = memberSaving + (promo ? promoOff : 0);
  const shownTotal = grand !== null ? num(grand) : null;

  const field = (key: string) => ({
    name: key,
    shake: shaking === key,
    attention: attempted && required.find((f) => f.key === key)?.bad,
  });

  // ---- the order summary (a bar on a phone, a panel on the web) ----
  const summary = (
    <div className={styles.sum}>
      <ul className={styles.sumLines}>
        {lines.map((l) => {
          const p = friendProductById(l.coralId);
          return (
            <li key={l.coralId} className={styles.sumLine}>
              <span className={styles.thumb}>
                <span className={styles.thumbImg}>
                  {l.image && <Image src={l.image} alt="" fill sizes="56px" />}
                </span>
                <span className={styles.badge}>{l.qty}</span>
              </span>
              <span className={styles.lineName}>
                {p ? friendName(p, lang) : l.name}
                {p && friendForm(p, lang) && <span className={styles.lineSub}>{friendForm(p, lang)}</span>}
              </span>
              <span className={styles.lineSum}>
                {ownPrices && p && (
                  <span className={styles.was}>
                    {money(pr.regular(p) * l.qty)}
                  </span>
                )}{" "}
                {ownPrices && p && money(pr.club(p) * l.qty)}
              </span>
            </li>
          );
        })}
      </ul>
      <dl className={styles.rows}>
        {memberSaving > 0 && (
          <div className={styles.rowGood}>
            <dt>{T("Member discount", "Скидка участника")}</dt>
            <dd>−{money(memberSaving)}</dd>
          </div>
        )}
        <div>
          <dt>{T("Subtotal", "Товары")}</dt>
          <dd>{money(goodsSum)}</dd>
        </div>
        {promo && promoOff > 0 && (
          <div className={styles.rowGood}>
            <dt>
              {T("Code", "Промокод")} {promo}
            </dt>
            <dd>−{money(promoOff)}</dd>
          </div>
        )}
        <div>
          <dt>{T("Shipping", "Доставка")}</dt>
          <dd>
            {deliveryPrice === null
              ? T("Calculated next", "Рассчитаем дальше")
              : deliveryPrice > 0
                ? money(deliveryPrice)
                : T("Free", "Бесплатно")}
          </dd>
        </div>
        {totals && num(totals.TAX) > 0 && (
          <div>
            <dt>{T("Tax", "Налог")}</dt>
            <dd>{money(num(totals.TAX))}</dd>
          </div>
        )}
        <div className={styles.rowTotal}>
          <dt>{T("Total", "Итого")}</dt>
          <dd>{shownTotal !== null ? money(shownTotal) : "—"}</dd>
        </div>
      </dl>
      {totalSaving > 0 && (
        <p className={styles.saved}>
          {T("You’re saving", "Вы экономите")} {money(totalSaving)}
        </p>
      )}
      {friend && (
        <p className={styles.host}>
          {T("The sale goes to", "Покупка засчитывается")}{" "}
          <strong>{friend.name}</strong> · Coral ID {friend.memberId}
          {source === "demo"
            ? T(
                " (test: no link, default member)",
                " (тест: без ссылки, участник по умолчанию)",
              )
            : ""}
        </p>
      )}
    </div>
  );

  const barTotal =
    shownTotal !== null ? shownTotal : ownPrices ? prices.club : 0;

  return (
    <div className="appShell">
      <main className={styles.page} data-analytics-location="checkout">
        {lines.length === 0 ? (
          <div className={styles.empty}>
            <h1 className={styles.title}>
              {T("Checkout", "Оформление заказа")}
            </h1>
            <p className={styles.host}>
              {T("Your cart is empty.", "Корзина пуста.")}
            </p>
            <Link href="/friend/" className={co.link}>
              {T("Back to the sets", "К наборам")}
            </Link>
          </div>
        ) : live === false ? (
          <div className={styles.layout}>
            <div className={styles.main}>
              <h1 className={styles.title}>Checkout</h1>
              <section className={styles.totalCard}>{summary}</section>
              <section className={styles.section}>
                <h2 className={styles.h2}>Delivery and payment</h2>
                <p className={styles.sub}>
                  The live checkout — delivery to your address, payment by card
                  or Google Pay — runs on the shop’s own domain. Continue there
                  with this cart at member prices; no sign-up needed.
                </p>
                <button
                  type="button"
                  className={styles.pay}
                  disabled={!friend}
                  data-analytics-id="checkout_to_shop_btn"
                  onClick={() => {
                    if (!friend) return;
                    track(
                      "friend_redirect_to_shop",
                      { bonus_points: goods.bonus_points },
                      {
                        currency: siteCurrency,
                        value: goods.value,
                        items: goods.items,
                      },
                    );
                    window.location.assign(shopBasketUrl(lines, friend));
                  }}
                >
                  Continue on {MARKET.site}
                </button>
              </section>
            </div>
          </div>
        ) : (
          <div className={styles.layout}>
            <details className={styles.sumMobile}>
              <summary className={styles.sumHead}>
                <span>
                  {T("Order summary", "Состав заказа")} <Chevron />
                </span>
                <span className={styles.sumHeadPrice}>
                  {ownPrices && prices.regular > barTotal && (
                    <span className={styles.was}>{money(prices.regular)}</span>
                  )}
                  <strong>{money(barTotal)}</strong>
                </span>
              </summary>
              <div className={styles.sumBodyMobile}>{summary}</div>
            </details>

            <div className={styles.main}>
              <h1 className={extra.visuallyHidden}>
                {T("Checkout", "Оформление заказа")}
              </h1>

              {ready === "sync" && (
                <p className={styles.loader} role="status">
                  <span className={styles.spinner} aria-hidden="true" />
                  {T("Preparing your order…", "Готовим заказ…")}
                </p>
              )}
              {error && (
                <p className={styles.error} role="alert">
                  {error}
                </p>
              )}
              {missing.map((m) => (
                <p key={m} className={styles.error}>
                  {m}
                </p>
              ))}

              {!pickupNone && (
                <DeliveryModeSwitch
                  labels={
                    ru
                      ? { courier: "Доставка", pickup: "Самовывоз" }
                      : undefined
                  }
                  value={pickup ? "pickup" : "courier"}
                  onChange={(id) => {
                    setMode(id);
                    if (id === "pickup" && city) setSheetOpen(true);
                    track("delivery_method_selected", {
                      delivery_type_code: id,
                    });
                  }}
                />
              )}

              <section className={styles.section}>
                <h2 className={styles.h2}>{T("Delivery", "Доставка")}</h2>
                {pickup && pickupItems.length === 0 && place !== "" ? (
                  <p className={styles.hint}>
                    {deliveryFor === deliveryKey
                      ? T(
                          `Pick-up points are not available in ${countryName} yet. Choose home delivery.`,
                          "В вашей стране пока нет пунктов выдачи. Выберите доставку.",
                        )
                      : T("Looking for pick-up points…", "Ищем пункты выдачи…")}
                  </p>
                ) : !pickup ? (
                  <>
                    {manual ? (
                      <FloatInput
                        {...field("address")}
                        label={T("Street and house number", "Улица и дом")}
                        placeholder={T(
                          "Friedrichstraße 43",
                          "Тверская ул., 12",
                        )}
                        value={address}
                        onChange={setAddress}
                        error={attempted && street !== "" && build === ""}
                        hint={
                          attempted && street !== "" && build === ""
                            ? T(
                                "Add the house number, e.g. Friedrichstraße 43",
                                "Добавьте номер дома, например: Тверская ул., 12",
                              )
                            : undefined
                        }
                        autoComplete="address-line1"
                      />
                    ) : (
                      <AddressSearch
                        {...field("address")}
                        country={country}
                        label={T("Search address", "Найти адрес")}
                        placeholder={T(
                          "Street, house number, city",
                          "Улица, дом, город",
                        )}
                        value={searchText}
                        onChange={(v) => {
                          setSearchText(v);
                          if (picked) {
                            // typing again drops the earlier pick
                            setPicked(false);
                            setAddress("");
                            setZip("");
                            setCityDraft("");
                            setCity("");
                            setState("");
                          }
                        }}
                        error={attempted && !picked && searchText.trim() !== ""}
                        hint={
                          attempted && !picked && searchText.trim() !== ""
                            ? T(
                                "Choose your address from the list or on the map",
                                "Выберите адрес из списка или на карте",
                              )
                            : undefined
                        }
                        onPick={applyAddress}
                      />
                    )}
                    {searchOn && (
                      <div className={styles.addLines}>
                        <button
                          type="button"
                          className={styles.addLine}
                          onClick={() => setMapOpen(true)}
                          data-analytics-id="address_map"
                        >
                          {T("Choose on map", "Выбрать на карте")}
                        </button>
                        {manual && (
                          <button
                            type="button"
                            className={styles.addLine}
                            onClick={() => {
                              const full =
                                street && build && zip.trim() && city && state;
                              setPicked(Boolean(full));
                              setSearchText(
                                full
                                  ? addressLine(address, zip.trim(), city)
                                  : "",
                              );
                              setManual(false);
                            }}
                          >
                            {T(
                              "Search for an address instead",
                              "Найти адрес поиском",
                            )}
                          </button>
                        )}
                      </div>
                    )}
                    {(manual || apartment) && (
                      <FloatInput
                        label={T(
                          "Address supplement (optional)",
                          "Квартира, подъезд, этаж (необязательно)",
                        )}
                        placeholder={T(
                          "c/o, floor, entrance",
                          "кв. 5, подъезд 2, этаж 3",
                        )}
                        value={apartment}
                        onChange={setApartment}
                        autoComplete="address-line2"
                      />
                    )}
                    {manual && (
                      <>
                        <div className={styles.row}>
                          <FloatInput
                            {...field("zip")}
                            label={T("Postcode", "Индекс")}
                            placeholder="10117"
                            value={zip}
                            onChange={setZip}
                            inputMode="numeric"
                            autoComplete="postal-code"
                          />
                          <FloatInput
                            {...field("city")}
                            label={T("City", "Город")}
                            value={cityDraft}
                            onChange={setCityDraft}
                            autoComplete="address-level2"
                          />
                        </div>
                        {country === MARKET.code ? (
                          <StateCombobox
                            options={REGIONS}
                            label="State (Bundesland)"
                            value={state}
                            onChange={setState}
                            name="state"
                            shake={shaking === "state"}
                            attention={attempted && !state}
                          />
                        ) : (
                          <FloatInput
                            {...field("state")}
                            label={T("State / region", "Регион")}
                            value={state}
                            onChange={setState}
                            autoComplete="address-level1"
                          />
                        )}
                      </>
                    )}
                  </>
                ) : (
                  <>
                    <FloatInput
                      {...field("city")}
                      label={T("City", "Город")}
                      value={cityDraft}
                      onChange={setCityDraft}
                      autoComplete="address-level2"
                    />
                    <div
                      className={`${styles.pickup} ${shaking === "point" ? styles.shake : ""}`}
                      data-field="point"
                    >
                      {!city ? (
                        <p className={styles.hint}>
                          {T(
                            "Enter your city to find pick-up points near you.",
                            "Укажите город, чтобы найти пункты выдачи рядом.",
                          )}
                        </p>
                      ) : pointsLoading ? (
                        <p className={styles.loader} role="status">
                          <span className={styles.spinner} aria-hidden="true" />
                          {T(
                            "Looking for pick-up points…",
                            "Ищем пункты выдачи…",
                          )}
                        </p>
                      ) : points.length === 0 ? (
                        <p className={styles.hint}>
                          {T(
                            `No pick-up points near ${city}. Try a nearby city, or choose delivery to an address.`,
                            `Рядом с городом ${city} нет пунктов выдачи. Попробуйте соседний город или выберите доставку по адресу.`,
                          )}
                        </p>
                      ) : (
                        <>
                          <PickupPointButton
                            error={attempted && !point}
                            onClick={() => setSheetOpen(true)}
                            title={
                              point
                                ? (pickupItems.find((i) => i.ID === point.TYPE)
                                    ?.NAME ?? point.NAME)
                                : undefined
                            }
                            address={
                              point
                                ? [point.ADDRESS, point.CITY]
                                    .filter(Boolean)
                                    .join(", ")
                                : undefined
                            }
                            emptyTitle={T(
                              "Choose pick-up point",
                              "Выберите пункт выдачи",
                            )}
                            action={
                              point
                                ? T("Change", "Изменить")
                                : T(
                                    `${points.length} near ${city}`,
                                    `${points.length} рядом`,
                                  )
                            }
                          />
                          {attempted && !point && (
                            <p
                              className={`${styles.floatHint} ${styles.floatHintError}`}
                              role="alert"
                            >
                              {T(
                                "Choose a pick-up point",
                                "Выберите пункт выдачи",
                              )}
                            </p>
                          )}
                        </>
                      )}
                    </div>
                  </>
                )}
              </section>

              <section className={styles.section}>
                <h2 className={styles.h2}>{T("Contact", "Контакты")}</h2>
                <FloatInput
                  {...field("email")}
                  error={nonLatinEmail}
                  hint={
                    nonLatinEmail
                      ? T(
                          "Use Latin letters only (a look-alike letter from another alphabet will not work)",
                          "Только латинские буквы (похожая буква из другого алфавита не подойдёт)",
                        )
                      : undefined
                  }
                  label={T("Email", "E-mail")}
                  placeholder="name@example.com"
                  value={email}
                  onChange={setEmail}
                  inputMode="email"
                  autoComplete="email"
                />
                <FloatInput
                  {...field("first")}
                  label={T("Full name", "Имя и фамилия")}
                  placeholder={T("First and last name", "Имя и фамилия")}
                  value={fullName}
                  onChange={setFullName}
                  error={attempted && first !== "" && last === ""}
                  hint={
                    attempted && first !== "" && last === ""
                      ? T("Add your last name", "Добавьте фамилию")
                      : undefined
                  }
                  autoComplete="name"
                />
                <FloatInput
                  {...field("phone")}
                  label={T("Phone", "Телефон")}
                  placeholder={T("0151 23456789", "+7 900 123-45-67")}
                  value={phone}
                  onChange={setPhone}
                  inputMode="tel"
                  autoComplete="tel"
                />
              </section>

              <section className={styles.section}>
                <h2 className={styles.h2}>
                  {T("Shipping method", "Способ доставки")}
                </h2>
                {!place ? (
                  <p className={styles.hint}>
                    {T(
                      "Choose your address to see the delivery options.",
                      "Укажите адрес, чтобы увидеть способы доставки.",
                    )}
                  </p>
                ) : deliveryLoading ? (
                  <p className={styles.loader} role="status">
                    <span className={styles.spinner} aria-hidden="true" />
                    {T(
                      "Loading delivery options…",
                      "Загружаем способы доставки…",
                    )}
                  </p>
                ) : items.length > 0 ? (
                  items.length === 1 ? (
                    <OptionInfo
                      title={items[0].NAME}
                      detail={
                        items[0].TRANSIT
                          ? `${items[0].TRANSIT} ${T("days", "дн.")}`
                          : undefined
                      }
                      asideNote={
                        items[0].FREE_DELIVERY && items[0].PRICE
                          ? `${T("free over", "бесплатно от")} ${money(items[0].FREE_DELIVERY)}`
                          : undefined
                      }
                      aside={
                        items[0].PRICE
                          ? money(items[0].PRICE)
                          : T("Free", "Бесплатно")
                      }
                      good={!items[0].PRICE}
                    />
                  ) : (
                    <OptionCards
                      label={T("Shipping method", "Способ доставки")}
                      layout="list"
                    >
                      {items.map((it) => (
                        <OptionCard
                          key={it.ID}
                          name="delivery"
                          checked={deliveryId === it.ID}
                          onChange={() => {
                            setDeliveryChoice(it.ID);
                            track("delivery_method_selected", {
                              delivery_type_code: pickup ? "pickup" : "courier",
                              delivery_service: it.NAME,
                              delivery_cost: Number(it.PRICE) || 0,
                            });
                          }}
                          title={it.NAME}
                          lines={
                            it.TRANSIT ? (
                              <span>
                                {it.TRANSIT} {T("days", "дн.")}
                              </span>
                            ) : null
                          }
                          price={
                            it.PRICE ? money(it.PRICE) : T("Free", "Бесплатно")
                          }
                          priceNote={
                            it.FREE_DELIVERY && it.PRICE
                              ? `${T("free over", "бесплатно от")} ${money(it.FREE_DELIVERY)}`
                              : undefined
                          }
                          priceGood={!it.PRICE}
                        />
                      ))}
                    </OptionCards>
                  )
                ) : (
                  <p className={styles.hint}>
                    {pickup && !deliveryErr
                      ? T(
                          `Pick-up isn’t available in ${countryName} yet. Choose home delivery.`,
                          "В вашей стране пока нет самовывоза. Выберите доставку.",
                        )
                      : !place
                        ? T(
                            "Delivery options appear once you choose your address.",
                            "Способы доставки появятся, когда вы укажете адрес.",
                          )
                        : deliveryErr ||
                          T(
                            "No delivery options for this address.",
                            "Для этого адреса нет способов доставки.",
                          )}
                  </p>
                )}
                {slotDay && slotHours && (
                  <CourierSlots
                    {...(ru
                      ? {
                          title: "Дата и время доставки",
                          dayLabel: "День доставки",
                          hoursLabel: "Время доставки",
                        }
                      : {})}
                    days={slotDays}
                    day={slotDay}
                    hours={slotHours}
                    onDay={setSlotDate}
                    onHours={setSlotTime}
                  />
                )}
              </section>

              <section className={styles.section} id="payment-method">
                <h2 className={styles.h2}>{T("Payment", "Оплата")}</h2>
                {!place ? (
                  <p className={styles.hint}>
                    {T(
                      "Payment options appear once you choose your address.",
                      "Способы оплаты появятся, когда вы укажете адрес.",
                    )}
                  </p>
                ) : paymentsLoading ? (
                  <p className={styles.loader} role="status">
                    <span className={styles.spinner} aria-hidden="true" />
                    {T("Loading payment options…", "Загружаем способы оплаты…")}
                  </p>
                ) : payments.length === 1 ? (
                  <OptionInfo
                    title={
                      /^bank card$/i.test(payments[0].NAME)
                        ? T("Credit or debit card", "Банковская карта")
                        : payments[0].NAME
                    }
                    aside={
                      /^bank card$/i.test(payments[0].NAME) ? (
                        <CardBadges wallets={MARKET.googlePay} />
                      ) : payments[0].IMAGE ? (
                        // eslint-disable-next-line @next/next/no-img-element -- the shop's own method logo
                        <img
                          src={shopAsset(payments[0].IMAGE, site)}
                          alt=""
                          style={{
                            width: 32,
                            height: 32,
                            objectFit: "contain",
                          }}
                        />
                      ) : undefined
                    }
                  />
                ) : (
                  <OptionCards
                    label={T("Payment method", "Способ оплаты")}
                    layout="list"
                  >
                    {payments.map((p) => {
                      const card = /^bank card$/i.test(p.NAME);
                      return (
                        <OptionCard
                          key={p.ID}
                          name="payment"
                          checked={paymentId === p.ID}
                          onChange={() => {
                            setPaymentId(p.ID);
                            track("payment_method_selected", {
                              payment_type_code: paymentTypeCode(p.NAME),
                              payment_method_name: p.NAME,
                            });
                          }}
                          title={
                            card
                              ? T("Credit or debit card", "Банковская карта")
                              : p.NAME
                          }
                          icon={
                            !card && p.IMAGE ? (
                              // eslint-disable-next-line @next/next/no-img-element -- the shop's own method logo
                              <img src={shopAsset(p.IMAGE, site)} alt="" />
                            ) : undefined
                          }
                          footer={
                            card ? (
                              <CardBadges wallets={MARKET.googlePay} />
                            ) : (
                              <span />
                            )
                          }
                        />
                      );
                    })}
                  </OptionCards>
                )}
              </section>

              <div className={styles.discount}>
                {!promoOpen && !promo ? (
                  <button
                    type="button"
                    className={styles.discountToggle}
                    onClick={() => setPromoOpen(true)}
                    disabled={!deliveryId}
                  >
                    {T("Add discount", "Добавить промокод")}
                  </button>
                ) : (
                  <>
                    <div className={styles.discountRow}>
                      <input
                        value={promoDraft || promo}
                        onChange={(e) => setPromoDraft(e.target.value)}
                        placeholder={T("Discount code", "Промокод")}
                        aria-label={T("Discount code", "Промокод")}
                        autoCapitalize="characters"
                      />
                      <button
                        type="button"
                        className={styles.apply}
                        onClick={applyPromo}
                        disabled={!promoDraft.trim() || !deliveryId}
                      >
                        {T("Apply", "Применить")}
                      </button>
                    </div>
                    {promoMsg && <p className={styles.fieldHint}>{promoMsg}</p>}
                    {promo && (
                      <p className={styles.fieldHint}>
                        {T(
                          `Code ${promo} applied.`,
                          `Промокод ${promo} применён.`,
                        )}
                      </p>
                    )}
                  </>
                )}
              </div>

              <section className={styles.totalCard}>
                <h2 className={styles.h2}>{T("Total", "Итого")}</h2>
                {totalsLoading && (
                  <p className={styles.loader} role="status">
                    <span className={styles.spinner} aria-hidden="true" />
                    {T("Calculating…", "Считаем…")}
                  </p>
                )}
                <div className={totalsLoading ? styles.dim : undefined}>
                  <dl className={styles.rows}>
                    {memberSaving > 0 && (
                      <div className={styles.rowGood}>
                        <dt>{T("Member discount", "Скидка участника")}</dt>
                        <dd>−{money(memberSaving)}</dd>
                      </div>
                    )}
                    <div>
                      <dt>{T("Items", "Товары")}</dt>
                      <dd>{money(goodsSum)}</dd>
                    </div>
                    <div>
                      <dt>{T("Shipping", "Доставка")}</dt>
                      <dd>
                        {deliveryPrice === null
                          ? "—"
                          : deliveryPrice > 0
                            ? money(deliveryPrice)
                            : T("Free", "Бесплатно")}
                      </dd>
                    </div>
                    <div className={styles.rowTotal}>
                      <dt>{T("Total", "Итого")}</dt>
                      <dd>{shownTotal !== null ? money(shownTotal) : "—"}</dd>
                    </div>
                  </dl>
                </div>
                <p className={styles.host}>
                  {T(
                    "All prices include VAT. Shipping is shown above.",
                    "Цены включают НДС. Доставка указана выше.",
                  )}
                </p>
                {totalSaving > 0 && (
                  <p className={styles.saved}>
                    {T("Total savings", "Общая экономия")} {money(totalSaving)}
                  </p>
                )}
              </section>

              <div className={styles.consents}>
                <label
                  className={`${co.check} ${shaking === "terms" ? co.shake : ""} ${
                    attempted && !acceptTerms ? co.checkActive : ""
                  }`}
                  data-field="terms"
                >
                  <input
                    type="checkbox"
                    checked={acceptTerms}
                    onChange={(e) => setAcceptTerms(e.target.checked)}
                  />
                  {ru ? (
                    <span>
                      Принимаю{" "}
                      <a
                        href={`https://${site}/faq/terms/`}
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        условия оферты
                      </a>{" "}
                      и{" "}
                      <a
                        href={`https://${site}/faq/privacy/`}
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        политику конфиденциальности
                      </a>
                    </span>
                  ) : (
                    <span>
                      I accept the{" "}
                      <a
                        href={`https://${site}/faq/terms/`}
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        Terms and conditions (AGB)
                      </a>{" "}
                      and the{" "}
                      <a
                        href={`https://${site}/faq/privacy/`}
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        Privacy policy (Datenschutz)
                      </a>
                      , and I have read the{" "}
                      <a
                        href={`https://${site}/support/question.php?q=return`}
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        information on returns and withdrawal
                      </a>
                    </span>
                  )}
                </label>
                <label
                  className={`${co.check} ${shaking === "data" ? co.shake : ""} ${
                    attempted && !agreeData ? co.checkActive : ""
                  }`}
                  data-field="data"
                >
                  <input
                    type="checkbox"
                    checked={agreeData}
                    onChange={(e) => setAgreeData(e.target.checked)}
                  />
                  <span>
                    {T(
                      "I agree to the processing of my personal data",
                      "Согласен на обработку персональных данных",
                    )}{" "}
                    (
                    <a
                      href={`https://${site}/faq/privacy/`}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      {T("details", "подробнее")}
                    </a>
                    )
                  </span>
                </label>
              </div>

              <button
                type="button"
                className={styles.pay}
                disabled={
                  sending || ready !== "ok" || totalsLoading || !canOrder
                }
                onClick={submit}
                data-analytics-id="checkout_pay_btn"
              >
                {sending
                  ? T("Creating your order…", "Создаём заказ…")
                  : T("Continue to payment", "Перейти к оплате")}
              </button>
            </div>

            <aside
              className={styles.sumDesktop}
              aria-label={T("Order summary", "Состав заказа")}
            >
              {summary}
            </aside>
          </div>
        )}
        {sheetOpen && pickup && !pointsLoading && points.length > 0 && (
          <PickupSheet
            country={country}
            countryName={countryName}
            city={city}
            points={points}
            services={pickupItems}
            selected={pointCode}
            money={money}
            labels={ru ? PICKUP_RU : undefined}
            onSelect={(code) => {
              setPointCode(code);
              setSheetOpen(false);
            }}
            onClose={() => setSheetOpen(false)}
          />
        )}
        {mapOpen && searchOn && (
          <MapPicker
            country={country}
            countryName={countryName}
            nearby={city || undefined}
            labels={ru ? MAP_RU : undefined}
            onSelect={(a) => {
              applyAddress(a);
              setMapOpen(false);
            }}
            onClose={() => setMapOpen(false)}
          />
        )}
      </main>
    </div>
  );
}
