/**
 * Стили Layout внутри shadow DOM: внешние стили страницы их не меняют. Цвета и отступы берутся из токенов
 * UI kit (custom properties проходят в shadow DOM), с запасными значениями для сервисов без токенов.
 * Нижнее меню: плавающая панель кабинета. Корзина — отдельное приложение (@coral/cart), здесь только кнопка с бейджем.
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
.desk { display: none; }
.icon { position: relative; display: inline-flex; align-items: center; justify-content: center; width: 24px; height: 24px; transition: opacity .15s var(--ease); }
.icon:hover { opacity: .7; }
.icon svg { width: 24px; height: 24px; }
.icon .badge { top: -6px; left: 14px; }
@media (min-width: 768px) {
  .head { grid-template-columns: 1fr auto 1fr; }
  .brand { grid-column: 2; justify-self: center; }
}
@media (min-width: 1024px) {
  .brand { font-size: 1.5rem; }
  .desk { grid-column: 3; justify-self: end; display: flex; align-items: center; gap: 24px; }
}
/* шапка «полосой» («Друг клуба»): меню и логотип слева, слоты сервиса и корзина справа, на всех ширинах */
.head.bar { display: flex; align-items: center; justify-content: space-between; gap: 8px; padding: 8px var(--page-padding-inline, 16px); }
.head.bar .brand { display: inline-flex; font-size: inherit; line-height: 0; }
.side { display: flex; align-items: center; gap: 8px; min-width: 0; }
.iconBtn { position: relative; display: inline-grid; place-items: center; width: 44px; height: 44px; border-radius: 999px;
  transition: background-color var(--duration-fast, .15s) var(--ease); }
.iconBtn:hover { background: var(--c-thumb); }
.iconBtn svg { width: 26px; height: 26px; }
.iconBtn .badge { top: 1px; left: auto; right: 0; background: var(--color-error, var(--c-badge)); box-shadow: none; font-size: .75rem; }

/* ---------- нижнее меню (телефон и планшет) ---------- */
.tabbar { position: fixed; z-index: 45; left: 50%; transform: translateX(-50%); bottom: calc(12px + env(safe-area-inset-bottom, 0px));
  width: min(436px, calc(100vw - 24px)); display: flex; align-items: stretch; gap: 2px; padding: 6px; border-radius: 34px;
  background: rgba(255, 255, 255, .94); -webkit-backdrop-filter: saturate(180%) blur(16px); backdrop-filter: saturate(180%) blur(16px);
  box-shadow: 0 8px 30px rgba(20, 30, 40, .16), 0 1px 3px rgba(20, 30, 40, .08); }
.tab { position: relative; flex: 1; min-width: 0; display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 3px;
  padding: 8px 2px 7px; border-radius: 28px; font-size: .7rem; line-height: .9rem; -webkit-tap-highlight-color: transparent; }
.tab svg { width: 25px; height: 25px; color: #7b8791; }
.tab span { white-space: nowrap; }
.tab.on { background: var(--tab-on-bg, #e6f4f1); color: var(--tab-on, #00474d); }
.tab.on svg { color: var(--tab-on, #00474d); }
.tab:active { opacity: .6; }
.tabbar { transition: transform .2s var(--ease), opacity .2s var(--ease); }
.tabbar.hide { transform: translate(-50%, 140%); opacity: 0; pointer-events: none; }
.badge { position: absolute; top: 1px; left: 52%; min-width: 20px; height: 20px; padding: 0 5px; border-radius: 10px; background: var(--c-badge);
  color: #fff; font-style: normal; font-size: .72rem; line-height: 20px; font-weight: var(--fw); text-align: center; box-shadow: 0 0 0 2px #fff; }
@media (min-width: 1024px) { .tabbar { display: none; } }

`;

/** Отступ снизу у страницы под плавающее меню (вне shadow DOM, одно правило на документ). Фиксированные панели
 *  сервиса (например, плашка покупки на странице товара) встают над меню по переменной --cc-tabbar-space. */
export const PAGE_CSS = `@media (max-width: 1023px) {
  html.cc-has-tabbar { --cc-tabbar-space: calc(94px + env(safe-area-inset-bottom, 0px)); }
  html.cc-has-tabbar body { padding-bottom: var(--cc-tabbar-space); }
}`;
