import { OTHER_SITES } from "./friendCatalog.generated";

/**
 * The shop numbers its products differently from site to site (Hydramax Plus
 * is 807200 in Germany, 80720 in Russia, 807201 in the US …), and some sites
 * do not sell a product at all. The project's catalog carries the articles of
 * the market's own site (Germany); `OTHER_SITES` is what each other country's
 * site takes for the same pack (only the differences; `null`: not sold there),
 * as the shop's own basket answered. It is generated: `npm run friend:sync`.
 */

/** The article of the product (by the market's article) on the country's site; `null`: not sold there. */
export function articleFor(country: string, coralId: string): string | null {
  const own = OTHER_SITES[country];
  return own && coralId in own ? own[coralId] : coralId;
}

/** The catalog's article behind an article of the country's site (an order line carries the site's own). */
export function canonicalArticle(country: string, article: string): string {
  const own = OTHER_SITES[country];
  if (own) {
    for (const [canon, theirs] of Object.entries(own)) {
      if (theirs === article) return canon;
    }
  }
  return article;
}
