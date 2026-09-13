"use client";

import { useState, type ReactNode } from "react";
import Link from "next/link";
import { Accent, BodyLong, Container, Heading } from "@/components/ui";
import { addItem, useCart, setQty } from "@/lib/cart";
import { productHref } from "@/lib/catalog";
import { Carousel } from "./Carousel";
import { ImageSlider } from "./ImageSlider";
import type { Product } from "@/lib/products";
import styles from "./SeriesFeature.module.css";

export type SeriesFeatureProps = {
  /** Name of the set, e.g. "Hydration" → "The Hydration Series". */
  seriesName: string;
  /** Overrides the default "The {seriesName} Series" heading. Ignored when
   *  blurbTitle is set. */
  heading?: ReactNode;
  /** The product that represents the set. Omit for a product LINE with no
   *  single bundle SKU (e.g. Privilege) — the name/price/cart row is
   *  skipped. */
  product?: Product | null;
  /** Big-card photos — typically the series' own CMS-uploaded images
   *  (Series Blocks), independent of the product's own PDP packshots.
   *  Omit (or pass an empty list) to fall back to the product's PDP
   *  images, or a placeholder when there's no product either. */
  images?: { src: string; alt: string }[];
  /** Replaces the generic heading with the phase's own — sans lead +
   *  Newton-italic accent, same convention as Hero/Editorial — plus an
   *  optional body paragraph under it, both above the image. Also switches
   *  to the desktop layout: the card on the left, the text beside it on
   *  the right, not sticky (see .blockSplit) — the generic heading keeps
   *  the older image-beside-text layout instead. */
  blurbTitle?: { lead: string; accent: string };
  blurbBody?: string;
  /** Pre-rendered "what's in it" cards. Below 1024px these sit in their
   *  own scroll row directly under the card, inside this block; at
   *  1024px+ they move into the shared full-bleed <Carousel> underneath
   *  the whole block instead (same treatment as Restart's own product
   *  carousel), rather than staying confined next to the card. */
  carouselItems?: ReactNode[];
  /** Drops the block's own top margin — for callers that already sit in a
   *  flex column with its own gap right after a sibling (e.g. PhasesSection's
   *  PhaseSwitcher), where the self-margin would double up on that gap. */
  tightTop?: boolean;
};

function CartIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path
        d="M4 5h2.2l1.9 9.6a2 2 0 0 0 2 1.6h7a2 2 0 0 0 2-1.6L21 8.5H6.6"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <circle cx="10" cy="20" r="1.4" fill="currentColor" />
      <circle cx="17" cy="20" r="1.4" fill="currentColor" />
    </svg>
  );
}

/**
 * SeriesFeature — spotlights a set as a whole: a heading, an image, and
 * (when there's a single bundle product) its name + price with a floating
 * cart button, plus an optional row of "what's in it" cards.
 */
