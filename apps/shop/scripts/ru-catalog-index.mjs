#!/usr/bin/env node
/**
 * Лёгкий индекс каталога России для браузера: content/ru/catalog.json → content/ru/catalog.index.json.
 * В индексе — то, что нужно карточкам, каталогу, главной и корзине. Без лида (он — только на странице товара,
 * передаётся туда при сборке страницы) и без лишних фото сайта (страница товара берёт фото из API): из фото —
 * превью и одно следующее (запасные кадры карточки). Каталог грузится на каждой странице — так он вдвое легче.
 * Запускается в `npm run gen` и после scripts/sync-ru-catalog.mjs.
 */
import { readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const src = join(root, "content/ru/catalog.json");
const out = join(root, "content/ru/catalog.index.json");

const full = JSON.parse(readFileSync(src, "utf8"));
const products = full.products.map((p) => {
  const { lead: _lead, category: _category, pictures = [], ...rest } = p;
  const extra = pictures.find((x) => x !== p.preview);
  return { ...rest, pictures: extra ? [extra] : [] };
});
const json = JSON.stringify({ ...full, products }) + "\n";
writeFileSync(out, json);
console.log(`catalog.index.json: ${products.length} товаров, ${Math.round(json.length / 1024)} КБ (полный — ${Math.round(readFileSync(src).length / 1024)} КБ)`);
