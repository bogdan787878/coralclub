"use client";

/**
 * The member area's checkout, without any markup: the same steps as the friend
 * project's checkout (basket in the shop → delivery → payment → totals → order),
 * but on the member's own shop session (through the checkout gateway), with the
 * cabinet basket as the cart and online payment only. The screen
 * (components/lk/LkCheckout) only draws what this returns.
 */
import { useEffect, useMemo, useRef, useState } from "react";
import type { PickPoint } from "@/components/checkout";
import { refreshCart, useCart, type CartLine } from "@/lib/cart";
import { addressSearchEnabled, splitStreet, streetLine, type ResolvedAddress } from "@/lib/addressSearch";
import { deliverySlots, isMoscow, slotRegion, type DeliveryTimes } from "@/lib/deliverySlots";
import { api, GatewayError, shopFetch } from "@/lib/shopApi";
import {
  CASHLIKE,
  num,
  onlineOnly,
  type DeliveryGroup,
  type PayMethod,
  type Totals,
} from "@/lib/checkout/types";
import { cc4 } from "./session";
import { rub } from "./catalog";
import { announceCartChanged } from "./memberCart";
import { openBank } from "./pay";
import { rememberLkCountries, setLkCountry, useLkCountries, useLkCountry } from "./country";

const SHAKE_MS = 600;

type Ready = "idle" | "ok" | "error";

const titleCase = (s: string) =>
  s.toLowerCase().replace(/(^|[\s-])(\S)/g, (_, a: string, b: string) => a + b.toUpperCase());

const CITY_REGIONS = /^(москва|санкт-петербург|севастополь)$/i;

