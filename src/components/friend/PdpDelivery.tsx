"use client";

import { SITE_DELIVERY } from "@/lib/friendCatalog.generated";
import { useFriendPricing } from "@/lib/friendPricing";
import { MARKET } from "@/lib/market";
import { SHOP_SITES } from "@/lib/shopSites";
import heads from "./PdpHeadings.module.css";
import styles from "./PdpBlocks.module.css";

/**
 * The delivery options of the country the visitor shops for, a block of the
 * product page. The list is what the country's shop site delivers with; the
 * exact options and prices for an address come at checkout.
 */
export function PdpDelivery() {
  const pr = useFriendPricing();
  const name = SHOP_SITES[pr.country]?.name ?? MARKET.country;
  const options = SITE_DELIVERY[pr.country] ?? [];
  const courier = options
    .filter((o) => o.kind === "courier")
    .sort((a, b) => a.price - b.price);
  const pickup = options.filter((o) => o.kind === "pickup");
  const cheapestPickup = pickup.length
    ? Math.min(...pickup.map((o) => o.price))
    : 0;
  const days = (t: string) => (t ? `${t} days` : "");

  return (
    <section className={styles.block} aria-labelledby="pdp-delivery">
      <h2 id="pdp-delivery" className={heads.title}>
        Delivery to {name}
      </h2>
      {options.length > 0 ? (
        <div className={styles.card}>
          {courier.map((o) => (
            <div key={`c-${o.name}`} className={styles.row}>
              <span className={styles.rowText}>
                <span className={styles.rowName}>{o.name}</span>
                <span className={styles.rowDetail}>
                  {[
                    days(o.transit),
                    o.price > 0 && o.freeFrom > 0
                      ? `free over ${pr.money(o.freeFrom)}`
                      : "",
                  ]
                    .filter(Boolean)
                    .join(" · ")}
                </span>
              </span>
              <span
                className={`${styles.rowPrice} ${o.price === 0 ? styles.free : ""}`}
              >
                {o.price > 0 ? pr.money(o.price) : "Free"}
              </span>
            </div>
          ))}
          {pickup.length > 0 && (
            <div className={styles.row}>
              <span className={styles.rowText}>
                <span className={styles.rowName}>Pick-up point</span>
                <span className={styles.rowDetail}>
                  {[
                    pickup.map((o) => o.name).join(", "),
                    days(pickup[0].transit),
                  ]
                    .filter(Boolean)
                    .join(" · ")}
                </span>
              </span>
              <span
                className={`${styles.rowPrice} ${cheapestPickup === 0 ? styles.free : ""}`}
              >
                {cheapestPickup > 0
                  ? `from ${pr.money(cheapestPickup)}`
                  : "Free"}
              </span>
            </div>
          )}
        </div>
      ) : (
        <p className={styles.text}>
          Delivery options for your address appear at checkout.
        </p>
      )}
      <p className={styles.note}>
        Exact options and prices depend on your address and order; you see them
        at checkout.
      </p>
    </section>
  );
}
