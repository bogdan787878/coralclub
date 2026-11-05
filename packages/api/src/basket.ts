/**
 * Корзина участника в API кабинета: она же корзина магазина (одна и та же на сервере).
 * POST /basket, POST /basket/decrease, DELETE /basket/{code}/{memberId}, GET /basket/quantities.
 */
import { fetchProducts, type Product } from "./catalog";
import { cc4 } from "./session";

type QuantitiesAnswer = { data?: { memberId?: number; items?: { productId?: number; quantity?: number }[] }[] };

export type BasketLine = { code: number; qty: number; product: Product | null };

let memberId: number | null = null;
/** Номер участника (GET /account); запоминается до перезагрузки страницы. */
export async function ensureMember(): Promise<number | null> {
  if (memberId !== null) return memberId;
  const r = await cc4<{ data?: { id?: number } }>("/account");
  memberId = r.json?.data?.id ?? null;
  return memberId;
}
export const currentMemberId = (): number | null => memberId;

/** В ответе корзины есть корзины получателей группового заказа: берём корзину самого участника. */
function ownItems(json: QuantitiesAnswer | null, me: number | null) {
  const entries = json?.data ?? [];
  const mine = entries.filter((e) => e.memberId === me);
  return (mine.length ? mine : entries).flatMap((e) => e.items ?? []);
}

/** Корзина с товарами. null: нет ответа (не вошёл, сеть). */
export async function readBasket(): Promise<BasketLine[] | null> {
  const me = await ensureMember();
  const r = await cc4<QuantitiesAnswer>("/basket/quantities");
  if (!r.ok) return null;
  const qty = new Map<number, number>();
  for (const it of ownItems(r.json, me)) {
    if (typeof it.productId === "number" && (it.quantity ?? 0) > 0) qty.set(it.productId, (qty.get(it.productId) ?? 0) + (it.quantity ?? 0));
  }
  const products = await fetchProducts([...qty.keys()]);
  const byCode = new Map(products.map((p) => [p.code, p]));
  return [...qty].map(([code, q]) => ({ code, qty: q, product: byCode.get(code) ?? null }));
}

export async function addToBasket(code: number, quantity = 1): Promise<boolean> {
  const me = await ensureMember();
  if (me === null) return false;
  return (await cc4("/basket", { method: "POST", body: { code, quantity, memberId: me } })).ok;
}

export async function decreaseInBasket(code: number, quantity = 1): Promise<boolean> {
  const me = await ensureMember();
  if (me === null) return false;
  return (await cc4("/basket/decrease", { method: "POST", body: { code, quantity, memberId: me } })).ok;
}

export async function removeFromBasket(code: number): Promise<boolean> {
  const me = await ensureMember();
  if (me === null) return false;
  return (await cc4(`/basket/${code}/${me}`, { method: "DELETE" })).ok;
}
