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
  /* шапка: фон — primary (зелёный, как кнопки), текст и значки — белые (переопределяются --cc-head-bg / --cc-head-fg) */
  --c-head-bg: var(--cc-head-bg, var(--color-malachite-90, #004144));
  --c-head-fg: var(--cc-head-fg, var(--color-text-on-primary, #fff));
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
  padding: 16px var(--page-padding-inline, 16px); background: var(--c-head-bg); color: var(--c-head-fg); }
.brand { justify-self: start; font-size: 1.375rem; line-height: 1.5rem; font-weight: var(--fw); letter-spacing: -.01em; }
.brand { display: inline-flex; align-items: center; color: inherit; }
.logo { display: block; height: 24px; width: auto; }
.head .badge { background: var(--c-head-fg); color: var(--c-head-bg); }
.head .iconBtn:hover { background: rgba(255, 255, 255, .12); }
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
.search { display: none; }
.catBtn { display: none; }
.lbl { display: none; }
@media (min-width: 1024px) {
  .brand { font-size: 1.5rem; }
  .logo { height: 28px; }
  /* веб: логотип слева, поиск (слот search) на всю ширину, справа город и разделы с подписями */
  .head { grid-template-columns: auto auto minmax(0, 1fr) auto; column-gap: 24px; padding-block: 14px; }
  .brand { grid-column: 1; justify-self: start; margin-right: 8px; }
  /* «Каталог» — отдельная кнопка после логотипа (светлее фона шапки) */
  .catBtn { grid-column: 2; display: inline-flex; align-items: center; gap: 8px; height: 44px; padding: 0 20px 0 16px;
    border-radius: 999px; background: var(--color-malachite-70, #007d79); color: #fff; font-size: 1rem; font-weight: var(--fw);
    transition: background-color .15s var(--ease); }
  .catBtn:hover, .catBtn.on { background: var(--color-malachite-50, #08bdba); color: var(--c-head-bg); }
  .catBtn svg { width: 20px; height: 20px; }
  .search { display: block; grid-column: 3; min-width: 0; }
  .right { grid-column: 4; gap: 20px; }
  .desk { display: flex; align-items: center; gap: 20px; }
  .desk .icon { width: auto; height: auto; flex-direction: column; gap: 2px; min-width: 48px; }
  .desk .ico { position: relative; display: inline-flex; }
  .desk .ico svg { width: 24px; height: 24px; }
  .desk .lbl { display: block; font-size: .75rem; line-height: 1rem; white-space: nowrap; opacity: .85; }
  .desk .on .lbl, .desk .icon[aria-current] .lbl { opacity: 1; font-weight: var(--fw); }
  .desk .badge { top: -6px; right: -10px; }
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
/* «жидкое стекло» (tabbar="glass"): плавающая скруглённая панель над контентом, полупрозрачная, с размытием и бликом */
.tabbar.glass { bottom: calc(12px + env(safe-area-inset-bottom, 0px)); width: calc(100% - 24px); max-width: min(var(--cc-tabbar-max, 100%), 440px);
  height: 64px; padding: 0 6px; border-radius: 32px; border: 1px solid rgba(255, 255, 255, .55);
  background: linear-gradient(180deg, rgba(255, 255, 255, .62), rgba(255, 255, 255, .42));
  -webkit-backdrop-filter: blur(22px) saturate(180%); backdrop-filter: blur(22px) saturate(180%);
  box-shadow: 0 10px 30px rgba(1, 17, 48, .14), 0 1px 2px rgba(1, 17, 48, .08), inset 0 1px 0 rgba(255, 255, 255, .85), inset 0 -1px 0 rgba(255, 255, 255, .25);
  transition: transform .35s cubic-bezier(.32, .72, 0, 1), opacity .25s var(--ease); overflow: hidden; }
.tabbar.glass::before { content: ""; position: absolute; inset: 0; border-radius: inherit; pointer-events: none;
  background: radial-gradient(120% 90% at 50% -30%, rgba(255, 255, 255, .7), transparent 60%); opacity: .55; }
.tabbar.glass.hide { transform: translate(-50%, calc(100% + 24px + env(safe-area-inset-bottom, 0px))); opacity: 0; }
.tabbar.glass .tab { padding: 6px 0; margin: 6px 0; border-radius: 26px; transition: background-color .2s var(--ease); }
.tabbar.glass .tab.on { background: rgba(255, 255, 255, .7); box-shadow: inset 0 0 0 1px rgba(255, 255, 255, .6), 0 1px 4px rgba(1, 17, 48, .06); }
@supports not ((-webkit-backdrop-filter: blur(1px)) or (backdrop-filter: blur(1px))) { .tabbar.glass { background: rgba(255, 255, 255, .94); } }
@media (min-width: 1024px) { .tabbar { display: none; } }

`;

/** Отступ снизу у страницы под плавающее меню (вне shadow DOM, одно правило на документ). Фиксированные панели
 *  сервиса (например, плашка покупки на странице товара) встают над меню по переменной --cc-tabbar-space. */
export const PAGE_CSS = `@media (max-width: 1023px) {
  html.cc-has-tabbar { --cc-tabbar-space: calc(64px + env(safe-area-inset-bottom, 0px)); }
  html.cc-has-tabbar body { padding-bottom: var(--cc-tabbar-space); }
  html.cc-has-tabbar.cc-tabbar-glass { --cc-tabbar-space: calc(76px + env(safe-area-inset-bottom, 0px)); }
}`;
