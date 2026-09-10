import type { NextConfig } from "next";

// When building for GitHub Pages the site is served from
// https://bogdan787878.github.io/coralclub/ — a sub-path — so asset and
// route URLs need the "/coralclub" prefix. Local dev / other hosts don't.
const isGithubPages = process.env.GITHUB_PAGES === "true";
const basePath = isGithubPages ? "/coralclub" : "";

const nextConfig: NextConfig = {
  // Static HTML export — no Node server on GitHub Pages.
  output: "export",
  trailingSlash: true,
  images: {
    // Raster images are resized + reformatted by Cloudflare Images; the
    // loader falls back to the original /public file for anything not yet
    // uploaded (see src/lib/cf-image-loader.ts). No Next.js image server.
    loader: "custom",
    loaderFile: "./src/lib/cf-image-loader.ts",
    // Column is 480px wide — cap the srcset so we don't pay Cloudflare for
    // transformation variants nobody downloads (2x of 480 ≈ 960).
    deviceSizes: [360, 480, 720, 960, 1280],
    imageSizes: [96, 128, 256],
  },
  ...(isGithubPages ? { basePath, assetPrefix: basePath } : {}),
  // Exposed to the client so `asset()` / the image loader can prefix
  // /public paths (next/image with a custom loader does not apply basePath).
  env: { NEXT_PUBLIC_BASE_PATH: basePath },
};

export default nextConfig;
