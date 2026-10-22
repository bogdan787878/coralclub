import Image from "next/image";
import { formatMoney, friendProductById } from "@/lib/friendCatalog";
import type { PayOrder } from "@/lib/shopPay";
import styles from "./FriendCheckout.module.css";

/** The shop's delivery service ids → names (the order carries only the id). */
const DELIVERY_NAME: Record<string, string> = {
  I_FEDEX_GROUND: "FedEx Ground",
  I_FEDEX_EXPRESS: "FedEx Express 2nd Business Day",
  I_USPS: "USPS",
  I_DHL: "DHL",
  I_DHL_X: "DHL Express",
  I_DPD: "DPD",
  I_FEDEX_PICKPOINT: "FedEx pick-up",
};

export const deliveryNameOf = (order: Pick<PayOrder, "delivery">) =>
  DELIVERY_NAME[order.delivery] ||
  order.delivery.replace(/^I_/, "").replace(/_/g, " ");

/** Recipient, address, phone, email, delivery service — as the shop has them. */
export function ShippingFacts({ order }: { order: PayOrder }) {
  return (
    <dl className={styles.facts}>
      <div>
        <dt>Recipient</dt>
        <dd>{order.recipient}</dd>
      </div>
      <div>
        <dt>{order.pickup ? "Pick-up point" : "Shipping address"}</dt>
        <dd>
          {[order.street, order.city, order.area].filter(Boolean).join(", ")}{" "}
          {order.zip}
        </dd>
      </div>
      <div>
        <dt>Phone</dt>
        <dd>{order.phone}</dd>
      </div>
      <div>
        <dt>Email</dt>
        <dd>{order.email}</dd>
      </div>
      <div>
        <dt>Delivery service</dt>
        <dd>{deliveryNameOf(order)}</dd>
      </div>
    </dl>
  );
}

/**
 * The order's items and totals. `pay`: what is left to pay and the consent
 * line; `done`: the order as placed (no «amount to pay»).
 */
export function OrderSummary({
  order,
  mode,
}: {
  order: PayOrder;
  mode: "pay" | "done";
}) {
  return (
    <div className={styles.sum}>
      <ul className={styles.sumLines}>
        {order.lines.map((l) => {
          const p = friendProductById(l.code);
          return (
            <li key={l.code} className={styles.sumLine}>
              <span className={styles.thumb}>
                <span className={styles.thumbImg}>
                  {p?.images[0] && (
                    <Image src={p.images[0].src} alt="" fill sizes="56px" />
                  )}
                </span>
                <span className={styles.badge}>{l.qty}</span>
              </span>
              <span className={styles.lineName}>
                {p?.name ?? `#${l.code}`}
                {p?.form && <span className={styles.lineSub}>{p.form}</span>}
              </span>
              <span className={styles.lineSum}>
                {p && (
                  <span className={styles.was}>
                    {formatMoney(p.regular * l.qty)}
                  </span>
                )}{" "}
                {formatMoney(l.sum)}
              </span>
            </li>
          );
        })}
      </ul>
      <dl className={styles.rows}>
        <div>
          <dt>Products</dt>
          <dd>{formatMoney(order.productSum)}</dd>
        </div>
        <div>
          <dt>Delivery</dt>
          <dd>
            {order.deliveryPrice > 0
              ? formatMoney(order.deliveryPrice)
              : "Free"}
          </dd>
        </div>
        {mode === "pay" ? (
          <>
            {order.paidSum > 0 && (
              <div>
                <dt>Paid</dt>
                <dd>{formatMoney(order.paidSum)}</dd>
              </div>
            )}
            <div>
              <dt>Total amount</dt>
              <dd>{formatMoney(order.total)}</dd>
            </div>
            <div className={styles.rowTotal}>
              <dt>Amount to pay</dt>
              <dd>{formatMoney(Number(order.amount))}</dd>
            </div>
          </>
        ) : (
          <div className={styles.rowTotal}>
            <dt>Total</dt>
            <dd>{formatMoney(order.total)}</dd>
          </div>
        )}
      </dl>
      {order.friendRef && (
        <p className={styles.host}>
          Member prices applied: this order is counted for the friend who
          invited you (Coral ID {order.memberId}).
        </p>
      )}
      {mode === "pay" && (
        <p className={styles.host}>
          By placing an order, you agree to the{" "}
          <a href="/faq/privacy/" target="_blank" rel="noopener noreferrer">
            Privacy Policy
          </a>{" "}
          and accept the{" "}
          <a href="/faq/terms/" target="_blank" rel="noopener noreferrer">
            Terms and Conditions
          </a>
          .
        </p>
      )}
    </div>
  );
}
