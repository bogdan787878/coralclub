import styles from "./LkShop.module.css";

/** Шимер сетки карточек товаров на время загрузки (каталог, главная, страница товара кабинета). */
export function ShopSkeleton({ n }: { n: number }) {
  return (
    <div className={styles.grid} role="status" aria-label="Загрузка">
      {Array.from({ length: n }, (_, i) => (
        <i key={i} className={styles.sk} />
      ))}
    </div>
  );
}
