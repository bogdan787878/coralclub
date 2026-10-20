"use client";

import Image from "next/image";
import Link from "next/link";
import {
  useEffect,
  useId,
  useMemo,
  useRef,
  useState,
  useSyncExternalStore,
} from "react";
import { Container } from "@/components/ui";
import { LandingHeader } from "@/components/landing/LandingHeader";
import { asset } from "@/lib/asset";
import { track, trackOnce } from "@/lib/analytics";
import { summarize } from "@/lib/analyticsRu";
import { refreshCart, useCart } from "@/lib/cart";
import { formatUsd, friendProductById } from "@/lib/friendCatalog";
import { shopBasketUrl } from "@/lib/friend";
import {
  api,
  emptyShopBasket,
  enqueueBasketSync,
  fillShopBasket,
  language,
  onShopOrigin,
  shopFetch,
} from "@/lib/shopApi";
import { US_STATES } from "@/lib/usStates";
import { useFriend } from "./FriendProvider";
import { FriendRegisterCta } from "./FriendRegisterCta";
import co from "../landing/LandingCheckout.module.css";
import styles from "./Friend.module.css";

/**
 * The project's real checkout (US): the visitor's cart is put into the shop's
 * own basket tied to the friend's REF_CODE (member prices, no sign-up, the
 * sale is counted for that member), then delivery, payment and totals are read
 * from the shop's checkout API, and the order is created on the shopper's
 * click — followed by the shop's own payment page.
 *
 * It needs the shop's origin (coralclub.us, or `npm run dev:proxy` →
 * http://localhost:3200/friend/checkout/). Anywhere else it falls back to
 * handing the cart to the shop's basket page.
 */

type PayMethod = { ID: string; NAME: string };
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
  /paypal/i.test(name) ? "paypal" : "bank_card";

