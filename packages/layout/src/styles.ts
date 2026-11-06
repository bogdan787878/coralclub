/**
 * Стили Layout внутри shadow DOM: внешние стили страницы их не меняют. Цвета и отступы берутся из токенов
 * UI kit (custom properties проходят в shadow DOM), с запасными значениями для сервисов без токенов.
 * Нижнее меню: классическая панель магазина (как TabBar витрины). Корзина — отдельное приложение (@coral/cart), здесь только кнопка с бейджем.
 */
export const CSS = `
:host {
  --c-surface: var(--color-surface, #fff);
  --c-text: var(--color-text, #002022);
  --c-muted: var(--color-text-muted, rgba(0, 32, 34, .6));
  --c-line: var(--color-neutral-white, #fff);
  --c-thumb: var(--color-neutral-30, #f6f6f6);
  --c-action: var(--color-action, #00474d);
  --c-action-hover: var(--color-action-hover, #002022);
  --c-soft: var(--color-malachite-10, #e3f7fa);
  --c-badge: #e5484d;
  --f: var(--font-sans, "Suisse Intl", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif);
  --fw: var(--font-weight-medium, 500);
  --ease: var(--ease-standard, cubic-bezier(.2, 0, 0, 1));
  display: block;
  font-family: var(--f);
  color: var(--c-text);
}
* { box-sizing: border-box; }
a { color: inherit; text-decoration: none; }
button { font: inherit; color: inherit; border: 0; background: none; padding: 0; cursor: pointer; }
svg { display: block; }
[hidden] { display: none !important; }

/* ---------- шапка ---------- */
.head { position: sticky; top: 0; z-index: 50; display: grid; grid-template-columns: 1fr auto; align-items: center; gap: 8px;
  padding: 16px var(--page-padding-inline, 16px); background: var(--c-surface); }
.brand { justify-self: start; font-size: 1.375rem; line-height: 1.5rem; font-weight: var(--fw); letter-spacing: -.01em; }
.right { justify-self: end; display: flex; align-items: center; gap: 16px; }
.desk { display: none; }
.icon { position: relative; display: inline-flex; align-items: center; justify-content: center; width: 24px; height: 24px; transition: opacity .15s var(--ease); }
.icon:hover { opacity: .7; }
.icon svg { width: 24px; height: 24px; }
.icon .badge { top: -6px; right: -10px; }
@media (min-width: 768px) {
  .head { grid-template-columns: 1fr auto 1fr; }
  .brand { grid-column: 2; justify-self: center; }
  .right { grid-column: 3; }
}
@media (min-width: 1024px) {
  .brand { font-size: 1.5rem; }
  .desk { display: flex; align-items: center; gap: 24px; }
}
/* шапка «полосой» («Друг клуба»): меню и логотип слева, слоты сервиса и корзина справа, на всех ширинах */
.head.bar { display: flex; align-items: center; justify-content: space-between; gap: 8px; padding: 8px var(--page-padding-inline, 16px); }
.head.bar .brand { display: inline-flex; font-size: inherit; line-height: 0; }
.side { display: flex; align-items: center; gap: 8px; min-width: 0; }
.iconBtn { position: relative; display: inline-grid; place-items: center; width: 44px; height: 44px; border-radius: 999px;
  transition: background-color var(--duration-fast, .15s) var(--ease); }
.iconBtn:hover { background: var(--c-thumb); }
.iconBtn svg { width: 26px; height: 26px; }
.iconBtn .badge { top: 1px; right: 0; min-width: 20px; height: 20px; padding: 0 5px; line-height: 20px; background: var(--color-error, var(--c-badge)); font-size: .75rem; }

/* ---------- нижнее меню (телефон и планшет): классическая панель магазина, прижата к низу ---------- */
.tabbar { position: fixed; z-index: 45; left: 50%; transform: translateX(-50%); bottom: 0; width: 100%; max-width: var(--cc-tabbar-max, 100%);
  height: calc(64px + env(safe-area-inset-bottom, 0px)); padding-bottom: env(safe-area-inset-bottom, 0px);
  display: flex; justify-content: space-around; align-items: stretch;
  background: var(--c-surface); border-top: 1px solid var(--c-thumb); box-shadow: 0 -8px 24px rgba(1, 17, 48, .08);
  transition: transform .2s var(--ease), opacity .2s var(--ease); }
.tabbar.hide { transform: translate(-50%, 100%); opacity: 0; pointer-events: none; }
.tab { position: relative; flex: 1; min-width: 0; display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 4px;
  padding: 8px 0; color: var(--c-muted); font-size: .6875rem; line-height: .875rem; font-weight: var(--fw); -webkit-tap-highlight-color: transparent; }
.tab svg { width: 24px; height: 24px; }
.tab span { white-space: nowrap; }
.tab.on { color: var(--c-text); }
.tab:active { opacity: .6; }
.tab .ico { position: relative; display: inline-flex; }
.badge { position: absolute; top: -4px; right: -8px; min-width: 16px; height: 16px; padding: 0 4px; border-radius: 999px; background: var(--c-action);
  color: #fff; font-style: normal; font-size: .625rem; line-height: 16px; font-weight: var(--fw); text-align: center; }
@media (min-width: 1024px) { .tabbar { display: none; } }

`;

/** Отступ снизу у страницы под плавающее меню (вне shadow DOM, одно правило на документ). Фиксированные панели
 *  сервиса (например, плашка покупки на странице товара) встают над меню по переменной --cc-tabbar-space. */
export const PAGE_CSS = `@media (max-width: 1023px) {
  html.cc-has-tabbar { --cc-tabbar-space: calc(64px + env(safe-area-inset-bottom, 0px)); }
  html.cc-has-tabbar body { padding-bottom: var(--cc-tabbar-space); }
}`;
