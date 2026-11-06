/**
 * <cc-cart> — приложение корзины: отдельная страница (не шторка), отдельно от оформления заказа.
 * Сервис ставит элемент на свою страницу корзины и подключает cart.js по адресу.
 *
 * Атрибуты:
 *   cart         источник: member (корзина участника в API кабинета, по умолчанию) | local (гостевая в браузере)
 *   cart-key     ключ гостевой корзины в localStorage (по умолчанию coralclub.cart)
 *   links        JSON: {"checkout","shop","login"} — оформление, «продолжить покупки», вход
 *   labels       JSON с подписями поверх языка
 *   locale       ru (по умолчанию) | en
 *   currency, money-locale  как писать суммы гостевой корзины (по умолчанию RUB, ru-RU)
 *
 * Слоты (разметка сервиса со своими стилями): cart-banner (над строками), cart-extra (под строками, например
 * «Вам может понравиться»), cart-summary (вместо строк итога), cart-note (над кнопкой оформления).
 * Свойства: linePrice(raw) → {now, was, save, note} — цена строки по правилам сервиса; imageUrl(src) → адрес картинки.
 *
 * События: cc:cart:checkout {lines} на элементе — отменяемое (preventDefault: переход делает сервис, иначе
 * links.checkout); cc:cart:changed на window — от хранилища при каждом изменении.
 */
import { getStore, type CartState, type RawLine, type ViewLine } from "./shared";
import { ICON } from "./icons";
import { CSS } from "./styles";

export type LinePrice = { now?: string; was?: string; save?: string; note?: string };
export type CartLinks = { checkout: string; shop: string; login: string };

const plural = (n: number, one: string, few: string, many: string) => {
  const m10 = n % 10;
  const m100 = n % 100;
  return m10 === 1 && m100 !== 11 ? one : m10 >= 2 && m10 <= 4 && (m100 < 12 || m100 > 14) ? few : many;
};

const TEXT = {
  ru: {
    title: "Корзина", items: (n: number) => `${n} ${plural(n, "товар", "товара", "товаров")}`, empty: "В корзине пока пусто.",
    shop: "Перейти в каталог", checkout: "Оформить заказ", subtotal: "Итого по ценам участника", discount: "Скидка участника",
    saving: (s: string) => `Вы экономите ${s} на ценах участника`, save: (s: string) => `Экономия ${s}`,
    guest: "Войдите в личный кабинет, чтобы видеть корзину и оформлять заказы.", signIn: "Войти", error: "Не удалось загрузить корзину.",
    retry: "Повторить", priceLater: "Цена при оформлении", remove: "Удалить", dec: (n: string) => `Уменьшить: ${n}`, inc: (n: string) => `Добавить: ${n}`,
    loading: "Загрузка", summary: "Ваш заказ", next: "Доставку и оплату выберете на следующем шаге.",
  },
  en: {
    title: "Cart", items: (n: number) => `${n} ${n === 1 ? "item" : "items"}`, empty: "Your cart is empty.",
    shop: "Continue shopping", checkout: "Checkout", subtotal: "Subtotal", discount: "Member discount",
    saving: (s: string) => `You’re saving ${s} with member prices`, save: (s: string) => `${s} savings`,
    guest: "Sign in to see your cart.", signIn: "Sign in", error: "Could not load the cart.",
    retry: "Try again", priceLater: "Price at checkout", remove: "Remove", dec: (n: string) => `Decrease ${n}`, inc: (n: string) => `Increase ${n}`,
    loading: "Loading", summary: "Your order", next: "Delivery and payment come at the next step.",
  },
};
type Text = (typeof TEXT)["ru"];

