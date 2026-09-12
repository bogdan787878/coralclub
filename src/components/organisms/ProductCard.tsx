"use client";

import { useRef, useState, type ReactNode } from "react";
import Image from "next/image";
import Link from "next/link";
import styles from "./ProductCard.module.css";

export type ProductImage = {
  src: string;
  alt: string;
  /** object-position for framing the packshot. */
  position?: string;
};

/**
 * A plain packshot (product centered on its own transparent canvas) needs
 * object-fit:contain to show accurately. A full lifestyle-style photo
 * (different composition, not on our packshot canvas convention) looks
 * tiny/off-center under contain — it needs cover instead.
 *
 * Defaults by slide position: the first slide (the packshot every product
 * has) is contain; every slide after it defaults to cover, since in
 * practice that's almost always a lifestyle photo added after the
 * packshot — so uploading a second image in the CMS doesn't also require
 * remembering to tag it. A slide can still override the default by
 * appending `?fit=cover` or `?fit=contain` to its path in
 * content/products/<slug>.json (e.g. a second packshot angle wants
 * contain) — this strips that marker back out before it reaches <Image>,
 * so the loader/manifest lookup sees the clean path.
 */
function resolveFit(src: string, index: number): { src: string; fit: "contain" | "cover" } {
  const qIndex = src.indexOf("?");
  const byPosition = index === 0 ? "contain" : "cover";
  if (qIndex === -1) return { src, fit: byPosition };
  const base = src.slice(0, qIndex);
  const params = new URLSearchParams(src.slice(qIndex + 1));
  const override = params.get("fit");
  const fit = override === "cover" || override === "contain" ? override : byPosition;
  params.delete("fit");
  const rest = params.toString();
  return { src: rest ? `${base}?${rest}` : base, fit };
}

export type ProductCardProps = {
  /** Two-line product name. */
  title: ReactNode;
  /** Tan category pill above the name. */
  category?: string;
  /** Current / sale price. */
  price: ReactNode;
  /** Struck-through "was" price shown next to it. */
  priceWas?: ReactNode;
  /** Product page the name links to. */
  href: string;
  /** Packshots — one per slide of the card's own nested carousel. */
  images?: ProductImage[];
  /** Where the cart button links when there's no local-cart handler. */
  cartHref?: string;
  /** Adds the product to the local cart. Takes over the cart button. */
  onAddToCart?: () => void;
  /** Current quantity of this product in the cart. */
  cartQty?: number;
  /** Set the cart quantity (0 removes). Powers the −/+ stepper. */
  onSetQty?: (qty: number) => void;
  /** Fill the container (for a grid) instead of the fixed 150px carousel width. */
  fluid?: boolean;
};

