/**
 * Бюджет производительности магазина России (Lighthouse CI) — по отдельной сборке dist/ru (без base path).
 * Мобильный профиль Lighthouse по умолчанию: Moto G Power, «медленный 4G» (симуляция).
 *   npm run build:ru && npm run perf:lh
 * В CI — шагом после сборки (см. handoff/perf-budget.md). Ошибка бюджета роняет шаг.
 */
module.exports = {
  ci: {
    collect: {
      staticDistDir: "./dist/ru",
      url: ["http://localhost/", "http://localhost/catalog/", "http://localhost/product/b-luron/"],
      numberOfRuns: 3,
      settings: { preset: undefined, chromeFlags: "--headless=new --no-sandbox" },
    },
    assert: {
      assertions: {
        // главное: первый экран на 4G быстрее 2,5 с, без сдвигов
        "largest-contentful-paint": ["error", { maxNumericValue: 2500, aggregationMethod: "median" }],
        "cumulative-layout-shift": ["error", { maxNumericValue: 0.1, aggregationMethod: "median" }],
        "total-blocking-time": ["warn", { maxNumericValue: 300, aggregationMethod: "median" }],
        "categories:performance": ["warn", { minScore: 0.8, aggregationMethod: "median" }],
        // вес JS (по сети, сжатый): сейчас ~250 КБ — потолок, цель — 170 КБ
        "resource-summary:script:size": ["error", { maxNumericValue: 260000 }],
        "resource-summary:image:size": ["warn", { maxNumericValue: 600000 }],
      },
    },
    upload: { target: "filesystem", outputDir: "./.lighthouseci" },
  },
};