export function SeriesFeature({
  seriesName,
  heading,
  product,
  images: customImages,
  blurbTitle,
  blurbBody,
  carouselItems,
  tightTop,
}: SeriesFeatureProps) {
  const cart = useCart();
  const [acted, setActed] = useState(false);
  const anim = acted ? ` ${styles.animIn}` : "";

  const club = product?.prices[0]?.price;
  const clubNote = product?.prices[0]?.note;
  const regular = product?.prices[1]?.price;
  const shopHref = product?.prices[1]?.cta.href;
  const images =
    customImages && customImages.length > 0
      ? customImages
      : product
        ? product.pdpImages.map((src) => ({ src, alt: product.name }))
        : [];

  const coralId = product?.coralId;
  const qty = coralId
    ? (cart.find((l) => l.coralId === coralId)?.qty ?? 0)
    : 0;

  const href = product ? productHref(product.slug) : undefined;

  const add = () => {
    if (!product) return;
    setActed(true);
    addItem({
      coralId: coralId as string,
      slug: product.slug,
      name: product.name,
      price: club as string,
      image: images[0]?.src,
    });
  };

  const split = Boolean(blurbTitle);

  return (
    <>
      <Container>
        <div
          className={`${styles.block}${split ? ` ${styles.blockSplit}` : ""}${tightTop ? ` ${styles.tightTop}` : ""}`}
        >
          {blurbTitle ? (
            <div className={styles.intro}>
              <Heading as="h2" className={styles.title}>
                {blurbTitle.lead} <Accent>{blurbTitle.accent}</Accent>
              </Heading>
              {blurbBody && <BodyLong className={styles.introBody}>{blurbBody}</BodyLong>}
            </div>
          ) : (
            <Heading as="h2" className={styles.title}>
              {heading ?? `The ${seriesName} Series`}
            </Heading>
          )}

          <div className={styles.cardWrap}>
            <div className={styles.media}>
              <div className={styles.mediaInner}>
                {images.length > 0 ? (
                  <ImageSlider images={images} sizes="100vw" fit="cover" href={href} lightDots />
                ) : (
                  <span className={styles.mediaEmpty} aria-hidden="true" />
                )}
              </div>
            </div>

            {/* on mobile just two more flex children (display:contents below
                1024px); on desktop this becomes the text column beside .media
                (generic heading) or stays stacked under it (blurbTitle) */}
            {product && (
              <div className={styles.info}>
                <div className={styles.priceRow}>
                  {/* name + price share one frame; the stretched link still
                      covers the whole card via .name::after */}
                  <div className={styles.nameFrame}>
                    <Link href={href as string} className={styles.name}>
                      {product.headline}
                    </Link>
                    <p className={styles.price}>
                      <span className={styles.now}>{club}</span>
                      <span className={styles.was}>{regular}</span>
                    </p>
                    {clubNote && <span className={styles.savings}>{clubNote}</span>}
                  </div>

                  {/* fixed-width slot, sized for the stepper (the widest of
                      the three states) so the name column beside it doesn't
                      reflow when a cart button swaps for a stepper */}
                  <div className={styles.actionSlot}>
                    {coralId ? (
                      qty > 0 ? (
                        <span className={styles.stepper + anim}>
                          <button
                            type="button"
                            aria-label="Remove one"
                            onClick={() => {
                              setActed(true);
                              setQty(coralId, qty - 1);
                            }}
                          >
                            −
                          </button>
                          <span className={styles.stepperCount} aria-live="polite">
                            {qty}
                          </span>
                          <button
                            type="button"
                            aria-label="Add one"
                            onClick={() => {
                              setActed(true);
                              setQty(coralId, qty + 1);
                            }}
                          >
                            +
                          </button>
                        </span>
                      ) : (
                        <button
                          type="button"
                          className={styles.cart + anim}
                          onClick={add}
                          aria-label="Add to cart"
                        >
                          <CartIcon />
                        </button>
                      )
                    ) : (
                      <a
                        className={styles.cart}
                        href={shopHref}
                        target="_blank"
                        rel="noopener noreferrer"
                        aria-label="Add to cart"
                      >
                        <CartIcon />
                      </a>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* mobile/tablet only (hidden at 1024px+, see .carouselSlot) — a
              scroll row confined to the card's own column */}
          {carouselItems && carouselItems.length > 0 && (
            <div className={styles.carouselSlot}>
              {carouselItems.map((item, i) => (
                <div key={i} className={styles.carouselItem}>
                  {item}
                </div>
              ))}
            </div>
          )}
        </div>
      </Container>

      {/* desktop only (1024px+, see .desktopCarousel) — the shared
          full-bleed <Carousel>, same treatment as Restart's own product
          carousel, sitting below the whole card instead of confined
          beside it */}
      {carouselItems && carouselItems.length > 0 && (
        <div className={styles.desktopCarousel}>
          <Carousel label={`${seriesName} — what's in it`}>{carouselItems}</Carousel>
        </div>
      )}
    </>
  );
}
