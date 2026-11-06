// Микрофронтенды, которые магазин отдаёт по адресу со своего сайта: собранные пакеты кладутся в public/
//   @coral/layout → public/layout/layout.js   (на Pages: /coralclub/layout/layout.js)
//   @coral/cart   → public/cart/cart.js       (на Pages: /coralclub/cart/cart.js)
import { copyFileSync, mkdirSync } from "node:fs";
import { createRequire } from "node:module";
import { dirname } from "node:path";

const require = createRequire(import.meta.url);
for (const [pkg, out] of [
  ["@coral/layout/dist/layout.js", "public/layout/layout.js"],
  ["@coral/cart/dist/cart.js", "public/cart/cart.js"],
]) {
  mkdirSync(dirname(out), { recursive: true });
  copyFileSync(require.resolve(pkg), out);
  console.log(`${pkg} → ${out}`);
}
