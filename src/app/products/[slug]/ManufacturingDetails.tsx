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

export function SupplementFacts({ data }: { data: Manufacturing["supplementFacts"] }) {
  if (!data?.rows?.length) return null;
  return (
    <div>
      <p className={styles.factsTitle}>Supplement Facts</p>
      <div className={styles.tableWrap}>
        <table className={styles.table}>
          <thead>
            <tr>
              <th scope="col" />
              <th scope="col" className={styles.num}>
                {data.servingLabel || "Amount Per Serving"}
              </th>
              <th scope="col" className={styles.num}>
                %DV*
              </th>
            </tr>
          </thead>
          <tbody>
            {data.rows.map((row, i) => (
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
        * Percent Daily Values are based on a 2,000 calorie diet.
      </p>
    </div>
  );
}

export function ManufacturingDetails({ data }: { data: Manufacturing }) {
  return (
    <div className={styles.root}>
      <Fact label="Country of Origin">{data.countryOfOrigin}</Fact>
      <Fact label="Shipping weight">{data.shippingWeight}</Fact>
      <Fact label="Expiration date">{data.expiration}</Fact>
      <Fact label="Storage method">{data.storage}</Fact>
      <Fact label="Ingredient list">{data.ingredients}</Fact>

      <SupplementFacts data={data.supplementFacts} />
    </div>
  );
}
