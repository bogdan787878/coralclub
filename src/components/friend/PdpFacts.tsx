import { friendProduct } from "@/lib/friendCatalog";
import { getProduct } from "@/lib/products";
import styles from "./PdpBlocks.module.css";

type Row = { name: string; amount: string; dv: string };

/** Real rows only: drops empty and leftover «test» placeholder rows. */
const realRows = (rows: Row[] | undefined): Row[] =>
  (rows ?? []).filter((r) => {
    const n = r.name?.trim().toLowerCase();
    return n && n !== "test";
  });

/** «Amount Per 1 Sachet» → «1 sachet»; «Amount Per Serving» says nothing: null. */
function servingOf(label: string | undefined): string | null {
  const m = /amount per\s+(?:serving\s*)?\(?([^()]*?)\)?\s*$/i.exec(
    label ?? "",
  );
  const v = m?.[1]?.trim();
  return v && !/^serving$/i.test(v) ? v.toLowerCase() : null;
}

/**
 * The product page's Supplement Facts, a block of its own (not folded away):
 * the table of the product, and for a set the table of each product in it.
 * What has no table yet shows its ingredient list instead.
 */
export function PdpFacts({ slug }: { slug: string }) {
  const own = friendProduct(slug);
  if (!own) return null;
  const slugs = own.includes.length ? own.includes : [slug];
  const parts = slugs
    .map((s) => {
      const p = getProduct(s);
      if (!p) return null;
      const sf = p.manufacturing.supplementFacts;
      return {
        slug: s,
        name: p.name,
        rows: realRows(sf?.rows),
        serving: servingOf(sf?.servingLabel),
        ingredients: p.manufacturing.ingredients?.trim() ?? "",
      };
    })
    .filter((x): x is NonNullable<typeof x> => x !== null)
    .filter((x) => x.rows.length > 0 || x.ingredients);
  if (!parts.length) return null;

  const anyDv = parts.some((x) => x.rows.some((r) => r.dv));
  const anyNone = parts.some((x) => x.rows.some((r) => !r.dv));
  const named = parts.length > 1;

  return (
    <section className={styles.block} aria-labelledby="pdp-facts">
      <h2 id="pdp-facts" className={styles.title}>
        Supplement Facts
      </h2>
      {parts.map((x) => (
        <div key={x.slug} className={styles.block}>
          {named && <h3 className={styles.sub}>{x.name}</h3>}
          {x.rows.length > 0 ? (
            <>
              {x.serving && (
                <p className={styles.serving}>
                  Amount per serving: {x.serving}
                </p>
              )}
              <div className={styles.tableWrap}>
                <table className={styles.table}>
                  <thead>
                    <tr>
                      <th scope="col">Ingredients</th>
                      <th scope="col" className={styles.num}>
                        Amount
                      </th>
                      <th scope="col" className={styles.num}>
                        %DV*
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {x.rows.map((r, i) => (
                      <tr key={i}>
                        <td>{r.name}</td>
                        <td className={styles.num}>{r.amount}</td>
                        <td className={styles.num}>{r.dv || "†"}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          ) : (
            <p className={styles.text}>
              <b>Ingredients:</b> {x.ingredients}
            </p>
          )}
        </div>
      ))}
      {(anyDv || anyNone) && (
        <p className={styles.note}>
          {anyDv && "* Percent Daily Values are based on a 2,000 calorie diet."}
          {anyDv && anyNone && <br />}
          {anyNone && "† Daily Value not established."}
        </p>
      )}
    </section>
  );
}
