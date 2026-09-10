import manifest from "./image-manifest.json";

/**
 * next/image loader — routes raster images through Cloudflare Images.
 *
 * Everything else (HTML, JS, SVG, reels) still ships from GitHub Pages. A
 * `src` that has been uploaded (see `scripts/sync-images.mjs`, mapping lives
 * in `image-manifest.json`) is served from `imagedelivery.net` with an
 * on-the-fly resize + `format=auto` (WebP/AVIF). Anything not in the manifest
 * — or when the manifest has no account hash yet — falls back to the original
 * file in /public, base-path-prefixed exactly like `asset()`.
 */

const BASE = process.env.NEXT_PUBLIC_BASE_PATH ?? "";
const HASH = (manifest as { accountHash: string }).accountHash;
const IDS = (manifest as { ids: Record<string, string> }).ids;

type LoaderArgs = { src: string; width: number; quality?: number };

/** Drop the base path and any `?v=` / `#` suffix to get the manifest key. */
function manifestKey(src: string): string {
  let s = src.split(/[?#]/)[0];
  if (BASE && s.startsWith(BASE)) s = s.slice(BASE.length);
  return s;
}

function local(src: string): string {
  if (/^(https?:)?\/\//.test(src)) return src;
  return `${BASE}${src.startsWith("/") ? "" : "/"}${src}`;
}

export default function cloudflareImageLoader({
  src,
  width,
  quality,
}: LoaderArgs): string {
  const id = IDS[manifestKey(src)];
  if (!id || !HASH) return local(src);

  // Packshot sources are small (~500px), so most images end up upscaled in
  // the layout; a high quality keeps the AVIF/WebP re-encode from adding
  // visible mush on top of that. Still only tens of KB per image.
  const q = quality ?? 90;
  const opts = `w=${width},q=${q},format=auto,fit=scale-down`;
  return `https://imagedelivery.net/${HASH}/${encodeURI(id)}/${opts}`;
}
