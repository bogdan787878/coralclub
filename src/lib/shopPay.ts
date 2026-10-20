/**
 * Paying an order of the US shop from our own page — the same requests the
 * shop's own payment page makes (read from its public client code):
 *
 *   GET  /sv-api/getOrder?orderId=…                 the order to pay
 *   GET  /sv-api/payment/authorize/config           Google Pay merchant settings
 *   POST /sv-api/orders/<order>/<pay system>/pay    a card, or a Google Pay token
 *
 * Card data is sent straight to the shop and is never stored, logged or put
 * into analytics here. Like the rest of /sv-api it works on the shop's origin
 * only (coralclub.us, or the local proxy).
 */
import { api, language, shopFetch } from "./shopApi";

export type PayOrder = {
  id: string;
  /** What is left to pay, as the shop wrote it ("126.50"). */
  amount: string;
  currency: string;
  paid: boolean;
  canceled: boolean;
  country: string;
  street: string;
  city: string;
  area: string;
  zip: string;
};

export type PayResult =
  | { success: true }
  | {
      success: false;
      /** The shop wants the visitor to sign in: the order is not in this session. */
      deauth?: boolean;
      general?: string;
      /** Messages by field: card_number, card_name, exp_month, exp_year, cvc, billing_* */
      fields?: Record<string, string>;
    };

type OrderRaw = {
  ORDER_ID?: string | number;
  NEED_PAY?: string | number;
  FULL_PRICE?: string | number;
  CURRENCY?: string;
  ORDER_STATUS_PAID?: string;
  ORDER_STATUS_CANCELED?: string;
  ALPHA2?: string;
  ADDRESS?: string;
  CITY?: string;
  AREA?: string;
  ZIP?: string;
};

/** The order to pay, or why it can't be paid here. */
export async function getPayOrder(
  orderId: string,
): Promise<{ order: PayOrder } | { error: string; deauth?: boolean }> {
  const d = await api<{ result?: OrderRaw | 0; error?: string }>("/getOrder", {
    orderId,
  });
  if (d.error === "deauthorization") return { error: "", deauth: true };
  if (d.error) return { error: d.error };
  const o = d.result;
  if (!o) return { error: "Order not found" };
  return {
    order: {
      id: String(o.ORDER_ID ?? orderId),
      amount: String(o.NEED_PAY || o.FULL_PRICE || ""),
      currency: o.CURRENCY || "USD",
      paid: o.ORDER_STATUS_PAID === "1",
      canceled: o.ORDER_STATUS_CANCELED === "1",
      country: (o.ALPHA2 || "").toUpperCase(),
      street: o.ADDRESS || "",
      city: o.CITY || "",
      area: o.AREA || "",
      zip: o.ZIP || "",
    },
  };
}

/** The shop's answers come in three shapes; this makes one of them. */
function readPayAnswer(data: unknown, ok: boolean): PayResult {
  const d = (data && typeof data === "object" ? data : {}) as Record<
    string,
    unknown
  >;
  if (!Object.keys(d).length) {
    return { success: false, general: "The payment service did not answer." };
  }
  if (d.error === "deauthorization") return { success: false, deauth: true };
  if (d.result === 0 && d.error) {
    return { success: false, general: String(d.error) };
  }
  if (d.status === "error" && d.errors && typeof d.errors === "object") {
    return { success: false, fields: d.errors as Record<string, string> };
  }
  if (!ok) {
    return {
      success: false,
      general: String(d.error || d.message || "The payment was declined."),
    };
  }
  return { success: true };
}

