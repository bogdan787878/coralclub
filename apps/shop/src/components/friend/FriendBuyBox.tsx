"use client";

import { BuyBox, type BuyBoxProduct } from "@/components/organisms";
import { friendProductById } from "@/lib/friendCatalog";
import { useFriendPricing } from "@/lib/friendPricing";
import { SHOP_SITES } from "@/lib/shopSites";
import { tr, useFriendLang } from "@/lib/friendLang";

/** The product page's buy block, priced for the country the visitor shops for. */
export function FriendBuyBox({
  product,
  href,
}: {
  product: BuyBoxProduct & { coralId: string };
  href: string;
}) {
  const pr = useFriendPricing();
  const lang = useFriendLang();
  const add = tr(lang, "Add to cart", "В корзину");
  const p = friendProductById(product.coralId);
  const options =
    p && pr.sold(p)
      ? [
          {
            id: "club",
            label: tr(lang, "Member price", "Цена участника"),
            note: "−20%",
            price: pr.money(pr.club(p)),
            cta: { label: add, href },
          },
          {
            id: "regular",
            label: tr(lang, "Regular price", "Обычная цена"),
            price: pr.money(pr.regular(p)),
            cta: { label: add, href },
          },
        ]
      : [
          {
            id: "club",
            label: tr(lang, "Not sold here", "Нет в продаже"),
            price: "—",
            cta: { label: add, href },
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
          {tr(
            lang,
            `Not sold on the ${SHOP_SITES[pr.country]?.name ?? pr.country} site.`,
            "Этого товара нет в магазине вашей страны.",
          )}
        </p>
      )}
      <BuyBox
        pinned
        tagByWas
        steady
        product={product}
        options={options}
        labels={{
          add,
          inCart: tr(lang, "In cart", "В корзине"),
          openCart: tr(lang, "Open cart", "Открыть корзину"),
        }}
      />
    </>
  );
}
