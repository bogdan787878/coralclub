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
import { LandingHeader } from "@/components/landing/LandingHeader";
import { asset } from "@/lib/asset";
import { track, trackOnce } from "@/lib/analytics";
import { summarize } from "@/lib/analyticsRu";
import { refreshCart, useCart } from "@/lib/cart";
import {
  formatMoney,
  friendProductById,
  friendTotals,
} from "@/lib/friendCatalog";
import { shopBasketUrl } from "@/lib/friend";
import { MARKET, REGIONS, phoneForShop } from "@/lib/market";
import { readContact, saveContact } from "@/lib/friendContact";
import {
  api,
  emptyShopBasket,
  enqueueBasketSync,
  fillShopBasket,
  language,
  onShopOrigin,
  pinShopSite,
  shopFetch,
} from "@/lib/shopApi";
import { AddressSearch } from "./AddressSearch";
import { splitStreet } from "@/lib/addressSearch";
import { FloatInput } from "./FloatInput";
import { CardBadges } from "./PayBadges";
import { StateCombobox } from "./StateCombobox";
import { useFriend } from "./FriendProvider";
import co from "../landing/LandingCheckout.module.css";
import styles from "./FriendCheckout.module.css";

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
/** A pick-up point as the shop lists it (FedEx locations near a city). */
type PickPoint = {
  CODE: string;
  TYPE: string;
  NAME: string;
  ADDRESS: string;
  CITY: string;
  POSTINDEX?: string;
  WORKTIME?: string | null;
};

const num = (v: unknown) =>
  parseFloat(
    String(v ?? "")
      .replace(/\s/g, "")
      .replace(",", "."),
  ) || 0;

