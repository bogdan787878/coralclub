/**
 * Стили страницы корзины внутри shadow DOM. Токены UI kit (custom properties проходят в shadow DOM) с запасными
 * значениями. Строки товара как в корзине «Друга клуба»; на телефоне итог и кнопка оформления закреплены внизу
 * над нижним меню Layout (--cc-tabbar-space), на десктопе итог — колонка справа.
 */
export const CSS = `
:host {
  --c-surface: var(--color-surface, #fff);
  --c-text: var(--color-text, #002022);
  --c-muted: var(--color-text-muted, rgba(0, 32, 34, .6));
  --c-thumb: var(--color-neutral-30, #f6f6f6);
  --c-action: var(--color-action, #00474d);
  --c-action-hover: var(--color-action-hover, #002022);
  --c-soft: var(--color-malachite-10, #e3f7fa);
  --c-good: #1f8a5b;
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

.page { max-width: 1120px; margin: 0 auto; padding: 8px var(--page-padding-inline, 16px) 24px; }
.top { display: flex; align-items: baseline; gap: 12px; margin: 8px 0 16px; }
.top h1 { margin: 0; font-size: 1.75rem; line-height: 2rem; font-weight: var(--fw); letter-spacing: -.01em; }
.count { color: var(--c-muted); font-size: .9375rem; }

.banner { margin: 0 0 8px; padding: 12px 16px; border-radius: 16px; background: var(--c-soft); font-size: .875rem; }
.grid { display: grid; gap: 16px; }
.lines { list-style: none; margin: 0; padding: 0; }
.line { display: grid; grid-template-columns: 88px 1fr; gap: 16px; padding: 16px 0; border-bottom: 1px solid var(--c-thumb); }
.thumb { position: relative; width: 88px; height: 88px; border-radius: 12px; background: var(--c-thumb); overflow: hidden; }
.thumb img { position: absolute; inset: 0; width: 100%; height: 100%; object-fit: contain; padding: 8px; }
.lbody { display: flex; flex-direction: column; gap: 4px; min-width: 0; }
.lname { font-size: 1rem; line-height: 1.375rem; font-weight: var(--fw); }
.price { font-size: .875rem; }
.price.muted { color: var(--c-muted); }
.was { color: var(--c-muted); text-decoration: line-through; margin-left: 6px; }
.save { display: block; color: var(--c-good); font-size: .75rem; }
.lfoot { margin-top: 8px; display: flex; align-items: center; justify-content: space-between; gap: 12px; }
.qty { display: inline-flex; align-items: center; gap: 12px; padding: 4px; border-radius: 999px; background: var(--c-thumb); }
.qty button { width: 28px; height: 28px; display: inline-flex; align-items: center; justify-content: center; border-radius: 999px; background: #fff; }
.qty button svg { width: 14px; height: 14px; }
.qty span { min-width: 1.25rem; text-align: center; font-size: .9375rem; font-weight: var(--fw); }
.remove { font-size: .8125rem; color: var(--c-muted); text-decoration: underline; text-underline-offset: 3px; }
.remove:hover { color: var(--c-text); }
.busy { opacity: .6; pointer-events: none; }

.sum { display: flex; flex-direction: column; gap: 12px; }
.sumTitle { margin: 8px 0 0; font-size: 1.125rem; font-weight: var(--fw); }
.rows { margin: 0; display: flex; flex-direction: column; gap: 8px; font-size: .9375rem; }
.rows div { display: flex; justify-content: space-between; gap: 12px; }
.rows dt, .rows dd { margin: 0; }
.rows .disc dd { color: var(--c-good); }
.rows .total { font-size: 1.0625rem; font-weight: var(--fw); }
.note { margin: 0; color: var(--c-muted); font-size: .8125rem; line-height: 1.15rem; }
/* телефон: итог и кнопка закреплены внизу, над нижним меню */
.bar { position: sticky; bottom: calc(var(--cc-tabbar-space, 0px) + 8px); z-index: 2; display: flex; align-items: center; gap: 12px;
  padding: 10px 10px 10px 18px; border-radius: 999px; background: var(--c-surface);
  box-shadow: 0 0 0 10px var(--cc-page-bg, var(--c-surface)), 0 8px 30px 10px rgba(20, 30, 40, .12); } /* кайма цвета страницы (--cc-page-bg): строки итога не выглядывают по краям */
.barSum { flex: 1; font-size: 1.0625rem; font-weight: var(--fw); white-space: nowrap; }
.cta { min-height: 52px; padding: 0 28px; display: inline-flex; align-items: center; justify-content: center; border-radius: 999px;
  background: var(--c-action); color: #fff; font-size: 1rem; font-weight: var(--fw); transition: background-color .15s var(--ease); }
.cta:hover:not(:disabled) { background: var(--c-action-hover); }
.cta:disabled { opacity: .45; cursor: not-allowed; }
.ghost { align-self: center; padding: 10px 4px; font-size: .9375rem; text-decoration: underline; text-underline-offset: 3px; }

.empty { display: flex; flex-direction: column; align-items: center; gap: 16px; padding: 56px 16px; text-align: center; color: var(--c-muted); }
.empty svg { width: 48px; height: 48px; color: var(--c-muted); }
.empty p { margin: 0; font-size: 1rem; }
.empty .ghost { color: var(--c-text); }
.skel { display: flex; flex-direction: column; gap: 16px; padding: 8px 0; }
.skrow { display: grid; grid-template-columns: 88px 1fr; gap: 16px; align-items: center; }
.sk { display: block; height: 14px; border-radius: 7px; margin: 8px 0; background: linear-gradient(90deg, #eef1f3 25%, #f7f9fa 50%, #eef1f3 75%);
  background-size: 200% 100%; animation: sh 1.2s linear infinite; }
.sk.sq { width: 88px; height: 88px; border-radius: 12px; margin: 0; }
@keyframes sh { to { background-position: -200% 0; } }

/* десктоп: строки слева, итог справа (закреплён при прокрутке), без плавающей панели */
@media (min-width: 1024px) {
  .top h1 { font-size: 2.25rem; line-height: 2.5rem; }
  .grid { grid-template-columns: minmax(0, 1fr) 360px; gap: 48px; align-items: start; }
  .line { grid-template-columns: 112px 1fr; gap: 24px; padding: 24px 0; }
  .thumb { width: 112px; height: 112px; }
  .sum { position: sticky; top: 96px; padding: 24px; border-radius: 24px; background: var(--c-thumb); }
  .sumTitle { margin: 0; }
  .bar { position: static; display: block; padding: 0; background: none; box-shadow: none; }
  .barSum { display: none; }
  .bar .cta { width: 100%; min-height: 56px; }
}
`;
