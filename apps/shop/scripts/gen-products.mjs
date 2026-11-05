// Reads content/products/*.json (edited by the CMS) and writes a typed,
// client-safe data module the app imports. Run via prebuild / predev, or
// `npm run gen`.

import { readdirSync, readFileSync, writeFileSync, existsSync } from "node:fs";
import { join } from "node:path";

const CONTENT_DIR = join(process.cwd(), "content", "products");
const DOMAINS_FILE = join(process.cwd(), "content", "domains.json");
const SERIES_DIR = join(process.cwd(), "content", "series");
const OUT = join(process.cwd(), "src", "lib", "products.generated.ts");

const files = readdirSync(CONTENT_DIR)
  .filter((f) => f.endsWith(".json"))
  .sort();

const products = files.map((f) => {
  const raw = JSON.parse(readFileSync(join(CONTENT_DIR, f), "utf8"));
  // slug falls back to the filename
  raw.slug = raw.slug || f.replace(/\.json$/, "");
  return raw;
});

const domainsRaw = existsSync(DOMAINS_FILE)
  ? JSON.parse(readFileSync(DOMAINS_FILE, "utf8"))
  : [];
const domains = Array.isArray(domainsRaw)
  ? domainsRaw
  : (domainsRaw.domains ?? []);

const series = existsSync(SERIES_DIR)
  ? readdirSync(SERIES_DIR)
      .filter((f) => f.endsWith(".json"))
      .sort()
      .map((f) => {
        const raw = JSON.parse(readFileSync(join(SERIES_DIR, f), "utf8"));
        raw.id = raw.id || f.replace(/\.json$/, "");
        return raw;
      })
  : [];

const banner =
  "// AUTO-GENERATED from content/products/*.json + content/domains.json by\n" +
  "// scripts/gen-products.mjs. Do not edit by hand — edit the JSON (or use\n" +
  "// the CMS) and re-run `npm run gen`.\n";

writeFileSync(
  OUT,
  banner +
    '\nimport type { ProductContent, DomainContent, SeriesContent } from "./products";\n\n' +
    `export const GENERATED_PRODUCTS: ProductContent[] = ${JSON.stringify(
      products,
      null,
      2,
    )};\n\n` +
    `export const GENERATED_DOMAINS: DomainContent[] = ${JSON.stringify(
      domains,
      null,
      2,
    )};\n\n` +
    `export const GENERATED_SERIES: SeriesContent[] = ${JSON.stringify(
      series,
      null,
      2,
    )};\n`,
);

console.log(
  `gen-products: wrote ${products.length} products, ${domains.length} domains, ${series.length} series -> ${OUT}`,
);