const esc = (s: unknown) => String(s ?? "").replace(/[&<>"']/g, (c) => `&#${c.charCodeAt(0)};`);
const json = <T,>(raw: string | null, fallback: T): T => {
  try {
    return raw ? { ...fallback, ...JSON.parse(raw) } : fallback;
  } catch {
    return fallback;
  }
};

export class CcCart extends HTMLElement {
  static observedAttributes = ["links", "labels", "locale", "currency", "money-locale"];
  private root: ShadowRoot;
  private stop: (() => void) | null = null;
  private priceFn: ((raw: RawLine) => LinePrice | null) | null = null;
  private imageFn: ((src: string) => string) | null = null;
  private store = getStore();

  constructor() {
    super();
    this.root = this.attachShadow({ mode: "open" });
    this.root.addEventListener("click", (e) => this.onClick(e));
  }

  /** Цена строки по правилам сервиса (например, «Друг клуба» считает цену участника по стране). */
  set linePrice(fn: ((raw: RawLine) => LinePrice | null) | null) {
    this.priceFn = typeof fn === "function" ? fn : null;
    if (this.isConnected) this.render();
  }
  get linePrice() {
    return this.priceFn;
  }
  /** Адрес картинки строки (basePath сервиса, CDN картинок). */
  set imageUrl(fn: ((src: string) => string) | null) {
    this.imageFn = typeof fn === "function" ? fn : null;
    if (this.isConnected) this.render();
  }
  get imageUrl() {
    return this.imageFn;
  }

  /** Адреса из атрибута links (не свойство links: React 19 присваивает атрибуты веб-компонента как свойства). */
  get linkMap(): CartLinks {
    return json(this.getAttribute("links"), { checkout: "", shop: "", login: "" });
  }
  private get labelSet(): Text {
    return json(this.getAttribute("labels"), (this.getAttribute("locale") === "en" ? TEXT.en : TEXT.ru) as Text);
  }
  private money(n: number): string {
    const cur = this.getAttribute("currency") || this.store.cartState().lines.find((l) => l.currency)?.currency || "RUB";
    return new Intl.NumberFormat(this.getAttribute("money-locale") || (this.getAttribute("locale") === "en" ? "en-US" : "ru-RU"), { style: "currency", currency: cur }).format(n);
  }

  connectedCallback() {
    this.stop = this.store.subscribe(() => this.render());
    this.store.start(this.getAttribute("cart") === "local" ? { kind: "local", key: this.getAttribute("cart-key") || "coralclub.cart" } : { kind: "member" });
    window.dispatchEvent(new Event("coralclub:cart:view")); // аналитика магазина: «view_cart»
    void this.store.refresh();
  }
  disconnectedCallback() {
    this.stop?.();
  }
  attributeChangedCallback() {
    if (this.isConnected) this.render();
  }

  private onClick(e: Event) {
    const el = (e.target as Element).closest<HTMLElement>("[data-act]");
    if (!el) return;
    const id = el.dataset.id ?? "";
    const qty = this.store.cartState().lines.find((l) => l.id === id)?.qty ?? 0;
    const act = el.dataset.act;
    if (act === "retry") return void this.store.refresh();
    if (act === "inc") return void this.store.setQty(id, qty + 1);
    if (act === "dec") return void this.store.setQty(id, qty - 1);
    if (act === "remove") return void this.store.remove(id);
    if (act === "checkout") {
      const lines = this.store.cartState().lines;
      if (!lines.length) return;
      const ev = new CustomEvent("cc:cart:checkout", { detail: { lines: lines.map((l) => l.raw) }, cancelable: true, bubbles: true, composed: true });
      if (this.dispatchEvent(ev) && this.linkMap.checkout) window.location.assign(this.linkMap.checkout);
    }
  }

  private render() {
    const s: CartState = this.store.cartState();
    const T = this.labelSet;
    const L = this.linkMap;
    const lines = s.lines;
    const n = this.store.count();
    const sum = lines.reduce((t, l) => t + (l.now ?? 0) * l.qty, 0);
    const saving = lines.reduce((t, l) => t + (l.was !== null && l.now !== null ? (l.was - l.now) * l.qty : 0), 0);
    const shopLink = L.shop ? `<a class="ghost" href="${esc(L.shop)}">${esc(T.shop)}</a>` : "";
    let main: string;
    if (s.status === "guest") {
      main = `<div class="empty"><p>${esc(T.guest)}</p>${L.login ? `<a class="cta wide" href="${esc(L.login)}">${esc(T.signIn)}</a>` : ""}</div>`;
    } else if (s.status === "loading" && !lines.length) {
      main = `<div class="skel" role="status" aria-label="${esc(T.loading)}">${Array.from({ length: 3 }, () => `<div class="skrow"><i class="sk sq"></i><span><i class="sk" style="width:70%"></i><i class="sk" style="width:40%"></i></span></div>`).join("")}</div>`;
    } else if (s.status === "error" && !lines.length) {
      main = `<div class="empty"><p>${esc(T.error)}</p><button class="cta wide" type="button" data-act="retry">${esc(T.retry)}</button></div>`;
    } else if (!lines.length) {
      main = `<div class="empty">${ICON.bag}<p>${esc(T.empty)}</p>${shopLink}</div>`;
    } else {
      main = `<slot name="cart-banner">${saving > 0 ? `<p class="banner">${esc(T.saving(this.money(saving)))}</p>` : ""}</slot>
        <div class="grid">
          <ul class="lines${s.busy ? " busy" : ""}">${lines.map((l) => this.line(l, T)).join("")}</ul>
          <aside class="sum" aria-label="${esc(T.summary)}">
            <h2 class="sumTitle">${esc(T.summary)}</h2>
            <slot name="cart-summary"><dl class="rows">
              ${saving > 0 ? `<div class="disc"><dt>${esc(T.discount)}</dt><dd>−${esc(this.money(saving))}</dd></div>` : ""}
              <div class="total"><dt>${esc(T.subtotal)}</dt><dd>${esc(this.money(sum))}</dd></div>
            </dl></slot>
            <slot name="cart-note"><p class="note">${esc(T.next)}</p></slot>
            <div class="bar">
              <span class="barSum">${esc(this.money(sum))}</span>
              <button class="cta" type="button" data-act="checkout">${esc(T.checkout)}</button>
            </div>
            ${shopLink}
          </aside>
        </div>
        <slot name="cart-extra"></slot>`;
    }
    this.root.innerHTML = `<style>${CSS}</style>
      <section class="page">
        <header class="top"><h1>${esc(T.title)}</h1>${lines.length ? `<span class="count">${esc(T.items(n))}</span>` : ""}</header>
        ${main}
      </section>`;
  }

  private line(l: ViewLine, T: Text) {
    const own = this.priceFn?.(l.raw) ?? null;
    const now = own?.now ?? l.nowText;
    const was = own ? own.was ?? "" : l.was !== null ? l.wasText : "";
    const save = own ? own.save ?? "" : l.was !== null && l.now !== null ? T.save(this.money((l.was - l.now) * l.qty)) : "";
    const price = own?.note
      ? `<span class="price muted">${esc(own.note)}</span>`
      : now
        ? `<span class="price"><b>${esc(now)}</b>${was ? `<span class="was">${esc(was)}</span>` : ""}${save ? `<span class="save">${esc(save)}</span>` : ""}</span>`
        : `<span class="price muted">${esc(T.priceLater)}</span>`;
    const img = l.image ? `<img src="${esc(this.imageFn ? this.imageFn(l.image) : l.image)}" alt="" loading="lazy">` : "";
    return `<li class="line">
      <span class="thumb">${img}</span>
      <div class="lbody">
        <span class="lname">${esc(l.name)}</span>
        ${price}
        <div class="lfoot">
          <div class="qty">
            <button type="button" data-act="dec" data-id="${esc(l.id)}" aria-label="${esc(l.qty <= 1 ? T.remove : T.dec(l.name))}">${l.qty <= 1 ? ICON.trash : ICON.minus}</button>
            <span aria-live="polite">${l.qty}</span>
            <button type="button" data-act="inc" data-id="${esc(l.id)}" aria-label="${esc(T.inc(l.name))}">${ICON.plus}</button>
          </div>
          <button class="remove" type="button" data-act="remove" data-id="${esc(l.id)}">${esc(T.remove)}</button>
        </div>
      </div>
    </li>`;
  }
}
