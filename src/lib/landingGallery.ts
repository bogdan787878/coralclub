import { asset } from "./asset";
import {
  LEAD_PHOTO,
  LANDING_PRODUCTS_RU,
  sitePhotos,
  type BeautySlug,
} from "./landingCatalogRu";
import { getProduct } from "./products";

/**
 * Every photo of a landing product, in the order the Russian PDP shows
 * them: the catalog photos first, then all photos from coralclub.ru.
 * Used by the PDP gallery and by every card / slider that shows the product.
 */
export function landingGallery(slug: string): { src: string; alt: string }[] {
  const ru = LANDING_PRODUCTS_RU[slug as BeautySlug];
  const product = getProduct(slug);
  const alt = ru?.name ?? product?.name ?? slug;

  // Hydramax's catalog photo shows the "Plus" box — lead with the real one;
  // Hydramax Plus leads with the plain box on grey from the site
  const lead = LEAD_PHOTO[slug];
  const catalog = slug === "hydramax" ? [] : (product?.pdpImages ?? []);
  const site = sitePhotos(slug).map((src) => asset(src));
  const leadSrc = lead ? asset(lead) : undefined;
  const without = (list: string[]) => list.filter((u) => u !== leadSrc);
  const images0 = leadSrc
    ? [leadSrc, ...without(catalog), ...without(site)]
    : [...catalog, ...site];

  const images = images0.map((src) => ({ src, alt }));
  if (!images.length && product?.image)
    images.push({ src: product.image, alt });
  return images;
}
