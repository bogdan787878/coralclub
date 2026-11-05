/**
 * Корзина принадлежит Layout: одна на все сервисы, два источника правды.
 *
 *  - member: корзина участника в API кабинета (она же корзина магазина на сервере); здесь только её копия.
 *  - local:  гостевая корзина в localStorage (витрина, «Друг клуба», лендинги). Формат и события те же, что у
 *            корзины приложения магазина (lib/cart.ts): строки CartLine под ключом, событие `coralclub:cart` после
 *            записи, `coralclub:cart:change` для аналитики, `coralclub:cart:open` открывает корзину.
 *
 * Сервисы меняют корзину через window.coralLayout.cart или сами (локальная корзина: lib/cart.ts) и сообщают об этом;
 * Layout перечитывает источник. Другие вкладки узнают через BroadcastChannel("cc") и событие storage.
 */
import { addToBasket, decreaseInBasket, getToken, money, readBasket, removeFromBasket, type BasketLine } from "@coral/api";

/** Строка гостевой корзины (как CartLine приложения магазина). */
export type LocalLine = { coralId: string; slug: string; name: string; price: string; image?: string; was?: string; qty: number };
export type RawLine = BasketLine | LocalLine;

/** Строка для отрисовки: общий вид для обоих источников. */
export type ViewLine = {
  id: string;
  qty: number;
  name: string;
  image: string;
  /** цена за штуку числом (для итогов) и текстом */
  now: number | null;
  nowText: string;
  was: number | null;
  wasText: string;
  currency: string;
  raw: RawLine;
};

export type CartState = { status: "guest" | "loading" | "ready" | "error"; lines: ViewLine[]; open: boolean; busy: boolean };
export type Source = { kind: "member" } | { kind: "local"; key: string };

let source: Source = { kind: "member" };
let state: CartState = { status: "loading", lines: [], open: false, busy: false };
const listeners = new Set<(s: CartState) => void>();
const channel = typeof BroadcastChannel === "undefined" ? null : new BroadcastChannel("cc");

function set(next: Partial<CartState>) {
  state = { ...state, ...next };
  listeners.forEach((l) => l(state));
}
export const cartState = (): CartState => state;
export const cartSource = (): Source => source;
export function subscribe(fn: (s: CartState) => void): () => void {
  listeners.add(fn);
  fn(state);
  return () => listeners.delete(fn);
}
export const count = (): number => state.lines.reduce((n, l) => n + l.qty, 0);

/** "$21.99" / "3 762,50 ₽" → число; 0, если не разобрать (как priceValue приложения магазина). */
export function priceValue(price: string): number {
  const compact = price.replace(/[\s  ]/g, "");
  const decimalComma = /,\d{1,2}(?!\d)/.test(compact) && !compact.includes(".");
  const normalized = decimalComma ? compact.replace(",", ".") : compact.replace(/,/g, "");
  const n = parseFloat(normalized.replace(/[^0-9.]/g, ""));
  return Number.isFinite(n) ? n : 0;
}

function viewMember(l: BasketLine): ViewLine {
  const p = l.product;
  const cur = p?.currency ?? "RUB";
  const was = p?.retail && p.club !== null && p.retail > p.club ? p.retail : null;
  return {
    id: String(l.code),
    qty: l.qty,
    name: p?.name ?? `Артикул ${l.code}`,
    image: p?.image ?? "",
    now: p?.club ?? null,
    nowText: p?.club != null ? money(p.club, cur) : "",
    was,
    wasText: was !== null ? money(was, cur) : "",
    currency: cur,
    raw: l,
  };
}
function viewLocal(l: LocalLine): ViewLine {
  const now = l.price ? priceValue(l.price) : null;
  const was = l.was ? priceValue(l.was) : null;
  return { id: l.coralId, qty: l.qty, name: l.name, image: l.image ?? "", now, nowText: l.price ?? "", was: was && now !== null && was > now ? was : null, wasText: l.was ?? "", currency: "", raw: l };
}

/* ---------- гостевая корзина в localStorage ---------- */
function readLocal(): LocalLine[] {
  if (source.kind !== "local") return [];
  try {
    const parsed = JSON.parse(window.localStorage.getItem(source.key) ?? "[]") as unknown;
    return Array.isArray(parsed) ? parsed.filter((l): l is LocalLine => !!l && typeof l.coralId === "string" && typeof l.qty === "number") : [];
  } catch {
    return [];
  }
}
function writeLocal(lines: LocalLine[], change?: { type: "add" | "remove"; coralId: string; qty: number }) {
  if (source.kind !== "local") return;
  try {
    window.localStorage.setItem(source.key, JSON.stringify(lines));
  } catch {
    /* без хранилища корзина живёт до перезагрузки */
  }
  window.dispatchEvent(new Event("coralclub:cart")); // приложение магазина перечитает свою копию
  if (change && change.qty > 0) window.dispatchEvent(new CustomEvent("coralclub:cart:change", { detail: change }));
  reloadLocal(true);
}
function reloadLocal(local: boolean) {
  const raw = readLocal();
  set({ status: "ready", lines: raw.map(viewLocal) });
  announce(local);
}

