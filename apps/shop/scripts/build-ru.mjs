#!/usr/bin/env node
/**
 * Отдельная сборка магазина России — только его страницы, без остального сайта.
 *
 *   npm run build:ru                       # сайт в корне домена
 *   RU_BASE_PATH=/shop npm run build:ru    # сайт в папке /shop
 *
 * Результат: dist/ru/ — выложить СОДЕРЖИМОЕ в корень сайта (или в папку RU_BASE_PATH), и dist/ru.zip.
 *
 * Что делает:
 *  1. next build с DEPLOY_TARGET=ru: маршруты — только файлы *.ru.tsx (главная, товар, корзина, вход, оформление);
 *     «Друга клуба», ЛК, лабораторий, прототипов и магазина США в сборке нет;
 *  2. из public/ оставляет только то, на что страницы и их код действительно ссылаются;
 *  3. проверяет, что все локальные ссылки и файлы страниц есть в сборке, и что маршрутов ровно столько, сколько
 *     у магазина России.
 *
 * Шлюзу чек-аута нужен адрес сайта в ALLOWED_ORIGINS (packages/gateway/wrangler.toml), иначе вход, регистрация и
 * оформление с нового домена работать не будут.
 */
import { execFileSync } from "node:child_process";
import { cpSync, existsSync, mkdirSync, readdirSync, readFileSync, rmSync, statSync, writeFileSync } from "node:fs";
import path from "node:path";

const ROOT = process.cwd();
const BASE = (process.env.RU_BASE_PATH ?? "").replace(/\/+$/, "");
const BUILD = path.join(ROOT, "dist/ru-build");
const OUT = path.join(ROOT, "dist/ru");

const run = (cmd, args, env = {}) => execFileSync(cmd, args, { stdio: "inherit", env: { ...process.env, ...env }, cwd: ROOT });

function walk(dir, base = dir) {
  const out = [];
  for (const name of readdirSync(dir)) {
    const p = path.join(dir, name);
    if (statSync(p).isDirectory()) out.push(...walk(p, base));
    else out.push(path.relative(base, p));
  }
  return out;
}

// 1 ── сборка
rmSync(BUILD, { recursive: true, force: true });
rmSync(OUT, { recursive: true, force: true });
run("npm", ["run", "gen"]);
run("npm", ["run", "mfe"]); // Layout и корзина (public/layout, public/cart)
run("npx", ["next", "build"], { DEPLOY_TARGET: "ru", RU_BASE_PATH: BASE });
// next build пишет типы маршрутов этой сборки в общий .next/types — вернуть типы основного сайта
run("npx", ["next", "typegen"]);
if (!existsSync(BUILD)) throw new Error(`нет результата сборки в ${BUILD}`);

// 2 ── из public/ — только то, на что ссылаются
const textFiles = walk(BUILD).filter((f) => /\.(html|txt|js|css|json)$/.test(f));
// манифест Cloudflare Images (src/lib/image-manifest.json) лежит в коде целиком — «путь: id» каждой картинки
// всего сайта; это не ссылка, его пары из проверки убираем
const corpus = textFiles
  .map((f) => readFileSync(path.join(BUILD, f), "utf8"))
  .join("\n")
  .replace(/"\/images\/[^"]*":"[^"]*"/g, "");
const spellings = (rel) => new Set([rel, encodeURI(rel), rel.replaceAll(" ", "%20"), rel.split("/").map(encodeURIComponent).join("/")]);
const isUsed = (rel) => [...spellings(rel)].some((v) => corpus.includes(v));
let removed = 0;
for (const f of walk(BUILD)) {
  const rel = "/" + f.split(path.sep).join("/");
  if (!/^\/(images|fonts|reels|admin|icons|video|videos)\//.test(rel)) continue;
  if (rel === "/fonts/README.md" || !isUsed(rel)) {
    rmSync(path.join(BUILD, f));
    removed++;
  }
}
// папки public/, которых у магазина нет: админка CMS, ролики, гайд по картинкам товаров
for (const dir of ["admin", "reels", "pdp-guide"]) rmSync(path.join(BUILD, dir), { recursive: true, force: true });
const dropEmpty = (dir) => {
  for (const name of readdirSync(dir)) {
    const sub = path.join(dir, name);
    if (!statSync(sub).isDirectory()) continue;
    dropEmpty(sub);
    if (!readdirSync(sub).length) rmSync(sub, { recursive: true });
  }
};
dropEmpty(BUILD);
console.log(`убрано ${removed} неиспользуемых файлов public/`);

// шрифты — по base path
if (BASE) {
  for (const f of walk(BUILD).filter((x) => x.endsWith(".css"))) {
    const p = path.join(BUILD, f);
    const css = readFileSync(p, "utf8");
    const next = css.replaceAll('url("/fonts/', `url("${BASE}/fonts/`).replaceAll("url(/fonts/", `url(${BASE}/fonts/`);
    if (next !== css) writeFileSync(p, next);
  }
}

// 3 ── проверки
mkdirSync(OUT, { recursive: true });
cpSync(BUILD, OUT, { recursive: true });
const exists = (rel) => {
  const p = path.join(OUT, rel);
  if (existsSync(p) && statSync(p).isFile()) return true;
  return existsSync(path.join(p, "index.html"));
};
const missing = new Set();
for (const f of walk(OUT).filter((x) => x.endsWith(".html"))) {
  const html = readFileSync(path.join(OUT, f), "utf8");
  for (const m of html.matchAll(/(?:href|src)="(\/[^"#?]*)/g)) {
    const url = m[1];
    if (url.startsWith("//")) continue;
    if (BASE && !url.startsWith(BASE)) {
      missing.add(`${f}: ${url} (вне ${BASE})`);
      continue;
    }
    let rel = url.slice(BASE.length) || "/";
    try {
      rel = decodeURIComponent(rel);
    } catch {
      /* как есть */
    }
    if (!exists(rel)) missing.add(`${f}: ${url}`);
  }
}
const pages = walk(OUT)
  .filter((f) => f.endsWith("index.html"))
  .map((f) => "/" + path.dirname(f).split(path.sep).join("/").replace(/^\.$/, ""));
const extra = pages.filter((p) => !/^\/(|product\/[^/]+|cart|login|checkout|_not-found|404)$/.test(p));
const products = pages.filter((p) => p.startsWith("/product/")).length;
console.log(`страниц: ${pages.length} (товаров ${products}), файлов: ${walk(OUT).length}`);
if (extra.length) {
  console.error(`ЛИШНИЕ СТРАНИЦЫ:\n${extra.join("\n")}`);
  process.exitCode = 1;
}
if (missing.size) {
  console.error("НЕТ В СБОРКЕ:\n" + [...missing].slice(0, 40).join("\n"));
  process.exitCode = 1;
}

try {
  rmSync(path.join(ROOT, "dist/ru.zip"), { force: true });
  execFileSync("zip", ["-qr", path.join(ROOT, "dist/ru.zip"), "."], { cwd: OUT });
  console.log("dist/ru.zip записан");
} catch {
  console.log("zip недоступен — выкладывайте папку dist/ru");
}
