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
 *   free-from    порог бесплатной доставки (число в валюте корзины): полоска «ещё N до бесплатной доставки»
 *
 * Слоты (разметка сервиса со своими стилями): cart-banner (над строками), cart-extra (под строками, например
 * «Вам может понравиться»), cart-summary (вместо строк итога), cart-note (над кнопкой оформления).
 * Свойства: linePrice(raw) → {now, was, save, note} — цена строки по правилам сервиса; imageUrl(src) → адрес картинки;
 * lineSub(id) → подпись под названием строки (например, домен здоровья); shareLink(lines) → ссылка «Поделиться корзиной»
 * (задана — под «Оформить заказ» появляется кнопка: системное «Поделиться», иначе ссылка копируется).
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
    freeLeft: (s: string) => `Ещё ${s} до бесплатной доставки`, freeDone: "Доставка будет бесплатной", goods: (n: number) => `Товары (${n})`,
    total: "Итого", share: "Поделиться корзиной", copied: "Ссылка скопирована", shareTitle: "Корзина Coral Club",
  },
  en: {
    title: "Cart", items: (n: number) => `${n} ${n === 1 ? "item" : "items"}`, empty: "Your cart is empty.",
    shop: "Continue shopping", checkout: "Checkout", subtotal: "Subtotal", discount: "Member discount",
    saving: (s: string) => `You’re saving ${s} with member prices`, save: (s: string) => `${s} savings`,
    guest: "Sign in to see your cart.", signIn: "Sign in", error: "Could not load the cart.",
    retry: "Try again", priceLater: "Price at checkout", remove: "Remove", dec: (n: string) => `Decrease ${n}`, inc: (n: string) => `Increase ${n}`,
    loading: "Loading", summary: "Your order", next: "Delivery and payment come at the next step.",
    freeLeft: (s: string) => `Add ${s} more for free shipping`, freeDone: "You’ve unlocked free shipping", goods: (n: number) => `Items (${n})`,
    total: "Total", share: "Share cart", copied: "Link copied", shareTitle: "Coral Club cart",
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
  static observedAttributes = ["links", "labels", "locale", "currency", "money-locale", "free-from"];
  private root: ShadowRoot;
  private stop: (() => void) | null = null;
  private priceFn: ((raw: RawLine) => LinePrice | null) | null = null;
  private imageFn: ((src: string) => string) | null = null;
  private subFn: ((id: string) => string) | null = null;
  private shareFn: ((lines: { id: string; qty: number }[]) => Promise<string> | string) | null = null;
  private shareState: "" | "busy" | "copied" = "";
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
  /** Подпись под названием строки (по id строки — артикулу). */
  set lineSub(fn: ((id: string) => string) | null) {
    this.subFn = typeof fn === "function" ? fn : null;
    if (this.isConnected) this.render();
  }
  get lineSub() {
    return this.subFn;
  }
  /** Ссылка «Поделиться корзиной» по строкам (id — артикул, qty). */
  set shareLink(fn: ((lines: { id: string; qty: number }[]) => Promise<string> | string) | null) {
    this.shareFn = typeof fn === "function" ? fn : null;
    if (this.isConnected) this.render();
  }
  get shareLink() {
    return this.shareFn;
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
    // свойства, заданные до загрузки cart.js (страница успела раньше), лежат на самом элементе и прячут сеттеры:
    // забираем их и присваиваем заново
    for (const key of ["linePrice", "imageUrl", "lineSub", "shareLink"] as const) {
      if (Object.prototype.hasOwnProperty.call(this, key)) {
        const value = (this as unknown as Record<string, unknown>)[key];
        delete (this as unknown as Record<string, unknown>)[key];
        (this as unknown as Record<string, unknown>)[key] = value;
      }
    }
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
    if (act === "share") return void this.share();
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
      const free = Number(this.getAttribute("free-from")) || 0;
      const left = Math.max(0, free - sum);
      const ship = free
        ? `<div class="ship"><p>${esc(left > 0 ? T.freeLeft(this.money(left)) : T.freeDone)}</p><div class="track" role="progressbar" aria-valuemin="0" aria-valuemax="${free}" aria-valuenow="${Math.min(sum, free)}"><span style="width:${Math.min(100, (sum / free) * 100).toFixed(1)}%"></span></div></div>`
        : "";
      // итог — карточкой, как сводка заказа в оформлении: товары по обычным ценам, скидка участника, итого и кнопка
      main = `<slot name="cart-banner"></slot>${ship}
        <div class="grid">
          <div class="col">
            <ul class="lines${s.busy ? " busy" : ""}">${lines.map((l) => this.line(l, T)).join("")}</ul>
            <slot name="cart-extra"></slot>
          </div>
          <aside class="sum" aria-label="${esc(T.summary)}">
            <h2 class="sumTitle">${esc(T.summary)}</h2>
            <slot name="cart-summary"><dl class="rows">
              <div><dt>${esc(T.goods(n))}</dt><dd>${esc(this.money(sum + saving))}</dd></div>
              ${saving > 0 ? `<div class="disc"><dt>${esc(T.discount)}</dt><dd>−${esc(this.money(saving))}</dd></div>` : ""}
              <div class="total"><dt>${esc(T.total)}</dt><dd>${esc(this.money(sum))}</dd></div>
            </dl></slot>
            <slot name="cart-note"></slot>
            <button class="cta" type="button" data-act="checkout">${esc(T.checkout)}</button>
            ${this.shareFn ? `<button class="ghostBtn" type="button" data-act="share"${this.shareState === "busy" ? " disabled" : ""}>${esc(this.shareState === "copied" ? T.copied : T.share)}</button>` : ""}
          </aside>
        </div>`;
    }
    this.root.innerHTML = `<style>${CSS}</style>
      <section class="page">
        <header class="top"><h1>${esc(T.title)}</h1>${lines.length ? `<span class="count">${esc(T.items(n))}</span>` : ""}</header>
        ${main}
      </section>`;
  }

  /** «Поделиться корзиной»: ссылку даёт сервис; системное меню «Поделиться», иначе — в буфер обмена. */
  private async share() {
    if (!this.shareFn || this.shareState === "busy") return;
    const T = this.labelSet;
    const lines = this.store.cartState().lines.map((l) => ({ id: l.id, qty: l.qty }));
    if (!lines.length) return;
    this.shareState = "busy";
    this.render();
    let url = "";
    try {
      url = await this.shareFn(lines);
    } catch {
      url = "";
    }
    this.shareState = "";
    if (url) {
      if (typeof navigator.share === "function") {
        try {
          await navigator.share({ title: T.shareTitle, url });
          this.render();
          return;
        } catch (e) {
          if (e instanceof DOMException && e.name === "AbortError") return void this.render();
        }
      }
      // в буфер обмена; где API буфера недоступен — как на сайте магазина, через временное поле
      let copied = false;
      try {
        await navigator.clipboard.writeText(url);
        copied = true;
      } catch {
        const tmp = document.createElement("textarea");
        tmp.value = url;
        tmp.setAttribute("readonly", "");
        tmp.style.cssText = "position:fixed;opacity:0;top:0;left:0";
        document.body.append(tmp);
        tmp.select();
        copied = document.execCommand("copy");
        tmp.remove();
      }
      if (copied) {
        this.shareState = "copied";
        setTimeout(() => {
          this.shareState = "";
          if (this.isConnected) this.render();
        }, 2000);
      }
    }
    this.render();
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
    const sub = this.subFn?.(l.id) ?? "";
    return `<li class="line">
      <span class="thumb">${img}</span>
      <div class="lbody">
        <div class="lhead">
          <span class="lname">${esc(l.name)}</span>
          <button class="del" type="button" data-act="remove" data-id="${esc(l.id)}" aria-label="${esc(T.remove)}: ${esc(l.name)}">${ICON.trash}</button>
        </div>
        ${sub ? `<span class="lsub">${esc(sub)}</span>` : ""}
        <div class="lfoot">
          ${price}
          <div class="qty">
            <button type="button" data-act="dec" data-id="${esc(l.id)}" aria-label="${esc(T.dec(l.name))}"${l.qty <= 1 ? " disabled" : ""}>${ICON.minus}</button>
            <span aria-live="polite">${l.qty}</span>
            <button type="button" data-act="inc" data-id="${esc(l.id)}" aria-label="${esc(T.inc(l.name))}">${ICON.plus}</button>
          </div>
        </div>
      </div>
    </li>`;
  }
}
