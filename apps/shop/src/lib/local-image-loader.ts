/**
 * next/image loader of the coralclub.ru build: every image is served from the
 * bundle itself (no Cloudflare Images, no resizing). Paths already prefixed by
 * asset() are left as they are.
 */
const BASE = process.env.NEXT_PUBLIC_BASE_PATH ?? "";

export default function localImageLoader({ src }: { src: string }): string {
  if (/^(https?:)?\/\//.test(src)) return src;
  if (BASE && src.startsWith(`${BASE}/`)) return src;
  return `${BASE}${src.startsWith("/") ? "" : "/"}${src}`;
}
