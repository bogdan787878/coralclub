"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import {
  useCallback,
  useEffect,
  useRef,
  useState,
  useSyncExternalStore,
} from "react";
import { LandingHeader } from "@/components/landing/LandingHeader";
import { asset } from "@/lib/asset";
import {
  checkCard,
  formatCardNumber,
  formatExpiry,
  type CardErrors,
} from "@/lib/cardFormat";
import { formatUsd } from "@/lib/friendCatalog";
import { onShopOrigin, pinShopSite } from "@/lib/shopApi";
import {
  getPayOrder,
  getPayPalLink,
  payByCard,
  setupGooglePay,
  type GooglePay,
  type PayOrder,
  type PayResult,
} from "@/lib/shopPay";
import { US_STATES } from "@/lib/usStates";
import { FloatInput } from "./FloatInput";
import { OrderSummary, ShippingFacts } from "./OrderParts";
import co from "../landing/LandingCheckout.module.css";
import friendStyles from "./Friend.module.css";
import styles from "./FriendCheckout.module.css";

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

/** The shop's field names → ours, for the messages it sends back. */
const FIELD_OF: Record<string, string> = {
  card_number: "number",
  card_name: "name",
  exp_month: "expiry",
  exp_year: "expiry",
  cvc: "cvc",
  billing_street: "street",
  billing_city: "city",
  billing_state: "state",
  billing_zip: "zip",
};

/**
 * Step 2 of the friend checkout, in our own design: the order is already
 * created in the shop; here the shopper pays it — with Google Pay (Google's
 * own button) or a card typed into our fields. Both go to the shop's payment
 * API exactly as the shop's own payment page sends them; card data is not
 * stored, logged or put into analytics (analytics is switched off on this
 * page, and the checkout leads here by a full page load).
 */
