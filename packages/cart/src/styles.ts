/**
 * Стили страницы корзины внутри shadow DOM. Токены UI kit (custom properties проходят в shadow DOM) с запасными
 * значениями. Строки товара: фото, название с иконкой удаления, подпись, цена и количество; итог — серой карточкой,
 * как сводка заказа в оформлении (на телефоне — под товарами, на десктопе — колонка справа, закреплена при прокрутке).
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
  --c-good: var(--color-malachite-70, #007d79);
  --c-deal: var(--color-special, #cb8d52);
  --c-deal-soft: var(--color-peach-10, #faeee2);
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

.page { max-width: var(--cc-cart-max, 1120px); margin: 0 auto; padding: 8px var(--page-padding-inline, 16px) 24px; }
.top { display: flex; align-items: baseline; gap: 12px; margin: 16px 0 12px; }
.top h1 { margin: 0; font-size: 1.75rem; line-height: 2rem; font-weight: var(--fw); letter-spacing: -.01em; }
.count { color: var(--c-muted); font-size: .9375rem; }

/* до бесплатной доставки */
.ship { display: grid; gap: 10px; margin: 0 0 8px; }
.ship p { margin: 0; font-size: .9375rem; line-height: 1.25rem; font-weight: var(--fw); }
.track { height: 6px; border-radius: 999px; background: var(--c-thumb); overflow: hidden; }
.track span { display: block; height: 100%; border-radius: 999px; background: var(--c-deal); transition: width .3s var(--ease); }

.grid { display: grid; grid-template-columns: minmax(0, 1fr); gap: 24px; }
.col { display: grid; grid-template-columns: minmax(0, 1fr); gap: 24px; min-width: 0; }
.lines { list-style: none; margin: 0; padding: 0; }
.line { display: grid; grid-template-columns: 96px 1fr; gap: 14px; padding: 16px 0; border-bottom: 1px solid var(--c-thumb); }
.thumb { position: relative; width: 96px; height: 96px; border-radius: 12px; background: var(--c-thumb); overflow: hidden; }
.thumb img { position: absolute; inset: 0; width: 100%; height: 100%; object-fit: contain; padding: 10px; mix-blend-mode: multiply; }
.lbody { display: flex; flex-direction: column; gap: 2px; min-width: 0; }
.lhead { display: flex; align-items: flex-start; justify-content: space-between; gap: 8px; }
.lname { font-size: 1rem; line-height: 1.375rem; font-weight: var(--fw); }
/* удалить строку — иконкой справа от названия */
.del { flex: none; display: inline-flex; align-items: center; justify-content: center; width: 32px; height: 32px; margin: -5px -6px 0 0;
  border-radius: 999px; color: var(--c-muted); transition: background-color .15s var(--ease), color .15s var(--ease); }
