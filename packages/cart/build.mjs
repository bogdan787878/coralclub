// Сборка приложения корзины в один файл для подключения по адресу: dist/cart.js. Сервисы кладут его себе в public
// (магазин: apps/shop/public/cart/cart.js, на GitHub Pages /coralclub/cart/cart.js).
import { build } from "esbuild";
import { mkdirSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const here = dirname(fileURLToPath(import.meta.url));
const out = resolve(here, "dist/cart.js");
mkdirSync(dirname(out), { recursive: true });
await build({
  entryPoints: [resolve(here, "src/index.ts")],
  outfile: out,
  bundle: true,
  format: "iife",
  target: ["es2020", "safari14"],
  minify: true,
  sourcemap: false,
  legalComments: "none",
});
console.log("cart → packages/cart/dist/cart.js");
