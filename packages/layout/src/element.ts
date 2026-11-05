/**
 * <cc-layout> — общий Layout продукта: шапка, нижнее меню и корзина.
 *
 * Атрибуты:
 *   active       текущий раздел (подсвечивается): home | catalog | fav | me
 *   parts        что рисовать: без атрибута "header tabbar"; "tabbar"; "header"; "" (ничего, корзина остаётся)
 *   header       вид шапки: "center" (по умолчанию: слово-логотип по центру, значки на десктопе) | "bar" (меню и
 *                логотип слева, слоты и корзина справа, как в «Друге клуба»)
 *   tabs         разделы нижнего меню и значков шапки, по порядку: по умолчанию "home catalog cart fav me"
 *   links        JSON с адресами: {"home","catalog","fav","me","checkout","login"}
 *   labels       JSON с подписями поверх языка: {"home","catalog","cart","fav","me","title","empty","checkout","subtotal",…}
 *   locale       язык подписей: ru (по умолчанию) | en
 *   cart         источник корзины: member (корзина участника в API кабинета, по умолчанию) | local (гостевая в браузере)
 *   cart-key     ключ гостевой корзины в localStorage (по умолчанию coralclub.cart)
 *   currency, money-locale  как писать итог гостевой корзины (по умолчанию RUB, ru-RU)
 *   cart-href    кнопка корзины становится ссылкой (например, на странице оформления)
 *   reveal-after id элемента: нижнее меню появляется, когда страница до него докрутилась
 *
 * Слоты (разметка сервиса со своими стилями): menu, brand, actions — в шапке; cart-banner, cart-extra,
 * cart-summary, cart-note — в корзине. Свойства: linePrice(raw) → {now, was, save, note} — цена строки по правилам
 * сервиса; imageUrl(src) → адрес картинки строки (basePath, CDN).
 *
 * Наружу (window): cc:cart:changed {count, lines, source}. На элементе: cc:cart:checkout {lines} — отменяемое; если
 * сервис вызвал preventDefault(), переход делает он сам, иначе Layout ведёт на links.checkout.
 * Внутрь: window.coralLayout.cart.add(…) / .open() / .close() / .count() / .refresh()
 */
import { LOGIN_URL } from "@coral/api";
import * as cart from "./cart";
import { ICON } from "./icons";
import { CSS, PAGE_CSS } from "./styles";

export type Links = { home: string; catalog: string; fav: string; me: string; checkout: string; login: string };
type TabKey = "home" | "catalog" | "cart" | "fav" | "me";
export type LinePrice = { now?: string; was?: string; save?: string; note?: string };

/** По умолчанию разделы ведут в кабинет (там сейчас магазин участника). */
const LK = LOGIN_URL;
export const DEFAULT_LINKS: Links = { home: `${LK}#/`, catalog: `${LK}#/catalog`, fav: `${LK}#/fav`, me: `${LK}#/me`, checkout: `${LK}#/checkout`, login: LK };

