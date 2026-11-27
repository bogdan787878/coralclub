// Офлайн-тесты поиска: собрать TypeScript esbuild'ом во временный файл и запустить.
import { build } from "esbuild";
import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { pathToFileURL } from "node:url";

const dir = mkdtempSync(path.join(tmpdir(), "coral-search-"));
const out = path.join(dir, "search.test.mjs");
try {
  await build({ entryPoints: [new URL("./search.test.ts", import.meta.url).pathname], bundle: true, platform: "node", format: "esm", outfile: out, logLevel: "error" });
  await import(pathToFileURL(out).href);
} finally {
  rmSync(dir, { recursive: true, force: true });
}
