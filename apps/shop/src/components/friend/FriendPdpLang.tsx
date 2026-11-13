"use client";

import { useEffect, useState, type ReactNode } from "react";
import { guestProductDetail, type ProductDetail } from "@coral/api";
import { Container, Heading, Section } from "@/components/ui";
import { ProductDetailView } from "@/components/catalog/ProductDetailView";
import { ShopSkeleton } from "@/components/lk/LkShop";
import { FRIEND_PRODUCTS, friendPdpHref, friendProduct } from "@/lib/friendCatalog";
import { useFriendLang } from "@/lib/friendLang";
import { friendTitle } from "@/lib/friendRu";
import { articleFor } from "@/lib/siteArticles";
import shop from "@/app/(shop)/products/[slug]/page.module.css";
import styles from "@/app/landing/product/[slug]/page.module.css";
import { FriendBuyBox } from "./FriendBuyBox";
import { FriendCards } from "./FriendCards";

/**
 * Страница товара «Друга клуба» на языке страны. Английская (статичная, собирается при сборке) — `children`;
 * для России — русская: тексты, применение и состав из API каталога России, фото и цены — витрины проекта.
 */
export function FriendPdpLang({ slug, children }: { slug: string; children: ReactNode }) {
  const lang = useFriendLang();
  const p = friendProduct(slug);
  const article = p ? articleFor("RU", p.coralId) : null;
  const [ru, setRu] = useState<{ article: string; detail: ProductDetail | null } | null>(null);

  useEffect(() => {
    if (lang !== "ru" || !article) return;
    let alive = true;
    guestProductDetail(article, { country: "RU", language: "ru" }).then((detail) => alive && setRu({ article, detail }));
    return () => {
      alive = false;
    };
  }, [lang, article]);

  if (lang !== "ru" || !p) return <>{children}</>;

  const detail = ru?.article === article ? ru.detail : undefined;
  if (detail === undefined) {
    return (
      <main className={shop.page}>
        <Container>
          <div style={{ padding: "24px 0" }}>
            <ShopSkeleton n={2} />
          </div>
        </Container>
      </main>
    );
  }
  // API не знает товар: английская страница лучше пустой
  if (detail === null) return <>{children}</>;

  const title = friendTitle(p, "ru");
  const others = FRIEND_PRODUCTS.filter((x) => x.slug !== slug);
  return (
    <ProductDetailView
      p={detail}
      title={title}
      lead={detail.description || detail.components.split(/(?<=[.!?])\s+/)[0] || ""}
      images={p.images.map((im) => ({ ...im, alt: title }))}
      backHref="/friend/"
      idPrefix="friend"
      buy={<FriendBuyBox href={friendPdpHref(slug)} product={{ coralId: p.coralId, slug, name: title, image: p.images[0]?.src }} />}
      more={
        <Section tone="default" className={styles.more}>
          <Container>
            <Heading as="h2" className={shop.moreTitle}>
              Ещё для гидратации
            </Heading>
          </Container>
          <FriendCards products={others} listId="pdp_similar" listName="More from Hydration" label="Ещё для гидратации" />
        </Section>
      }
    />
  );
}
