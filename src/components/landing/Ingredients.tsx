import Image from "next/image";
import { Accent, Container, Heading, Section } from "@/components/ui";
import { asset } from "@/lib/asset";
import styles from "./Ingredients.module.css";

type Logo = { slug: string; name: string; w: number; h: number; show: number };

/** Ingredient brands, in rows as on the design. `show` is the display
 *  height (px) — tuned so every mark carries about the same visual weight. */
const ROWS: Logo[][] = [
  [
    { slug: "aquamin", name: "Aquamin", w: 196, h: 128, show: 34 },
    { slug: "concordix", name: "Concordix", w: 505, h: 155, show: 38 },
    { slug: "extrafolate-s", name: "ExtraFolate-S", w: 363, h: 60, show: 22 },
  ],
  [
    { slug: "libifem", name: "Libifem", w: 552, h: 164, show: 30 },
    { slug: "kaneka-q10", name: "Kaneka Q10", w: 350, h: 151, show: 34 },
    { slug: "lipomask", name: "LipoMask", w: 189, h: 221, show: 44 },
  ],
  [
    { slug: "mucosave", name: "Mucosave FG", w: 636, h: 111, show: 22 },
    { slug: "memophenol", name: "Memophenol", w: 744, h: 118, show: 30 },
  ],
  [
    { slug: "pureway", name: "PureWay-C", w: 355, h: 88, show: 26 },
    { slug: "safrinside", name: "safr'inside", w: 740, h: 155, show: 30 },
    { slug: "zooca", name: "Zooca", w: 443, h: 158, show: 34 },
  ],
  [
    { slug: "menaq7", name: "MenaQ7", w: 525, h: 117, show: 30 },
    {
      slug: "oximacro-cranberry",
      name: "Oximacro Cranberry",
      w: 638,
      h: 147,
      show: 32,
    },
  ],
];

/**
 * Ingredients — "Только премиальные ингредиенты": a statement on the left and
 * the ingredient brands as outlined pills on the right.
 */
export function Ingredients() {
  return (
    <Section tone="surface" id="ingredients" className={styles.section}>
      <Container>
        <div className={styles.inner}>
          <div className={styles.copy}>
            <Heading as="h2" className={styles.title}>
              Только <Accent>премиальные ингредиенты</Accent>
            </Heading>
            <p className={styles.text}>
              Тщательно отобранные ингредиенты и составы, которые мы используем
              в продуктах Coral Club.
            </p>
          </div>

          <div className={styles.logos}>
            {ROWS.map((row, i) => (
              <ul className={styles.row} key={i}>
                {row.map((l) => (
                  <li className={styles.pill} key={l.slug}>
                    <Image
                      src={asset(`/images/landing/ingredients/${l.slug}.webp`)}
                      alt={l.name}
                      width={l.w}
                      height={l.h}
                      sizes={`${Math.round((l.w / l.h) * l.show)}px`}
                      style={{
                        height: `calc(${l.show}px * var(--logo-scale, 1))`,
                        width: "auto",
                        maxWidth: "100%",
                      }}
                    />
                  </li>
                ))}
              </ul>
            ))}
          </div>
        </div>
      </Container>
    </Section>
  );
}
