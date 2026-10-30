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
  onCountryRequest,
  rememberFriendCountries,
  setFriendCountry,
  useFriendCountries,
  useFriendCountry,
} from "@/lib/friendCountry";
import { MARKET, REGIONS, phoneForShop } from "@/lib/market";
import { SHOP_SITES, deliveryByPlace, orderPaymentPath } from "@/lib/shopSites";
import { readContact, saveContact } from "@/lib/friendContact";
import {
  api,
  emptyShopBasket,
  enqueueBasketSync,
  fillShopBasket,
  language,
  onShopOrigin,
  setShopSite,
  shopFetch,
} from "@/lib/shopApi";
import { AddressSearch } from "./AddressSearch";
import { MapPicker } from "./MapPicker";
import { PickupSheet, type PickPoint } from "./PickupSheet";
import {
  addressSearchEnabled,
  splitStreet,
  streetLine,
  type ResolvedAddress,
} from "@/lib/addressSearch";
import { FloatInput } from "./FloatInput";
import { OptionCard, OptionCards, OptionInfo } from "./OptionCards";
import { CardBadges } from "./PayBadges";
import { StateCombobox } from "./StateCombobox";
import { useFriend } from "./FriendProvider";
import co from "../landing/LandingCheckout.module.css";
import styles from "./FriendCheckout.module.css";
import extra from "./CheckoutExtras.module.css";
import slots from "./CourierSlots.module.css";

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

/** Latin letters, digits and the usual symbols only: a look-alike Cyrillic letter in an address breaks the payment gateway. */
const EMAIL_RE = /^[\x21-\x7E]+@[\x21-\x7E]+\.[\x21-\x7E]+$/;