function ChevronIcon({ direction }: { direction: "left" | "right" }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path
        d={direction === "left" ? "M15 5l-7 7 7 7" : "M9 5l7 7-7 7"}
        stroke="currentColor"
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

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
 * ProductCard — a packshot tile (the only filled surface; the section
 * behind is the "card") with its own nested image carousel + dots and a
 * floating cart button; below it, on no background, the category pill, the
 * name and the sale price. The text block links to the product page.
 */
export function ProductCard({
  title,
  category,
  price,
  priceWas,
  href,
  images = [],
  cartHref = "#add-to-bag",
  onAddToCart,
  cartQty = 0,
  onSetQty,
  fluid = false,
}: ProductCardProps) {
  const [active, setActive] = useState(0);
  const [acted, setActed] = useState(false);
  const trackRef = useRef<HTMLDivElement>(null);
  const anim = acted ? ` ${styles.animIn}` : "";

  const onScroll = () => {
    const el = trackRef.current;
    if (!el || el.clientWidth === 0) return;
    setActive(Math.round(el.scrollLeft / el.clientWidth));
  };

  const multi = images.length > 1;

  const page = (dir: 1 | -1) => {
    const el = trackRef.current;
    if (!el) return;
    el.scrollBy({ left: dir * el.clientWidth, behavior: "smooth" });
  };

  return (
    <article className={`${styles.card}${fluid ? ` ${styles.fluid}` : ""}`}>
      <div className={styles.media}>
        <div className={styles.track} ref={trackRef} onScroll={multi ? onScroll : undefined}>
          {images.length ? (
            images.map((img, i) => {
              const { src, fit } = resolveFit(img.src, i);
              return (
              <span className={styles.slide} key={i}>
                {/* Link lives inside the scroll track (a real descendant of
                    it, not an overlay sibling) so the browser can tell a
                    tap from a drag on its own — an overlay on top of the
                    track would intercept the swipe instead of passing it
                    through. */}
                <Link
                  href={href}
                  className={styles.frame}
                  tabIndex={-1}
                  style={fit === "cover" ? { inset: 0 } : undefined}
                >
                  <Image
                    src={src}
                    alt={img.alt}
                    fill
                    sizes="(max-width: 767px) 150px, 250px"
                    style={{
                      objectFit: fit,
                      ...(img.position ? { objectPosition: img.position } : {}),
                    }}
                  />
                </Link>
              </span>
              );
            })
          ) : (
            <span className={`${styles.slide} ${styles.slideEmpty}`} aria-hidden="true">
              <Link href={href} className={styles.mediaLink} aria-hidden="true" tabIndex={-1} />
            </span>
          )}
        </div>

        {/* desktop only, and only when there's something to page through
            (see .arrow) — revealed on hovering the tile, since a mouse
            has no swipe gesture to fall back on */}
        {multi && (
          <>
            <button
              type="button"
              className={`${styles.arrow} ${styles.arrowPrev}`}
              onClick={() => page(-1)}
              aria-label="Previous image"
              disabled={active === 0}
              tabIndex={-1}
            >
              <ChevronIcon direction="left" />
            </button>
            <button
              type="button"
              className={`${styles.arrow} ${styles.arrowNext}`}
              onClick={() => page(1)}
              aria-label="Next image"
              disabled={active === images.length - 1}
              tabIndex={-1}
            >
              <ChevronIcon direction="right" />
            </button>
          </>
        )}

        {onAddToCart ? (
          cartQty > 0 ? (
            <span className={styles.stepper + anim}>
              <button
                type="button"
                aria-label="Remove one"
                onClick={() => {
                  setActed(true);
                  onSetQty?.(cartQty - 1);
                }}
              >
                −
              </button>
              <span className={styles.stepperCount} aria-live="polite">
                {cartQty}
              </span>
              <button
                type="button"
                aria-label="Add one"
                onClick={() => {
                  setActed(true);
                  onSetQty?.(cartQty + 1);
                }}
              >
                +
              </button>
            </span>
          ) : (
            <button
              type="button"
              onClick={() => {
                setActed(true);
                onAddToCart();
              }}
              className={styles.cart + anim}
              aria-label="Add to bag"
            >
              <CartIcon />
            </button>
          )
        ) : /^https?:/.test(cartHref) ? (
          <a
            href={cartHref}
            className={styles.cart}
            aria-label="Add to bag"
            target="_blank"
            rel="noopener noreferrer"
          >
            <CartIcon />
          </a>
        ) : (
          <Link href={cartHref} className={styles.cart} aria-label="Add to bag">
            <CartIcon />
          </Link>
        )}
      </div>

      {multi && (
        <span className={styles.dots} aria-hidden="true">
          {images.map((_, i) => (
            <span key={i} className={`${styles.dot} ${i === active ? styles.dotOn : ""}`} />
          ))}
        </span>
      )}

      <div className={styles.info}>
        {category && <span className={styles.category}>{category}</span>}

        <h3 className={styles.title}>
          <Link href={href} className={styles.titleLink}>
            {title}
          </Link>
        </h3>

        <p className={styles.price}>
          <span className={styles.priceNow}>{price}</span>
          {priceWas && <span className={styles.priceWas}>{priceWas}</span>}
        </p>
      </div>
    </article>
  );
}
