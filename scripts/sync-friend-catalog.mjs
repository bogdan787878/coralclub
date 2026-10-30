#!/usr/bin/env node
/**
 * sync-friend-catalog.mjs — what each country's shop site sells of the
 * «Друг клуба» products, under which article, at which club price, in which
 * currency. Writes src/lib/friendCatalog.generated.ts (articles by country,
 * prices, currencies), replacing hand-kept tables.
 *
 * The shop has no public catalog API, so this asks its own endpoints:
 *  - the product pages (`/shop/<slug>.html`) list a product's articles
 *    (`VENDOR_CODE`) with their bonus points and the site's currency;
 *  - the basket (`/shop/shop_basket.php`) says which article the site takes,
 *    and `/sv-api/order` what it charges for it through a friend session.
 * The pack is told apart by its bonus points (the market's own article is the
 * reference), so a 10-sachet pack or a 30-sachet one is never mixed up.
 *
 *   npm run dev:proxy        # in another terminal (basket calls need one origin)
 *   npm run friend:sync
 *
 * It only fills and empties the session basket of each site; no order is made.
 */
import { readFileSync, writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";

const ROOT = fileURLToPath(new URL("..", import.meta.url));
const PROXY = process.env.PROXY ?? "http://localhost:3200";
/** The test distributor of the project (lib/friend.ts DEMO_REF_CODE). */
const REF_CODE = process.env.REF_CODE ?? "570445656503";
const MEMBER_ID = process.env.MEMBER_ID ?? "8819457";
/** The market's own site: its articles and prices are the catalog's. */
const MARKET_SITE = "de";

/** The project's products: the market's article and the page of each on the shop. */
const PRODUCTS = [
  { slug: "hydramax-plus", article: "807200", pages: ["hydramax-plus"] },
  { slug: "hydramax", article: "803800", pages: ["hydramax-europe"] },
  { slug: "coral-mine-silver", article: "22201", pages: ["coral-mine"] },
  { slug: "oceanmin", article: "225115", pages: ["oceanmin"] },
  { slug: "h-500", article: "91883", pages: ["h-500"] },
];

const sitesSrc = readFileSync(`${ROOT}src/lib/shopSites.ts`, "utf8");
const SITES = [
  ...sitesSrc.matchAll(
    /^ {2}(\w\w): \{ name: "[^"]*", currency: "\w+", host: "([\w-]+)\.coral\.club"/gm,
  ),
].map((m) => ({ code: m[1], sub: m[2] }));

async function page(sub, slug) {
  // the connection to the shop drops now and then: three tries
  for (let i = 0; i < 3; i++) {
    try {
      const r = await fetch(`https://${sub}.coral.club/shop/${slug}.html`, {
        headers: { "user-agent": "Mozilla/5.0" },
        signal: AbortSignal.timeout(30000),
      });
      if (r.ok) return await r.text();
      if (r.status === 404) return "";
    } catch {
      /* try again */
    }
    await new Promise((res) => setTimeout(res, 1500 * (i + 1)));
  }
  return "";
}

/** [{ code, bonus }] of the articles a product page lists. */
function offersOf(html) {
  const out = [];
  for (const m of html.matchAll(
    /'VENDOR_CODE':'(\d+)','PROPERTY_BB_VALUE':'(\d*)'/g,
  )) {
    if (!out.some((o) => o.code === m[1]))
      out.push({ code: m[1], bonus: m[2] });
  }
  return out;
}

const H = (sub) => ({ "x-shop-site": `${sub}.coral.club` });

/** The basket's own lines (a tag whose class is exactly `basket-member__basic-item`). */
function basketLines(html) {
  return [...html.matchAll(/<[^>]+>/g)]
    .map((m) => m[0])
    .filter((tag) =>
      /\bclass="([^"]*)"/
        .exec(tag)?.[1]
        .split(/\s+/)
        .includes("basket-member__basic-item"),
    );
}

async function emptyBasket(sub) {
  for (let round = 0; round < 3; round++) {
    const html = await (
      await fetch(`${PROXY}/basket/`, { headers: H(sub) })
    ).text();
    const lines = basketLines(html);
    if (!lines.length) return;
    const body = new URLSearchParams();
    lines.forEach((tag, i) => {
      const get = (k) =>
        (tag.match(new RegExp(`data-${k}="([^"]*)"`)) || [])[1] ?? "";
      body.append(`basket_products[${i}][basket_id]`, get("basket_id"));
      body.append(`basket_products[${i}][member_id]`, get("member"));
      body.append(`basket_products[${i}][vendor_code]`, get("code"));
    });
    body.append("basket_count", String(lines.length));
    body.append("basket_member_count", "1");
    await fetch(`${PROXY}/ajax/deleteBasketItems.php`, {
      method: "POST",
      headers: {
        ...H(sub),
        "Content-Type": "application/x-www-form-urlencoded; charset=UTF-8",
      },
      body,
    });
  }
  throw new Error(`${sub}: the basket would not empty`);
}

/** The price of one unit if the site's basket takes the article, else null. */
async function tryArticle(sub, code) {
  await emptyBasket(sub);
  const lang = sub === MARKET_SITE ? "de" : "us";
  await fetch(
    `${PROXY}/shop/shop_basket.php?${code}=1&REF_CODE=${REF_CODE}&langss=${lang}&user=${MEMBER_ID}&f=y`,
    { headers: H(sub) },
  );
  try {
    const o = await (
      await fetch(`${PROXY}/sv-api/order?language=us`, { headers: H(sub) })
    ).json();
    // exactly the one unit we put in (anything else is a leftover)
    return Number(o.result?.QUANTITY) === 1 ? Number(o.result.PRICE) : null;
  } catch {
    return null;
  }
}

