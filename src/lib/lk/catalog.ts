/** Товары из API кабинета: из общего пакета @coral/api. */
import "./config";
import { money, type Product } from "@coral/api";

export { HYDRATION_CODES, fetchProducts, normalizeProduct } from "@coral/api";
export type LkProduct = Product;
export const rub = money;
