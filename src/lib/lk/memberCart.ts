/**
 * The member's cart: the cabinet API's basket is the truth, the local cart store
 * (lib/cart.ts, key `coralclub.cart.lk`) is its mirror, so the same cart drawer
 * as in the friend project works unchanged. Changes made in the drawer are
 * written through to the basket (POST /basket, /basket/decrease, DELETE).
 */
import { type CartChange, type CartLine, getCart, replaceCart } from "@/lib/cart";
import { fetchProducts, rub } from "./catalog";
import { cc4 } from "./session";

type BasketAnswer = { data?: { memberId?: number; items?: { productId?: number; quantity?: number }[] }[] };

let memberId: number | null = null;
async function ensureMember(): Promise<number | null> {
  if (memberId !== null) return memberId;
  const r = await cc4<{ data?: { id?: number } }>("/account");
  memberId = r.json?.data?.id ?? null;
  return memberId;
}
export const currentMemberId = (): number | null => memberId;

/** Basket answers hold the member's own basket and the baskets of group recipients: take the member's. */
function ownItems(json: BasketAnswer | null, me: number | null) {
  const entries = json?.data ?? [];
  const mine = entries.filter((e) => e.memberId === me);
  return (mine.length ? mine : entries).flatMap((e) => e.items ?? []);
}

/** Read the basket and its products, and put them into the local mirror. */
export async function loadMemberCart(): Promise<boolean> {
  const me = await ensureMember();
  const r = await cc4<BasketAnswer>("/basket/quantities");
  if (!r.ok) return false;
  const qty = new Map<number, number>();
  for (const it of ownItems(r.json, me)) {
    if (typeof it.productId === "number" && (it.quantity ?? 0) > 0) qty.set(it.productId, (qty.get(it.productId) ?? 0) + (it.quantity ?? 0));
  }
  const products = await fetchProducts([...qty.keys()]);
  const byCode = new Map(products.map((p) => [p.code, p]));
  const lines: CartLine[] = [...qty].map(([code, q]) => {
    const p = byCode.get(code);
    const member = p?.club ?? null;
    return {
      coralId: String(code),
      slug: String(code),
      name: p?.name ?? `Артикул ${code}`,
      price: member !== null ? rub(member, p?.currency) : "",
      image: p?.image || undefined,
      was: member !== null && p?.retail && p.retail > member ? rub(p.retail, p.currency) : undefined,
      qty: q,
    };
  });
  replaceCart(lines);
  return true;
}

let queue: Promise<unknown> = Promise.resolve();

/** Write-through: what the drawer does to the local cart is repeated on the basket, one call after another. */
export function startMemberCartSync(): () => void {
  const onChange = (e: Event) => {
    const { type, coralId, qty } = (e as CustomEvent<CartChange>).detail;
    const code = Number(coralId);
    if (!Number.isFinite(code)) return;
    queue = queue.then(async () => {
      const me = await ensureMember();
      if (me === null) return;
      if (type === "add") {
        await cc4("/basket", { method: "POST", body: { code, quantity: qty, memberId: me } });
      } else if (getCart().some((l) => l.coralId === coralId)) {
        await cc4("/basket/decrease", { method: "POST", body: { code, quantity: qty, memberId: me } });
      } else {
        await cc4(`/basket/${code}/${me}`, { method: "DELETE" });
      }
      await loadMemberCart(); // the server's answer is the truth
    });
  };
  window.addEventListener("coralclub:cart:change", onChange);
  return () => window.removeEventListener("coralclub:cart:change", onChange);
}