async function main() {
  try {
    await fetch(PROXY, { signal: AbortSignal.timeout(5000) });
  } catch {
    console.error(
      `No proxy at ${PROXY}: run \`npm run dev:proxy\` (and \`npm run dev\`) first.`,
    );
    process.exit(1);
  }

  // every product page of every site, once
  const pages = {};
  await Promise.all(
    SITES.flatMap((s) =>
      PRODUCTS.map(async (p) => {
        for (const slug of p.pages) {
          const html = await page(s.sub, slug);
          if (html) {
            pages[`${s.code}|${p.slug}`] = html;
            break;
          }
        }
      }),
    ),
  );

  // the pack = the articles with the bonus points of the market's own one
  const candidates = {};
  for (const p of PRODUCTS) {
    const home = offersOf(
      pages[`${SITES.find((s) => s.sub === MARKET_SITE).code}|${p.slug}`] ?? "",
    );
    const bonus = home.find((o) => o.code === p.article)?.bonus;
    if (bonus === undefined)
      throw new Error(`${p.slug}: ${p.article} not on the ${MARKET_SITE} page`);
    const count = new Map([[p.article, 99]]);
    for (const s of SITES) {
      for (const o of offersOf(pages[`${s.code}|${p.slug}`] ?? "")) {
        if (o.bonus === bonus) count.set(o.code, (count.get(o.code) ?? 0) + 1);
      }
    }
    candidates[p.slug] = [...count].sort((a, b) => b[1] - a[1]).map(([c]) => c);
  }

  const currency = {};
  const articles = {};
  const prices = {};
  const queue = [...SITES];
  const work = async (s) => {
    currency[s.code] = (/"priceCurrency":"([A-Z]{3})"/.exec(
      Object.entries(pages).find(([k]) => k.startsWith(`${s.code}|`))?.[1] ??
        "",
    ) ?? [])[1];
    for (const p of PRODUCTS) {
      const own = offersOf(pages[`${s.code}|${p.slug}`] ?? "");
      const sku = /"sku":"(\d+)"/.exec(pages[`${s.code}|${p.slug}`] ?? "")?.[1];
      // the site's own article first, then the other known ones
      const order = [
        ...(sku && candidates[p.slug].includes(sku) ? [sku] : []),
        ...own.map((o) => o.code).filter((c) => candidates[p.slug].includes(c)),
        ...candidates[p.slug],
      ].filter((c, i, a) => a.indexOf(c) === i);
      let found = null;
      for (const [i, code] of order.entries()) {
        // the shop answers a rejected article and a just-emptied basket alike:
        // the site's own article gets a second look
        let price = await tryArticle(s.sub, code);
        if (price === null && i === 0 && sku === code) {
          await new Promise((r) => setTimeout(r, 800));
          price = await tryArticle(s.sub, code);
        }
        if (price !== null) {
          found = { code, price };
          break;
        }
      }
      (articles[s.code] ??= {})[p.article] = found?.code ?? null;
      if (found) (prices[s.code] ??= {})[p.article] = found.price;
    }
    await emptyBasket(s.sub);
    console.error("done", s.code, JSON.stringify(articles[s.code]));
  };
  await Promise.all(
    Array.from({ length: 6 }, async () => {
      while (queue.length) await work(queue.shift());
    }),
  );

  const own = SITES.find((s) => s.sub === MARKET_SITE).code;
  const names = Object.fromEntries(PRODUCTS.map((p) => [p.article, p.slug]));
  let out = `// generated by scripts/sync-friend-catalog.mjs — do not edit
// What the shop's own basket said on each country's site (one unit of the
// pack, through a friend session): articles, club prices, currencies.
export const CATALOG_SYNCED_AT = "${new Date().toISOString().slice(0, 10)}";

/** The currency each site charges in (its product pages' priceCurrency). */
export const SITE_CURRENCY: Record<string, string> = {\n`;
  for (const s of SITES)
    if (currency[s.code]) out += `  ${s.code}: "${currency[s.code]}",\n`;
  out += `};

/**
 * The article each other site takes for the market's article; only the
 * differences are listed, \`null\` = the site does not sell it.
 */
export const OTHER_SITES: Record<string, Record<string, string | null>> = {\n`;
  for (const s of SITES) {
    if (s.code === own) continue;
    const diff = PRODUCTS.filter(
      (p) => articles[s.code][p.article] !== p.article,
    );
    if (!diff.length) continue;
    out += `  ${s.code}: {\n${diff.map((p) => `    "${p.article}": ${articles[s.code][p.article] === null ? "null" : `"${articles[s.code][p.article]}"`}, // ${names[p.article]}`).join("\n")}\n  },\n`;
  }
  out += `};

/** Club price of one unit by country and the market's article (the market's own prices are the catalog's). */
export const CLUB_PRICES: Record<string, Record<string, number>> = {\n`;
  for (const s of SITES) {
    if (s.code === own || !prices[s.code]) continue;
    out += `  ${s.code}: { ${PRODUCTS.filter(
      (p) => prices[s.code][p.article] !== undefined,
    )
      .map((p) => `"${p.article}": ${prices[s.code][p.article]}`)
      .join(", ")} },\n`;
  }
  out += "};\n";
  writeFileSync(`${ROOT}src/lib/friendCatalog.generated.ts`, out);

  // the market's own prices live in lib/friendCatalog.ts: say if they drifted
  for (const p of PRODUCTS) {
    const got = prices[own]?.[p.article];
    console.error(
      `market ${p.slug}: ${p.article} → ${got ?? "not sold"} (catalog: check META.club)`,
    );
  }
  console.error("wrote src/lib/friendCatalog.generated.ts");
}

main();
