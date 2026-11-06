/** Иконки корзины: те же, что в магазине (cart/icons.tsx). */
const svg = (body: string) => `<svg viewBox="0 0 24 24" fill="none" aria-hidden="true">${body}</svg>`;
const s = 'stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"';
export const ICON = {
  bag: svg(`<path d="M4 5h2.2l1.9 9.6a2 2 0 0 0 2 1.6h7a2 2 0 0 0 2-1.6L21 8.5H6.6" ${s}/><circle cx="10" cy="20" r="1.4" fill="currentColor"/><circle cx="17" cy="20" r="1.4" fill="currentColor"/>`),
  minus: svg(`<path d="M5 12h14" ${s}/>`),
  plus: svg(`<path d="M12 5v14M5 12h14" ${s}/>`),
  trash: svg(`<path d="M4 7h16M10 11v6M14 11v6M6 7l1 12a2 2 0 0 0 2 2h6a2 2 0 0 0 2-2l1-12M9 7V4h6v3" ${s}/>`),
};