const paymentTypeCode = (name: string) =>
  /paypal/i.test(name)
    ? "paypal"
    : /transfer|invoice|überweis/i.test(name)
      ? "bank_transfer"
      : "bank_card";

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
  useEffect(() => pinShopSite(), []);
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
  const prices = useMemo(() => friendTotals(lines), [lines]);

  /** `null` until the first render on the client (SSR has no window). */
  const live = useSyncExternalStore<boolean | null>(
    () => () => {},
    onShopOrigin,
    () => null,
  );

  const [ready, setReady] = useState<"idle" | "sync" | "ok" | "error">("idle");
  const [error, setError] = useState("");
  const [missing, setMissing] = useState<string[]>([]);

  const [email, setEmail] = useState("");
  const [first, setFirst] = useState("");
  const [last, setLast] = useState("");
  const [phone, setPhone] = useState("");
  const [state, setState] = useState("");
  const [city, setCity] = useState("");
  const [cityDraft, setCityDraft] = useState("");
  const [address, setAddress] = useState(""); // street and house number
  const [apartment, setApartment] = useState("");
  const [supplementOpen, setSupplementOpen] = useState(false);
  // the Bundesland came with a picked address: no need to ask for it again
  const [statePicked, setStatePicked] = useState(false);
  const { street, build } = splitStreet(address);
  const [zip, setZip] = useState("");
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
  const [pointSearch, setPointSearch] = useState("");
  const [deliveryErr, setDeliveryErr] = useState("");
  const [payments, setPayments] = useState<PayMethod[]>([]);
  const [paymentId, setPaymentId] = useState("");
  const [totals, setTotals] = useState<Totals | null>(null);
  // which request each block shows the answer of (for the loaders)
  const [deliveryFor, setDeliveryFor] = useState("");
  const [paymentsFor, setPaymentsFor] = useState("");
  const [totalsFor, setTotalsFor] = useState("");

  // courier services and the pick-up service come in separate groups
  // the cheapest service first, so that it is the one chosen by default
  const courierItems = groups
    .filter((g) => g.ID !== "PICK_POINT")
    .flatMap((g) => g.ITEMS)
    .sort((a, b) => (a.PRICE ?? 0) - (b.PRICE ?? 0));
  const pickupItems = groups
    .filter((g) => g.ID === "PICK_POINT")
    .flatMap((g) => g.ITEMS);
  const pickup = mode === "pickup";
  const items = pickup ? pickupItems : courierItems;
  const deliveryId = pickup
    ? (pickupItems[0]?.ID ?? "")
    : courierItems.some((i) => i.ID === deliveryChoice)
      ? deliveryChoice
      : (courierItems[0]?.ID ?? "");
  const activeItem = items.find((i) => i.ID === deliveryId);
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
        setFirst((v) => v || c.first);
        setLast((v) => v || c.last);
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

  // In Germany the shop's delivery options do not depend on the address, so
  // they load at once; a market whose options do (the US) waits for the state.
  const placeCity = MARKET.deliveryNeedsRegion ? city || state : "";
  const placeArea = MARKET.deliveryNeedsRegion ? state : "";
  const cityForShop = city || state;
  const place = MARKET.deliveryNeedsRegion
    ? state
      ? `${placeCity}|${state}`
      : ""
    : MARKET.code;
  const deliveryKey = `${cartKey}|${place}`;
  const paymentsKey = `${deliveryKey}|${deliveryId}`;
  const totalsKey = `${paymentsKey}|${paymentId}|${promo}|${pickup ? pointCode : ""}`;

  // 1 ─ the cart into the shop's basket, tied to the friend
  useEffect(() => {
    if (!live || !refCode || !memberId || !cartKey) return;
    const wanted = cartKey.split(",").map((part) => {
      const [coralId, qty] = part.split(":");
      return { coralId, qty: Number(qty) };
    });
    let cancelled = false;
    enqueueBasketSync(async () => {
      // a newer run (or leaving the page) made this one stale: do nothing
      if (cancelled) return;
      setReady("sync");
      setError("");
      try {
        await emptyShopBasket();
        if (cancelled) return;
        await fillShopBasket(wanted, { refCode, memberId });
        const o = await api<{ result?: { QUANTITY?: number | string } }>(
          "/order",
        );
        if (cancelled) return;
        const want = wanted.reduce((n, l) => n + l.qty, 0);
        const got = Number(o.result?.QUANTITY ?? 0);
        if (got <= 0) {
          setReady("error");
          setError("The shop did not take the items from your cart.");
          return;
        }
        setMissing(
          got < want
            ? [
                "Some items from your cart are not available in the shop right now.",
              ]
            : [],
        );
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
  }, [live, refCode, memberId, cartKey]);

  // begin_checkout, once, when the checkout is open with the cart in it
  useEffect(() => {
    if (ready !== "ok" || !goods.items.length) return;
    trackOnce("begin_checkout", () =>
      track(
        "begin_checkout",
        { bonus_points: goods.bonus_points },
        { currency: MARKET.currency, value: goods.value, items: goods.items },
      ),
    );
  }, [ready, goods]);

  // 2 ─ delivery options for the state / city
  useEffect(() => {
    if (ready !== "ok" || !place) return;
    let cancelled = false;
    api<{ result?: DeliveryGroup[]; error?: string }>("/delivery", {
      COUNTRY: MARKET.code,
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
        list.length ? "" : "No delivery options for this address.",
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
  }, [ready, place, placeCity, placeArea, deliveryKey]);

  // 3 ─ payment methods of the chosen delivery
  useEffect(() => {
    if (ready !== "ok" || !deliveryId || !place) return;
    let cancelled = false;
    api<{ result?: PayMethod[] }>("/payments", {
      deliveryId,
      COUNTRY: MARKET.code,
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
  }, [ready, deliveryId, place, placeCity, placeArea, paymentsKey]);

  // 3b ─ pick-up points near the city (the shop answers per city)
  const pointsKey = `${state}|${city}`;
  useEffect(() => {
    if (ready !== "ok" || !pickup || !state || !city) return;
    let cancelled = false;
    api<{ result?: PickPoint[] }>("/pickpoints", {
      COUNTRY: MARKET.code,
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
  }, [ready, pickup, state, city, pointsKey]);
  const pointsLoading = pickup && !!state && !!city && pointsFor !== pointsKey;
  // the shopper's city first, then by city and name; narrowed by the search box
  const visiblePoints = useMemo(() => {
    const q = pointSearch.trim().toLowerCase();
    const own = city.trim().toLowerCase();
    return points
      .filter(
        (p) =>
          !q ||
          `${p.NAME} ${p.ADDRESS} ${p.CITY} ${p.POSTINDEX ?? ""}`
            .toLowerCase()
            .includes(q),
      )
      .sort(
        (a, b) =>
          Number(b.CITY.toLowerCase() === own) -
            Number(a.CITY.toLowerCase() === own) ||
          a.CITY.localeCompare(b.CITY) ||
          a.NAME.localeCompare(b.NAME),
      );
  }, [points, pointSearch, city]);

  const fio = `${first.trim()} ${last.trim()}`.trim();
  const digits = phone.replace(/\D/g, "");
  const phoneShop = phoneForShop(phone);
  const profile = pickup
    ? {
        COUNTRY: MARKET.code,
        COUNTRY_NAME: MARKET.country,
        CITY: city || cityForShop,
        AREA: state,
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
        COUNTRY: MARKET.code,
        COUNTRY_NAME: MARKET.country,
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
        COUNTRY: MARKET.code,
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
      COUNTRY: MARKET.code,
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
    { key: "email", bad: !/\S+@\S+\.\S+/.test(email) },
    { key: "first", bad: first.trim().length < 1 },
    { key: "last", bad: last.trim().length < 1 },
    ...(pickup
      ? [
          { key: "state", bad: !state },
          { key: "city", bad: !city },
          { key: "point", bad: !point },
        ]
      : [
          { key: "address", bad: street === "" || build === "" },
          { key: "zip", bad: zip.trim() === "" },
          { key: "city", bad: !city },
          { key: "state", bad: !state },
        ]),
    { key: "phone", bad: digits.length < 6 },
    { key: "terms", bad: !acceptTerms },
    { key: "data", bad: !agreeData },
  ];
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
          orderComment: "",
          needToContact: false,
          contactMethod: "",
          chosenMessenger: "",
          receiveEmails: false,
          acceptTerms,
          acceptTerms2: false,
          agreePersonalData: agreeData,
        },
        dutyEnabled: true,
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
          currency: MARKET.currency,
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
        // step 2 is a full page load, on purpose: the card page runs without
        // analytics and without any script left over from the pages before it
        window.location.assign(
          asset(
            `/friend/checkout/pay/?order=${encodeURIComponent(String(data.result))}&pm=${encodeURIComponent(paymentId)}&kind=${kind}`,
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

  const goodsSum = totals ? num(totals.PRICE) : prices.club;
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
  const memberSaving = prices.saving;
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
                {p && (
                  <span className={styles.was}>
                    {formatMoney(p.regular * l.qty)}
                  </span>
                )}{" "}
                {formatMoney((p?.club ?? 0) * l.qty)}
              </span>
            </li>
          );
        })}
      </ul>
      <dl className={styles.rows}>
        {memberSaving > 0 && (
          <div className={styles.rowGood}>
            <dt>Member discount</dt>
            <dd>−{formatMoney(memberSaving)}</dd>
          </div>
        )}
        <div>
          <dt>Subtotal</dt>
          <dd>{formatMoney(goodsSum)}</dd>
        </div>
        {promo && promoOff > 0 && (
          <div className={styles.rowGood}>
            <dt>Code {promo}</dt>
            <dd>−{formatMoney(promoOff)}</dd>
          </div>
        )}
        <div>
          <dt>Shipping</dt>
          <dd>
            {deliveryPrice === null
              ? "Calculated next"
              : deliveryPrice > 0
                ? formatMoney(deliveryPrice)
                : "Free"}
          </dd>
        </div>
        {totals && num(totals.TAX) > 0 && (
          <div>
            <dt>Tax</dt>
            <dd>{formatMoney(num(totals.TAX))}</dd>
          </div>
        )}
        <div className={styles.rowTotal}>
          <dt>Total</dt>
          <dd>{shownTotal !== null ? formatMoney(shownTotal) : "—"}</dd>
        </div>
      </dl>
      {totalSaving > 0 && (
        <p className={styles.saved}>You’re saving {formatMoney(totalSaving)}</p>
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

  const barTotal = shownTotal !== null ? shownTotal : prices.club;

  return (
    <div className="appShell">
      <main className={styles.page} data-analytics-location="checkout">
        <LandingHeader homeHref={asset("/friend/")} />

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
                        currency: MARKET.currency,
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
                  {prices.regular > barTotal && (
                    <span className={styles.was}>
                      {formatMoney(prices.regular)}
                    </span>
                  )}
                  <strong>{formatMoney(barTotal)}</strong>
                </span>
              </summary>
              <div className={styles.sumBodyMobile}>{summary}</div>
            </details>

            <div className={styles.main}>
              <h1 className={styles.title}>Checkout</h1>

              {ready === "sync" && (
                <p className={styles.loader} role="status">
                  <span className={styles.spinner} aria-hidden="true" />
                  Preparing your order…
                </p>
              )}
              {error && <p className={styles.error}>{error}</p>}
              {missing.map((m) => (
                <p key={m} className={styles.error}>
                  {m}
                </p>
              ))}

              <section className={styles.section}>
                <h2 className={styles.h2}>Contact</h2>
                <FloatInput
                  {...field("email")}
                  label="Email"
                  placeholder="name@example.com"
                  value={email}
                  onChange={setEmail}
                  inputMode="email"
                  autoComplete="email"
                />
              </section>

              <section className={styles.section}>
                <h2 className={styles.h2}>Delivery</h2>
                {MARKET.pickup && (
                  <div
                    className={styles.toggle}
                    role="radiogroup"
                    aria-label="How to receive your order"
                  >
                    {(
                      [
                        ["courier", "Delivery to address"],
                        ["pickup", "Pick up point"],
                      ] as const
                    ).map(([id, label]) => (
                      <button
                        key={id}
                        type="button"
                        role="radio"
                        aria-checked={mode === id}
                        className={`${styles.toggleBtn} ${mode === id ? styles.toggleOn : ""}`}
                        data-analytics-id={`delivery_mode_${id}`}
                        onClick={() => {
                          setMode(id);
                          track("delivery_method_selected", {
                            delivery_type_code: id,
                          });
                        }}
                      >
                        {label}
                      </button>
                    ))}
                  </div>
                )}
                <div className={styles.fixed}>
                  <span>Country/Region</span>
                  <strong>{MARKET.country}</strong>
                </div>
                <div className={styles.row}>
                  <FloatInput
                    {...field("first")}
                    label="First name"
                    value={first}
                    onChange={setFirst}
                    autoComplete="given-name"
                  />
                  <FloatInput
                    {...field("last")}
                    label="Last name"
                    value={last}
                    onChange={setLast}
                    autoComplete="family-name"
                  />
                </div>
                {!pickup ? (
                  <>
                    <AddressSearch
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
                      onPick={(a) => {
                        // a pick fills the whole address form
                        setAddress(
                          [a.street, a.houseNumber].filter(Boolean).join(" "),
                        );
                        setApartment(a.unit);
                        if (a.unit) setSupplementOpen(true);
                        setCityDraft(a.city);
                        setCity(a.city);
                        setState(a.state);
                        setStatePicked(a.state !== "");
                        setZip(a.zip);
                      }}
                    />
                    {supplementOpen || apartment ? (
                      <FloatInput
                        label="Address supplement (optional)"
                        placeholder="c/o, floor, entrance"
                        value={apartment}
                        onChange={setApartment}
                        autoComplete="address-line2"
                      />
                    ) : (
                      <button
                        type="button"
                        className={styles.addLine}
                        onClick={() => setSupplementOpen(true)}
                      >
                        + Add c/o, floor or entrance
                      </button>
                    )}
                    <div className={styles.row}>
                      <FloatInput
                        {...field("zip")}
                        label="Postcode"
                        placeholder="10117"
                        value={zip}
                        onChange={(v) => {
                          setZip(v);
                          setStatePicked(false);
                        }}
                        inputMode="numeric"
                        autoComplete="postal-code"
                      />
                      <FloatInput
                        {...field("city")}
                        label="City"
                        value={cityDraft}
                        onChange={(v) => {
                          setCityDraft(v);
                          setStatePicked(false);
                        }}
                        autoComplete="address-level2"
                      />
                    </div>
                    {!statePicked && (
                      <StateCombobox
                        options={REGIONS}
                        label="State (Bundesland)"
                        value={state}
                        onChange={setState}
                        name="state"
                        shake={shaking === "state"}
                        attention={attempted && !state}
                      />
                    )}
                  </>
                ) : (
                  <>
                    <div className={styles.row}>
                      <StateCombobox
                        options={REGIONS}
                        label="State (Bundesland)"
                        value={state}
                        onChange={setState}
                        name="state"
                        shake={shaking === "state"}
                        attention={attempted && !state}
                      />
                      <FloatInput
                        {...field("city")}
                        label="City"
                        value={cityDraft}
                        onChange={setCityDraft}
                        autoComplete="address-level2"
                      />
                    </div>
                    <div
                      className={`${styles.pickup} ${shaking === "point" ? styles.shake : ""}`}
                      data-field="point"
                    >
                      {!state || !city ? (
                        <p className={styles.hint}>
                          Enter your state and city to find pick-up points near
                          you.
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
                          <p className={styles.sub}>
                            {points.length} pick-up points near {city}
                          </p>
                          {points.length > 6 && (
                            <FloatInput
                              label="Search by name, street or ZIP"
                              value={pointSearch}
                              onChange={setPointSearch}
                            />
                          )}
                          <div
                            className={`${styles.options} ${attempted && !point ? styles.optionsError : ""}`}
                            role="radiogroup"
                            aria-label="Pick-up points"
                          >
                            <div className={styles.pointScroll}>
                              {visiblePoints.length === 0 ? (
                                <p className={styles.comboEmpty}>
                                  Nothing matches “{pointSearch}”.
                                </p>
                              ) : (
                                visiblePoints.map((p) => (
                                  <label
                                    key={p.CODE}
                                    className={`${styles.option} ${pointCode === p.CODE ? styles.optionOn : ""}`}
                                  >
                                    <input
                                      type="radio"
                                      name="pickpoint"
                                      checked={pointCode === p.CODE}
                                      onChange={() => setPointCode(p.CODE)}
                                    />
                                    <span className={styles.optionName}>
                                      {p.NAME}
                                      <small>{p.ADDRESS}</small>
                                      {p.WORKTIME && (
                                        <small>{p.WORKTIME}</small>
                                      )}
                                    </span>
                                  </label>
                                ))
                              )}
                            </div>
                          </div>
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
                <FloatInput
                  {...field("phone")}
                  label="Phone"
                  placeholder="(212) 555-0123"
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
                    Choose your state to view available shipping methods.
                  </p>
                ) : deliveryLoading ? (
                  <p className={styles.loader} role="status">
                    <span className={styles.spinner} aria-hidden="true" />
                    Loading delivery options…
                  </p>
                ) : items.length > 0 ? (
                  <div className={styles.options} role="radiogroup">
                    {items.map((it) => (
                      <label
                        key={it.ID}
                        className={`${styles.option} ${deliveryId === it.ID ? styles.optionOn : ""}`}
                      >
                        <input
                          type="radio"
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
                        />
                        <span className={styles.optionName}>
                          {it.NAME}
                          <small>
                            {it.TRANSIT ? `${it.TRANSIT} business days` : ""}
                            {it.FREE_DELIVERY
                              ? `${it.TRANSIT ? " · " : ""}free over ${formatMoney(it.FREE_DELIVERY)}`
                              : ""}
                          </small>
                        </span>
                        <span className={styles.optionPrice}>
                          {it.PRICE ? formatMoney(it.PRICE) : "Free"}
                        </span>
                      </label>
                    ))}
                  </div>
                ) : (
                  <p className={styles.hint}>
                    {pickup && !deliveryErr
                      ? "Pick-up isn’t available in this state. Choose delivery to an address."
                      : deliveryErr || "No delivery options for this address."}
                  </p>
                )}
              </section>

              <section className={styles.section}>
                <h2 className={styles.h2}>Payment</h2>
                <p className={styles.sub}>
                  All transactions are secure and encrypted.
                </p>
                {!place ? (
                  <p className={styles.hint}>
                    Payment options appear once you choose your state.
                  </p>
                ) : paymentsLoading ? (
                  <p className={styles.loader} role="status">
                    <span className={styles.spinner} aria-hidden="true" />
                    Loading payment options…
                  </p>
                ) : (
                  <div className={styles.options} role="radiogroup">
                    {payments.map((p) => (
                      <label
                        key={p.ID}
                        className={`${styles.option} ${paymentId === p.ID ? styles.optionOn : ""}`}
                      >
                        <input
                          type="radio"
                          name="payment"
                          checked={paymentId === p.ID}
                          onChange={() => {
                            setPaymentId(p.ID);
                            track("payment_method_selected", {
                              payment_type_code: paymentTypeCode(p.NAME),
                              payment_method_name: p.NAME,
                            });
                          }}
                        />
                        <span className={styles.optionName}>
                          {paymentTypeCode(p.NAME) === "bank_card"
                            ? "Credit or debit card"
                            : p.NAME}
                        </span>
                        {paymentTypeCode(p.NAME) === "bank_card" ? (
                          <CardBadges wallets={MARKET.googlePay} />
                        ) : p.IMAGE ? (
                          // eslint-disable-next-line @next/next/no-img-element -- the shop's own method logo
                          <img
                            src={p.IMAGE}
                            alt=""
                            className={styles.optionLogo}
                          />
                        ) : (
                          <span />
                        )}
                        {paymentId === p.ID && (
                          <p className={styles.optionNote}>
                            {paymentTypeCode(p.NAME) === "paypal"
                              ? "You’ll continue to PayPal to finish your payment."
                              : paymentTypeCode(p.NAME) === "bank_transfer"
                                ? "You’ll get the bank details on the next step."
                                : MARKET.googlePay
                                  ? "You’ll enter your card details — or use Google Pay where available — on the next step."
                                  : "You’ll enter your card details on the next step."}
                          </p>
                        )}
                      </label>
                    ))}
                  </div>
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
                        <dd>−{formatMoney(memberSaving)}</dd>
                      </div>
                    )}
                    <div>
                      <dt>Items</dt>
                      <dd>{formatMoney(goodsSum)}</dd>
                    </div>
                    <div>
                      <dt>Shipping</dt>
                      <dd>
                        {deliveryPrice === null
                          ? "—"
                          : deliveryPrice > 0
                            ? formatMoney(deliveryPrice)
                            : "Free"}
                      </dd>
                    </div>
                    <div className={styles.rowTotal}>
                      <dt>Total</dt>
                      <dd>
                        {shownTotal !== null ? formatMoney(shownTotal) : "—"}
                      </dd>
                    </div>
                  </dl>
                </div>
                <p className={styles.host}>
                  All prices include VAT. Shipping is shown above.
                </p>
                {totalSaving > 0 && (
                  <p className={styles.saved}>
                    Total savings {formatMoney(totalSaving)}
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
      </main>
    </div>
  );
}
