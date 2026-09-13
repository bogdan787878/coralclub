import type { AnchorHTMLAttributes, ButtonHTMLAttributes, ReactNode } from "react";
import styles from "./Chips.module.css";

export type ChipsProps = {
  children: ReactNode;
  className?: string;
  "aria-label"?: string;
};

/**
 * Chips — a horizontally-scrolling row of pill buttons/links, no snap or
 * scrollbar. Purely structural; each item is a <Chip>.
 */
export function Chips({ children, className, ...rest }: ChipsProps) {
  return (
    <div className={[styles.row, className].filter(Boolean).join(" ")} {...rest}>
      {children}
    </div>
  );
}

type CommonChipProps = {
  /** Marks the chip as the current selection/section. */
  active?: boolean;
  children: ReactNode;
  className?: string;
};

type ChipAsButton = CommonChipProps &
  Omit<ButtonHTMLAttributes<HTMLButtonElement>, keyof CommonChipProps> & {
    href?: undefined;
  };

type ChipAsLink = CommonChipProps &
  Omit<AnchorHTMLAttributes<HTMLAnchorElement>, keyof CommonChipProps> & {
    /** When set, the chip renders as an `<a>` — e.g. a same-page `#anchor`. */
    href: string;
  };

export type ChipProps = ChipAsButton | ChipAsLink;

/** Chip — one pill in a <Chips> row. Renders as a link when `href` is set,
 *  otherwise a button. */
export function Chip({ active = false, className, children, ...rest }: ChipProps) {
  const cls = [styles.chip, active && styles.chipActive, className].filter(Boolean).join(" ");

  if ("href" in rest && rest.href !== undefined) {
    const { href, ...anchorRest } = rest as AnchorHTMLAttributes<HTMLAnchorElement> & {
      href: string;
    };
    return (
      <a href={href} className={cls} {...anchorRest}>
        {children}
      </a>
    );
  }

  return (
    <button type="button" className={cls} {...(rest as ButtonHTMLAttributes<HTMLButtonElement>)}>
      {children}
    </button>
  );
}
