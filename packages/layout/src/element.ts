/**
 * <cc-layout> — общий Layout продукта: шапка, нижнее меню и корзина.
 *
 * Атрибуты:
 *   active  — текущий раздел: home | catalog | fav | me (подсвечивается в меню)
 *   parts   — что рисовать: "header tabbar" (без атрибута) | "tabbar" | "header" | "" (ничего, корзина остаётся)
 *   links   — JSON с адресами разделов, перекрывает значения по умолчанию:
 *             {"home","catalog","fav","me","checkout","login"}
 * События наружу (window): cc:cart:changed {count, lines}.
 * Вызовы внутрь: window.coralLayout.cart.add(code, qty) / .open() / .close() / .count() / .refresh()
 */
import { LOGIN_URL, money, type BasketLine } from "@coral/api";
import * as cart from "./cart";
import { ICON } from "./icons";
import { CSS, PAGE_CSS } from "./styles";

export type Links = { home: string; catalog: string; fav: string; me: string; checkout: string; login: string };

/** По умолчанию разделы ведут в кабинет (там сейчас магазин участника), оформление: /lk/checkout магазина. */
const LK = LOGIN_URL;
export const DEFAULT_LINKS: Links = {
  home: `${LK}#/`,
  catalog: `${LK}#/catalog`,
  fav: `${LK}#/fav`,
  me: `${LK}#/me`,
  checkout: `${LK}#/checkout`,
  login: LK,
};

