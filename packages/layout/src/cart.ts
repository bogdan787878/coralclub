/**
 * Корзина принадлежит Layout: одна на все сервисы. Правда на сервере (корзина участника в API кабинета),
 * здесь только её копия для отрисовки. Сервисы меняют корзину через window.coralLayout.cart или сообщают,
 * что поменяли её сами (событие cc:cart:refresh); другие вкладки узнают через BroadcastChannel("cc").
 */
import { addToBasket, decreaseInBasket, getToken, readBasket, removeFromBasket, type BasketLine } from "@coral/api";

export type CartState = { status: "guest" | "loading" | "ready" | "error"; lines: BasketLine[]; open: boolean; busy: boolean };

let state: CartState = { status: getToken() ? "loading" : "guest", lines: [], open: false, busy: false };
const listeners = new Set<(s: CartState) => void>();
const channel = typeof BroadcastChannel === "undefined" ? null : new BroadcastChannel("cc");

function set(next: Partial<CartState>) {
  state = { ...state, ...next };
  listeners.forEach((l) => l(state));
}
export const cartState = (): CartState => state;
export function subscribe(fn: (s: CartState) => void): () => void {
  listeners.add(fn);
  fn(state);
  return () => listeners.delete(fn);
}
export const count = (): number => state.lines.reduce((n, l) => n + l.qty, 0);

function announce(local: boolean) {
  window.dispatchEvent(new CustomEvent("cc:cart:changed", { detail: { count: count(), lines: state.lines } }));
  if (local) channel?.postMessage({ type: "cart" });
}

let loading: Promise<void> | null = null;
/** Перечитать корзину с сервера. */
export function refresh(local = false): Promise<void> {
  if (!getToken()) {
    set({ status: "guest", lines: [] });
    announce(local);
    return Promise.resolve();
  }
  loading ??= readBasket()
    .then((lines) => {
      set(lines ? { status: "ready", lines } : { status: "error" });
      announce(local);
    })
    .finally(() => (loading = null));
  return loading;
}

let queue: Promise<unknown> = Promise.resolve();
/** Изменения идут на сервер по одному; после каждого корзина перечитывается (ответ сервера и есть правда). */
function change(job: () => Promise<boolean>) {
  set({ busy: true });
  queue = queue.then(async () => {
    await job();
    await refresh(true);
    set({ busy: false });
  });
  return queue as Promise<void>;
}

const patch = (code: number, qty: number) =>
  set({ lines: qty > 0 ? state.lines.map((l) => (l.code === code ? { ...l, qty } : l)) : state.lines.filter((l) => l.code !== code) });

export function add(code: number, qty = 1): Promise<void> {
  return change(() => addToBasket(code, qty));
}
export function setQty(code: number, qty: number): Promise<void> {
  const line = state.lines.find((l) => l.code === code);
  if (!line) return add(code, qty);
  const diff = qty - line.qty;
  if (!diff) return Promise.resolve();
  patch(code, qty); // сразу на экране, сервер подтвердит
  if (qty <= 0) return change(() => removeFromBasket(code));
  return change(() => (diff > 0 ? addToBasket(code, diff) : decreaseInBasket(code, -diff)));
}
export function remove(code: number): Promise<void> {
  patch(code, 0);
  return change(() => removeFromBasket(code));
}
export function open(): void {
  set({ open: true });
  if (state.status !== "guest") void refresh();
}
export function close(): void {
  set({ open: false });
}

let started = false;
export function start(): void {
  if (started) return;
  started = true;
  channel?.addEventListener("message", (e) => e.data?.type === "cart" && void refresh());
  window.addEventListener("cc:cart:refresh", () => void refresh(true));
  window.addEventListener("cc:auth:changed", () => void refresh(true));
  // вход в соседней вкладке не виден (sessionStorage свой у вкладки), но в этой: проверяем при возврате на вкладку
  document.addEventListener("visibilitychange", () => {
    if (document.visibilityState === "visible" && (state.status === "guest") === Boolean(getToken())) void refresh();
  });
  void refresh();
}
