/**
 * Чек-аут магазина (/sv-api/*) из общего пакета @coral/api/shop, настроенный на рынок приложения (lib/market.ts).
 * Импорт в приложении прежний: `@/lib/shopApi`.
 */
import { apiLanguage, configureShop } from "@coral/api/shop";
import { MARKET } from "./market";

configureShop({ site: MARKET.site, apiLanguage: MARKET.apiLanguage, linkLanguage: MARKET.linkLanguage });

export * from "@coral/api/shop";
/** The shop's site of the market. */
export const SHOP_SITE: string = MARKET.site;
/** The market's API language. */
export const language: string = apiLanguage();
