/**
 * Prefix a path to a file in /public with the deployment base path.
 *
 * next/link and next/image apply `basePath` to routes and the image
 * optimizer, but NOT to raw `/public` `src` values when images are
 * `unoptimized` (our GitHub Pages setup). Wrap those paths with this.
 */
const BASE = process.env.NEXT_PUBLIC_BASE_PATH ?? "";

export function asset(path: string): string {
  if (/^(https?:)?\/\//.test(path)) return path; // already absolute URL
  return `${BASE}${path.startsWith("/") ? "" : "/"}${path}`;
}
