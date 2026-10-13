import type { ReactNode } from "react";
import type { Manufacturing } from "@/lib/products";
import styles from "./ManufacturingDetails.module.css";

/** Per-product manufacturing sheet + editable Supplement Facts table. */

function Fact({ label, children }: { label: string; children: ReactNode }) {
  if (!children) return null;
  return (
    <div className={styles.fact}>
      <p className={styles.label}>{label}</p>
      <p className={styles.value}>{children}</p>
    </div>
  );
}

/** Real rows only — drops empty and leftover "Test" placeholder rows. */
function realRows(data: Manufacturing["supplementFacts"]) {
  return (data?.rows ?? []).filter((r) => {
    const n = r.name?.trim().toLowerCase();
    return n && n !== "test";
  });
}

/** Whether the product has a Supplement Facts table worth showing. */
export function hasSupplementFacts(data: Manufacturing["supplementFacts"]) {
  return realRows(data).length > 0;
}

export type SupplementFactsLabels = {
  perServing: string;
  dv: string;
  footnote: string;
};

export function SupplementFacts({
  data,
  labels,
}: {
  data: Manufacturing["supplementFacts"];
  /** Overrides for a translated storefront (defaults are English). */
  labels?: SupplementFactsLabels;
}) {
  const rows = realRows(data);
  if (!rows.length) return null;
  return (
    <div>
      <div className={styles.tableWrap}>
        <table className={styles.table}>
          <thead>
            <tr>
              <th scope="col" />
              <th scope="col" className={styles.num}>
                {data.servingLabel || labels?.perServing || "Amount Per Serving"}
              </th>
              <th scope="col" className={styles.num}>
                {labels?.dv ?? "%DV*"}
              </th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row, i) => (
              <tr key={i}>
                <td>{row.name}</td>
                <td className={styles.num}>{row.amount}</td>
                <td className={styles.num}>{row.dv || "–"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p className={styles.footnote}>
        {labels?.footnote ?? "* Percent Daily Values are based on a 2,000 calorie diet."}
      </p>
    </div>
  );
}

export type ManufacturingLabels = {
  country: string;
  weight: string;
  expiration: string;
  storage: string;
  ingredients: string;
};

export function ManufacturingDetails({
  data,
  labels,
}: {
  data: Manufacturing;
  /** Overrides for a translated storefront (defaults are English). */
  labels?: ManufacturingLabels;
}) {
  return (
    <div className={styles.root}>
      <Fact label={labels?.country ?? "Country of Origin"}>{data.countryOfOrigin}</Fact>
      <Fact label={labels?.weight ?? "Shipping weight"}>{data.shippingWeight}</Fact>
      <Fact label={labels?.expiration ?? "Expiration date"}>{data.expiration}</Fact>
      <Fact label={labels?.storage ?? "Storage method"}>{data.storage}</Fact>
      <Fact label={labels?.ingredients ?? "Ingredient list"}>{data.ingredients}</Fact>
    </div>
  );
}