.del:hover { background: var(--c-thumb); color: var(--c-text); }
.del svg { width: 18px; height: 18px; }
.lsub { font-family: var(--font-accent, Georgia, serif); font-style: italic; font-size: .9375rem; line-height: 1.25rem; color: var(--c-muted); }
/* цена слева, количество справа — по низу строки */
.lfoot { margin-top: auto; padding-top: 10px; display: flex; align-items: flex-end; justify-content: space-between; gap: 8px; }
.lfoot .price { min-width: 0; }
.price { display: flex; flex-wrap: wrap; align-items: baseline; gap: 0 6px; font-size: .9375rem; line-height: 1.25rem; }
.price b { font-weight: var(--fw); }
.price.muted { color: var(--c-muted); }
.was { color: var(--c-muted); text-decoration: line-through; font-size: .8125rem; }
.save { flex-basis: 100%; color: var(--c-good); font-size: .8125rem; line-height: 1.125rem; white-space: nowrap; }
.qty { flex: none; display: inline-flex; align-items: center; gap: 4px; padding: 3px; border-radius: 999px; background: var(--c-thumb); }
.qty button { width: 30px; height: 30px; display: inline-flex; align-items: center; justify-content: center; border-radius: 999px; background: #fff; }
.qty button svg { width: 16px; height: 16px; }
.qty button:disabled { opacity: .35; cursor: default; }
.qty span { min-width: 1.25rem; text-align: center; font-size: .9375rem; font-weight: var(--fw); }
.busy { opacity: .6; pointer-events: none; }

/* итог — серой карточкой, как сводка заказа в оформлении */
.sum { display: flex; flex-direction: column; gap: 16px; padding: 24px; border-radius: var(--radius-base, 32px); background: var(--c-thumb); }
.sumTitle { margin: 0; font-size: 1.125rem; line-height: 1.5rem; font-weight: var(--fw); }
.rows { margin: 0; display: flex; flex-direction: column; gap: 8px; font-size: .9375rem; line-height: 1.375rem; }
.rows div { display: flex; justify-content: space-between; gap: 12px; }
.rows dt, .rows dd { margin: 0; }
.rows dd { text-align: right; white-space: nowrap; }
.rows .disc { color: var(--c-good); }
.rows .total { padding-top: 12px; border-top: 1px solid rgba(0, 65, 68, .12); font-size: 1.125rem; font-weight: var(--fw); }
.cta { width: 100%; min-height: 52px; padding: 0 28px; display: inline-flex; align-items: center; justify-content: center; border-radius: 999px;
  background: var(--c-action); color: #fff; font-size: 1rem; font-weight: var(--fw); transition: background-color .15s var(--ease); }
.cta:hover:not(:disabled) { background: var(--c-action-hover); }
.cta:disabled { opacity: .45; cursor: not-allowed; }
.cta.wide { width: auto; }
/* ghost-кнопка: «Поделиться корзиной» под «Оформить заказ» — без обводки и иконки */
.ghostBtn { width: 100%; min-height: 52px; padding: 0 24px; display: inline-flex; align-items: center; justify-content: center;
  border: 0; border-radius: 999px; background: transparent; color: var(--c-text); font-size: 1rem; font-weight: var(--fw);
  transition: background-color .15s var(--ease); }
.ghostBtn:hover:not(:disabled) { background: rgba(0, 32, 34, .06); }
.ghostBtn:disabled { opacity: .6; cursor: progress; }
.ghost { align-self: center; padding: 10px 4px; font-size: .9375rem; text-decoration: underline; text-underline-offset: 3px; }

.empty { display: flex; flex-direction: column; align-items: center; gap: 16px; padding: 56px 16px; text-align: center; color: var(--c-muted); }
.empty svg { width: 48px; height: 48px; color: var(--c-muted); }
.empty p { margin: 0; font-size: 1rem; }
.empty .ghost { color: var(--c-text); }
.skel { display: flex; flex-direction: column; gap: 16px; padding: 8px 0; }
.skrow { display: grid; grid-template-columns: 96px 1fr; gap: 16px; align-items: center; }
.sk { display: block; height: 14px; border-radius: 7px; margin: 8px 0; background: linear-gradient(90deg, #eef1f3 25%, #f7f9fa 50%, #eef1f3 75%);
  background-size: 200% 100%; animation: sh 1.2s linear infinite; }
.sk.sq { width: 96px; height: 96px; border-radius: 12px; margin: 0; }
@keyframes sh { to { background-position: -200% 0; } }

/* десктоп: товары и «Вам может понравиться» слева, итог справа (закреплён при прокрутке) */
@media (min-width: 1024px) {
  .top { margin: 24px 0 16px; }
  .top h1 { font-size: 2.25rem; line-height: 2.5rem; }
  .ship { max-width: calc(100% - 360px - 48px); }
  .grid { grid-template-columns: minmax(0, 1fr) 360px; gap: 48px; align-items: start; }
  .line { grid-template-columns: 136px 1fr; gap: 24px; padding: 24px 0; }
  .thumb { width: 136px; height: 136px; }
  .sum { position: sticky; top: calc(var(--ru-sticky-top, 0px) + 24px); }
  .cta { min-height: 56px; }
  .ghostBtn { min-height: 56px; }
  .qty { gap: 8px; padding: 4px; }
  .qty button { width: 32px; height: 32px; }
}
`;
