import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  // монорепозиторий: приложение Next лежит в apps/shop
  { settings: { next: { rootDir: "apps/shop/" } } },
  // границы сервисов (ARCHITECTURE.md): общие пакеты не знают ни про приложение, ни про React/Next
  {
    files: ["packages/**/*.{ts,tsx,js,mjs}"],
    rules: {
      "no-restricted-imports": [
        "error",
        {
          patterns: [
            { group: ["@/*", "**/apps/**"], message: "Пакет не импортирует код приложения." },
            { group: ["react", "react-dom", "react/*", "next", "next/*"], message: "Общие пакеты без React и Next: их подключают любые сервисы." },
          ],
        },
      ],
    },
  },
  // приложение берёт общий код только через пакеты, не через пути к их файлам
  {
    files: ["apps/*/src/**/*.{ts,tsx}"],
    rules: {
      "no-restricted-imports": ["error", { patterns: [{ group: ["**/packages/*", "**/packages/**"], message: "Импортируйте пакет по имени (@coral/...)." }] }],
    },
  },
  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    ".next/**",
    "out/**",
    "dist/**",
    "build/**",
    "next-env.d.ts",
    "apps/*/.next/**",
    "apps/*/out/**",
    "apps/*/dist/**",
    "apps/*/next-env.d.ts",
    "packages/*/dist/**",
  ]),
]);

export default eslintConfig;
