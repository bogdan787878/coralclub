#!/usr/bin/env node
/**
 * Builds the "Система красоты" landing for https://coralclub.ru/landings/labspace/
 *
 *   npm run build:labspace
 *
 * Result: dist/labspace/ — upload its CONTENT to <site root>/landings/labspace/
 * (so that dist/labspace/index.html is served at /landings/labspace/), and
 * dist/labspace.zip with the same content.
 *
 * What it does:
 *  1. next build with DEPLOY_TARGET=coralclub (base path /landings/labspace,
 *     only the *.labspace.tsx routes, images from the bundle);
 *  2. keeps only the files of public/ that the pages really reference;
 *  3. points the @font-face urls at the base path;
 *  4. checks that every local link / asset of every page exists in the bundle.
 */
import { execFileSync } from "node:child_process";
import {
  cpSync,
  existsSync,
  mkdirSync,
  readdirSync,
  readFileSync,
  rmSync,
  statSync,
  writeFileSync,
} from "node:fs";
import path from "node:path";

const ROOT = process.cwd();
const BASE = "/landings/labspace";
const BUILD = path.join(ROOT, "dist/labspace-build");
const OUT = path.join(ROOT, "dist/labspace");

const run = (cmd, args, env = {}) =>
  execFileSync(cmd, args, {
    stdio: "inherit",
    env: { ...process.env, ...env },
    cwd: ROOT,
  });

/** Every file under `dir`, relative paths. */
function walk(dir, base = dir) {
  const out = [];
  for (const name of readdirSync(dir)) {
    const p = path.join(dir, name);
    if (statSync(p).isDirectory()) out.push(...walk(p, base));
    else out.push(path.relative(base, p));
  }
  return out;
}

// 1 ── build
rmSync(BUILD, { recursive: true, force: true });
rmSync(OUT, { recursive: true, force: true });
run("npm", ["run", "gen"]);
run("npx", ["next", "build"], {
  DEPLOY_TARGET: "coralclub",
  NEXT_PUBLIC_MAIN_SITE_URL: "https://coralclub.ru",
});
if (!existsSync(BUILD)) throw new Error(`no build output in ${BUILD}`);

// 2 ── keep only what the pages reference
const textFiles = walk(BUILD).filter((f) =>
  /\.(html|txt|js|css|json)$/.test(f),
);
const read = (files) =>
  files.map((f) => readFileSync(path.join(BUILD, f), "utf8")).join("\n");
// Rendered pages and styles name exactly what a visitor can see. The JS chunks
// also carry whole data modules (the EN product catalogue, …), so a name found
// only there proves nothing — except for the folders the landing's client
// code really reads from.
const pageCorpus = read(textFiles.filter((f) => /\.(html|txt|css)$/.test(f)));
const allCorpus = read(textFiles);
const LOOSE = [
  "/images/landing/",
  "/images/reviews/",
  "/images/badges/",
  "/fonts/",
];
// a path may appear raw ("a b, c.png"), percent-encoded or URI-encoded
const spellings = (rel) =>
  new Set([
    rel,
    encodeURI(rel),
    rel.replaceAll(" ", "%20"),
    rel.split("/").map(encodeURIComponent).join("/"),
  ]);
const isUsed = (rel) => {
  const corpus = LOOSE.some((d) => rel.startsWith(d)) ? allCorpus : pageCorpus;
  return [...spellings(rel)].some((v) => corpus.includes(v));
};
let removed = 0;
for (const f of walk(BUILD)) {
  const rel = "/" + f.split(path.sep).join("/");
  if (!/^\/(images|fonts|reels)\//.test(rel)) continue;
  if (rel === "/fonts/README.md" || !isUsed(rel)) {
    rmSync(path.join(BUILD, f));
    removed++;
  }
}
for (const dir of ["admin", "reels"])
  rmSync(path.join(BUILD, dir), { recursive: true, force: true });
// folders left empty by the pruning
const dropEmpty = (dir) => {
  for (const name of readdirSync(dir)) {
    const sub = path.join(dir, name);
    if (!statSync(sub).isDirectory()) continue;
    dropEmpty(sub);
    if (!readdirSync(sub).length) rmSync(sub, { recursive: true });
  }
};
dropEmpty(BUILD);
console.log(`pruned ${removed} unreferenced public files`);

// 3 ── font urls follow the base path
for (const f of walk(BUILD).filter((x) => x.endsWith(".css"))) {
  const p = path.join(BUILD, f);
  const css = readFileSync(p, "utf8");
  const next = css
    .replaceAll('url("/fonts/', `url("${BASE}/fonts/`)
    .replaceAll("url(/fonts/", `url(${BASE}/fonts/`);
  if (next !== css) writeFileSync(p, next);
}

// 4 ── every local link and asset must exist
mkdirSync(OUT, { recursive: true });
cpSync(BUILD, OUT, { recursive: true });
const missing = new Set();
const exists = (rel) => {
  const p = path.join(OUT, rel);
  if (existsSync(p) && statSync(p).isFile()) return true;
  return existsSync(path.join(p, "index.html"));
};
for (const f of walk(OUT).filter((x) => x.endsWith(".html"))) {
  const html = readFileSync(path.join(OUT, f), "utf8");
  for (const m of html.matchAll(/(?:href|src)="(\/[^"#?]*)/g)) {
    const url = m[1];
    if (!url.startsWith(BASE)) {
      if (url.startsWith("//")) continue;
      missing.add(`${f}: ${url} (outside ${BASE})`);
      continue;
    }
    let rel = url.slice(BASE.length) || "/";
    try {
      rel = decodeURIComponent(rel);
    } catch {
      /* keep as is */
    }
    if (!exists(rel)) missing.add(`${f}: ${url}`);
  }
}
const pages = walk(OUT).filter((f) => f.endsWith("index.html")).length;
console.log(`pages: ${pages}, files: ${walk(OUT).length}`);
if (missing.size) {
  console.error("MISSING:\n" + [...missing].slice(0, 40).join("\n"));
  process.exitCode = 1;
}

// zip
try {
  rmSync(path.join(ROOT, "dist/labspace.zip"), { force: true });
  execFileSync("zip", ["-qr", path.join(ROOT, "dist/labspace.zip"), "."], {
    cwd: OUT,
  });
  console.log("dist/labspace.zip written");
} catch {
  console.log("zip not available — upload the dist/labspace folder instead");
}
