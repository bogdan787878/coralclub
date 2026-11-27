#!/usr/bin/env node
/**
 * Каталог магазина России → content/ru/catalog.json
 *
 *   node scripts/sync-ru-catalog.mjs
 *
 * Источники:
 *  - канон продуктов (Product Master, lucidos.ru/assembler/pm/core.json): какие продукты есть, их фазы, домены
 *    здоровья, «красота изнутри / снаружи», наборы и коды фасовок;
 *  - API магазина России (гость, витрина RUSSIA): что реально продаётся, русские названия, фасовка, фото;
 *  - наши картинки (content/products/*.json → carouselImages): первые две, где они есть.
 *
 * Цены и наличие сюда не пишутся — их страница берёт из API на лету (по городу покупателя).
 * Запускать вручную, когда меняется ассортимент; результат коммитится.
 */
import { readdirSync, readFileSync, writeFileSync, mkdirSync } from "node:fs";
import path from "node:path";

const ROOT = process.cwd();
const CANON = "https://lucidos.ru/assembler/pm/core.json";
const API = "https://api.coral.club/api/v1";
const APP = "1ec82603-8332-6dd2-9af6-4309c012a93e"; // идентификатор приложения (публичный, как у сайта)
const OUT = path.join(ROOT, "content/ru/catalog.json");

/** Коды, которых нет в каноне, но они входят в наборы на витрине (комплекты Коло-Вада, МСМ, ПараФайт…). */
const EXTRA = [91302, 91303, 91304, 91305, 2152, 2124, 2307, 2220, 2200];

/** Свои слаги, которые уже есть у страниц (галереи PDP, ссылки): код → слаг. */
const SLUG = {
  80720: "hydramax-plus",
  80380: "hydramax",
  2200: "coral-mine-silver",
  2220: "coral-mine",
  2141: "pentokan",
  225115: "oceanmin",
  91800: "h-500",
  8035007: "coral-detox",
  8036007: "coral-detox-plus",
  80320: "parashield",
  80330: "parashield-plus",
  1200: "colo-vada-plus",
  91302: "colo-vada-plus-kit-1",
  91303: "colo-vada-plus-kit-2",
  91304: "colo-vada-plus-kit-3",
};

/** Наши картинки у товаров, чей код в магазине США другой: код России → слаг content/products. */
const OWN = {
  80720: "hydramax-plus",
  80380: "hydramax",
  2200: "coral-mine-silver",
  8035007: "coral-detox-plus", // коробка «Coral Detox» — состав российского Корал Детокса
  80320: "parashield",
  1200: "colo-vada-plus",
  8039009: "immunity-pack",
  80730: "womens-balance",
};
/** Наших картинок не брать: другой товар под тем же кодом США (Корал-Майн без серебра). */
const NO_OWN = new Set([2220]);

const json = async (url, init) => {
  const r = await fetch(url, init);
  if (!r.ok) throw new Error(`${url} → ${r.status}`);
  return r.json();
};

// ── канон
const canon = await json(CANON);
const byCode = new Map();
for (const p of canon.products) for (const c of p.codes ?? [p.code]) byCode.set(Number(c), p);
const canonById = new Map(canon.products.map((p) => [p.id, p]));

// ── наши картинки: coralId → слаг
const ownBySlug = new Map();
const ownByCode = new Map();
for (const f of readdirSync(path.join(ROOT, "content/products"))) {
  if (!f.endsWith(".json")) continue;
  const d = JSON.parse(readFileSync(path.join(ROOT, "content/products", f), "utf8"));
  const slug = f.slice(0, -5);
  ownBySlug.set(slug, d.carouselImages ?? []);
  if (d.coralId) ownByCode.set(Number(d.coralId), slug);
}

// ── API России, гость
const session = await json(`${API}/auth/session`, {
  method: "POST",
  headers: { "content-type": "application/json", accept: "application/json" },
  body: JSON.stringify({ applicationToken: APP, country: "RU", language: "ru" }),
});
const token = session?.data?.access_token;
if (!token) throw new Error("API не открыл сессию");
const auth = { accept: "application/json", authorization: `Bearer ${token}` };