export function useMemberCheckout() {
  const cart = useCart();
  // a render can run on a stale snapshot: re-read the cart once on mount
  useEffect(() => refreshCart(), []);

  const lines = useMemo(() => cart.filter((l) => l.qty > 0), [cart]);
  const cartKey = lines.map((l) => `${l.coralId}:${l.qty}`).join(",");

  const country = useLkCountry();
  const countries = useLkCountries();
  const countryName = countries[country] ?? country;

  const [ready, setReady] = useState<Ready>("idle");
  const [error, setError] = useState("");
  const [warn, setWarn] = useState("");

  /* ---- the form ---- */
  const [email, setEmail] = useState("");
  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState(""); // street and house number
  const [apartment, setApartment] = useState("");
  const [zip, setZip] = useState("");
  const [cityDraft, setCityDraft] = useState("");
  const [city, setCity] = useState("");
  const [region, setRegion] = useState("");
  const [manual, setManual] = useState(false);
  const [picked, setPicked] = useState(false);
  const [searchText, setSearchText] = useState("");
  const [acceptTerms, setAcceptTerms] = useState(false);
  const [agreeData, setAgreeData] = useState(false);
  const { street, build } = splitStreet(address);

  /* ---- delivery, pick-up, payment ---- */
  const [groups, setGroups] = useState<DeliveryGroup[]>([]);
  const [mode, setMode] = useState<"courier" | "pickup">("courier");
  const [deliveryChoice, setDeliveryChoice] = useState("");
  const [points, setPoints] = useState<PickPoint[]>([]);
  const [pointsFor, setPointsFor] = useState("");
  const [pointCode, setPointCode] = useState("");
  const [sheetOpen, setSheetOpen] = useState(false);
  const [mapOpen, setMapOpen] = useState(false);
  const [deliveryErr, setDeliveryErr] = useState("");
  const [payments, setPayments] = useState<PayMethod[]>([]);
  const [paymentChoice, setPaymentChoice] = useState("");
  const [lastPayment, setLastPayment] = useState("");
  const [totals, setTotals] = useState<Totals | null>(null);
  const [deliveryFor, setDeliveryFor] = useState("");
  const [paymentsFor, setPaymentsFor] = useState("");
  const [totalsFor, setTotalsFor] = useState("");
  const [slotCfg, setSlotCfg] = useState<{ moscow?: DeliveryTimes; spb?: DeliveryTimes }>({});
  const [slotDate, setSlotDate] = useState("");
  const [slotTime, setSlotTime] = useState("");

  /* ---- code and bonuses ---- */
  const [promoOpen, setPromoOpen] = useState(false);
  const [promoDraft, setPromoDraft] = useState("");
  const [promo, setPromo] = useState("");
  const [promoMsg, setPromoMsg] = useState("");
  const [bonusOpen, setBonusOpen] = useState(false);
  const [bonusDraft, setBonusDraft] = useState("");
  const [bonus, setBonus] = useState(0);

  /* ---- sending ---- */
  const [attempted, setAttempted] = useState(false);
  const [shaking, setShaking] = useState("");
  const shakeTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [sending, setSending] = useState(false);
  const [memberId, setMemberId] = useState<number | null>(null);
  const [order, setOrder] = useState<{ id: string; paymentName: string; failed: string } | null>(null);

  // the city is read after the member stops typing
  useEffect(() => {
    const t = setTimeout(() => setCity(cityDraft.trim()), 450);
    return () => clearTimeout(t);
  }, [cityDraft]);

  // the member's own data fills the form: name, phone, e-mail, city
  useEffect(() => {
    let alive = true;
    cc4<{
      data?: { id?: number; name?: string; surname?: string; patronymic?: string; phone?: string; email?: string; address?: { city?: string } };
    }>("/account").then((r) => {
      const d = r.json?.data;
      if (!alive || !d) return;
      if (typeof d.id === "number") setMemberId(d.id);
      const name = [d.surname, d.name, d.patronymic].filter(Boolean).join(" ");
      if (name) setFullName((v) => v || titleCase(name));
      if (d.phone) setPhone((v) => v || d.phone!);
      if (d.email) setEmail((v) => v || d.email!);
      if (d.address?.city) {
        setCityDraft((v) => v || d.address!.city!);
        setCity((v) => v || d.address!.city!);
      }
    });
    return () => {
      alive = false;
    };
  }, []);

  // 1 ─ the basket in the shop: for a member it is the cabinet basket; when the shop's copy is empty, fill it
  useEffect(() => {
    if (!cartKey) return;
    let cancelled = false;
    const read = () => api<{ result?: { QUANTITY?: number | string }; error?: string }>("/order");
    (async () => {
      try {
        let o = await read();
        if (cancelled) return;
        if (!Number(o.result?.QUANTITY ?? 0)) {
          const pairs = cartKey
            .split(",")
            .map((p) => p.split(":"))
            .map(([id, q]) => `${encodeURIComponent(id)}=${q}`)
            .join("&");
          await shopFetch(`/shop/shop_basket.php?${pairs}`);
          o = await read();
          if (cancelled) return;
        }
        const got = Number(o.result?.QUANTITY ?? 0);
        if (!got) {
          setReady("error");
          setError(o.error || "Магазин не принял корзину.");
          return;
        }
        const want = cartKey.split(",").reduce((n, p) => n + Number(p.split(":")[1] ?? 0), 0);
        setWarn(got !== want ? `В корзине магазина ${got} шт., у вас в списке ${want}. Проверьте состав перед оформлением.` : "");
        setReady("ok");
      } catch (e) {
        if (cancelled) return;
        // вход истёк (токен кабинета не принят): на вход и обратно сюда
        if (e instanceof GatewayError && e.status === 401) {
          window.location.assign(`${process.env.NEXT_PUBLIC_BASE_PATH ?? ""}/lk/login/?next=${encodeURIComponent("/lk/checkout/")}`);
          return;
        }
        setReady("error");
        const why = e instanceof GatewayError ? e.message : e instanceof TypeError ? "нет связи со шлюзом" : (e as Error)?.message || "неизвестная ошибка";
        setError(`Не удалось связаться с магазином (${why}). Обновите страницу и попробуйте снова.`);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [cartKey]);

  // the shop's own data once the basket is in: countries, courier schedules, how the member paid last time, a city to start from
  useEffect(() => {
    if (ready !== "ok") return;
    let alive = true;
    api<{
      result?: {
        COUNTRIES_FILTERED?: Record<string, string>;
        CHECKOUT_OPTIONS?: { countries?: Record<string, string>; moscowDeliveryTimes?: DeliveryTimes; spbDeliveryTimes?: DeliveryTimes };
        PROFILE_LAST?: { LAST_CHOICES?: { LAST_PAYMENT_TYPE?: { ID?: string } } };
      };
    }>("/init").then((d) => {
      if (!alive) return;
      setSlotCfg({ moscow: d.result?.CHECKOUT_OPTIONS?.moscowDeliveryTimes, spb: d.result?.CHECKOUT_OPTIONS?.spbDeliveryTimes });
      const list = Object.entries(d.result?.COUNTRIES_FILTERED ?? d.result?.CHECKOUT_OPTIONS?.countries ?? {}).filter(([c]) => /^[A-Z]{2}$/.test(c));
      if (list.length) rememberLkCountries(Object.fromEntries(list));
      setLastPayment(d.result?.PROFILE_LAST?.LAST_CHOICES?.LAST_PAYMENT_TYPE?.ID ?? "");
    });
    return () => {
      alive = false;
    };
  }, [ready]);

  /* ---- what the choices give (pure derivations) ---- */
  const place = city ? `${country}|${city}|${region}` : "";
  const deliveryKey = `${cartKey}|${place}`;
  const expressOff = country === "RU" && isMoscow(city) && !!slotCfg.moscow && deliverySlots(slotCfg.moscow, { express: true, mkad: true }).length === 0;
  const courierItems = groups
    .filter((g) => g.ID !== "PICK_POINT")
    .flatMap((g) => g.ITEMS)
    .filter((i) => !(expressOff && i.ID === "I_COURIER_1DAY"))
    .sort((a, b) => (a.PRICE ?? 0) - (b.PRICE ?? 0));
  const pickupItems = groups.filter((g) => g.ID === "PICK_POINT").flatMap((g) => g.ITEMS);
  const pickupNone = deliveryFor === deliveryKey && pickupItems.length === 0;
  const pickup = !pickupNone && (mode === "pickup" || (courierItems.length === 0 && pickupItems.length > 0));
  const items = pickup ? pickupItems : courierItems;
  const chosenPoint = pickup ? points.find((p) => p.CODE === pointCode) : undefined;
  const deliveryId = pickup
    ? pickupItems.some((i) => i.ID === chosenPoint?.TYPE)
      ? (chosenPoint?.TYPE ?? "")
      : (pickupItems[0]?.ID ?? "")
    : courierItems.some((i) => i.ID === deliveryChoice)
      ? deliveryChoice
      : (courierItems[0]?.ID ?? "");
  const activeItem = items.find((i) => i.ID === deliveryId);
  const point = chosenPoint;
  const pickPointParam = point ? point.CODE : false;
  const slotArea = country === "RU" && !pickup ? slotRegion(city, deliveryId) : null;
  const slotDays = slotArea ? deliverySlots(slotArea === "moscow" ? slotCfg.moscow : slotCfg.spb, { express: deliveryId === "I_COURIER_1DAY", mkad: true }) : [];
  const slotDay = slotDays.find((d) => d.date === slotDate) ?? slotDays[0];
  const slotHours = slotDay?.times.includes(slotTime) ? slotTime : slotDay?.times[0];
  const paymentId = payments.some((p) => p.ID === paymentChoice)
    ? paymentChoice
    : (payments.find((p) => p.ID === lastPayment)?.ID ?? payments[0]?.ID ?? "");
  const paymentsKey = `${deliveryKey}|${deliveryId}`;
  const totalsKey = `${paymentsKey}|${paymentId}|${promo}|${bonus}|${pickup ? pointCode : ""}`;

  // регион, как его пишет справочник магазина («Республика Татарстан»): без него доставка в РФ не считается
  // («Ошибка получения доступных методов доставки»); город вместо региона годится только для городов-регионов
  const area = region || (country !== "RU" || CITY_REGIONS.test(city) ? city : "");
  const needsRegion = country === "RU" && Boolean(city) && !area;

  const fio = fullName.trim();
  const profile = pickup
    ? {
        COUNTRY: country,
        COUNTRY_NAME: countryName,
        CITY: city,
        AREA: area,
        STREET: point?.ADDRESS ?? "",
        DELIVERY_TYPE: activeItem?.TYPE ?? "PICK_POINT",
        PICK_POINT_SERVICE: point?.TYPE ?? "",
        PICK_POINT_CODE: point?.CODE ?? "",
        EMAIL: email.trim(),
        FIO: fio,
        PHONE: phone.replace(/[^0-9+]/g, ""),
      }
    : {
        COUNTRY: country,
        COUNTRY_NAME: countryName,
        CITY: city,
        AREA: area,
        STREET: street,
        BUILD: build,
        APARTMENT: apartment.trim(),
        POSTINDEX: zip.trim(),
        DELIVERY_TYPE: activeItem?.TYPE ?? "COURIER",
        EMAIL: email.trim(),
        FIO: fio,
        PHONE: phone.replace(/[^0-9+]/g, ""),
      };
  const profileKey = JSON.stringify(profile);

  /* ---- 2 ─ delivery ---- */
  useEffect(() => {
    if (ready !== "ok" || !place) return;
    if (needsRegion) {
      const t = setTimeout(() => {
        setGroups([]);
        setDeliveryFor(deliveryKey);
        setDeliveryErr("Укажите регион, например «Республика Татарстан» или «Московская область».");
      }, 0);
      return () => clearTimeout(t);
    }
    let cancelled = false;
    api<{ result?: DeliveryGroup[]; error?: string }>("/delivery", { COUNTRY: country, CITY: city, AREA: area }).then((d) => {
      if (cancelled) return;
      // the shop says which payments each service allows: only cash (pay the courier) is not offered here
      const hasOnline = (i: DeliveryGroup["ITEMS"][number]) => !Array.isArray(i.PAYSYSTEMS) || i.PAYSYSTEMS.length === 0 || onlineOnly(i.PAYSYSTEMS).length > 0;
      const list = (Array.isArray(d.result) ? d.result : [])
        .map((g) => ({ ...g, ITEMS: (Array.isArray(g.ITEMS) ? g.ITEMS : []).filter(hasOnline) }))
        .filter((g) => g.ITEMS.length);
      setGroups(list);
      setDeliveryFor(deliveryKey);
      setDeliveryErr(list.length ? "" : d.error || "Для этого адреса нет способов доставки.");
      if (!list.length) {
        setPayments([]);
        setTotals(null);
      }
    });
    return () => {
      cancelled = true;
    };
  }, [ready, place, country, city, region, area, needsRegion, deliveryKey]);

  /* ---- 3 ─ payments of the chosen delivery (online only) ---- */
  useEffect(() => {
    if (ready !== "ok" || !deliveryId || !place) return;
    let cancelled = false;
    api<{ result?: PayMethod[] }>("/payments", { deliveryId, COUNTRY: country, CITY: city, AREA: area }).then((p) => {
      if (cancelled) return;
      setPayments(onlineOnly(Array.isArray(p.result) ? p.result : []));
      setPaymentsFor(paymentsKey);
    });
    return () => {
      cancelled = true;
    };
  }, [ready, deliveryId, place, country, city, region, area, paymentsKey]);

  /* ---- 3b ─ pick-up points of the city ---- */
  const pointsKey = `${region}|${city}`;
  useEffect(() => {
    if (ready !== "ok" || !pickup || !city) return;
    let cancelled = false;
    api<{ result?: PickPoint[] }>("/pickpoints", { COUNTRY: country, CITY: city, AREA: area }).then((d) => {
      if (cancelled) return;
      setPoints(Array.isArray(d.result) ? d.result : []);
      setPointsFor(pointsKey);
    });
    return () => {
      cancelled = true;
    };
  }, [ready, pickup, country, region, area, city, pointsKey]);
  const pointsLoading = pickup && !!city && pointsFor !== pointsKey;

  /* ---- 4 ─ totals, re-read on every change ---- */
  useEffect(() => {
    if (ready !== "ok" || !deliveryId || !paymentId || !place) return;
    let cancelled = false;
    const t = setTimeout(() => {
      api<{ result?: Totals }>("/order", {
        bonusUseValue: bonus,
        promo,
        deliveryId,
        paymentId,
        pickPoint: pickPointParam,
        COUNTRY: country,
        CITY: city,
        AREA: area,
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
  }, [ready, deliveryId, paymentId, place, country, city, region, area, promo, bonus, profileKey, pickPointParam, totalsKey]);

  /* ---- actions ---- */
  function applyAddress(a: ResolvedAddress) {
    const line = streetLine(country, a.street, a.houseNumber);
    setAddress(line);
    setApartment(a.unit);
    setCityDraft(a.city);
    setCity(a.city);
    setRegion(a.state);
    setZip(a.zip);
    if (a.street && a.houseNumber && a.zip && a.city) {
      setSearchText(`${line}, ${a.zip} ${a.city}`);
      setPicked(true);
    } else {
      setManual(true); // something is missing: let the member complete it
    }
  }

  /** Another country: the address was for the old one, the shop recounts delivery and payment. */
  function changeCountry(code: string) {
    if (!code || code === country) return;
    setLkCountry(code);
    setGroups([]);
    setPayments([]);
    setPaymentChoice("");
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
    setRegion("");
  }

  async function applyPromo() {
    const code = promoDraft.trim();
    if (!code || !deliveryId) return;
    setPromoMsg("");
    // the order calculation answers 500 for an unknown code, so ask first
    const r = await api<{ result?: { DISCOUNT?: number | string } | number }>("/promo", { promo: code, deliveryId, COUNTRY: country, CITY: city, AREA: area });
    const discount = typeof r.result === "object" && r.result ? num(r.result.DISCOUNT) : 0;
    if (discount > 0) {
      setPromo(code);
    } else {
      setPromo("");
      setPromoMsg("Этот промокод не подходит.");
    }
  }

  const walletHave = num(totals?.CW_VALUE);
  const walletLimit = Math.floor(num(totals?.CW_VALUE_LIMIT) || walletHave);
  function setBonusTo(v: number) {
    const next = Math.max(0, Math.min(walletLimit, Math.floor(v)));
    setBonus(next);
    setBonusDraft(next ? String(next) : "");
    if (!next) setBonusOpen(false);
  }

  const required: { key: string; bad: boolean }[] = [
    ...(pickup
      ? [
          { key: "city", bad: !city },
          { key: "region", bad: needsRegion },
          { key: "point", bad: !point },
        ]
      : [
          { key: "address", bad: manual || !addressSearchEnabled() ? street === "" || build === "" : !picked },
          { key: "zip", bad: zip.trim().length < 5 },
          { key: "city", bad: !city },
          { key: "region", bad: needsRegion },
        ]),
    { key: "first", bad: fio.split(/\s+/).filter(Boolean).length < 2 },
    { key: "phone", bad: phone.replace(/\D/g, "").length < 10 },
    { key: "email", bad: !/^\S+@\S+\.\S+$/.test(email.trim()) },
    { key: "terms", bad: !acceptTerms },
    { key: "data", bad: !agreeData },
  ];
  const canOrder = deliveryId !== "" && paymentId !== "";

  /** Scroll to a field, shake it and put the cursor in it. */
  function pointAt(key: string) {
    const el = document.querySelector<HTMLElement>(`[data-field="${key}"]`);
    if (!el) return;
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    el.scrollIntoView({ behavior: reduce ? "auto" : "smooth", block: "center" });
    setShaking("");
    if (shakeTimer.current) clearTimeout(shakeTimer.current);
    shakeTimer.current = setTimeout(() => {
      setShaking(key);
      shakeTimer.current = setTimeout(() => setShaking(""), SHAKE_MS);
    }, 30);
    el.querySelector<HTMLElement>("input:not([type=checkbox]), select")?.focus({ preventScroll: true });
  }

  /**
   * After the order: online payment opens the gateway the shop picks for the country. The cabinet API gives the order's
   * payment link (the member's session sits in it); the gateway walks the shop's order page like the shop does (picks the
   * payment method via orderSelectPaysystem) and hands back the bank address. If no bank is found we stay on the done
   * screen with a retry: opening the shop in the browser would land on its sign-in page (no session there).
   */
  async function goToPayment(id: string, paymentName: string): Promise<string> {
    if (CASHLIKE.test(paymentName)) return "";
    try {
      return await findBank(id);
    } catch (e) {
      console.error(e);
      return "не удалось найти страницу банка";
    }
  }
  async function findBank(id: string): Promise<string> {
    return openBank(id, { country, paymentId });
  }

  // the only place that creates a real order: runs on the member's click
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
        PHONE: phone.replace(/[^0-9+]/g, ""),
        PROFILE: { ...profile, MANUAL: 1 },
        memberId,
        bonusUse: !(bonus > 0), // the shop's own checkout sends it this way round
        bonusUseValue: bonus,
        promo,
        additionalOrderInfo: {
          orderComment: slotDay && slotHours ? `Доставка: ${slotDay.label}, ${slotHours}` : "",
          needToContact: false,
          contactMethod: "",
          chosenMessenger: "",
          receiveEmails: false,
          acceptTerms,
          acceptTerms2: false,
          agreePersonalData: agreeData,
        },
        dutyEnabled: true,
        ...(slotDay && slotHours ? { DELIVERY_DATE: slotDay.date, DELIVERY_FROM: slotHours.split("-")[0], DELIVERY_TO: slotHours.split("-")[1] } : {}),
      };
      const r = await shopFetch("/sv-api/order?language=ru", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(body) });
      const data = (await r.json()) as { result?: string | number; error?: string };
      if (data.result) {
        const name = payments.find((x) => x.ID === paymentId)?.NAME ?? "";
        const id = String(data.result);
        announceCartChanged(); // корзина после заказа пуста: Layout перечитает её в общем меню
        setOrder({ id, paymentName: name, failed: "" });
        const failed = await goToPayment(id, name);
        setOrder({ id, paymentName: name, failed });
        setSending(false);
        return;
      }
      setError(data.error || "Магазин не принял заказ. Проверьте данные.");
    } catch (e) {
      console.error(e);
      setError("Не удалось отправить заказ. Попробуйте ещё раз.");
    }
    setSending(false);
  }

  /* ---- loaders and money ---- */
  const deliveryLoading = ready === "idle" || (ready === "ok" && place !== "" && deliveryFor !== deliveryKey);
  const paymentsLoading = deliveryLoading || (ready === "ok" && deliveryId !== "" && paymentsFor !== paymentsKey);
  const totalsLoading = paymentsLoading || (ready === "ok" && deliveryId !== "" && paymentId !== "" && totalsFor !== totalsKey);
  const currency = String(totals?.CURRENCY ?? "RUB");
  const money = (n: number) => rub(n, currency);
  const goodsFromLines = lines.reduce((sum, l) => sum + priceOf(l), 0);
  const goodsSum = totals ? num(totals.PRICE) : goodsFromLines;
  const deliveryPrice = totals && totals.TOTAL_PRICE !== undefined && totals.PRICE !== undefined ? num(totals.TOTAL_PRICE) - num(totals.PRICE) : null;
  const grand = totals ? (promo && totals.TOTAL_PRICE_WITH_PROMO !== undefined ? totals.TOTAL_PRICE_WITH_PROMO : totals.TOTAL_PRICE) : null;
  const promoOff = totals ? Math.max(0, num(totals.TOTAL_PRICE) - num(totals.TOTAL_PRICE_WITH_PROMO)) : 0;
  const memberSaving = lines.reduce((sum, l) => sum + savingOf(l), 0);
  const totalSaving = memberSaving + (promo ? promoOff : 0);
  const shownTotal = grand !== null ? num(grand) : null;

  const field = (key: string) => ({
    name: key,
    shake: shaking === key,
    attention: attempted && required.find((f) => f.key === key)?.bad,
  });

  return {
    // cart and place
    lines, country, countries, countryName, changeCountry,
    // state of the page
    ready, error, warn, order, sending, attempted,
    // form
    form: { email, setEmail, fullName, setFullName, phone, setPhone, address, setAddress, apartment, setApartment, zip, setZip, cityDraft, setCityDraft, city, region, setRegion, needsRegion, manual, setManual, picked, setPicked, searchText, setSearchText, street, build, acceptTerms, setAcceptTerms, agreeData, setAgreeData },
    applyAddress, field, required,
    // delivery
    delivery: { pickup, pickupNone, mode, setMode, items, activeItem, deliveryId, setDeliveryChoice, deliveryErr, deliveryLoading, deliveryFor, deliveryKey, point, pickupItems, points, pointsLoading, setPointCode, sheetOpen, setSheetOpen, mapOpen, setMapOpen, slotDays, slotDay, slotHours, setSlotDate, setSlotTime },
    // payment
    payment: { payments, paymentId, setPaymentChoice, paymentsLoading },
    // code and bonuses
    promoState: { promoOpen, setPromoOpen, promoDraft, setPromoDraft, promo, promoMsg, applyPromo },
    bonusState: { walletHave, walletLimit, bonus, bonusOpen, setBonusOpen, bonusDraft, setBonusDraft, setBonusTo },
    // money
    money, goodsSum, deliveryPrice, memberSaving, totalSaving, promoOff, shownTotal, totals, totalsLoading,
    canOrder, submit, retryPayment: () => (order ? goToPayment(order.id, order.paymentName).then((failed) => setOrder({ ...order, failed })) : undefined),
  };
}

/** A line's total in numbers (the cart keeps display strings). */
function priceOf(l: CartLine): number {
  return num(l.price.replace(/[^\d.,\s ]/g, "").replace(/[ ]/g, "")) * l.qty;
}
function savingOf(l: CartLine): number {
  const was = l.was ? num(l.was.replace(/[^\d.,\s ]/g, "").replace(/[ ]/g, "")) : 0;
  const now = num(l.price.replace(/[^\d.,\s ]/g, "").replace(/[ ]/g, ""));
  return was > now ? (was - now) * l.qty : 0;
}

/** Go to the bank: a plain visit, or the form the shop would have posted. */
