import Image from "next/image";
import { DietaryBadges, PeriodicElements } from "@/components/organisms";
import {
  ManufacturingDetails,
  SupplementFacts,
} from "../../app/(shop)/products/[slug]/ManufacturingDetails";
import {
  BADGE_LABELS_RU,
  DISCLAIMERS,
  type IncludedProductRu,
} from "@/lib/landingCatalogRu";
import styles from "./IncludedProductDetails.module.css";

/** Everything about one product of a set, for the details sheet (no price,
 *  no buy button). */
export function IncludedProductDetails({
  ru,
  image,
  badges,
}: {
  ru: IncludedProductRu;
  image?: { src: string; alt: string };
  badges: string[];
}) {
  const hasFacts = (ru.facts?.rows.length ?? 0) > 0;
  const paragraphs = ru.fullDescription.split("\n\n");

  return (
    <div className={styles.root}>
      {image && (
        <div className={styles.media}>
          <Image
            src={image.src}
            alt={image.alt}
            fill
            sizes="(max-width: 767px) 100vw, 400px"
            style={{ objectFit: "contain" }}
          />
        </div>
      )}

      <p className={styles.lead}>{ru.lead}</p>

      {badges.length > 0 && (
        <DietaryBadges items={badges} labels={BADGE_LABELS_RU} />
      )}
      {ru.elements.length > 0 && (
        <PeriodicElements items={ru.elements} heading="Ключевые компоненты" />
      )}

      <section className={styles.section}>
        <h3 className={styles.title}>Как применять</h3>
        <p className={styles.text}>{ru.howToUse}</p>
      </section>

      <section className={styles.section}>
        <h3 className={styles.title}>Производство и хранение</h3>
        <ManufacturingDetails
          data={{
            countryOfOrigin: ru.manufacturing.country,
            shippingWeight: "",
            expiration: ru.manufacturing.expiration,
            storage: ru.manufacturing.storage,
            ingredients: ru.manufacturing.ingredients ?? "",
            supplementFacts: { servingLabel: "", rows: [] },
          }}
          labels={{
            country: "Страна происхождения",
            weight: "Вес",
            expiration: "Срок годности",
            storage: "Условия хранения",
            ingredients: "Состав",
          }}
        />
      </section>

      {hasFacts && ru.facts && (
        <section className={styles.section}>
          <h3 className={styles.title}>Пищевая ценность</h3>
          <SupplementFacts
            data={{
              servingLabel: ru.facts.servingLabel,
              rows: ru.facts.rows.map((r) => ({
                name: r.name,
                amount: r.amount,
                dv: r.dv ?? "",
              })),
            }}
            labels={{
              perServing: "В одной порции",
              dv: "% от суточной нормы",
              footnote:
                "* Процент от рекомендуемой суточной нормы потребления.",
            }}
          />
        </section>
      )}

      <section className={styles.section}>
        <h3 className={styles.title}>Полное описание</h3>
        {paragraphs.map((p, i) => (
          <p className={styles.text} key={i}>
            {p}
          </p>
        ))}
      </section>

      <p className={styles.disclaimer}>{DISCLAIMERS.supplement}</p>
    </div>
  );
}