const esc = (s: unknown) => String(s ?? "").replace(/[&<>"']/g, (c) => `&#${c.charCodeAt(0)};`);
const lineSum = (l: BasketLine, key: "club" | "retail") => (l.product?.[key] ?? 0) * l.qty;
const currencyOf = (lines: BasketLine[]) => lines.find((l) => l.product)?.product?.currency ?? "RUB";

export class CcLayout extends HTMLElement {
  static observedAttributes = ["active", "parts", "links"];
  private root: ShadowRoot;
  private stop: (() => void) | null = null;

  constructor() {
    super();
    this.root = this.attachShadow({ mode: "open" });
    this.root.addEventListener("click", (e) => this.onClick(e));
  }

  get links(): Links {
    try {
      return { ...DEFAULT_LINKS, ...JSON.parse(this.getAttribute("links") || "{}") };
    } catch {
      return DEFAULT_LINKS;
    }
  }
  private get parts() {
    // нет атрибута: всё; пустой атрибут: ничего (внутренние страницы сервиса прячут меню)
    const p = (this.hasAttribute("parts") ? this.getAttribute("parts") ?? "" : "header tabbar").split(/\s+/);
    return { header: p.includes("header"), tabbar: p.includes("tabbar") };
  }

  connectedCallback() {
    if (!document.getElementById("cc-layout-page")) {
      const st = document.createElement("style");
      st.id = "cc-layout-page";
      st.textContent = PAGE_CSS;
      document.head.appendChild(st);
    }
    document.documentElement.classList.toggle("cc-has-tabbar", this.parts.tabbar);
    this.stop = cart.subscribe(() => this.render());
    cart.start();
  }
  disconnectedCallback() {
    this.stop?.();
    document.documentElement.classList.remove("cc-has-tabbar");
    document.body.style.overflow = "";
  }
  attributeChangedCallback() {
    if (this.isConnected) {
      document.documentElement.classList.toggle("cc-has-tabbar", this.parts.tabbar);
      this.render();
    }
  }

  private onClick(e: Event) {
    const el = (e.target as Element).closest<HTMLElement>("[data-act]");
    if (!el) return;
    const code = Number(el.dataset.code);
    const act = el.dataset.act;
    if (act === "cart") return cart.open();
    if (act === "close") return cart.close();
    if (act === "retry") return void cart.refresh();
    if (act === "inc") return void cart.setQty(code, (cart.cartState().lines.find((l) => l.code === code)?.qty ?? 0) + 1);
    if (act === "dec") return void cart.setQty(code, (cart.cartState().lines.find((l) => l.code === code)?.qty ?? 1) - 1);
    if (act === "checkout") {
      if (!cart.cartState().lines.length) return e.preventDefault();
      cart.close(); // ссылка ведёт дальше сама
    }
  }

  private render() {
    const s = cart.cartState();
    const L = this.links;
    const active = this.getAttribute("active") || "";
    const n = cart.count();
    const badge = n ? `<em class="badge">${n > 99 ? "99+" : n}</em>` : "";
    const tab = (key: keyof Links, icon: string, label: string) =>
      `<a class="tab${active === key ? " on" : ""}" href="${esc(L[key])}"${active === key ? ' aria-current="page"' : ""}>${icon}<span>${label}</span></a>`;
    const { header, tabbar } = this.parts;
    document.body.style.overflow = s.open ? "hidden" : "";
    this.root.innerHTML = `<style>${CSS}</style>
      ${header ? `<header class="head">
        <a class="brand" href="${esc(L.home)}">coralclub</a>
        <nav class="desk" aria-label="Разделы">
          <a class="icon" href="${esc(L.home)}" aria-label="Главная">${ICON.home}</a>
          <a class="icon" href="${esc(L.catalog)}" aria-label="Каталог">${ICON.catalog}</a>
          <button class="icon" type="button" data-act="cart" aria-label="Корзина, товаров: ${n}">${ICON.bag}${badge}</button>
          <a class="icon" href="${esc(L.fav)}" aria-label="Избранное">${ICON.heart}</a>
          <a class="icon" href="${esc(L.me)}" aria-label="Кабинет">${ICON.user}</a>
        </nav>
      </header>` : ""}
      ${tabbar ? `<nav class="tabbar" aria-label="Разделы">
        ${tab("home", ICON.home, "Главная")}
        ${tab("catalog", ICON.catalog, "Каталог")}
        <button class="tab" type="button" data-act="cart" aria-label="Корзина, товаров: ${n}">${ICON.bag}<span>Корзина</span>${badge}</button>
        ${tab("fav", ICON.heart, "Избранное")}
        ${tab("me", ICON.user, "Профиль")}
      </nav>` : ""}
      ${s.open ? this.drawer(s, L) : ""}`;
    if (s.open) (this.root.querySelector(".close") as HTMLElement | null)?.focus({ preventScroll: true });
  }

  private drawer(s: cart.CartState, L: Links) {
    const lines = s.lines;
    const cur = currencyOf(lines);
    const club = lines.reduce((sum, l) => sum + lineSum(l, "club"), 0);
    const retail = lines.reduce((sum, l) => sum + Math.max(lineSum(l, "retail"), lineSum(l, "club")), 0);
    const saving = retail - club;
    let body: string;
    if (s.status === "guest") {
      body = `<div class="empty"><p>Войдите в личный кабинет, чтобы видеть корзину и оформлять заказы.</p><a class="cta" style="padding:0 28px" href="${esc(L.login)}">Войти</a></div>`;
    } else if (s.status === "loading" && !lines.length) {
      body = `<div style="padding:16px 24px" role="status" aria-label="Загрузка"><i class="sk" style="width:80%"></i><i class="sk" style="width:60%"></i><i class="sk" style="width:70%"></i></div>`;
    } else if (s.status === "error" && !lines.length) {
      body = `<div class="empty"><p>Не удалось загрузить корзину.</p><button class="cta" style="padding:0 28px" type="button" data-act="retry">Повторить</button></div>`;
    } else if (!lines.length) {
      body = `<div class="empty"><p>Корзина пуста.</p></div>`;
    } else {
      body = `${saving > 0 ? `<p class="banner">Вы экономите ${esc(money(saving, cur))} на ценах участника</p>` : ""}
        <ul class="lines${s.busy ? " busy" : ""}">${lines.map((l) => this.line(l)).join("")}</ul>`;
    }
    const foot = s.status === "guest" ? "" : `<footer class="foot">
        <dl class="rows">
          ${saving > 0 ? `<div class="disc"><dt>Скидка участника</dt><dd>−${esc(money(saving, cur))}</dd></div>` : ""}
          <div class="total"><dt>Итого по ценам участника</dt><dd>${esc(money(club, cur))}</dd></div>
        </dl>
        <a class="cta" href="${esc(L.checkout)}" data-act="checkout"${lines.length ? "" : ' aria-disabled="true"'}>Оформить заказ</a>
      </footer>`;
    return `<div class="drawer" role="dialog" aria-modal="true" aria-label="Корзина">
      <div class="scrim" data-act="close"></div>
      <aside class="panel">
        <header class="dhead"><span class="title">Ваша корзина</span><button class="close" type="button" data-act="close" aria-label="Закрыть">${ICON.close}</button></header>
        <div class="body">${body}</div>
        ${foot}
      </aside>
    </div>`;
  }

  private line(l: BasketLine) {
    const p = l.product;
    const name = p?.name ?? `Артикул ${l.code}`;
    const cur = p?.currency ?? "RUB";
    const was = p?.retail && p.club !== null && p.retail > p.club ? p.retail : 0;
    const price = p?.club != null
      ? `<span class="price"><b>${esc(money(p.club, cur))}</b>${was ? `<span class="was">${esc(money(was, cur))}</span><span class="save">Экономия ${esc(money((was - p.club) * l.qty, cur))}</span>` : ""}</span>`
      : `<span class="price">Цена при оформлении</span>`;
    return `<li class="line">
      <span class="thumb">${p?.image ? `<img src="${esc(p.image)}" alt="" loading="lazy">` : ""}</span>
      <div class="lbody">
        <span class="lname">${esc(name)}</span>
        ${price}
        <div class="qty">
          <button type="button" data-act="dec" data-code="${l.code}" aria-label="${l.qty <= 1 ? "Удалить" : `Уменьшить: ${esc(name)}`}">${l.qty <= 1 ? ICON.trash : ICON.minus}</button>
          <span aria-live="polite">${l.qty}</span>
          <button type="button" data-act="inc" data-code="${l.code}" aria-label="Добавить: ${esc(name)}">${ICON.plus}</button>
        </div>
      </div>
    </li>`;
  }
}

/** Escape закрывает корзину. */
export function listenKeys(): void {
  window.addEventListener("keydown", (e) => e.key === "Escape" && cart.cartState().open && cart.close());
}
