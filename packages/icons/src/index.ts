/**
 * Одна библиотека иконок для всех сервисов Coral Club: магазин, Layout, корзина, кабинет. Рисунки — Lucide.
 * Толщина линии одна на весь продукт (STROKE). React-обёртка: Icon в @coral/ui.
 */
import { ICONS, type IconName } from "./icons";

export { ICONS, type IconName };
/** Толщина линии всех иконок продукта. */
export const STROKE = 1.75;

/** Иконка строкой SVG (веб-компоненты, чистый JS): svg("cart"), svg("cart", { size: 20 }). */
export function svg(name: IconName, { size = 24, stroke = STROKE, cls = "" }: { size?: number; stroke?: number; cls?: string } = {}): string {
  return `<svg${cls ? ` class="${cls}"` : ""} width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="${stroke}" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${ICONS[name]}</svg>`;
}
