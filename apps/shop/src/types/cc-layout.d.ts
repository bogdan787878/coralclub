// <cc-layout> (пакет @coral/layout) в JSX: веб-компонент, подключается скриптом layout.js по адресу.
import type { DetailedHTMLProps, HTMLAttributes } from "react";

declare module "react" {
  namespace JSX {
    interface IntrinsicElements {
      "cc-layout": DetailedHTMLProps<HTMLAttributes<HTMLElement>, HTMLElement> & { active?: string; parts?: string; links?: string };
    }
  }
}

declare global {
  interface Window {
    coralLayout?: { version: string; cart: { add(code: number, qty?: number): Promise<void>; open(): void; close(): void; count(): number; refresh(): Promise<void> } };
  }
}
