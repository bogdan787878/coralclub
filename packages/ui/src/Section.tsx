import type { ElementType, HTMLAttributes } from "react";
import styles from "./Section.module.css";

type SectionTone = "default" | "surface" | "primary";

type SectionProps = HTMLAttributes<HTMLElement> & {
  as?: ElementType;
  /** Background treatment. */
  tone?: SectionTone;
};

/**
 * Vertical rhythm band: applies the page block padding (top/bottom = 32)
 * and an optional background tone from the palette.
 */
export function Section({
  as: Tag = "section",
  tone = "default",
  className,
  ...rest
}: SectionProps) {
  const cls = [styles.section, styles[`tone-${tone}`], className]
    .filter(Boolean)
    .join(" ");
  return <Tag className={cls} {...rest} />;
}
