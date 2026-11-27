import type { ReactNode } from "react";
import styles from "./Consent.module.css";

/**
 * Checkbox: флажок с текстом — как в оформлении заказа (согласия, подписка, фильтры). `attention` обводит
 * пропущенный обязательный флажок, `shake` встряхивает его один раз; `name` — `data-field`, к которому
 * прокручивает форма. Consent — то же самое (прежнее имя, для согласий).
 */
export function Checkbox({
  checked,
  onChange,
  children,
  name,
  shake,
  attention,
}: {
  checked: boolean;
  onChange: (checked: boolean) => void;
  children: ReactNode;
  name?: string;
  shake?: boolean;
  attention?: boolean;
}) {
  return (
    <label
      className={[
        styles.check,
        shake ? styles.shake : "",
        attention ? styles.checkActive : "",
      ]
        .filter(Boolean)
        .join(" ")}
      data-field={name}
    >
      <input
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
      />
      <span>{children}</span>
    </label>
  );
}

/** Флажок согласия (условия, персональные данные) — тот же Checkbox. */
export const Consent = Checkbox;
