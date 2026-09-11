#!/usr/bin/env node
/**
 * sync-images.mjs — push public/images/*.{png,jpg,jpeg,webp} to Cloudflare
 * Images and refresh src/lib/image-manifest.json.
 *
 * Run it locally whenever raster images change, then commit the updated
 * manifest. CI never runs this (no token there); it just consumes the
 * committed manifest, and the loader falls back to the /public originals for
 * anything the manifest doesn't cover.
 *
 *   CF_ACCOUNT_ID=xxx CF_IMAGES_TOKEN=yyy npm run images:sync
 *
 *   CF_ACCOUNT_ID    Cloudflare account id (dashboard URL, or `wrangler whoami`)
 *   CF_IMAGES_TOKEN  API token with "Account › Cloudflare Images › Edit"
 *
 * SVGs and /public/reels stay on GitHub Pages and are left untouched.
 */

import { createHash } from "node:crypto";
import { readdirSync, readFileSync, statSync, writeFileSync } from "node:fs";
import { join, posix, relative } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = fileURLToPath(new URL("..", import.meta.url));
const IMAGES_DIR = join(ROOT, "public", "images");
const MANIFEST_PATH = join(ROOT, "src", "lib", "image-manifest.json");
const RASTER = /\.(png|jpe?g|webp)$/i;

const ACCOUNT_ID = process.env.CF_ACCOUNT_ID;
const TOKEN = process.env.CF_IMAGES_TOKEN;
if (!ACCOUNT_ID || !TOKEN) {
  console.error(
    "Missing CF_ACCOUNT_ID and/or CF_IMAGES_TOKEN.\n" +
      "  CF_ACCOUNT_ID=xxx CF_IMAGES_TOKEN=yyy npm run images:sync",
  );
  process.exit(1);
}

const API = `https://api.cloudflare.com/client/v4/accounts/${ACCOUNT_ID}/images/v1`;
const authHeader = { Authorization: `Bearer ${TOKEN}` };

/** All raster files under public/images, as posix paths relative to that dir. */
function walk(dir) {
  const out = [];
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const abs = join(dir, entry.name);
    if (entry.isDirectory()) out.push(...walk(abs));
    else if (RASTER.test(entry.name)) out.push(abs);
  }
  return out;
}

/** "/images/products/foo bar 1.png" -> "images/products/foo-bar-1.png" */
function toId(srcKey) {
  return srcKey
    .replace(/^\/+/, "")
    .toLowerCase()
    .replace(/[^a-z0-9/._-]+/g, "-")
    .replace(/-+/g, "-");
}

function sha1(buf) {
  return createHash("sha1").update(buf).digest("hex");
}

async function cf(method, path = "", body, headers) {
  const res = await fetch(API + path, {
    method,
    headers: { ...authHeader, ...headers },
    body,
  });
  const json = await res.json().catch(() => ({}));
  return { ok: res.ok && json.success !== false, status: res.status, json };
}

async function deleteImage(id) {
  const { ok, status } = await cf("DELETE", `/${encodeURIComponent(id)}`);
  // 404 == already gone, that's fine
  if (!ok && status !== 404) {
    throw new Error(`delete ${id} failed (HTTP ${status})`);
  }
}

async function uploadImage(id, buf, filename) {
  const form = new FormData();
  form.append("id", id);
  form.append("requireSignedURLs", "false");
  form.append("file", new Blob([buf]), filename);
  const { ok, status, json } = await cf("POST", "", form);
  if (!ok) {
    throw new Error(
      `upload ${id} failed (HTTP ${status}): ${JSON.stringify(json.errors ?? json)}`,
    );
  }
  return json.result; // { id, variants: ["https://imagedelivery.net/<hash>/<id>/public", ...] }
}

// ---------------------------------------------------------------------------

const manifest = JSON.parse(readFileSync(MANIFEST_PATH, "utf8"));
manifest.ids ??= {};
manifest.digests ??= {};

const files = walk(IMAGES_DIR).sort();
const seen = new Set();
let uploaded = 0;
let skipped = 0;
let pruned = 0;

for (const abs of files) {
  const rel = relative(IMAGES_DIR, abs).split(/[\\/]/).join(posix.sep);
  const srcKey = `/images/${rel}`;
  seen.add(srcKey);

  const buf = readFileSync(abs);
  const digest = sha1(buf);
  const sizeKb = Math.round(statSync(abs).size / 1024);

  if (manifest.digests[srcKey] === digest && manifest.ids[srcKey]) {
    skipped++;
    continue;
  }

  const id = toId(srcKey);
  process.stdout.write(`  ↑ ${srcKey}  (${sizeKb} KB) … `);
  // Always delete-before-upload, not just when the manifest already knew
  // about this id. deleteImage() treats 404 as a no-op, so this is free
  // when the id is genuinely new — and it self-heals the case where a
  // prior run uploaded to Cloudflare but got interrupted (e.g. a push
  // race) before committing the manifest, which otherwise makes the next
  // upload fail with "already exists" and blocks the whole deploy.
  await deleteImage(manifest.ids[srcKey] ?? id);
  const result = await uploadImage(id, buf, rel);

  manifest.ids[srcKey] = result.id;
  manifest.digests[srcKey] = digest;

  const sample = result.variants?.[0] ?? "";
  const m = sample.match(/imagedelivery\.net\/([^/]+)\//);
  if (m && manifest.accountHash !== m[1]) manifest.accountHash = m[1];

  uploaded++;
  console.log("ok");
}

// Drop (and delete remotely) entries whose file was removed.
for (const srcKey of Object.keys(manifest.ids)) {
  if (seen.has(srcKey)) continue;
  console.log(`  ✕ ${srcKey}  (file gone — removing)`);
  await deleteImage(manifest.ids[srcKey]);
  delete manifest.ids[srcKey];
  delete manifest.digests[srcKey];
  pruned++;
}

// Stable, diff-friendly output.
const sortKeys = (o) =>
  Object.fromEntries(Object.keys(o).sort().map((k) => [k, o[k]]));
manifest.ids = sortKeys(manifest.ids);
manifest.digests = sortKeys(manifest.digests);
writeFileSync(MANIFEST_PATH, JSON.stringify(manifest, null, 2) + "\n");

console.log(
  `\naccountHash: ${manifest.accountHash || "(none yet)"}` +
    `\nuploaded ${uploaded}, skipped ${skipped}, pruned ${pruned}` +
    `\nmanifest → ${relative(ROOT, MANIFEST_PATH)}`,
);
if (!manifest.accountHash) {
  console.log(
    "\nNote: enable Images → Variants → \"Flexible variants\" in the Cloudflare\n" +
      "dashboard, or the resized URLs will 404.",
  );
}
