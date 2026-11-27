import type { NextConfig } from "next";
import { networkInterfaces } from "node:os";

// Dev server opened from a phone on the same Wi-Fi (http://<Mac's IP>:3100): Next blocks its dev
// resources (scripts, HMR) for other origins unless they are allowed — allow this Mac's own LAN addresses.
const lanHosts = Object.values(networkInterfaces())
  .flat()
  .filter((n) => n && n.family === "IPv4" && !n.internal)
  .map((n) => n!.address);

// Two deployments of the same code:
//  - GitHub Pages (GITHUB_PAGES=true): https://bogdan787878.github.io/coralclub/
//    — a sub-path, so asset and route URLs need the "/coralclub" prefix.
//  - coralclub.ru (DEPLOY_TARGET=coralclub): ONLY the "Система красоты" landing,
//    at https://coralclub.ru/landings/labspace/. Its pages are the
//    `*.labspace.tsx` files in src/app (the root of the base path is the
//    landing itself); images are served from the bundle, not from Cloudflare.
//    Build it with `npm run build:labspace` (see handoff/labspace-deploy.md).
//  - магазин России отдельно (DEPLOY_TARGET=ru): ТОЛЬКО страницы магазина России — файлы `*.ru.tsx` в
//    src/app (главная, товар, корзина, вход, оформление) в корне сайта; base path — RU_BASE_PATH (по
//    умолчанию корень домена). Сборка: `npm run build:ru` → dist/ru (см. scripts/build-ru.mjs).
// Local dev / any other host: no prefix.
const isGithubPages = process.env.GITHUB_PAGES === "true";
const isLabspace = process.env.DEPLOY_TARGET === "coralclub";
const isRu = process.env.DEPLOY_TARGET === "ru";
const basePath = isLabspace
  ? "/landings/labspace"
  : isRu
    ? (process.env.RU_BASE_PATH ?? "")
    : isGithubPages
      ? "/coralclub"
      : "";

const nextConfig: NextConfig = {
  // Static HTML export — no Node server on GitHub Pages / on the shop's host.
  output: "export",
  // общие пакеты монорепозитория (packages/*) лежат исходниками на TypeScript
  transpilePackages: ["@coral/api", "@coral/cart", "@coral/icons", "@coral/layout", "@coral/ui"],
  trailingSlash: true,
  allowedDevOrigins: lanHosts,
  // the labspace build exports into its own folder, `out/` stays untouched
  ...(isLabspace ? { distDir: "dist/labspace-build" } : {}),
  ...(isRu ? { distDir: "dist/ru-build" } : {}),
  // labspace: only files named page.labspace.tsx / layout.labspace.tsx are routes
  ...(isLabspace ? { pageExtensions: ["labspace.tsx"] } : {}),
  // магазин России: только page.ru.tsx / layout.ru.tsx — остального сайта в сборке нет
  ...(isRu ? { pageExtensions: ["ru.tsx"] } : {}),
  // the dev server's generated types (.next/dev) describe other routes
  ...(isLabspace
    ? { typescript: { tsconfigPath: "tsconfig.labspace.json" } }
    : {}),
  ...(isRu ? { typescript: { tsconfigPath: "tsconfig.ru.json" } } : {}),
  images: {
    // Raster images are resized + reformatted by Cloudflare Images; the
    // loader falls back to the original /public file for anything not yet
    // uploaded (see src/lib/cf-image-loader.ts). No Next.js image server.
    loader: "custom",
    loaderFile: isLabspace
      ? "./src/lib/local-image-loader.ts"
      : "./src/lib/cf-image-loader.ts",
    // Column is 480px wide — cap the srcset so we don't pay Cloudflare for
    // transformation variants nobody downloads (2x of 480 ≈ 960).
    deviceSizes: [360, 480, 720, 960, 1280],
    imageSizes: [96, 128, 256],
  },
  ...(basePath ? { basePath, assetPrefix: basePath } : {}),
  // Exposed to the client so `asset()` / the image loader can prefix
  // /public paths (next/image with a custom loader does not apply basePath).
  env: {
    NEXT_PUBLIC_BASE_PATH: basePath,
    NEXT_PUBLIC_DEPLOY_TARGET: process.env.DEPLOY_TARGET ?? "",
    // корень магазина России: «/ru» внутри общего сайта, «» в его отдельной сборке
    NEXT_PUBLIC_RU_BASE: isRu ? "" : "/ru",
  },
};

export default nextConfig;
