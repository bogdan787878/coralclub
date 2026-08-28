import type { CSSProperties, ElementType, HTMLAttributes } from "react";
import styles from "./Stack.module.css";

/**
 * `base` = 24 (block rhythm), `text` = 16 (text rhythm).
 * A number is treated as pixels; a string is used verbatim (e.g. "var(--space-8)").
 */
type StackGap = "base" | "text" | number | string;

type StackProps = HTMLAttributes<HTMLElement> & {
  as?: ElementType;
  gap?: StackGap;
  direction?: "column" | "row";
};

function resolveGap(gap: StackGap): string {
  if (gap === "base") return "var(--gap-base)";
  if (gap === "text") return "var(--gap-text)";
  if (typeof gap === "number") return `${gap}px`;
  return gap;
}

/** Flexbox stack with the design-system gap scale. */
export function Stack({
  as: Tag = "div",
  gap = "base",
  direction = "column",
  className,
  style,
  ...rest
}: StackProps) {
  const cls = [styles.stack, direction === "row" && styles.row, className]
    .filter(Boolean)
    .join(" ");
  return (
    <Tag
      className={cls}
      style={{ ["--stack-gap" as string]: resolveGap(gap), ...style } as CSSProperties}
      {...rest}
    />
  );
}
