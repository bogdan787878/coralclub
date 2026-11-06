// Веб-компоненты микрофронтендов в JSX: <cc-layout> (пакет @coral/layout) и <cc-cart> (пакет @coral/cart).
// Подключаются скриптами layout.js и cart.js по адресу, не импортом.
import type { DetailedHTMLProps, HTMLAttributes } from "react";

type El = DetailedHTMLProps<HTMLAttributes<HTMLElement>, HTMLElement>;

declare module "react" {
  namespace JSX {
    interface IntrinsicElements {
      "cc-layout": El & { active?: string; parts?: string; links?: string; labels?: string; locale?: string; tabs?: string; header?: string; cart?: string; "cart-key"?: string; "reveal-after"?: string };
      "cc-cart": El & { ref?: React.Ref<HTMLElement>; links?: string; labels?: string; locale?: string; cart?: string; "cart-key"?: string; currency?: string; "money-locale"?: string };
    }
  }
}

declare global {
  interface Window {
    coralLayout?: { version: string; cart: { open(): void; count(): number; refresh(): Promise<void>; add(item: number | string | object, qty?: number): Promise<void> } };
    coralCart?: { version: string; add(item: number | string | object, qty?: number): Promise<void>; count(): number; refresh(): Promise<void> };
  }
}
