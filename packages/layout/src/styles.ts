/**
 * Стили Layout внутри shadow DOM: внешние стили страницы их не меняют. Цвета и отступы берутся из токенов
 * UI kit (custom properties проходят в shadow DOM), с запасными значениями для сервисов без токенов.
 * Нижнее меню: плавающая панель кабинета; выдвижная корзина: один в один CartDrawer «Друга клуба».
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
.badge { position: absolute; top: 1px; left: 52%; min-width: 20px; height: 20px; padding: 0 5px; border-radius: 10px; background: var(--c-badge);
  color: #fff; font-style: normal; font-size: .72rem; line-height: 20px; font-weight: var(--fw); text-align: center; box-shadow: 0 0 0 2px #fff; }
@media (min-width: 1024px) { .tabbar { display: none; } }

/* ---------- выдвижная корзина ---------- */
.drawer { position: fixed; top: 0; bottom: 0; left: 50%; transform: translateX(-50%); width: 100%; max-width: 480px; z-index: 100; display: flex; justify-content: flex-end; }
.scrim { position: absolute; inset: 0; background: rgba(1, 17, 48, .45); animation: fade .15s var(--ease); }
.panel { position: relative; display: flex; flex-direction: column; width: min(420px, 100%); background: var(--c-surface);
  box-shadow: -24px 0 64px rgba(1, 17, 48, .25); animation: slide .22s var(--ease); }
@keyframes fade { from { opacity: 0; } }
@keyframes slide { from { transform: translateX(24px); opacity: .6; } }
.dhead { display: flex; align-items: center; justify-content: space-between; padding: 20px 24px; border-bottom: 1px solid var(--c-thumb); }
.title { font-size: 1.125rem; font-weight: var(--fw); }
.close { width: 36px; height: 36px; display: inline-flex; align-items: center; justify-content: center; border-radius: 999px; background: var(--c-thumb); }
.close svg { width: 16px; height: 16px; }
.body { flex: 1; min-height: 0; display: flex; flex-direction: column; overflow-y: auto; }
.empty { flex: 1; display: flex; flex-direction: column; gap: 16px; align-items: center; justify-content: center; padding: 24px; color: var(--c-muted); text-align: center; }
.banner { margin: 16px 24px 0; padding: 12px 16px; border-radius: 16px; background: var(--c-soft); font-size: .875rem; }
.lines { list-style: none; margin: 0; padding: 8px 24px; }
.line { display: grid; grid-template-columns: 64px 1fr; gap: 16px; padding: 16px 0; border-bottom: 1px solid var(--c-thumb); }
.thumb { position: relative; width: 64px; height: 64px; border-radius: 12px; background: var(--c-thumb); overflow: hidden; }
.thumb img { position: absolute; inset: 0; width: 100%; height: 100%; object-fit: contain; padding: 6px; }
.lbody { display: flex; flex-direction: column; gap: 4px; min-width: 0; }
.lname { font-size: .9375rem; line-height: 1.25rem; font-weight: var(--fw); }
.price { font-size: .8125rem; }
.was { color: var(--c-muted); text-decoration: line-through; margin-left: 6px; }
.save { display: block; color: #1f8a5b; font-size: .75rem; }
.qty { margin-top: 8px; display: inline-flex; align-items: center; gap: 12px; align-self: flex-start; padding: 4px; border-radius: 999px; background: var(--c-thumb); }
.qty button { width: 24px; height: 24px; display: inline-flex; align-items: center; justify-content: center; border-radius: 999px; background: #fff; }
.qty button svg { width: 14px; height: 14px; }
.qty span { min-width: 1.25rem; text-align: center; font-size: .875rem; font-weight: var(--fw); }
.foot { padding: 20px 24px calc(24px + env(safe-area-inset-bottom, 0px)); border-top: 1px solid var(--c-thumb); display: flex; flex-direction: column; gap: 12px; }
.rows { margin: 0; display: flex; flex-direction: column; gap: 8px; }
.rows div { display: flex; justify-content: space-between; }
.rows dt, .rows dd { margin: 0; }
.rows .disc dd { color: #1f8a5b; }
.rows .total { font-size: 1rem; font-weight: var(--fw); }
.cta { min-height: 52px; display: inline-flex; align-items: center; justify-content: center; border-radius: 999px; background: var(--c-action); color: #fff; font-size: 1rem; font-weight: var(--fw);
  transition: background-color .15s var(--ease); }
.cta:hover:not(:disabled) { background: var(--c-action-hover); }
.cta:disabled, .cta[aria-disabled="true"] { opacity: .45; cursor: not-allowed; }
.busy { opacity: .6; pointer-events: none; }
.sk { display: block; height: 14px; border-radius: 7px; margin: 10px 0; background: linear-gradient(90deg, #eef1f3 25%, #f7f9fa 50%, #eef1f3 75%); background-size: 200% 100%; animation: sh 1.2s linear infinite; }
@keyframes sh { to { background-position: -200% 0; } }
@media (min-width: 1024px) {
  .drawer { left: 0; right: 0; transform: none; max-width: none; }
  .panel { width: min(480px, 100%); }
  .dhead { padding: 24px 32px; }
  .title { font-size: 1.375rem; }
  .lines { padding: 8px 32px; }
  .line { grid-template-columns: 88px 1fr; gap: 20px; padding: 24px 0; }
  .thumb { width: 88px; height: 88px; }
  .foot { padding: 24px 32px 32px; gap: 16px; }
  .cta { min-height: 56px; }
}
`;

/** Отступ снизу у страницы под плавающее меню (вне shadow DOM, одно правило на документ). */
export const PAGE_CSS = `@media (max-width: 1023px) { html.cc-has-tabbar body { padding-bottom: calc(96px + env(safe-area-inset-bottom, 0px)); } }`;
