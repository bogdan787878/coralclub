import type { CSSProperties } from "react";
import { ICONS, STROKE, type IconName } from "@coral/icons";

/**
 * Icon — иконка из общей библиотеки продукта (@coral/icons, рисунки Lucide), та же, что в Layout, корзине и кабинете.
 * Размер по умолчанию 24; цвет — currentColor.
 */
export function Icon({ name, size = 24, className, style, label }: { name: IconName; size?: number; className?: string; style?: CSSProperties; label?: string }) {
  return (
    <svg
      className={className}
      style={style}
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={STROKE}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden={label ? undefined : true}
      aria-label={label}
      role={label ? "img" : undefined}
      // разметка из сгенерированного набора иконок (packages/icons/src/icons.ts), не из данных пользователя
      dangerouslySetInnerHTML={{ __html: ICONS[name] }}
    />
  );
}
export type { IconName };
