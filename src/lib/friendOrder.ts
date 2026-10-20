/**
 * What the payment step needs to know about the order that was just created:
 * kept in sessionStorage by the checkout and read by /friend/checkout/pay/.
 * (The order itself lives in the shop; this is only for showing a summary.)
 */
export type LastOrder = {
  orderId: string;
  paymentId: string;
  total: number;
  shipping: number | null;
  shippingName: string;
  address: string;
  email: string;
  lines: {
    name: string;
    form: string;
    qty: number;
    club: number;
    regular: number;
    image?: string;
  }[];
};

const KEY = "coralclub.friend.lastOrder";

export function saveLastOrder(o: LastOrder): void {
  try {
    window.sessionStorage.setItem(KEY, JSON.stringify(o));
  } catch {
    /* storage unavailable — the payment page just shows less */
  }
}

export function readLastOrder(orderId: string): LastOrder | null {
  try {
    const raw = window.sessionStorage.getItem(KEY);
    if (!raw) return null;
    const o = JSON.parse(raw) as LastOrder;
    return o.orderId === orderId ? o : null;
  } catch {
    return null;
  }
}