export function FriendPayment() {
  const params = useSearchParams();
  const orderId = (params.get("order") ?? "").replace(/\D/g, "");
  const paySystemId = (params.get("pm") ?? "").replace(/[^\w:-]/g, "");
  const paypal = params.get("kind") === "paypal";

  const live = useSyncExternalStore<boolean | null>(
    () => () => {},
    onShopOrigin,
    () => null,
  );

  // the order as the shop sees it (amount to pay, shipping address)
  const [order, setOrder] = useState<PayOrder | null>(null);
  const [lost, setLost] = useState("");
  useEffect(() => {
    if (!live || !orderId) return;
    pinShopSite();
    let alive = true;
    getPayOrder(orderId).then((r) => {
      if (!alive) return;
      if ("order" in r) {
        if (r.order.paid) {
          window.location.assign(
            asset(`/friend/checkout/done/?order=${r.order.id}`),
          );
          return;
        }
        if (r.order.canceled) {
          setLost("This order was cancelled.");
          return;
        }
        setOrder(r.order);
      } else {
        setLost(
          r.deauth
            ? "We can’t open this order’s payment: the session has ended."
            : r.error,
        );
      }
    });
    return () => {
      alive = false;
    };
  }, [live, orderId]);

  // PayPal: the address the shop prepared for this order
  const [paypalLink, setPaypalLink] = useState<string | null | undefined>(
    undefined,
  );
  useEffect(() => {
    if (!live || !orderId || !paypal) return;
    let alive = true;
    getPayPalLink(orderId, paySystemId).then((l) => alive && setPaypalLink(l));
    return () => {
      alive = false;
    };
  }, [live, orderId, paypal, paySystemId]);

  // Google Pay (only where the device and the page can use it)
  const [gpay, setGpay] = useState<GooglePay | null>(null);
  const gpayHost = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!live || paypal) return;
    let alive = true;
    setupGooglePay().then((g) => alive && setGpay(g));
    return () => {
      alive = false;
    };
  }, [live, paypal]);

  const [number, setNumber] = useState("");
  const [expiry, setExpiry] = useState("");
  const [cvc, setCvc] = useState("");
  const [name, setName] = useState("");
  const [same, setSame] = useState(true);
  const [street, setStreet] = useState("");
  const [city, setCity] = useState("");
  const [state, setState] = useState("");
  const [zip, setZip] = useState("");
  const [attempted, setAttempted] = useState(false);
  const [shopErrors, setShopErrors] = useState<Record<string, string>>({});
  const [general, setGeneral] = useState("");
  const [busy, setBusy] = useState(false);

  const cardErrors: CardErrors = checkCard({ number, expiry, cvc, name });
  const billingErrors: Record<string, string> = same
    ? {}
    : {
        ...(street.trim() ? {} : { street: "Enter the billing address" }),
        ...(city.trim() ? {} : { city: "Enter the city" }),
        ...(state ? {} : { state: "Choose the state" }),
        ...(zip.replace(/\D/g, "").length >= 5
          ? {}
          : { zip: "Enter the ZIP code" }),
      };
  const errors: Record<string, string | undefined> = {
    ...cardErrors,
    ...billingErrors,
    ...shopErrors,
  };
  const shown = (k: string) =>
    (attempted || shopErrors[k]) && errors[k] ? errors[k] : undefined;

  const finish = useCallback(
    (r: PayResult) => {
      if (r.success) {
        // our own confirmation page (with the invitation to join the club)
        window.location.assign(
          asset(`/friend/checkout/done/?order=${orderId}`),
        );
        return true;
      }
      if (r.deauth) {
        setLost("We can’t open this order’s payment: the session has ended.");
        return false;
      }
      if (r.fields) {
        const f: Record<string, string> = {};
        for (const [k, v] of Object.entries(r.fields)) f[FIELD_OF[k] ?? k] = v;
        setShopErrors(f);
      }
      setGeneral(r.general ?? "");
      return false;
    },
    [orderId],
  );

  async function payCard() {
    if (busy || !order) return;
    setAttempted(true);
    setGeneral("");
    setShopErrors({});
    const bad = Object.keys({ ...cardErrors, ...billingErrors });
    if (bad.length) {
      document
        .querySelector<HTMLElement>(
          `[data-field="${bad[0]}"] input, [data-field="${bad[0]}"] select`,
        )
        ?.focus();
      return;
    }
    setBusy(true);
    const [month, year] = expiry.split("/");
    const r = await payByCard(
      order.id,
      paySystemId,
      { number, month, year, cvc, name: name.trim() },
      same
        ? "same"
        : { street: street.trim(), city: city.trim(), state, zip: zip.trim() },
    );
    if (!finish(r)) setBusy(false);
  }

  async function payGoogle() {
    if (busy || !order || !gpay) return;
    setGeneral("");
    setShopErrors({});
    setBusy(true);
    const r = await gpay.pay(order, paySystemId);
    if (!finish(r)) setBusy(false);
  }

  // Google's own button goes into our container
  const payGoogleRef = useRef(payGoogle);
  useEffect(() => {
    payGoogleRef.current = payGoogle;
  });
  useEffect(() => {
    const host = gpayHost.current;
    if (!gpay || !host) return;
    host.replaceChildren(gpay.button(() => void payGoogleRef.current()));
  }, [gpay]);

  const shopPage = `/order/payment/${orderId}/${encodeURIComponent(paySystemId)}/?new_checkout=1`;
  const total = order ? formatUsd(Number(order.amount)) : "";
  const shopPageChange = shopPage;

  const summary = order && <OrderSummary order={order} mode="pay" />;

  const field = (key: string) => ({
    name: key,
    attention: !!shown(key),
    hint: shown(key),
  });

  return (
    <div className="appShell">
      <main className={styles.page} data-analytics-location="checkout">
        <LandingHeader homeHref={asset("/friend/")} />

        {!orderId || live === false || lost ? (
          <div className={styles.empty}>
            <h1 className={styles.title}>Payment</h1>
            <p className={styles.host}>
              {lost ||
                (orderId
                  ? "This step runs on the shop’s own domain, where the order was created."
                  : "There is no order to pay yet.")}
            </p>
            <Link href="/friend/checkout/">Back to checkout</Link>
          </div>
        ) : (
          <div className={styles.layout}>
            {order && summary && (
              <details className={styles.sumMobile}>
                <summary className={styles.sumHead}>
                  <span>
                    Order summary <Chevron />
                  </span>
                  <span className={styles.sumHeadPrice}>
                    <strong>{total}</strong>
                  </span>
                </summary>
                <div className={styles.sumBodyMobile}>{summary}</div>
              </details>
            )}

            <div className={styles.main}>
              <h1 className={styles.title}>Order #{orderId}</h1>

              {order && (
                <section className={styles.section}>
                  <h2 className={styles.h2}>Shipping information</h2>
                  <ShippingFacts order={order} />
                </section>
              )}

              <section className={styles.section}>
                <h2 className={styles.h2}>Payment</h2>
                <p className={styles.sub}>
                  {paypal ? "PayPal" : "Credit card"} · all transactions are
                  secure and encrypted.{" "}
                  <a href={shopPageChange}>Change payment method</a>
                </p>
              </section>

              {general && <p className={styles.error}>{general}</p>}

              {paypal ? (
                <section className={styles.section}>
                  <button
                    type="button"
                    className={styles.pay}
                    disabled={!order || paypalLink === undefined}
                    onClick={() => {
                      if (paypalLink) window.location.assign(paypalLink);
                      // eslint-disable-next-line @next/next/no-location-assign-relative-destination -- a page of the shop
                      else window.location.assign(shopPage);
                    }}
                    data-analytics-id="payment_paypal_btn"
                  >
                    {paypalLink === undefined
                      ? "Preparing PayPal…"
                      : "Continue to PayPal"}
                  </button>
                  <p className={styles.note}>
                    You’ll finish the payment on PayPal and come back to the
                    shop.
                  </p>
                </section>
              ) : (
                <>
                  {gpay && (
                    <section className={styles.section}>
                      <div
                        ref={gpayHost}
                        className={styles.gpay}
                        aria-busy={busy}
                      />
                      <p className={styles.or}>
                        <span>or pay by card</span>
                      </p>
                    </section>
                  )}

                  <section className={styles.section} aria-label="Card">
                    <h2 className={styles.h2}>Card details</h2>
                    <FloatInput
                      {...field("number")}
                      label="Card number"
                      placeholder="1234 1234 1234 1234"
                      value={number}
                      onChange={(v) => setNumber(formatCardNumber(v))}
                      inputMode="numeric"
                      autoComplete="cc-number"
                      maxLength={23}
                    />
                    <div className={styles.row}>
                      <FloatInput
                        {...field("expiry")}
                        label="Expiration date"
                        placeholder="MM/YY"
                        value={expiry}
                        onChange={(v) => setExpiry(formatExpiry(v, expiry))}
                        inputMode="numeric"
                        autoComplete="cc-exp"
                        maxLength={5}
                      />
                      <FloatInput
                        {...field("cvc")}
                        label="Security code"
                        placeholder="CVC"
                        value={cvc}
                        onChange={(v) =>
                          setCvc(v.replace(/\D/g, "").slice(0, 4))
                        }
                        inputMode="numeric"
                        autoComplete="cc-csc"
                        maxLength={4}
                      />
                    </div>
                    <FloatInput
                      {...field("name")}
                      label="Name on card"
                      placeholder="JANE DOE"
                      value={name}
                      onChange={setName}
                      autoComplete="cc-name"
                    />
                  </section>

                  <section className={styles.section}>
                    <h2 className={styles.h2}>Billing address</h2>
                    <p className={styles.sub}>
                      For a successful payment, the address must match the one
                      on your card statement.
                    </p>
                    <label className={co.check}>
                      <input
                        type="checkbox"
                        checked={same}
                        onChange={(e) => setSame(e.target.checked)}
                      />
                      <span>Same as shipping address</span>
                    </label>
                    {same && order && (
                      <p className={styles.host}>
                        {[
                          order.street,
                          order.city,
                          [order.area, order.zip].filter(Boolean).join(" "),
                        ]
                          .filter(Boolean)
                          .join(", ")}
                      </p>
                    )}
                    {!same && (
                      <>
                        <FloatInput
                          {...field("street")}
                          label="Address"
                          value={street}
                          onChange={setStreet}
                          autoComplete="billing address-line1"
                        />
                        <FloatInput
                          {...field("city")}
                          label="City"
                          value={city}
                          onChange={setCity}
                          autoComplete="billing address-level2"
                        />
                        <div className={styles.row}>
                          <div className={co.float} data-field="state">
                            <div
                              className={`${co.floatBox} ${shown("state") ? co.floatBoxActive : ""}`}
                            >
                              <select
                                className={`${co.floatInput} ${friendStyles.select}`}
                                value={state}
                                onChange={(e) => setState(e.target.value)}
                                autoComplete="billing address-level1"
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
                            {shown("state") && (
                              <p className={styles.fieldHint}>
                                {shown("state")}
                              </p>
                            )}
                          </div>
                          <FloatInput
                            {...field("zip")}
                            label="ZIP code"
                            value={zip}
                            onChange={setZip}
                            inputMode="numeric"
                            autoComplete="billing postal-code"
                          />
                        </div>
                      </>
                    )}
                  </section>

                  <button
                    type="button"
                    className={styles.pay}
                    disabled={busy || !order}
                    onClick={payCard}
                    data-analytics-id="payment_pay_btn"
                  >
                    {busy ? "Processing…" : `Pay ${total}`}
                  </button>
                  <p className={styles.note}>
                    Your card details go straight to the shop’s payment system
                    over an encrypted connection and are not stored on this
                    page.{" "}
                    <a
                      href={shopPage}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      Use the shop’s own payment page instead
                    </a>
                  </p>
                </>
              )}
            </div>

            {order && summary && (
              <aside className={styles.sumDesktop} aria-label="Order summary">
                {summary}
              </aside>
            )}
          </div>
        )}
      </main>
    </div>
  );
}
