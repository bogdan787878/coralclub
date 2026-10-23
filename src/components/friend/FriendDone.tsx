"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useEffect, useState, useSyncExternalStore } from "react";
import { LandingHeader } from "@/components/landing/LandingHeader";
import { Container } from "@/components/ui";
import { asset } from "@/lib/asset";
import { track } from "@/lib/analytics";
import { summarize } from "@/lib/analyticsRu";
import { formatMoney } from "@/lib/friendCatalog";
import { MARKET } from "@/lib/market";
import { onShopOrigin, setShopSite } from "@/lib/shopApi";
import { getPayOrder, type PayOrder } from "@/lib/shopPay";
import { FriendMemberBlock } from "./FriendMemberBlock";
import { OrderSummary, ShippingFacts } from "./OrderParts";
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

/** `purchase` goes out once per order, even if the page is reloaded. */
function trackPurchaseOnce(order: PayOrder) {
  const key = `coralclub.friend.purchase.${order.id}`;
  try {
    if (window.localStorage.getItem(key)) return;
    window.localStorage.setItem(key, "1");
  } catch {
    /* storage unavailable: better a duplicate than a lost purchase */
  }
  const goods = summarize(
    order.lines.map((l) => ({ coralId: l.code, qty: l.qty })),
  );
  track(
    "purchase",
    { bonus_points: goods.bonus_points },
    {
      transaction_id: order.id,
      currency: order.currency || "USD",
      value: order.total,
      shipping: order.deliveryPrice,
      items: goods.items,
    },
  );
}

/**
 * The page after a successful payment, in our design: the order as placed,
 * where it ships, and the invitation to create an account (club membership
 * with its benefits). Reached by card / Google Pay; PayPal returns to a page
 * the shop chooses.
 */
export function FriendDone() {
  const params = useSearchParams();
  const orderId = (params.get("order") ?? "").replace(/\D/g, "");
  // the shop site the order was made on (a country with a site of its own)
  const siteRaw = params.get("site") ?? "";
  const siteParam = /^[a-z0-9-]+\.coral\.club$/.test(siteRaw)
    ? siteRaw
    : MARKET.site;

  const live = useSyncExternalStore<boolean | null>(
    () => () => {},
    onShopOrigin,
    () => null,
  );
  const [order, setOrder] = useState<PayOrder | null>(null);
  const [problem, setProblem] = useState("");

  // the order as the shop has it; right after a payment the «paid» mark can
  // lag a moment, so look again a few times
  useEffect(() => {
    if (!live || !orderId) return;
    setShopSite(siteParam);
    let alive = true;
    let tries = 0;
    const look = async () => {
      const r = await getPayOrder(orderId);
      if (!alive) return;
      if ("order" in r) {
        setOrder(r.order);
        if (r.order.paid) {
          trackPurchaseOnce(r.order);
        } else if (++tries < 6) {
          setTimeout(look, 3000);
        }
      } else {
        setProblem(
          r.deauth
            ? "We can’t open this order: the session has ended."
            : r.error,
        );
      }
    };
    void look();
    return () => {
      alive = false;
    };
  }, [live, orderId, siteParam]);

  const summary = order && <OrderSummary order={order} mode="done" />;

  return (
    <div className="appShell">
      <main className={styles.page} data-analytics-location="checkout">
        <LandingHeader homeHref={asset("/friend/")} />

        {!orderId || live === false || problem ? (
          <div className={styles.empty}>
            <h1 className={styles.title}>Your order</h1>
            <p className={styles.host}>
              {problem ||
                (orderId
                  ? "This page runs on the shop’s own domain, where the order was created."
                  : "There is no order to show.")}
            </p>
            <Link href="/friend/">Back to the shop</Link>
          </div>
        ) : (
          <>
            <div className={styles.layout}>
              {order && summary && (
                <details className={styles.sumMobile}>
                  <summary className={styles.sumHead}>
                    <span>
                      Order summary <Chevron />
                    </span>
                    <span className={styles.sumHeadPrice}>
                      <strong>{formatMoney(order.total)}</strong>
                    </span>
                  </summary>
                  <div className={styles.sumBodyMobile}>{summary}</div>
                </details>
              )}

              <div className={styles.main}>
                <div className={styles.doneHead}>
                  <span className={styles.doneMark} aria-hidden="true">
                    <svg viewBox="0 0 24 24" fill="none">
                      <path
                        d="M6 12.5l4 4 8-9"
                        stroke="currentColor"
                        strokeWidth="2.2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                  </span>
                  <h1 className={styles.title}>Thank you for your order!</h1>
                  <p className={styles.sub}>
                    Order #{orderId}
                    {order &&
                      (order.paid
                        ? " is paid."
                        : " — we’re confirming your payment…")}
                  </p>
                </div>

                {order && (
                  <section className={styles.section}>
                    <h2 className={styles.h2}>Shipping information</h2>
                    <ShippingFacts order={order} />
                  </section>
                )}

                <Link href="/friend/" className={styles.backLink}>
                  Continue shopping
                </Link>
              </div>

              {order && summary && (
                <aside className={styles.sumDesktop} aria-label="Order summary">
                  {summary}
                </aside>
              )}
            </div>

            <Container className={styles.afterOrder}>
              <FriendMemberBlock
                title="Create your account"
                cta="Create account"
                where="done"
              />
            </Container>
          </>
        )}
      </main>
    </div>
  );
}
