#!/usr/bin/env node
/**
 * Лицензионные шрифты (Suisse Intl, Newton) — в публичном репозитории только зашифрованными (fonts.enc, AES-256-GCM).
 *
 *   node scripts/fonts.mjs pack     — локально: public/fonts/*.woff,*.woff2 → fonts.enc. Ключ — из FONTS_KEY или новый,
 *                                     записывается в ~/.coralclub-fonts-key (в консоль не выводится). Ключ — в секрет
 *                                     репозитория FONTS_KEY.
 *   node scripts/fonts.mjs unpack   — перед сборкой (prebuild): если шрифтов в public/fonts нет, а есть FONTS_KEY —
 *                                     расшифровать fonts.enc туда. Нет ключа — предупреждение, сайт на запасных шрифтах.
 */
import { createCipheriv, createDecipheriv, randomBytes } from "node:crypto";
import { existsSync, mkdirSync, readdirSync, readFileSync, writeFileSync } from "node:fs";
import { homedir } from "node:os";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const dir = join(root, "public", "fonts");
const enc = join(root, "fonts.enc");
const keyFile = join(homedir(), ".coralclub-fonts-key");
const isFont = (f) => /\.(woff2?)$/.test(f);

const keyFrom = (hex) => {
  const k = Buffer.from(String(hex).trim(), "hex");
  if (k.length !== 32) throw new Error("FONTS_KEY — 64 шестнадцатеричных символа (32 байта)");
  return k;
};

function pack() {
  const files = existsSync(dir) ? readdirSync(dir).filter(isFont) : [];
  if (!files.length) throw new Error(`нет шрифтов в ${dir}`);
  let hex = process.env.FONTS_KEY || (existsSync(keyFile) ? readFileSync(keyFile, "utf8").trim() : "");
  if (!hex) {
    hex = randomBytes(32).toString("hex");
    writeFileSync(keyFile, `${hex}\n`, { mode: 0o600 });
    console.log(`новый ключ записан в ${keyFile} — скопируйте его в секрет репозитория FONTS_KEY`);
  }
  const payload = Buffer.from(JSON.stringify(Object.fromEntries(files.map((f) => [f, readFileSync(join(dir, f)).toString("base64")]))));
  const iv = randomBytes(12);
  const c = createCipheriv("aes-256-gcm", keyFrom(hex), iv);
  const body = Buffer.concat([c.update(payload), c.final()]);
  writeFileSync(enc, Buffer.concat([iv, c.getAuthTag(), body]));
  console.log(`fonts.enc: ${files.length} файлов, ${Math.round(body.length / 1024)} КБ`);
}

function unpack() {
  if (existsSync(dir) && readdirSync(dir).some((f) => f.endsWith(".woff2"))) return console.log("шрифты: уже в public/fonts");
  if (!process.env.FONTS_KEY) return console.warn("шрифты: нет FONTS_KEY — сборка без лицензионных шрифтов (запасные)");
  if (!existsSync(enc)) return console.warn("шрифты: нет fonts.enc");
  const raw = readFileSync(enc);
  const d = createDecipheriv("aes-256-gcm", keyFrom(process.env.FONTS_KEY), raw.subarray(0, 12));
  d.setAuthTag(raw.subarray(12, 28));
  const files = JSON.parse(Buffer.concat([d.update(raw.subarray(28)), d.final()]).toString("utf8"));
  mkdirSync(dir, { recursive: true });
  for (const [name, b64] of Object.entries(files)) if (isFont(name)) writeFileSync(join(dir, name), Buffer.from(b64, "base64"));
  console.log(`шрифты: расшифровано ${Object.keys(files).length} файлов в public/fonts`);
}

const cmd = process.argv[2];
if (cmd === "pack") pack();
else if (cmd === "unpack") unpack();
else console.log("node scripts/fonts.mjs pack|unpack");