async function postPay(
  orderId: string,
  paySystemId: string,
  body: Record<string, unknown>,
): Promise<PayResult> {
  try {
    const r = await shopFetch(
      `/sv-api/orders/${encodeURIComponent(orderId)}/${encodeURIComponent(paySystemId)}/pay?language=${language}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      },
    );
    let data: unknown = null;
    try {
      data = await r.json();
    } catch {
      /* empty or non-JSON body */
    }
    return readPayAnswer(data, r.ok);
  } catch {
    return {
      success: false,
      general: "We couldn’t reach the payment service.",
    };
  }
}

export type CardInput = {
  number: string;
  /** "MM" */
  month: string;
  /** "YY" */
  year: string;
  cvc: string;
  name: string;
};

export type Billing = {
  street: string;
  city: string;
  state: string;
  zip: string;
};

/** Pay with a card; billing = «same as shipping» (true) or its own address. */
export function payByCard(
  orderId: string,
  paySystemId: string,
  card: CardInput,
  billing: Billing | "same",
): Promise<PayResult> {
  return postPay(orderId, paySystemId, {
    card: {
      number: card.number.replace(/\s/g, ""),
      exp_month: card.month,
      exp_year: card.year,
      cvc: card.cvc,
      name: card.name,
    },
    order_id: orderId,
    pay_system_id: paySystemId,
    ...(billing === "same"
      ? { same_as_shipping: true }
      : { billing_address: billing }),
  });
}

/* ------------------------------- Google Pay ------------------------------ */

type GooglePayConfig = {
  googlePay?: {
    environment: "TEST" | "PRODUCTION";
    gatewayMerchantId: string;
    merchantId?: string;
    merchantName: string;
  };
};

type GPayClient = {
  isReadyToPay(req: unknown): Promise<{ result: boolean }>;
  loadPaymentData(req: unknown): Promise<{
    paymentMethodData: {
      tokenizationData: { token: string };
      info?: {
        billingAddress?: {
          name?: string;
          address1?: string;
          address2?: string;
          address3?: string;
          locality?: string;
          administrativeArea?: string;
          postalCode?: string;
          countryCode?: string;
        };
      };
    };
  }>;
  createButton(opts: Record<string, unknown>): HTMLElement;
};

declare global {
  interface Window {
    google?: {
      payments: {
        api: { PaymentsClient: new (o: { environment: string }) => GPayClient };
      };
    };
  }
}

const GPAY_BASE = { apiVersion: 2, apiVersionMinor: 0 };
const GPAY_CARD = {
  type: "CARD",
  parameters: {
    allowedAuthMethods: ["PAN_ONLY", "CRYPTOGRAM_3DS"],
    allowedCardNetworks: ["AMEX", "DISCOVER", "MASTERCARD", "VISA"],
    billingAddressRequired: true,
    billingAddressParameters: { format: "FULL", phoneNumberRequired: false },
  },
};

let gpayScript: Promise<void> | null = null;
function loadGooglePayScript(): Promise<void> {
  gpayScript ??= new Promise((resolve, reject) => {
    const el = document.createElement("script");
    el.src = "https://pay.google.com/gp/p/js/pay.js";
    el.async = true;
    el.onload = () => resolve();
    el.onerror = () => {
      gpayScript = null;
      reject(new Error("Google Pay script failed to load"));
    };
    document.head.appendChild(el);
  });
  return gpayScript;
}

export type GooglePay = {
  /** The official Google button (brand rules: only Google draws it). */
  button(onClick: () => void): HTMLElement;
  /** Opens the Google Pay sheet and pays the order with what the shopper chose. */
  pay(order: PayOrder, paySystemId: string): Promise<PayResult>;
};

/** A ready Google Pay, or null when it is not available on this device / page. */
export async function setupGooglePay(): Promise<GooglePay | null> {
  try {
    const cfg = await api<GooglePayConfig>("/payment/authorize/config");
    const g = cfg.googlePay;
    if (!g) return null;
    await loadGooglePayScript();
    if (!window.google) return null;
    const client = new window.google.payments.api.PaymentsClient({
      environment: g.environment,
    });
    const ready = await client.isReadyToPay({
      ...GPAY_BASE,
      allowedPaymentMethods: [GPAY_CARD],
    });
    if (!ready.result) return null;

    return {
      button: (onClick) =>
        client.createButton({
          buttonColor: "black",
          buttonType: "pay",
          buttonSizeMode: "fill",
          buttonRadius: 28,
          onClick,
        }),
      pay: async (order, paySystemId) => {
        let data;
        try {
          data = await client.loadPaymentData({
            ...GPAY_BASE,
            allowedPaymentMethods: [
              {
                ...GPAY_CARD,
                tokenizationSpecification: {
                  type: "PAYMENT_GATEWAY",
                  parameters: {
                    gateway: "authorizenet",
                    gatewayMerchantId: g.gatewayMerchantId,
                  },
                },
              },
            ],
            transactionInfo: {
              totalPriceStatus: "FINAL",
              totalPrice: order.amount,
              currencyCode: order.currency,
              countryCode: "US",
            },
            merchantInfo: {
              merchantName: g.merchantName,
              ...(g.merchantId && { merchantId: g.merchantId }),
            },
          });
        } catch (e) {
          // closing the sheet is not an error worth a message
          const code = (e as { statusCode?: string }).statusCode;
          if (code === "CANCELED") return { success: false };
          return { success: false, general: "Google Pay could not be opened." };
        }
        const b = data.paymentMethodData.info?.billingAddress;
        return postPay(order.id, paySystemId, {
          pay_system_id: paySystemId,
          google_pay_data: {
            dataDescriptor: "COMMON.GOOGLE.INAPP.PAYMENT",
            dataValue: btoa(data.paymentMethodData.tokenizationData.token),
          },
          ...(b && {
            billing_address: {
              name: b.name || "",
              street: [b.address1, b.address2, b.address3]
                .filter(Boolean)
                .join(", "),
              city: b.locality || "",
              state: b.administrativeArea || "",
              zip: b.postalCode || "",
              country: b.countryCode || "",
            },
          }),
        });
      },
    };
  } catch {
    return null;
  }
}
