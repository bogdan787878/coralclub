import type { BeautySlug } from "./landingCatalogRu";

/**
 * Customer reviews shown on the landing and on the matching product page.
 *
 * Every entry is a short, word-for-word excerpt from a public review, with
 * the author, date, rating and a link to the full text. Excerpts were
 * checked against the source page itself. Nothing here is written by us —
 * add only reviews the author/source allows to be reused.
 */
export type LandingReview = {
  id: string;
  product: BeautySlug;
  /** Shown above the quote, e.g. "Промарин Трипептиды Коллагена". */
  productName: string;
  author: string;
  /** Human-readable date, e.g. "1 октября 2026". */
  date: string;
  rating: 1 | 2 | 3 | 4 | 5;
  /** Word-for-word excerpt. */
  quote: string;
  source: { name: string; url: string };
};

export const LANDING_REVIEWS_RU: LandingReview[] = [
  {
    id: "otzovik-18702897",
    product: "promarine-collagen-tripeptides-pack",
    productName: "Промарин Трипептиды Коллагена",
    author: "Maria Arhipova",
    date: "1 октября 2026",
    rating: 5,
    quote:
      "Открыла маленький флакон, выпила и пошла дальше. Никаких шейкеров, мерных ложек и порошка на столе.",
    source: {
      name: "Отзовик",
      url: "https://otzovik.com/review_18702897.html",
    },
  },
  {
    id: "otzovik-18297675",
    product: "promarine-collagen-tripeptides-pack",
    productName: "Промарин Трипептиды Коллагена",
    author: "Волкова Карина",
    date: "23 апреля 2026",
    rating: 5,
    quote:
      "Понравилась форма приема, плюс в том, что не нужно ничего разводить или запивать горстью капсул, просто отмерил и выпил.",
    source: {
      name: "Отзовик",
      url: "https://otzovik.com/review_18297675.html",
    },
  },
];

export const reviewsFor = (slug: string): LandingReview[] =>
  LANDING_REVIEWS_RU.filter((r) => r.product === slug);
