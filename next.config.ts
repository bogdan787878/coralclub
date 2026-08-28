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
    // The Next.js image optimizer needs a server; serve the originals.
    unoptimized: true,
  },
  ...(isGithubPages ? { basePath, assetPrefix: basePath } : {}),
  // Exposed to the client so `asset()` can prefix /public paths
  // (next/image with `unoptimized` does not apply basePath itself).
  env: { NEXT_PUBLIC_BASE_PATH: basePath },
};

export default nextConfig;