/** Text input with its label inside the field (floats up on focus / value). */
function FloatInput({
  label,
  value,
  onChange,
  placeholder,
  attention,
  inputMode,
  autoComplete,
  name,
  shake,
}: {
  name?: string;
  shake?: boolean;
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  attention?: boolean;
  inputMode?: "text" | "tel" | "email" | "numeric";
  autoComplete?: string;
}) {
  const id = useId();
  return (
    <div className={`${co.float} ${shake ? co.shake : ""}`} data-field={name}>
      <div className={`${co.floatBox} ${attention ? co.floatBoxActive : ""}`}>
        <input
          id={id}
          className={co.floatInput}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder ?? " "}
          inputMode={inputMode}
          autoComplete={autoComplete}
        />
        <label htmlFor={id} className={co.floatLabel}>
          {label}
        </label>
      </div>
    </div>
  );
}

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
  const [missing, setMissing] = useState<string[]>([]);

  const [fio, setFio] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [state, setState] = useState("");
  const [city, setCity] = useState("");
  const [cityDraft, setCityDraft] = useState("");
  const [build, setBuild] = useState("");
  const [street, setStreet] = useState("");
  const [apartment, setApartment] = useState("");
  const [zip, setZip] = useState("");
  const [comment, setComment] = useState("");
  const [acceptTerms, setAcceptTerms] = useState(false);
  const [agreeData, setAgreeData] = useState(false);

  const [groups, setGroups] = useState<DeliveryGroup[]>([]);
  const [deliveryId, setDeliveryId] = useState("");
  const [deliveryErr, setDeliveryErr] = useState("");
  const [payments, setPayments] = useState<PayMethod[]>([]);
  const [paymentId, setPaymentId] = useState("");
  const [totals, setTotals] = useState<Totals | null>(null);
  // which request each block shows the answer of (for the loaders)
  const [deliveryFor, setDeliveryFor] = useState("");
  const [paymentsFor, setPaymentsFor] = useState("");
  const [totalsFor, setTotalsFor] = useState("");

  const [attempted, setAttempted] = useState(false);
  const [shaking, setShaking] = useState("");
  const shakeTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [sending, setSending] = useState(false);

  // the city is read after the shopper stops typing
  useEffect(() => {
    const t = setTimeout(() => setCity(cityDraft.trim()), 450);
    return () => clearTimeout(t);
  }, [cityDraft]);

  // delivery depends on the state (and the order sum); the city is only
  // needed to place the order, so the options load as soon as a state is chosen
  const cityForShop = city || state;
  const place = state ? `${cityForShop}|${state}` : "";
  const deliveryKey = `${cartKey}|${place}`;
  const paymentsKey = `${deliveryKey}|${deliveryId}`;
  const totalsKey = `${paymentsKey}|${paymentId}`;

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
        { currency: "USD", value: goods.value, items: goods.items },
      ),
    );
  }, [ready, goods]);

  // 2 ─ delivery options for the state / city
  useEffect(() => {
    if (ready !== "ok" || !place) return;
    let cancelled = false;
    api<{ result?: DeliveryGroup[]; error?: string }>("/delivery", {
      COUNTRY: "US",
      CITY: cityForShop,
      AREA: state,
    }).then((d) => {
      if (cancelled) return;
      // the pick-up points need a point picker — this checkout is courier-only
      const list = (Array.isArray(d.result) ? d.result : [])
        .filter((g) => g.ID !== "PICK_POINT")
        .map((g) => ({ ...g, ITEMS: Array.isArray(g.ITEMS) ? g.ITEMS : [] }))
        .filter((g) => g.ITEMS.length);
      setGroups(list);
      setDeliveryFor(deliveryKey);
      setDeliveryErr(
        list.length ? "" : "No delivery options for this address.",
      );
      const all = list.flatMap((g) => g.ITEMS);
      setDeliveryId((cur) =>
        all.some((i) => i.ID === cur) ? cur : (all[0]?.ID ?? ""),
      );
      if (!all.length) {
        setPayments([]);
        setPaymentId("");
        setTotals(null);
      }
    });
    return () => {
      cancelled = true;
    };
  }, [ready, place, cityForShop, state, deliveryKey]);

  const items = groups.flatMap((g) => g.ITEMS);
  const activeItem = items.find((i) => i.ID === deliveryId);

  // 3 ─ payment methods of the chosen delivery
  useEffect(() => {
    if (ready !== "ok" || !deliveryId || !place) return;
    let cancelled = false;
    api<{ result?: PayMethod[] }>("/payments", {
      deliveryId,
      COUNTRY: "US",
      CITY: cityForShop,
      AREA: state,
    }).then((p) => {
      if (cancelled) return;
      const list = Array.isArray(p.result) ? p.result : [];
      setPayments(list);
      setPaymentsFor(paymentsKey);
      setPaymentId((cur) =>
        list.some((x) => x.ID === cur) ? cur : (list[0]?.ID ?? ""),
      );
    });
    return () => {
      cancelled = true;
    };
  }, [ready, deliveryId, place, cityForShop, state, paymentsKey]);

  const digits = phone.replace(/\D/g, "");
  const phoneForShop = digits.length === 10 ? `+1${digits}` : `+${digits}`;
  const profile = {
    COUNTRY: "US",
    COUNTRY_NAME: "United States",
    CITY: cityForShop,
    AREA: state,
    STREET: street.trim(),
    BUILD: build.trim(),
    APARTMENT: apartment.trim(),
    POSTINDEX: zip.trim(),
    DELIVERY_TYPE: activeItem?.TYPE ?? "COURIER",
    EMAIL: email.trim(),
    FIO: fio.trim(),
    PHONE: phoneForShop,
  };

  // 4 ─ totals, re-read on every change of delivery / payment / address
  const profileKey = JSON.stringify(profile);
  useEffect(() => {
    if (ready !== "ok" || !deliveryId || !paymentId || !place) return;
    let cancelled = false;
    const t = setTimeout(() => {
      api<{ result?: Totals }>("/order", {
        bonusUseValue: 0,
        promo: "",
        deliveryId,
        paymentId,
        pickPoint: false,
        COUNTRY: "US",
        CITY: cityForShop,
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
    cityForShop,
    state,
    profileKey,
    totalsKey,
  ]);

  // required fields in page order — the first empty one gets the shake
  const required: { key: string; bad: boolean }[] = [
    { key: "fio", bad: fio.trim().length < 3 },
    { key: "phone", bad: digits.length < 10 },
    { key: "email", bad: !/\S+@\S+\.\S+/.test(email) },
    { key: "state", bad: !state },
    { key: "city", bad: !city },
    { key: "build", bad: build.trim() === "" },
    { key: "street", bad: street.trim() === "" },
    { key: "zip", bad: zip.replace(/\D/g, "").length < 5 },
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
        FIO: fio.trim(),
        PHONE: phoneForShop,
        PROFILE: {
          ...profile,
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
          order_total: num(totals?.TOTAL_PRICE) || goods.value,
          currency: "USD",
        });
        // the shop's own payment page → payment gateway (outside RU/BY the
        // address carries the payment method's id)
        // a page of the shop, not a route of this app
        // eslint-disable-next-line @next/next/no-location-assign-relative-destination
        window.location.assign(
          `/order/payment/${data.result}/${encodeURIComponent(paymentId)}/?new_checkout=1`,
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

  const money = (v: unknown) => (num(v) > 0 ? formatUsd(num(v)) : "—");
  const deliveryPrice =
    totals && totals.TOTAL_PRICE !== undefined && totals.PRICE !== undefined
      ? num(totals.TOTAL_PRICE) - num(totals.PRICE)
      : null;

  const orderCard = (
    <section className={co.card} aria-label="Your order">
      <h2 className={co.h2}>Your order</h2>
      <ul className={styles.rows}>
        {lines.map((l) => (
          <li key={l.coralId}>
            <span className={styles.thumb}>
              {l.image && <Image src={l.image} alt="" fill sizes="56px" />}
            </span>
            <span className={styles.rowName}>
              {l.name}
              <small>
                {l.qty} × {l.price}
              </small>
            </span>
          </li>
        ))}
      </ul>
    </section>
  );

  const owner = friend && (
    <p className={co.muted}>
      The sale goes to <strong>{friend.name}</strong> · Coral ID{" "}
      {friend.memberId}
      {source === "demo" ? " (test: no link, default member)" : ""}
    </p>
  );

  return (
    <div className="appShell">
      <main className={co.page} data-analytics-location="checkout">
        <LandingHeader homeHref={asset("/friend/")} />

        <div
          className={co.shell}
          style={{
            marginTop: "var(--space-24)",
            // one column (the stand's two-column layout has a test panel)
            gridTemplateColumns: "minmax(0, 560px)",
          }}
        >
          <div className={co.wrap}>
            <div className={co.top}>
              <h1 className={co.h1}>Checkout</h1>
            </div>

            {lines.length === 0 ? (
              <section className={co.card}>
                <p className={co.muted}>Your cart is empty.</p>
                <Link href="/friend/" className={co.link}>
                  Back to the sets
                </Link>
              </section>
            ) : live === false ? (
              <>
                {orderCard}
                {owner}
                <section className={co.card}>
                  <h2 className={co.h2}>Delivery and payment</h2>
                  <p className={co.muted}>
                    The live checkout — delivery to your address, payment — runs
                    on the shop’s own domain. Continue there with this cart at
                    member prices; no sign-up needed.
                  </p>
                  <button
                    type="button"
                    className={co.pay}
                    disabled={!friend}
                    data-analytics-id="checkout_to_shop_btn"
                    onClick={() => {
                      if (!friend) return;
                      track(
                        "friend_redirect_to_shop",
                        { bonus_points: goods.bonus_points },
                        {
                          currency: "USD",
                          value: goods.value,
                          items: goods.items,
                        },
                      );
                      window.location.assign(shopBasketUrl(lines, friend));
                    }}
                  >
                    Continue on coralclub.us
                  </button>
                </section>
              </>
            ) : (
              <>
                {ready === "sync" && (
                  <p className={co.muted}>Preparing your order…</p>
                )}
                {error && <p className={co.error}>{error}</p>}
                {missing.map((m) => (
                  <p key={m} className={co.error}>
                    {m}
                  </p>
                ))}
                {orderCard}
                {owner}

                <section className={co.card}>
                  <h2 className={co.h2}>Contact</h2>
                  <FloatInput
                    label="Full name"
                    name="fio"
                    shake={shaking === "fio"}
                    placeholder="Jane Smith"
                    value={fio}
                    onChange={setFio}
                    attention={attempted && fio.trim().length < 3}
                    autoComplete="name"
                  />
                  <FloatInput
                    label="Phone"
                    name="phone"
                    shake={shaking === "phone"}
                    placeholder="(212) 555-0123"
                    value={phone}
                    onChange={setPhone}
                    attention={attempted && digits.length < 10}
                    inputMode="tel"
                    autoComplete="tel"
                  />
                  <FloatInput
                    label="Email"
                    name="email"
                    shake={shaking === "email"}
                    placeholder="name@example.com"
                    value={email}
                    onChange={setEmail}
                    attention={attempted && !/\S+@\S+\.\S+/.test(email)}
                    inputMode="email"
                    autoComplete="email"
                  />
                </section>

                <section className={co.card}>
                  <h2 className={co.h2}>Delivery address</h2>
                  <div
                    className={`${co.float} ${shaking === "state" ? co.shake : ""}`}
                    data-field="state"
                  >
                    <div
                      className={`${co.floatBox} ${attempted && !state ? co.floatBoxActive : ""}`}
                    >
                      <select
                        className={`${co.floatInput} ${styles.select}`}
                        value={state}
                        onChange={(e) => setState(e.target.value)}
                        autoComplete="address-level1"
                        aria-label="State"
                      >
                        <option value="" disabled />
                        {US_STATES.map((s) => (
                          <option key={s} value={s}>
                            {s}
                          </option>
                        ))}
                      </select>
                      <span
                        className={co.floatLabel}
                        style={
                          state
                            ? {
                                top: 8,
                                transform: "none",
                                fontSize: "0.75rem",
                                lineHeight: "1rem",
                              }
                            : {
                                top: "50%",
                                transform: "translateY(-50%)",
                                fontSize: "1rem",
                                lineHeight: "1.25rem",
                              }
                        }
                      >
                        State
                      </span>
                    </div>
                  </div>
                  <FloatInput
                    label="City"
                    name="city"
                    shake={shaking === "city"}
                    placeholder="New York"
                    value={cityDraft}
                    onChange={setCityDraft}
                    attention={attempted && !city}
                    autoComplete="address-level2"
                  />
                  <div className={co.row}>
                    <FloatInput
                      label="House number"
                      name="build"
                      shake={shaking === "build"}
                      placeholder="350"
                      value={build}
                      onChange={setBuild}
                      attention={attempted && build.trim() === ""}
                    />
                    <FloatInput
                      label="Street address"
                      name="street"
                      shake={shaking === "street"}
                      placeholder="5th Avenue"
                      value={street}
                      onChange={setStreet}
                      attention={attempted && street.trim() === ""}
                      autoComplete="address-line1"
                    />
                  </div>
                  <div className={co.row}>
                    <FloatInput
                      label="Apt / unit / suite (optional)"
                      placeholder="Apt 4B"
                      value={apartment}
                      onChange={setApartment}
                      autoComplete="address-line2"
                    />
                    <FloatInput
                      label="ZIP code"
                      name="zip"
                      shake={shaking === "zip"}
                      placeholder="10118"
                      value={zip}
                      onChange={setZip}
                      attention={attempted && zip.replace(/\D/g, "").length < 5}
                      inputMode="numeric"
                      autoComplete="postal-code"
                    />
                  </div>
                  <FloatInput
                    label="Delivery note (optional)"
                    placeholder="Gate code, landmark…"
                    value={comment}
                    onChange={setComment}
                  />
                </section>

                <section className={co.card}>
                  <h2 className={co.h2}>Delivery method</h2>
                  {!place ? (
                    <p className={co.muted}>
                      Choose your state to see delivery options.
                    </p>
                  ) : deliveryLoading ? (
                    <p className={co.loader} role="status">
                      <span className={co.spinner} aria-hidden="true" />
                      Loading delivery options…
                    </p>
                  ) : items.length > 0 ? (
                    <div className={co.options}>
                      {items.map((it) => (
                        <label key={it.ID} className={co.option}>
                          <input
                            type="radio"
                            name="delivery"
                            checked={deliveryId === it.ID}
                            onChange={() => {
                              setDeliveryId(it.ID);
                              track("delivery_method_selected", {
                                delivery_type_code: "courier",
                                delivery_service: it.NAME,
                                delivery_cost: Number(it.PRICE) || 0,
                              });
                            }}
                          />
                          <span>
                            {it.NAME}
                            {it.TRANSIT ? ` · ${it.TRANSIT} business days` : ""}
                            <small>
                              {it.PRICE ? formatUsd(it.PRICE) : "Free"}
                              {it.FREE_DELIVERY
                                ? ` · free over ${formatUsd(it.FREE_DELIVERY)}`
                                : ""}
                            </small>
                          </span>
                        </label>
                      ))}
                    </div>
                  ) : (
                    <p className={co.muted}>
                      {deliveryErr || "No delivery options for this address."}
                    </p>
                  )}
                </section>

                <section className={co.card}>
                  <h2 className={co.h2}>Payment</h2>
                  {!place ? (
                    <p className={co.muted}>
                      Payment options appear once you choose your state.
                    </p>
                  ) : paymentsLoading ? (
                    <p className={co.loader} role="status">
                      <span className={co.spinner} aria-hidden="true" />
                      Loading payment options…
                    </p>
                  ) : (
                    <div className={co.options}>
                      {payments.map((p) => (
                        <label key={p.ID} className={co.option}>
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
                          <span>{p.NAME}</span>
                        </label>
                      ))}
                    </div>
                  )}
                </section>

                <section className={co.card}>
                  <h2 className={co.h2}>Total</h2>
                  {totalsLoading && (
                    <p className={co.loader} role="status">
                      <span className={co.spinner} aria-hidden="true" />
                      Calculating…
                    </p>
                  )}
                  <dl className={`${co.totals} ${totalsLoading ? co.dim : ""}`}>
                    <div>
                      <dt>Items (member price)</dt>
                      <dd>
                        {totals ? money(totals.PRICE) : formatUsd(goods.value)}
                      </dd>
                    </div>
                    <div>
                      <dt>Delivery</dt>
                      <dd>
                        {deliveryPrice === null
                          ? "—"
                          : deliveryPrice > 0
                            ? formatUsd(deliveryPrice)
                            : "Free"}
                      </dd>
                    </div>
                    {totals && num(totals.TAX) > 0 && (
                      <div>
                        <dt>Tax</dt>
                        <dd>{money(totals.TAX)}</dd>
                      </div>
                    )}
                    <div className={co.grand}>
                      <dt>Total</dt>
                      <dd>{totals ? money(totals.TOTAL_PRICE) : "—"}</dd>
                    </div>
                  </dl>
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
                        Terms and conditions
                      </a>{" "}
                      and the{" "}
                      <a
                        href="/faq/privacy/"
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        Privacy policy
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
                  <button
                    type="button"
                    className={co.pay}
                    disabled={
                      sending || ready !== "ok" || totalsLoading || !canOrder
                    }
                    onClick={submit}
                    data-analytics-id="checkout_pay_btn"
                  >
                    {sending ? "Creating your order…" : "Continue to payment"}
                  </button>
                  <p className={co.muted}>
                    Your order is created in the shop and you are taken to its
                    secure payment page. No sign-up needed.
                  </p>
                </section>

                <Container>
                  <FriendRegisterCta where="checkout" />
                </Container>
              </>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
