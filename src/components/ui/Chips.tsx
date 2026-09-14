import { forwardRef } from "react";
import type { AnchorHTMLAttributes, ButtonHTMLAttributes, ReactNode, Ref } from "react";
import styles from "./Chips.module.css";

export type ChipsProps = {
  children: ReactNode;
  className?: string;
  "aria-label"?: string;
};

/**
 * Chips — a horizontally-scrolling row of pill buttons/links, no snap or
 * scrollbar. Purely structural; each item is a <Chip>. Forwards its ref
 * to the scroll container itself (e.g. for a scrollspy nav that needs to
 * scroll the row programmatically).
 */
export const Chips = forwardRef<HTMLDivElement, ChipsProps>(function Chips(
  { children, className, ...rest },
  ref
) {
  return (
    <div ref={ref} className={[styles.row, className].filter(Boolean).join(" ")} {...rest}>
      {children}
    </div>
  );
});

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
 *  otherwise a button. Forwards its ref to the underlying <a>/<button>
 *  (e.g. for a scrollspy nav that needs to measure/scroll to a chip). */
export const Chip = forwardRef<HTMLAnchorElement | HTMLButtonElement, ChipProps>(
  function Chip({ active = false, className, children, ...rest }, ref) {
    const cls = [styles.chip, active && styles.chipActive, className].filter(Boolean).join(" ");

    if ("href" in rest && rest.href !== undefined) {
      const { href, ...anchorRest } = rest as AnchorHTMLAttributes<HTMLAnchorElement> & {
        href: string;
      };
      return (
        <a
          ref={ref as Ref<HTMLAnchorElement>}
          href={href}
          className={cls}
          {...anchorRest}
        >
          {children}
        </a>
      );
    }

    return (
      <button
        ref={ref as Ref<HTMLButtonElement>}
        type="button"
        className={cls}
        {...(rest as ButtonHTMLAttributes<HTMLButtonElement>)}
      >
        {children}
      </button>
    );
  }
);
