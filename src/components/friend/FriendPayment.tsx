"use client";

import Image from "next/image";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useEffect, useRef, useState, useSyncExternalStore } from "react";
import { LandingHeader } from "@/components/landing/LandingHeader";
import { asset } from "@/lib/asset";
import { formatUsd } from "@/lib/friendCatalog";
import { readLastOrder, type LastOrder } from "@/lib/friendOrder";
import { onShopOrigin, pinShopSite } from "@/lib/shopApi";
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

/** Pages of the shop's payment flow. */
const inPaymentFlow = (path: string) =>
  /^\/(card-payment|order\/payment|payment)\b/.test(path);
/** The shop asks the visitor to sign in: this order is not in this session. */
const needsLogin = (path: string) => /^\/auth\b/.test(path);

/**
 * Step 2 of the friend checkout: the order is already created in the shop;
 * the shop's own payment form (card number, Google Pay …) is shown inside our
 * page, next to the order summary. Card data never touches this app — the
 * form is the shop's payment page in a frame (same origin: coralclub.us or
 * the local proxy). When the payment flow leaves the payment pages (the
 * «thank you» page), the whole window goes there.
 */
export function FriendPayment() {
  const params = useSearchParams();
  const orderId = (params.get("order") ?? "").replace(/\D/g, "");
  const paymentId = (params.get("pm") ?? "").replace(/[^\w:-]/g, "");

  const live = useSyncExternalStore<boolean | null>(
    () => () => {},
    onShopOrigin,
    () => null,
  );
  const [order, setOrder] = useState<LastOrder | null>(null);
  useEffect(() => {
    const t = setTimeout(() => setOrder(readLastOrder(orderId)), 0);
    return () => clearTimeout(t);
  }, [orderId]);

  const src = `/order/payment/${orderId}/${encodeURIComponent(paymentId)}/?new_checkout=1`;
  const frame = useRef<HTMLIFrameElement>(null);
  const [height, setHeight] = useState(760);
  const [lost, setLost] = useState(false);
  useEffect(() => pinShopSite(), []);

  // follow the frame's content height; leave the frame when the payment is over
  useEffect(() => {
    const el = frame.current;
    if (!el || !live) return;
    let ro: ResizeObserver | null = null;
    const onLoad = () => {
      try {
        const win = el.contentWindow;
        const doc = el.contentDocument;
        if (!win || !doc) return;
        const path = win.location.pathname;
        if (needsLogin(path)) {
          setLost(true);
          return;
        }
        if (!inPaymentFlow(path)) {
          // the payment is over (the «thank you» page): take the whole window there
          window.location.assign(win.location.href);
          return;
        }
        const measure = () =>
          setHeight(Math.max(560, doc.documentElement.scrollHeight));
        measure();
        ro?.disconnect();
        ro = new ResizeObserver(measure);
        ro.observe(doc.documentElement);
      } catch {
        /* cross-origin: keep the default height */
      }
    };
    el.addEventListener("load", onLoad);
    return () => {
      el.removeEventListener("load", onLoad);
      ro?.disconnect();
    };
  }, [live, src]);

  const summary = order && (
    <div className={styles.sum}>
      <ul className={styles.sumLines}>
        {order.lines.map((l) => (
          <li key={l.name} className={styles.sumLine}>
            <span className={styles.thumb}>
              <span className={styles.thumbImg}>
                {l.image && <Image src={l.image} alt="" fill sizes="56px" />}
              </span>
              <span className={styles.badge}>{l.qty}</span>
            </span>
            <span className={styles.lineName}>
              {l.name}
              {l.form && <span className={styles.lineSub}>{l.form}</span>}
            </span>
            <span className={styles.lineSum}>
              <span className={styles.was}>{formatUsd(l.regular * l.qty)}</span>{" "}
              {formatUsd(l.club * l.qty)}
            </span>
          </li>
        ))}
      </ul>
      <dl className={styles.rows}>
        <div>
          <dt>{order.shippingName || "Shipping"}</dt>
          <dd>
            {order.shipping === null
              ? "—"
              : order.shipping > 0
                ? formatUsd(order.shipping)
                : "Free"}
          </dd>
        </div>
        <div className={styles.rowTotal}>
          <dt>Total</dt>
          <dd>{formatUsd(order.total)}</dd>
        </div>
      </dl>
      <p className={styles.host}>
        Shipping to {order.address}
        <br />
        Receipt to {order.email}
      </p>
    </div>
  );

  return (
    <div className="appShell">
      <main className={styles.page} data-analytics-location="checkout">
        <LandingHeader homeHref={asset("/friend/")} />

        {!orderId || live === false ? (
          <div className={styles.empty}>
            <h1 className={styles.title}>Payment</h1>
            <p className={styles.host}>
              {orderId
                ? "This step runs on the shop’s own domain, where the order was created."
                : "There is no order to pay yet."}
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
                    <strong>{formatUsd(order.total)}</strong>
                  </span>
                </summary>
                <div className={styles.sumBodyMobile}>{summary}</div>
              </details>
            )}

            <div className={styles.main}>
              <h1 className={styles.title}>Payment</h1>
              <section className={styles.section}>
                <p className={styles.sub}>
                  Order № {orderId} is created. Pay by card or with Google Pay
                  (where available). All transactions are secure and encrypted.
                </p>
                {lost && (
                  <p className={styles.error}>
                    We can’t open this order’s payment (the session has ended).
                    Please go back to checkout and place the order again.
                  </p>
                )}
                {live && !lost && (
                  <div className={styles.frame}>
                    <iframe
                      ref={frame}
                      title="Secure payment"
                      src={src}
                      allow="payment *"
                      style={{ height }}
                    />
                  </div>
                )}
                <p className={styles.note}>
                  The payment form is the shop’s secure page; your card details
                  go straight to the payment provider.{" "}
                  <a href={src} target="_blank" rel="noopener noreferrer">
                    Open it in a separate tab
                  </a>
                </p>
              </section>
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
