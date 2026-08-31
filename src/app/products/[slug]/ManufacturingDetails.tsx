import type { ReactNode } from "react";
import styles from "./ManufacturingDetails.module.css";

/**
 * Manufacturing-details sheet content. Static placeholder that mirrors the
 * design — later this comes per-product from the catalogue / CMS.
 */

function Fact({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className={styles.fact}>
      <p className={styles.label}>{label}</p>
      <p className={styles.value}>{children}</p>
    </div>
  );
}

const FACTS = [
  { term: "Vitamin C (ascorbyl palmitate)", amount: "50 mg", dv: "56%" },
  { term: "Bamboo (Bambusa vulgaris) extract", amount: "7.5 mg", dv: "–" },
  { term: "Manganese (manganese gluconate)", amount: "0.3 mg", dv: "13%" },
  { term: "Bamboo (Bambusa vulgaris) extract", amount: "7.5 mg", dv: "–" },
  { term: "Manganese (manganese gluconate)", amount: "0.3 mg", dv: "13%" },
  { term: "Bamboo (Bambusa vulgaris) extract", amount: "7.5 mg", dv: "–" },
];

export function ManufacturingDetails() {
  return (
    <div className={styles.root}>
      <Fact label="Country of Origin">Germany, Australia</Fact>
      <Fact label="Shipping weight">0.61 kg</Fact>
      <Fact label="Expiration date">2 years from the date of manufacture</Fact>
      <Fact label="Storage method">
        Store in a dry place, protected from direct sunlight, out of reach of
        children at a temperature not exceeding +25&nbsp;°C. After opening, store
        the bottle in the refrigerator.
      </Fact>
      <Fact label="Region of register">
        <a href="#source">Source</a>
      </Fact>
      <Fact label="Ingredient list">
        Vitamin C (ascorbyl palmitate), bamboo extract (Bambusa vulgaris),
        manganese (manganese gluconate).
      </Fact>

      <div>
        <p className={styles.factsTitle}>Supplement Facts</p>
        <div className={styles.tableWrap}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th scope="col" />
                <th scope="col" className={styles.num}>
                  Amount Per Serving
                  <br />1 capsule
                </th>
                <th scope="col" className={styles.num}>
                  %DV*
                </th>
              </tr>
            </thead>
            <tbody>
              {FACTS.map((row, i) => (
                <tr key={i}>
                  <td>{row.term}</td>
                  <td className={styles.num}>{row.amount}</td>
                  <td className={styles.num}>{row.dv}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <p className={styles.footnote}>
        * Percent Daily Values are based on a 2,000 calorie diet.
      </p>
    </div>
  );
}
