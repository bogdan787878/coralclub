// Reads content/products/*.json (edited by the CMS) and writes a typed,
// client-safe data module the app imports. Run via prebuild / predev, or
// `npm run gen`.

import { readdirSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";

const CONTENT_DIR = join(process.cwd(), "content", "products");
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

const banner =
  "// AUTO-GENERATED from content/products/*.json by scripts/gen-products.mjs.\n" +
  "// Do not edit by hand — edit the JSON (or use the CMS) and re-run `npm run gen`.\n";

writeFileSync(
  OUT,
  banner +
    "\nimport type { ProductContent } from \"./products\";\n\n" +
    `export const GENERATED_PRODUCTS: ProductContent[] = ${JSON.stringify(
      products,
      null,
      2,
    )};\n`,
);

console.log(`gen-products: wrote ${products.length} products -> ${OUT}`);
