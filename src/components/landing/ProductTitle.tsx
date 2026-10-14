import type { LandingProductRu } from "@/lib/landingCatalogRu";
import styles from "./ProductTitle.module.css";

/**
 * ProductTitle — "Название – форма выпуска", with the pack detail in grey:
 *   Промарин Пептиды Коллагена – 10 флаконов в упаковке
 *   Гидрамакс – Курс на 1 мес.
 *   Маска Hydro Boost – 5 шт. в наборе
 */
export function ProductTitle({
  title,
  form,
}: Pick<LandingProductRu, "title" | "form">) {
  return (
    <>
      {title} – {form.label}
      {form.note && <span className={styles.note}> ({form.note})</span>}
    </>
  );
}
