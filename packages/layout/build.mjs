// Сборка Layout в один файл для подключения по адресу: public/layout/layout.js сервиса магазина
// (попадает в out/layout/ при экспорте Next и публикуется на GitHub Pages вместе с ним).
import { build } from "esbuild";
import { mkdirSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const here = dirname(fileURLToPath(import.meta.url));
const out = resolve(here, "../../public/layout/layout.js");
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
console.log("layout → public/layout/layout.js");