const TEXT = {
  ru: {
    home: "Главная", catalog: "Каталог", cart: "Корзина", fav: "Избранное", me: "Профиль", menu: "Разделы",
    title: "Ваша корзина", close: "Закрыть", empty: "Корзина пуста.", checkout: "Оформить заказ", subtotal: "Итого по ценам участника",
    discount: "Скидка участника", saving: (s: string) => `Вы экономите ${s} на ценах участника`, save: (s: string) => `Экономия ${s}`,
    guest: "Войдите в личный кабинет, чтобы видеть корзину и оформлять заказы.", signIn: "Войти", error: "Не удалось загрузить корзину.",
    retry: "Повторить", priceLater: "Цена при оформлении", remove: "Удалить", dec: (n: string) => `Уменьшить: ${n}`, inc: (n: string) => `Добавить: ${n}`,
    cartCount: (n: number) => `Корзина, товаров: ${n}`, loading: "Загрузка",
  },
  en: {
    home: "Home", catalog: "Catalog", cart: "Cart", fav: "Favorites", me: "Account", menu: "Primary",
    title: "Your cart", close: "Close", empty: "Your cart is empty.", checkout: "Checkout", subtotal: "Subtotal",
    discount: "Member discount", saving: (s: string) => `You’re saving ${s} with member prices`, save: (s: string) => `${s} savings`,
    guest: "Sign in to see your cart.", signIn: "Sign in", error: "Could not load the cart.",
    retry: "Try again", priceLater: "Price at checkout", remove: "Remove", dec: (n: string) => `Decrease ${n}`, inc: (n: string) => `Increase ${n}`,
    cartCount: (n: number) => (n ? `Cart, ${n} items` : "Cart"), loading: "Loading",
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

export class CcLayout extends HTMLElement {
  static observedAttributes = ["active", "parts", "links", "labels", "locale", "tabs", "header", "cart-href", "currency", "money-locale"];
  private root: ShadowRoot;
  private stop: (() => void) | null = null;
  private revealed = true;
  private observer: IntersectionObserver | null = null;
  private priceFn: ((raw: cart.RawLine) => LinePrice | null) | null = null;
  private imageFn: ((src: string) => string) | null = null;

  constructor() {
    super();
    this.root = this.attachShadow({ mode: "open" });
    this.root.addEventListener("click", (e) => this.onClick(e));
  }

  /** Цена строки по правилам сервиса (например, «Друг клуба» считает цену участника по стране). */
  set linePrice(fn: ((raw: cart.RawLine) => LinePrice | null) | null) {
    this.priceFn = typeof fn === "function" ? fn : null;
    if (this.isConnected) this.render();
  }
  get linePrice() {
    return this.priceFn;
  }

  /** Адрес картинки строки (например, корень сайта с basePath или CDN картинок сервиса). */
  set imageUrl(fn: ((src: string) => string) | null) {
    this.imageFn = typeof fn === "function" ? fn : null;
    if (this.isConnected) this.render();
  }
  get imageUrl() {
    return this.imageFn;
  }

  get links(): Links {
    return json(this.getAttribute("links"), DEFAULT_LINKS);
  }
  private get text(): Text {
    const base = this.getAttribute("locale") === "en" ? TEXT.en : TEXT.ru;
    return json(this.getAttribute("labels"), base as Text);
  }
  private get parts() {
    // нет атрибута: всё; пустой атрибут: ничего (внутренние страницы сервиса прячут меню)
    const p = (this.hasAttribute("parts") ? this.getAttribute("parts") ?? "" : "header tabbar").split(/\s+/);
    return { header: p.includes("header"), tabbar: p.includes("tabbar") };
  }
  private get tabs(): TabKey[] {
    const list = (this.getAttribute("tabs") || "home catalog cart fav me").split(/\s+/);
    return list.filter((t): t is TabKey => ["home", "catalog", "cart", "fav", "me"].includes(t));
  }
  private money(n: number): string {
    const cur = this.getAttribute("currency") || cart.cartState().lines.find((l) => l.currency)?.currency || "RUB";
    return new Intl.NumberFormat(this.getAttribute("money-locale") || (this.getAttribute("locale") === "en" ? "en-US" : "ru-RU"), { style: "currency", currency: cur }).format(n);
  }

  connectedCallback() {
    if (!document.getElementById("cc-layout-page")) {
      const st = document.createElement("style");
      st.id = "cc-layout-page";
      st.textContent = PAGE_CSS;
      document.head.appendChild(st);
    }
    this.syncPageClass();
    this.watchReveal();
    this.stop = cart.subscribe(() => this.render());
    cart.start(this.getAttribute("cart") === "local" ? { kind: "local", key: this.getAttribute("cart-key") || "coralclub.cart" } : { kind: "member" });
  }
  disconnectedCallback() {
    this.stop?.();
    this.observer?.disconnect();
    document.documentElement.classList.remove("cc-has-tabbar");
    document.body.style.overflow = "";
  }
  attributeChangedCallback() {
    if (!this.isConnected) return;
    this.syncPageClass();
    this.render();
  }
  private syncPageClass() {
    document.documentElement.classList.toggle("cc-has-tabbar", this.parts.tabbar);
  }

  /** reveal-after: меню появляется, когда якорь дошёл до верхней части экрана или уже прокручен. */
  private watchReveal() {
    const id = this.getAttribute("reveal-after");
    const el = id ? document.getElementById(id) : null;
    if (!el || typeof IntersectionObserver === "undefined") return;
    this.revealed = false;
    this.observer = new IntersectionObserver(
      ([entry]) => {
        const next = entry.isIntersecting || entry.boundingClientRect.top < 0;
        if (next !== this.revealed) {
          this.revealed = next;
          this.render();
        }
      },
      { rootMargin: "0px 0px -85% 0px" },
    );
    this.observer.observe(el);
  }

  private onClick(e: Event) {
    const el = (e.target as Element).closest<HTMLElement>("[data-act]");
    if (!el) return;
    const id = el.dataset.id ?? "";
    const act = el.dataset.act;
    const qty = cart.cartState().lines.find((l) => l.id === id)?.qty ?? 0;
    if (act === "cart") return cart.open();
    if (act === "close") return cart.close();
    if (act === "retry") return void cart.refresh();
    if (act === "inc") return void cart.setQty(id, qty + 1);
    if (act === "dec") return void cart.setQty(id, qty - 1);
    if (act === "checkout") {
      const lines = cart.cartState().lines;
      if (!lines.length) return;
      const ev = new CustomEvent("cc:cart:checkout", { detail: { lines: lines.map((l) => l.raw) }, cancelable: true, bubbles: true, composed: true });
      const go = this.dispatchEvent(ev);
      cart.close();
      if (go && this.links.checkout) window.location.assign(this.links.checkout);
    }
  }

  private render() {
    const s = cart.cartState();
    const L = this.links;
    const T = this.text;
    const active = this.getAttribute("active") || "";
    const n = cart.count();
    const badge = n ? `<em class="badge">${n > 99 ? "99+" : n}</em>` : "";
    const cartHref = this.getAttribute("cart-href");
    const cartBtn = (cls: string, inner: string) =>
      cartHref
        ? `<a class="${cls}" href="${esc(cartHref)}" aria-label="${esc(T.cartCount(n))}">${inner}</a>`
        : `<button class="${cls}" type="button" data-act="cart" aria-label="${esc(T.cartCount(n))}">${inner}</button>`;
    const icon = { home: ICON.home, catalog: ICON.catalog, cart: ICON.bag, fav: ICON.heart, me: ICON.user };
    const tab = (key: TabKey) =>
      key === "cart"
        ? cartBtn("tab", `${ICON.bag}<span>${esc(T.cart)}</span>${badge}`)
        : `<a class="tab${active === key ? " on" : ""}" href="${esc(L[key])}"${active === key ? ' aria-current="page"' : ""}>${icon[key]}<span>${esc(T[key])}</span></a>`;
    const desk = (key: TabKey) =>
      key === "cart" ? cartBtn("icon", `${ICON.bag}${badge}`) : `<a class="icon" href="${esc(L[key])}" aria-label="${esc(T[key])}">${icon[key]}</a>`;
    const { header, tabbar } = this.parts;
    const variant = this.getAttribute("header") === "bar" ? "bar" : "center";
    document.body.style.overflow = s.open ? "hidden" : "";
    const head =
      variant === "bar"
        ? `<header class="head bar">
            <div class="side"><slot name="menu"></slot><a class="brand" href="${esc(L.home)}"><slot name="brand">coralclub</slot></a></div>
            <div class="side"><slot name="actions"></slot>${cartBtn("iconBtn", `${ICON.cart}${badge}`)}</div>
          </header>`
        : `<header class="head">
            <a class="brand" href="${esc(L.home)}"><slot name="brand">coralclub</slot></a>
            <nav class="desk" aria-label="${esc(T.menu)}"><slot name="actions"></slot>${this.tabs.map(desk).join("")}</nav>
          </header>`;
    this.root.innerHTML = `<style>${CSS}</style>
      ${header ? head : ""}
      ${tabbar ? `<nav class="tabbar${this.revealed ? "" : " hide"}" aria-label="${esc(T.menu)}">${this.tabs.map(tab).join("")}</nav>` : ""}
      ${s.open ? this.drawer(s, L, T) : ""}`;
    if (s.open) (this.root.querySelector(".close") as HTMLElement | null)?.focus({ preventScroll: true });
  }

  private drawer(s: cart.CartState, L: Links, T: Text) {
    const lines = s.lines;
    const sum = lines.reduce((t, l) => t + (l.now ?? 0) * l.qty, 0);
    const saving = lines.reduce((t, l) => t + (l.was !== null && l.now !== null ? (l.was - l.now) * l.qty : 0), 0);
    let body: string;
    if (s.status === "guest") {
      body = `<div class="empty"><p>${esc(T.guest)}</p><a class="cta wide" href="${esc(L.login)}">${esc(T.signIn)}</a></div>`;
    } else if (s.status === "loading" && !lines.length) {
      body = `<div class="skel" role="status" aria-label="${esc(T.loading)}"><i class="sk" style="width:80%"></i><i class="sk" style="width:60%"></i><i class="sk" style="width:70%"></i></div>`;
    } else if (s.status === "error" && !lines.length) {
      body = `<div class="empty"><p>${esc(T.error)}</p><button class="cta wide" type="button" data-act="retry">${esc(T.retry)}</button></div>`;
    } else if (!lines.length) {
      body = `<div class="empty"><p>${esc(T.empty)}</p></div>`;
    } else {
      body = `<slot name="cart-banner">${saving > 0 ? `<p class="banner">${esc(T.saving(this.money(saving)))}</p>` : ""}</slot>
        <ul class="lines${s.busy ? " busy" : ""}">${lines.map((l) => this.line(l, T)).join("")}</ul>
        <slot name="cart-extra"></slot>`;
    }
    const foot =
      s.status === "guest"
        ? ""
        : `<footer class="foot">
        <slot name="cart-summary"><dl class="rows">
          ${saving > 0 ? `<div class="disc"><dt>${esc(T.discount)}</dt><dd>−${esc(this.money(saving))}</dd></div>` : ""}
          <div class="total"><dt>${esc(T.subtotal)}</dt><dd>${esc(this.money(sum))}</dd></div>
        </dl></slot>
        <slot name="cart-note"></slot>
        <button class="cta" type="button" data-act="checkout"${lines.length ? "" : " disabled"}>${esc(T.checkout)}</button>
      </footer>`;
    return `<div class="drawer" role="dialog" aria-modal="true" aria-label="${esc(T.cart)}">
      <div class="scrim" data-act="close"></div>
      <aside class="panel">
        <header class="dhead"><span class="title">${esc(T.title)}</span><button class="close" type="button" data-act="close" aria-label="${esc(T.close)}">${ICON.close}</button></header>
        <div class="body">${body}</div>
        ${foot}
      </aside>
    </div>`;
  }

  private line(l: cart.ViewLine, T: Text) {
    const own = this.priceFn?.(l.raw) ?? null;
    const now = own?.now ?? l.nowText;
    const was = own ? own.was ?? "" : l.was !== null ? l.wasText : "";
    const save = own ? own.save ?? "" : l.was !== null && l.now !== null ? T.save(this.money((l.was - l.now) * l.qty)) : "";
    const price = own?.note
      ? `<span class="price muted">${esc(own.note)}</span>`
      : now
        ? `<span class="price"><b>${esc(now)}</b>${was ? `<span class="was">${esc(was)}</span>` : ""}${save ? `<span class="save">${esc(save)}</span>` : ""}</span>`
        : `<span class="price">${esc(T.priceLater)}</span>`;
    return `<li class="line">
      <span class="thumb">${l.image ? `<img src="${esc(this.imageFn ? this.imageFn(l.image) : l.image)}" alt="" loading="lazy">` : ""}</span>
      <div class="lbody">
        <span class="lname">${esc(l.name)}</span>
        ${price}
        <div class="qty">
          <button type="button" data-act="dec" data-id="${esc(l.id)}" aria-label="${esc(l.qty <= 1 ? T.remove : T.dec(l.name))}">${l.qty <= 1 ? ICON.trash : ICON.minus}</button>
          <span aria-live="polite">${l.qty}</span>
          <button type="button" data-act="inc" data-id="${esc(l.id)}" aria-label="${esc(T.inc(l.name))}">${ICON.plus}</button>
        </div>
      </div>
    </li>`;
  }
}

/** Escape закрывает корзину. */
export function listenKeys(): void {
  window.addEventListener("keydown", (e) => e.key === "Escape" && cart.cartState().open && cart.close());
}
