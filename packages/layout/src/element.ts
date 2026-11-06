/**
 * <cc-layout> — общий Layout продукта: шапка и нижнее меню с кнопкой корзины и бейджем. Сама корзина — отдельное
 * приложение (<cc-cart>, пакет @coral/cart) на своей странице: кнопка ведёт туда (links.cart).
 *
 * Атрибуты:
 *   active       текущий раздел (подсвечивается): home | catalog | fav | me
 *   parts        что рисовать: без атрибута "header tabbar"; "tabbar"; "header"; "" (ничего)
 *   header       вид шапки: "center" (по умолчанию: слово-логотип по центру, значки на десктопе) | "bar" (меню и
 *                логотип слева, слоты и корзина справа, как в «Друге клуба»)
 *   tabs         разделы нижнего меню и значков шапки, по порядку: по умолчанию "home catalog cart fav me"
 *   links        JSON с адресами: {"home","catalog","cart","fav","me"}
 *   labels       JSON с подписями поверх языка: {"home","catalog","cart","fav","me"}
 *   locale       язык подписей: ru (по умолчанию) | en
 *   cart         чей бейдж: member (корзина участника в API кабинета, по умолчанию) | local (гостевая в браузере)
 *   cart-key     ключ гостевой корзины в localStorage (по умолчанию coralclub.cart)
 *   reveal-after id элемента: нижнее меню появляется, когда страница до него докрутилась
 *
 * Слоты (разметка сервиса со своими стилями): menu, brand, actions — в шапке.
 * Хранилище корзины общее с приложением корзины (@coral/cart/store), бейдж обновляется сам.
 * Внутрь: window.coralLayout.cart.open() — перейти на страницу корзины; .count(), .refresh(), .add(…).
 */
import { LOGIN_URL } from "@coral/api";
import { getStore } from "@coral/cart/store";
import { ICON } from "./icons";
import { CSS, PAGE_CSS } from "./styles";

export type Links = { home: string; catalog: string; cart: string; fav: string; me: string };
type TabKey = "home" | "catalog" | "cart" | "fav" | "me";
const cart = getStore();

/** По умолчанию разделы ведут в кабинет (там сейчас магазин участника). */
const LK = LOGIN_URL;
export const DEFAULT_LINKS: Links = { home: `${LK}#/`, catalog: `${LK}#/catalog`, cart: `${LK}#/cart`, fav: `${LK}#/fav`, me: `${LK}#/me` };

const TEXT = {
  ru: { home: "Главная", catalog: "Каталог", cart: "Корзина", fav: "Избранное", me: "Профиль", menu: "Разделы", cartCount: (n: number) => `Корзина, товаров: ${n}` },
  en: { home: "Home", catalog: "Catalog", cart: "Cart", fav: "Favorites", me: "Account", menu: "Primary", cartCount: (n: number) => (n ? `Cart, ${n} items` : "Cart") },
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
  static observedAttributes = ["active", "parts", "links", "labels", "locale", "tabs", "header"];
  private root: ShadowRoot;
  private stop: (() => void) | null = null;
  private revealed = true;
  private observer: IntersectionObserver | null = null;

  constructor() {
    super();
    this.root = this.attachShadow({ mode: "open" });
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

  private render() {
    const L = this.links;
    const T = this.text;
    const active = this.getAttribute("active") || "";
    const n = cart.count();
    const badge = n ? `<em class="badge">${n > 99 ? "99+" : n}</em>` : "";
    // корзина — отдельная страница (приложение корзины): кнопка просто ведёт туда
    const cartBtn = (cls: string, inner: string) =>
      `<a class="${cls}${active === "cart" ? " on" : ""}" href="${esc(L.cart)}" aria-label="${esc(T.cartCount(n))}"${active === "cart" ? ' aria-current="page"' : ""}>${inner}</a>`;
    const icon = { home: ICON.home, catalog: ICON.catalog, cart: ICON.bag, fav: ICON.heart, me: ICON.user };
    const tab = (key: TabKey) =>
      key === "cart"
        ? cartBtn("tab", `${ICON.bag}<span>${esc(T.cart)}</span>${badge}`)
        : `<a class="tab${active === key ? " on" : ""}" href="${esc(L[key])}"${active === key ? ' aria-current="page"' : ""}>${icon[key]}<span>${esc(T[key])}</span></a>`;
    const desk = (key: TabKey) =>
      key === "cart" ? cartBtn("icon", `${ICON.bag}${badge}`) : `<a class="icon" href="${esc(L[key])}" aria-label="${esc(T[key])}">${icon[key]}</a>`;
    const { header, tabbar } = this.parts;
    const variant = this.getAttribute("header") === "bar" ? "bar" : "center";
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
      ${tabbar ? `<nav class="tabbar${this.revealed ? "" : " hide"}" aria-label="${esc(T.menu)}">${this.tabs.map(tab).join("")}</nav>` : ""}`;
  }
}

/** Страница корзины первого Layout на странице (для window.coralLayout.cart.open и openCart() магазина). */
export function cartPage(): string {
  const el = document.querySelector<CcLayout>("cc-layout");
  return el?.links.cart ?? DEFAULT_LINKS.cart;
}