function announce(local: boolean) {
  window.dispatchEvent(new CustomEvent("cc:cart:changed", { detail: { count: count(), lines: state.lines.map((l) => l.raw), source: source.kind } }));
  if (local) channel?.postMessage({ type: "cart" });
}

/* ---------- корзина участника ---------- */
let loading: Promise<void> | null = null;
/** Перечитать корзину из источника. */
export function refresh(local = false): Promise<void> {
  if (source.kind === "local") {
    reloadLocal(local);
    return Promise.resolve();
  }
  if (!getToken()) {
    set({ status: "guest", lines: [] });
    announce(local);
    return Promise.resolve();
  }
  loading ??= readBasket()
    .then((lines) => {
      set(lines ? { status: "ready", lines: lines.map(viewMember) } : { status: "error" });
      announce(local);
    })
    .finally(() => (loading = null));
  return loading;
}

let queue: Promise<unknown> = Promise.resolve();
/** Изменения корзины участника идут на сервер по одному; после каждого корзина перечитывается (ответ сервера и есть правда). */
function change(job: () => Promise<boolean>) {
  set({ busy: true });
  queue = queue.then(async () => {
    await job();
    await refresh(true);
    set({ busy: false });
  });
  return queue as Promise<void>;
}
const patch = (id: string, qty: number) =>
  set({ lines: qty > 0 ? state.lines.map((l) => (l.id === id ? { ...l, qty } : l)) : state.lines.filter((l) => l.id !== id) });

/** Добавить: участник — код товара; гостевая корзина — строка целиком (или код товара, который уже есть в корзине). */
export function add(item: number | string | Omit<LocalLine, "qty">, qty = 1): Promise<void> {
  if (source.kind === "local") {
    const lines = readLocal();
    const id = typeof item === "object" ? item.coralId : String(item);
    const have = lines.find((l) => l.coralId === id);
    if (have) have.qty += qty;
    else if (typeof item === "object") lines.push({ ...item, qty });
    else return Promise.resolve();
    writeLocal(lines, { type: "add", coralId: id, qty });
    return Promise.resolve();
  }
  const code = Number(typeof item === "object" ? item.coralId : item);
  return Number.isFinite(code) ? change(() => addToBasket(code, qty)) : Promise.resolve();
}
export function setQty(id: string, qty: number): Promise<void> {
  const line = state.lines.find((l) => l.id === id);
  if (!line) return Promise.resolve();
  const diff = qty - line.qty;
  if (!diff) return Promise.resolve();
  if (source.kind === "local") {
    const lines = readLocal()
      .map((l) => (l.coralId === id ? { ...l, qty } : l))
      .filter((l) => l.qty > 0);
    writeLocal(lines, { type: diff > 0 ? "add" : "remove", coralId: id, qty: Math.abs(diff) });
    return Promise.resolve();
  }
  const code = Number(id);
  patch(id, qty); // сразу на экране, сервер подтвердит
  if (qty <= 0) return change(() => removeFromBasket(code));
  return change(() => (diff > 0 ? addToBasket(code, diff) : decreaseInBasket(code, -diff)));
}
export function remove(id: string): Promise<void> {
  return setQty(id, 0);
}
export function open(): void {
  set({ open: true });
  window.dispatchEvent(new Event("coralclub:cart:view")); // аналитика магазина: «view_cart»
  if (state.status !== "guest") void refresh();
}
export function close(): void {
  set({ open: false });
}

let started = false;
/** Запуск один раз на страницу: источник задаёт первый <cc-layout> (атрибуты cart и cart-key). */
export function start(next: Source): void {
  if (started) return;
  started = true;
  source = next;
  state = { ...state, status: next.kind === "local" ? "ready" : getToken() ? "loading" : "guest" };
  channel?.addEventListener("message", (e) => e.data?.type === "cart" && void refresh());
  window.addEventListener("cc:cart:refresh", () => void refresh(true));
  window.addEventListener("cc:auth:changed", () => void refresh(true));
  window.addEventListener("coralclub:cart:open", () => open()); // openCart() приложения магазина
  if (next.kind === "local") {
    window.addEventListener("coralclub:cart", () => reloadLocal(false));
    window.addEventListener("storage", (e) => e.key === next.key && reloadLocal(false));
  } else {
    // вход в соседней вкладке не виден (sessionStorage у вкладки свой); проверяем при возврате на вкладку
    document.addEventListener("visibilitychange", () => {
      if (document.visibilityState === "visible" && (state.status === "guest") === Boolean(getToken())) void refresh();
    });
  }
  void refresh();
}
