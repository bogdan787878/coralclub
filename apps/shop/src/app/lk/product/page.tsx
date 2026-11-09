import { Suspense } from "react";
import { LkProduct } from "@/components/lk/catalog/LkProduct";

/** Страница товара кабинета: код товара в адресе (/lk/product/?code=…), данные — API каталога. */
export default function Page() {
  return (
    <Suspense fallback={null}>
      <LkProduct />
    </Suspense>
  );
}