const Chevron = () => (
  <svg viewBox="0 0 16 16" fill="none" aria-hidden="true">
    <path
      d="M4 6l4 4 4-4"
      stroke="currentColor"
      strokeWidth="1.6"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

export function FriendCheckout() {
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
  // background from the picked address and only shown for manual entry
  const [manual, setManual] = useState(!addressSearchEnabled);
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
  const multiSite = live === true && window.location.hostname === "localhost";
  const countryMap = useMemo<Record<string, string>>(
    () =>
      multiSite
        ? Object.fromEntries(
            Object.entries(SHOP_SITES).map(([code, v]) => [code, v.name]),
          )
        : countries,
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
  useEffect(() => setShopSite(site), [site]);

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

  // In Germany the shop's delivery options do not depend on the address, so
  // they load at once; a site whose options do (Russia, the US …) waits for the
  // address (its city and region).
  const byPlace =
    MARKET.deliveryNeedsRegion || (multiSite && deliveryByPlace(country));
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
    deliverySlots(slotCfg.moscow, { express: true, mkad: true }).length === 0;
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
      ? `${unsold.join(", ")} ${unsold.length > 1 ? "are" : "is"} not sold on the ${countryName} site.`
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
          site === MARKET.site ? MARKET.linkLanguage : MARKET.apiLanguage,
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
              ? "The shop did not take the items from your cart."
              : `These products are not available on the ${countryName} site yet.`,
          );
          return;
        }
        setMissing([
          ...(unsoldNote ? [unsoldNote] : []),
          ...(got < want
            ? [
                "Some items from your cart are not available in the shop right now.",
              ]
            : []),
        ]);
        setReady("ok");
      } catch (e) {
        if (!cancelled) {
          setReady("error");
          setError(
            "We couldn’t reach the shop. Please reload the page and try again.",
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
            ? "No delivery options for this address."
            : "No delivery options for this country.",
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
      setPromoMsg("This code isn’t valid.");
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
              ? `Delivery: ${slotDay.label}, ${slotHours}`
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
          "The shop did not accept the order. Please check the details.",
      );
    } catch (e) {
      console.error(e);
      setError("We couldn’t send the order. Please try again.");
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
                {p?.name ?? l.name}
                {p?.form && <span className={styles.lineSub}>{p.form}</span>}
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
            <dt>Member discount</dt>
            <dd>−{money(memberSaving)}</dd>
          </div>
        )}
        <div>
          <dt>Subtotal</dt>
          <dd>{money(goodsSum)}</dd>
        </div>
        {promo && promoOff > 0 && (
          <div className={styles.rowGood}>
            <dt>Code {promo}</dt>
            <dd>−{money(promoOff)}</dd>
          </div>
        )}
        <div>
          <dt>Shipping</dt>
          <dd>
            {deliveryPrice === null
              ? "Calculated next"
              : deliveryPrice > 0
                ? money(deliveryPrice)
                : "Free"}
          </dd>
        </div>
        {totals && num(totals.TAX) > 0 && (
          <div>
            <dt>Tax</dt>
            <dd>{money(num(totals.TAX))}</dd>
          </div>
        )}
        <div className={styles.rowTotal}>
          <dt>Total</dt>
          <dd>{shownTotal !== null ? money(shownTotal) : "—"}</dd>
        </div>
      </dl>
      {totalSaving > 0 && (
        <p className={styles.saved}>You’re saving {money(totalSaving)}</p>
      )}
      {friend && (
        <p className={styles.host}>
          The sale goes to <strong>{friend.name}</strong> · Coral ID{" "}
          {friend.memberId}
          {source === "demo" ? " (test: no link, default member)" : ""}
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
            <h1 className={styles.title}>Checkout</h1>
            <p className={styles.host}>Your cart is empty.</p>
            <Link href="/friend/" className={co.link}>
              Back to the sets
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
                  Order summary <Chevron />
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
              <h1 className={extra.visuallyHidden}>Checkout</h1>

              {ready === "sync" && (
                <p className={styles.loader} role="status">
                  <span className={styles.spinner} aria-hidden="true" />
                  Preparing your order…
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
                <div
                  className={extra.switch}
                  role="radiogroup"
                  aria-label="How to receive your order"
                >
                  {(
                    [
                      ["courier", "Home delivery"],
                      ["pickup", "Pick-up"],
                    ] as const
                  ).map(([id, label]) => {
                    const on = (id === "pickup") === pickup;
                    return (
                      <button
                        key={id}
                        type="button"
                        role="radio"
                        aria-checked={on}
                        className={`${extra.switchBtn} ${on ? extra.switchOn : ""}`}
                        data-analytics-id={`delivery_mode_${id}`}
                        onClick={() => {
                          setMode(id);
                          if (id === "pickup" && city) setSheetOpen(true);
                          track("delivery_method_selected", {
                            delivery_type_code: id,
                          });
                        }}
                      >
                        {label}
                      </button>
                    );
                  })}
                </div>
              )}

              <section className={styles.section}>
                <h2 className={styles.h2}>Delivery</h2>
                {pickup && pickupItems.length === 0 && place !== "" ? (
                  <p className={styles.hint}>
                    {deliveryFor === deliveryKey
                      ? `Pick-up points are not available in ${countryName} yet. Choose home delivery.`
                      : "Looking for pick-up points…"}
                  </p>
                ) : !pickup ? (
                  <>
                    {manual ? (
                      <FloatInput
                        {...field("address")}
                        label="Street and house number"
                        placeholder="Friedrichstraße 43"
                        value={address}
                        onChange={setAddress}
                        error={attempted && street !== "" && build === ""}
                        hint={
                          attempted && street !== "" && build === ""
                            ? "Add the house number, e.g. Friedrichstraße 43"
                            : undefined
                        }
                        autoComplete="address-line1"
                      />
                    ) : (
                      <AddressSearch
                        {...field("address")}
                        country={country}
                        label="Search address"
                        placeholder="Street, house number, city"
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
                            ? "Choose your address from the list or on the map"
                            : undefined
                        }
                        onPick={applyAddress}
                      />
                    )}
                    {addressSearchEnabled && (
                      <div className={styles.addLines}>
                        <button
                          type="button"
                          className={styles.addLine}
                          onClick={() => setMapOpen(true)}
                          data-analytics-id="address_map"
                        >
                          Choose on map
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
                            Search for an address instead
                          </button>
                        )}
                      </div>
                    )}
                    {(manual || apartment) && (
                      <FloatInput
                        label="Address supplement (optional)"
                        placeholder="c/o, floor, entrance"
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
                            label="Postcode"
                            placeholder="10117"
                            value={zip}
                            onChange={setZip}
                            inputMode="numeric"
                            autoComplete="postal-code"
                          />
                          <FloatInput
                            {...field("city")}
                            label="City"
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
                            label="State / region"
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
                      label="City"
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
                          Enter your city to find pick-up points near you.
                        </p>
                      ) : pointsLoading ? (
                        <p className={styles.loader} role="status">
                          <span className={styles.spinner} aria-hidden="true" />
                          Looking for pick-up points…
                        </p>
                      ) : points.length === 0 ? (
                        <p className={styles.hint}>
                          No pick-up points near {city}. Try a nearby city, or
                          choose delivery to an address.
                        </p>
                      ) : (
                        <>
                          <button
                            type="button"
                            className={`${extra.pointBtn} ${attempted && !point ? extra.pointBtnError : ""}`}
                            onClick={() => setSheetOpen(true)}
                            data-analytics-id="pickup_open"
                          >
                            <span className={extra.pointText}>
                              {point ? (
                                <>
                                  <strong>
                                    {pickupItems.find(
                                      (i) => i.ID === point.TYPE,
                                    )?.NAME ?? point.NAME}
                                  </strong>
                                  <small>
                                    {[point.ADDRESS, point.CITY]
                                      .filter(Boolean)
                                      .join(", ")}
                                  </small>
                                </>
                              ) : (
                                <strong>Choose pick-up point</strong>
                              )}
                            </span>
                            <span className={extra.pointAction}>
                              {point
                                ? "Change"
                                : `${points.length} near ${city}`}
                            </span>
                          </button>
                          {attempted && !point && (
                            <p
                              className={`${styles.floatHint} ${styles.floatHintError}`}
                              role="alert"
                            >
                              Choose a pick-up point
                            </p>
                          )}
                        </>
                      )}
                    </div>
                  </>
                )}
              </section>

              <section className={styles.section}>
                <h2 className={styles.h2}>Contact</h2>
                <FloatInput
                  {...field("email")}
                  error={nonLatinEmail}
                  hint={
                    nonLatinEmail
                      ? "Use Latin letters only (a look-alike letter from another alphabet will not work)"
                      : undefined
                  }
                  label="Email"
                  placeholder="name@example.com"
                  value={email}
                  onChange={setEmail}
                  inputMode="email"
                  autoComplete="email"
                />
                <FloatInput
                  {...field("first")}
                  label="Full name"
                  placeholder="First and last name"
                  value={fullName}
                  onChange={setFullName}
                  error={attempted && first !== "" && last === ""}
                  hint={
                    attempted && first !== "" && last === ""
                      ? "Add your last name"
                      : undefined
                  }
                  autoComplete="name"
                />
                <FloatInput
                  {...field("phone")}
                  label="Phone"
                  placeholder="0151 23456789"
                  value={phone}
                  onChange={setPhone}
                  inputMode="tel"
                  autoComplete="tel"
                />
              </section>

              <section className={styles.section}>
                <h2 className={styles.h2}>Shipping method</h2>
                {!place ? (
                  <p className={styles.hint}>
                    Choose your address to see the delivery options.
                  </p>
                ) : deliveryLoading ? (
                  <p className={styles.loader} role="status">
                    <span className={styles.spinner} aria-hidden="true" />
                    Loading delivery options…
                  </p>
                ) : items.length > 0 ? (
                  items.length === 1 ? (
                    <OptionInfo
                      title={items[0].NAME}
                      detail={[
                        items[0].TRANSIT && `${items[0].TRANSIT} days`,
                        items[0].FREE_DELIVERY && items[0].PRICE
                          ? `free over ${money(items[0].FREE_DELIVERY)}`
                          : "",
                      ]
                        .filter(Boolean)
                        .join(" · ")}
                      aside={items[0].PRICE ? money(items[0].PRICE) : "Free"}
                      good={!items[0].PRICE}
                    />
                  ) : (
                    <OptionCards label="Shipping method">
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
                          good={!it.PRICE}
                          lines={
                            <>
                              {it.TRANSIT && <span>{it.TRANSIT} days</span>}
                              {it.FREE_DELIVERY && it.PRICE ? (
                                <span>free over {money(it.FREE_DELIVERY)}</span>
                              ) : null}
                              <span>{it.PRICE ? money(it.PRICE) : "Free"}</span>
                            </>
                          }
                        />
                      ))}
                    </OptionCards>
                  )
                ) : (
                  <p className={styles.hint}>
                    {pickup && !deliveryErr
                      ? `Pick-up isn’t available in ${countryName} yet. Choose home delivery.`
                      : !place
                        ? "Delivery options appear once you choose your address."
                        : deliveryErr ||
                          "No delivery options for this address."}
                  </p>
                )}
                {slotDay && slotHours && (
                  <div className={slots.slots}>
                    <p className={slots.slotsTitle}>Delivery date and time</p>
                    <div
                      className={slots.chips}
                      role="radiogroup"
                      aria-label="Delivery day"
                    >
                      {slotDays.map((d) => (
                        <button
                          key={d.date}
                          type="button"
                          role="radio"
                          aria-checked={d.date === slotDay.date}
                          className={`${slots.chip} ${d.date === slotDay.date ? slots.chipOn : ""}`}
                          onClick={() => setSlotDate(d.date)}
                        >
                          {d.label}
                        </button>
                      ))}
                    </div>
                    <div
                      className={slots.chips}
                      role="radiogroup"
                      aria-label="Delivery hours"
                    >
                      {slotDay.times.map((t) => (
                        <button
                          key={t}
                          type="button"
                          role="radio"
                          aria-checked={t === slotHours}
                          className={`${slots.chip} ${t === slotHours ? slots.chipOn : ""}`}
                          onClick={() => setSlotTime(t)}
                        >
                          {t.replace("-", " – ")}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </section>

              <section className={styles.section} id="payment-method">
                <h2 className={styles.h2}>Payment</h2>
                {!place ? (
                  <p className={styles.hint}>
                    Payment options appear once you choose your address.
                  </p>
                ) : paymentsLoading ? (
                  <p className={styles.loader} role="status">
                    <span className={styles.spinner} aria-hidden="true" />
                    Loading payment options…
                  </p>
                ) : payments.length === 1 ? (
                  <OptionInfo
                    title={
                      /^bank card$/i.test(payments[0].NAME)
                        ? "Credit or debit card"
                        : payments[0].NAME
                    }
                    aside={
                      /^bank card$/i.test(payments[0].NAME) ? (
                        <CardBadges wallets={MARKET.googlePay} />
                      ) : payments[0].IMAGE ? (
                        // eslint-disable-next-line @next/next/no-img-element -- the shop's own method logo
                        <img
                          src={payments[0].IMAGE}
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
                  <OptionCards label="Payment method">
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
                          title={card ? "Credit or debit card" : p.NAME}
                          footer={
                            card ? (
                              <CardBadges wallets={MARKET.googlePay} />
                            ) : p.IMAGE ? (
                              // eslint-disable-next-line @next/next/no-img-element -- the shop's own method logo
                              <img
                                src={p.IMAGE}
                                alt=""
                                style={{
                                  width: 32,
                                  height: 32,
                                  objectFit: "contain",
                                  objectPosition: "left",
                                }}
                              />
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
                    Add discount
                  </button>
                ) : (
                  <>
                    <div className={styles.discountRow}>
                      <input
                        value={promoDraft || promo}
                        onChange={(e) => setPromoDraft(e.target.value)}
                        placeholder="Discount code"
                        aria-label="Discount code"
                        autoCapitalize="characters"
                      />
                      <button
                        type="button"
                        className={styles.apply}
                        onClick={applyPromo}
                        disabled={!promoDraft.trim() || !deliveryId}
                      >
                        Apply
                      </button>
                    </div>
                    {promoMsg && <p className={styles.fieldHint}>{promoMsg}</p>}
                    {promo && (
                      <p className={styles.fieldHint}>Code {promo} applied.</p>
                    )}
                  </>
                )}
              </div>

              <section className={styles.totalCard}>
                <h2 className={styles.h2}>Total</h2>
                {totalsLoading && (
                  <p className={styles.loader} role="status">
                    <span className={styles.spinner} aria-hidden="true" />
                    Calculating…
                  </p>
                )}
                <div className={totalsLoading ? styles.dim : undefined}>
                  <dl className={styles.rows}>
                    {memberSaving > 0 && (
                      <div className={styles.rowGood}>
                        <dt>Member discount</dt>
                        <dd>−{money(memberSaving)}</dd>
                      </div>
                    )}
                    <div>
                      <dt>Items</dt>
                      <dd>{money(goodsSum)}</dd>
                    </div>
                    <div>
                      <dt>Shipping</dt>
                      <dd>
                        {deliveryPrice === null
                          ? "—"
                          : deliveryPrice > 0
                            ? money(deliveryPrice)
                            : "Free"}
                      </dd>
                    </div>
                    <div className={styles.rowTotal}>
                      <dt>Total</dt>
                      <dd>{shownTotal !== null ? money(shownTotal) : "—"}</dd>
                    </div>
                  </dl>
                </div>
                <p className={styles.host}>
                  All prices include VAT. Shipping is shown above.
                </p>
                {totalSaving > 0 && (
                  <p className={styles.saved}>
                    Total savings {money(totalSaving)}
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
                  <span>
                    I accept the{" "}
                    <a
                      href="/faq/terms/"
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      Terms and conditions (AGB)
                    </a>{" "}
                    and the{" "}
                    <a
                      href="/faq/privacy/"
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      Privacy policy (Datenschutz)
                    </a>
                    , and I have read the{" "}
                    <a
                      href="/support/question.php?q=return"
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      information on returns and withdrawal
                    </a>
                  </span>
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
                    I agree to the processing of my personal data (
                    <a
                      href="/faq/privacy/"
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      details
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
                {sending ? "Creating your order…" : "Continue to payment"}
              </button>
            </div>

            <aside className={styles.sumDesktop} aria-label="Order summary">
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
            onSelect={(code) => {
              setPointCode(code);
              setSheetOpen(false);
            }}
            onClose={() => setSheetOpen(false)}
          />
        )}
        {mapOpen && addressSearchEnabled && (
          <MapPicker
            country={country}
            countryName={countryName}
            nearby={city || undefined}
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
