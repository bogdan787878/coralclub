/** Иконки меню и корзины: те же, что в магазине (navIcons.tsx, cart/icons.tsx). */
const svg = (body: string) => `<svg viewBox="0 0 24 24" fill="none" aria-hidden="true">${body}</svg>`;
const s = 'stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"';
export const ICON = {
  home: svg(`<path d="M4 11.5L12 4l8 7.5" ${s}/><path d="M6 10v9a1 1 0 0 0 1 1h3v-5.5h4V20h3a1 1 0 0 0 1-1v-9" ${s}/>`),
  catalog: svg(["3.5,3.5", "13.5,3.5", "3.5,13.5", "13.5,13.5"].map((p) => { const [x, y] = p.split(","); return `<rect x="${x}" y="${y}" width="7" height="7" rx="1.8" stroke="currentColor" stroke-width="1.7"/>`; }).join("")),
  bag: svg(`<path d="M4 5h2.2l1.9 9.6a2 2 0 0 0 2 1.6h7a2 2 0 0 0 2-1.6L21 8.5H6.6" ${s}/><circle cx="10" cy="20" r="1.4" fill="currentColor"/><circle cx="17" cy="20" r="1.4" fill="currentColor"/>`),
  /** корзина в шапке «Друга клуба» */
  cart: svg(`<path d="M3 4h2.4l2 10.2h9.8l2-7.7H6.6M9.5 19.2h.01M16.5 19.2h.01" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/>`),
  heart: svg(`<path d="M12 20s-7-4.4-7-10a4 4 0 0 1 7-2.6A4 4 0 0 1 19 10c0 5.6-7 10-7 10z" ${s}/>`),
  user: svg(`<circle cx="12" cy="8" r="3.5" stroke="currentColor" stroke-width="1.7"/><path d="M4.5 20c1.5-4 4.5-6 7.5-6s6 2 7.5 6" ${s}/>`),
  close: svg(`<path d="M6 6l12 12M18 6L6 18" ${s}/>`),
  minus: svg(`<path d="M5 12h14" ${s}/>`),
  plus: svg(`<path d="M12 5v14M5 12h14" ${s}/>`),
  trash: svg(`<path d="M4 7h16M10 11v6M14 11v6M6 7l1 12a2 2 0 0 0 2 2h6a2 2 0 0 0 2-2l1-12M9 7V4h6v3" ${s}/>`),
};
