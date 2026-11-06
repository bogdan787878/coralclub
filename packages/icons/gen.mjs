// Генерирует src/icons.ts — набор иконок интерфейса Coral Club из Lucide (lucide-static, ISC).
// Добавить иконку: допишите имя в NAMES (слева наше имя, справа имя в Lucide) и запустите `npm run gen -w @coral/icons`.
// Кабинет на чистом JS получает тот же набор файлом docs/icons.js (флаг --lk): `node gen.mjs --lk ../../../coral-club-lk-test/docs/icons.js`.
import { readFileSync, writeFileSync } from "node:fs";
import { createRequire } from "node:module";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const here = dirname(fileURLToPath(import.meta.url));
const require = createRequire(import.meta.url);
const dir = join(dirname(require.resolve("lucide-static/package.json")), "icons");

/** Наше имя → имя иконки в Lucide. Имена по смыслу, а не по рисунку: сервисы зовут иконку «cart», а не «shopping-cart». */
export const NAMES = {
  home: "house",
  catalog: "layout-grid",
  cart: "shopping-cart",
  bag: "shopping-bag",
  heart: "heart",
  user: "user",
  users: "users",
  userPlus: "user-plus",
  menu: "menu",
  close: "x",
  minus: "minus",
  plus: "plus",
  trash: "trash-2",
  check: "check",
  checkCircle: "circle-check",
  back: "chevron-left",
  next: "chevron-right",
  down: "chevron-down",
  up: "chevron-up",
  share: "share-2",
  search: "search",
  pin: "map-pin",
  crown: "crown",
  coins: "coins",
  transfer: "arrow-right-left",
  trendUp: "trending-up",
  trendDown: "trending-down",
  truck: "truck",
  card: "credit-card",
  doc: "file-text",
  gift: "gift",
  wallet: "wallet",
  logout: "log-out",
  alert: "circle-alert",
  info: "info",
  copy: "copy",
  external: "external-link",
  phone: "phone",
  mail: "mail",
  calendar: "calendar",
  clock: "clock",
  package: "package",
  star: "star",
  play: "play",
  pause: "pause",
  zoom: "zoom-in",
  map: "map",
  list: "list",
  lock: "lock",
  arrowRight: "arrow-right",
  arrowDown: "arrow-down",
  arrowUp: "arrow-up",
};

const inner = (lucide) => {
  const svg = readFileSync(join(dir, `${lucide}.svg`), "utf8");
  return svg
    .slice(svg.indexOf(">", svg.indexOf("<svg")) + 1, svg.lastIndexOf("</svg>"))
    .replace(/\s*\n\s*/g, "")
    .replace(/\s+\/>/g, "/>")
    .trim();
};
const body = Object.fromEntries(Object.entries(NAMES).map(([k, v]) => [k, inner(v)]));
const head = `// Сгенерировано packages/icons/gen.mjs из lucide-static ${require("lucide-static/package.json").version} (ISC). Не править руками.`;

const ts = `${head}
/** Внутренняя разметка иконок (viewBox 0 0 24 24, обводка currentColor). */
export const ICONS = ${JSON.stringify(body, null, 2)} as const;
export type IconName = keyof typeof ICONS;
`;
writeFileSync(resolve(here, "src/icons.ts"), ts);
console.log(`icons: ${Object.keys(body).length} → packages/icons/src/icons.ts`);

const lk = process.argv.indexOf("--lk");
if (lk > 0) {
  const out = resolve(process.cwd(), process.argv[lk + 1]);
  writeFileSync(
    out,
    `${head}
// Набор тот же, что в @coral/icons монорепозитория coral-club-shop; кабинет на чистом JS берёт его этим файлом.
export const ICONS = ${JSON.stringify(body, null, 2)};
/** Иконка строкой SVG: svg("cart"), svg("cart", { size: 20, stroke: 1.75, cls: "x" }). */
export function svg(name, { size = 24, stroke = 1.75, cls = "" } = {}) {
  const b = ICONS[name];
  if (!b) return "";
  return \`<svg\${cls ? \` class="\${cls}"\` : ""} width="\${size}" height="\${size}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="\${stroke}" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">\${b}</svg>\`;
}
`,
  );
  console.log(`icons → ${out}`);
}