// все фасовки канона: у товара главная та, что продаётся (маска — коробка 5 саше, а не одно саше)
const codes = [...new Set([...canon.products.flatMap((p) => [p.code, ...(p.codes ?? [])].map(Number)), ...EXTRA])];
const listed = new Map();
for (let i = 0; i < codes.length; i += 40) {
  const part = codes.slice(i, i + 40);
  const d = await json(`${API}/catalog/products?${part.map((c) => `products[]=${c}`).join("&")}`, { headers: auth });
  for (const p of d.data ?? []) listed.set(Number(p.code), p);
}
console.log(`канон: ${canon.products.length}, на витрине России: ${listed.size} из ${codes.length}`);

/** Главный артикул товара: свой код канона, если продаётся и есть в наличии; иначе первая фасовка в наличии. */
const entries = new Map(); // главный код → запись канона (или null для EXTRA)
for (const c of canon.products) {
  const all = [...new Set([c.code, ...(c.codes ?? [])].map(Number))].filter((x) => listed.has(x));
  if (!all.length) continue;
  const main = all.find((x) => listed.get(x).isAvailable !== false) ?? all[0];
  entries.set(main, c);
}
for (const x of EXTRA) if (listed.has(x) && ![...entries.values()].some((c) => (c?.codes ?? []).map(Number).includes(x))) entries.set(x, null);

const detail = new Map();
const queue = [...entries.keys()];
await Promise.all(
  Array.from({ length: 6 }, async () => {
    while (queue.length) {
      const code = queue.shift();
      try {
        const d = await json(`${API}/catalog/product/${code}`, { headers: auth });
        detail.set(code, d.data ?? {});
      } catch {
        detail.set(code, {});
      }
    }
  }),
);

const slugOf = (code, c) => {
  if (SLUG[code]) return SLUG[code];
  const own = ownByCode.get(code);
  if (own && !NO_OWN.has(code)) return own;
  const site = c?.site ? path.basename(new URL(c.site).pathname, ".html") : "";
  return site || `p-${code}`;
};

const clean = (s) => String(s ?? "").replace(/\s+/g, " ").trim();
const used = new Set();
const products = [];
for (const [code, c0] of entries) {
  const item = listed.get(code);
  const c = c0 ?? byCode.get(code);
  const d = detail.get(code) ?? {};
  let slug = slugOf(code, c);
  if (used.has(slug)) slug = `${slug}-${code}`;
  used.add(slug);
  const variants = [code, ...(c?.codes ?? []).map(Number)];
  const ownSlug = NO_OWN.has(code) ? null : (OWN[code] ?? variants.map((x) => ownByCode.get(x)).find(Boolean));
  const own = (ownSlug ? ownBySlug.get(ownSlug) : null) ?? [];
  const pictures = [...new Set([...(d.detailPictures ?? []), item.previewPicture].filter(Boolean))];
  products.push({
    code,
    slug,
    name: clean(item.name),
    pack: clean(d.forms?.[0]?.description),
    category: clean(item.breadCrumbs),
    phase: c?.phase ?? [],
    domains: c?.dom ?? [],
    primary: c?.prim ?? "",
    beauty: c?.beauty ?? [],
    set: Boolean(c?.set),
    parts: (c?.parts ?? []).map((id) => Number(canonById.get(id)?.code)).filter(Boolean),
    codes: [...new Set(variants)],
    lead: clean(c?.lead),
    // теги страницы товара («Без сои», «Халяль») и форма выпуска («Капсулы») — из канона
    feat: c?.feat ?? [],
    form: clean(c?.form),
    own: own.slice(0, 2),
    // пэкшот на сером фоне — карточка каталога сайта; первым в каруселях
    preview: item.previewPicture ?? "",
    pictures,
  });
}
products.sort((a, b) => a.name.localeCompare(b.name, "ru"));

mkdirSync(path.dirname(OUT), { recursive: true });
writeFileSync(
  OUT,
  JSON.stringify(
    {
      source: { canon: CANON, canonVersion: canon.version, api: API, synced: new Date().toISOString().slice(0, 10) },
      domains: canon.facets.domain,
      products,
    },
    null,
    1,
  ) + "\n",
);
console.log(`записано ${products.length} товаров → ${path.relative(ROOT, OUT)}`);
const missing = canon.products.filter((c) => ![c.code, ...(c.codes ?? [])].some((x) => listed.has(Number(x))));
if (missing.length) console.log(`нет на витрине России: ${missing.map((c) => `${c.code} ${c.name}`).join("; ")}`);
