import type { ElementType, HTMLAttributes } from "react";
import styles from "./Text.module.css";

function cx(...parts: Array<string | false | undefined>) {
  return parts.filter(Boolean).join(" ");
}

/* ---------- Heading (h1 · 28/32 · -2%) ---------- */

type HeadingProps = HTMLAttributes<HTMLHeadingElement> & {
  as?: ElementType;
};

export function Heading({ as: Tag = "h1", className, ...rest }: HeadingProps) {
  return <Tag className={cx(styles.h1, className)} {...rest} />;
}

/* ---------- Body long (14/20) ---------- */

type BodyProps = HTMLAttributes<HTMLParagraphElement> & {
  as?: ElementType;
  muted?: boolean;
};

export function BodyLong({
  as: Tag = "p",
  muted = false,
  className,
  ...rest
}: BodyProps) {
  return (
    <Tag className={cx(styles.bodyLong, muted && styles.muted, className)} {...rest} />
  );
}

/* ---------- Accent (Newton, italic) ---------- */

type AccentProps = HTMLAttributes<HTMLElement> & {
  as?: ElementType;
};

/** Inline editorial emphasis set in Newton Italic. */
export function Accent({ as: Tag = "em", className, ...rest }: AccentProps) {
  return <Tag className={cx(styles.accent, className)} {...rest} />;
}
