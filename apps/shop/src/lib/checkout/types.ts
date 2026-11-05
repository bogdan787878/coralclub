/** The shop's checkout API (/sv-api/*): the shapes both checkouts read. */
export type PayMethod = {
  ID: string;
  NAME: string;
  DESCRIPTION?: string | null;
  IMAGE?: string | null;
};
export type DeliveryItem = {
  ID: string;
  NAME: string;
  TYPE: string;
  TRANSIT?: string;
  PRICE?: number;
  FREE_DELIVERY?: number;
  /** the payments the shop allows with this service */
  PAYSYSTEMS?: PayMethod[];
};
export type DeliveryGroup = { ID: string; NAME: string; ITEMS: DeliveryItem[] };
export type Totals = Record<string, string | number | null | undefined>;

/** «7 052,00» / "7052.00" / 7052 → 7052; 0 for anything else. */
export const num = (v: unknown): number =>
  parseFloat(
    String(v ?? "")
      .replace(/\s/g, "")
      .replace(",", "."),
  ) || 0;

/** Cash and pay-to-courier methods (the member area offers online payment only). */
export const CASHLIKE = /налич|при получении|наложен|cash/i;
export const onlineOnly = <T extends { NAME: string }>(list: T[]): T[] =>
  list.filter((p) => !CASHLIKE.test(p.NAME));
