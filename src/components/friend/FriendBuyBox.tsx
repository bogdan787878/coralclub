"use client";

import { BuyBox, type BuyBoxProduct } from "@/components/organisms";
import { friendProductById } from "@/lib/friendCatalog";
import { useFriendPricing } from "@/lib/friendPricing";
import { SHOP_SITES } from "@/lib/shopSites";

/** The product page's buy block, priced for the country the visitor shops for. */
export function FriendBuyBox({
  product,
  href,
}: {
  product: BuyBoxProduct & { coralId: string };
  href: string;
}) {
  const pr = useFriendPricing();
  const p = friendProductById(product.coralId);
  const options =
    p && pr.sold(p)
      ? [
          {
            id: "club",
            label: "Member price",
            note: "−20%",
            price: pr.money(pr.club(p)),
            cta: { label: "Add to cart", href },
          },
          {
            id: "regular",
            label: "Regular price",
            price: pr.money(pr.regular(p)),
            cta: { label: "Add to cart", href },
          },
        ]
      : [
          {
            id: "club",
            label: "Not sold here",
            price: "—",
            cta: { label: "Add to cart", href },
          },
        ];

  const unsold = !(p && pr.sold(p));
  return (
    <>
      {unsold && (
        <p
          style={{
            margin: "0 0 var(--space-8)",
            color: "var(--color-text-muted)",
          }}
        >
          Not sold on the {SHOP_SITES[pr.country]?.name ?? pr.country} site.
        </p>
      )}
      <BuyBox
        pinned
        product={product}
        options={options}
        labels={{
          add: "Add to cart",
          inCart: "In cart",
          openCart: "Open cart",
        }}
      />
    </>
  );
}
