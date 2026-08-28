import type { ElementType, HTMLAttributes } from "react";
import styles from "./Container.module.css";

type ContainerProps = HTMLAttributes<HTMLElement> & {
  /** Rendered element. Defaults to `div`. */
  as?: ElementType;
};

/**
 * Horizontal layout frame: centers content, caps width at the mobile
 * canvas and applies the page inline padding (left/right = 16).
 */
export function Container({
  as: Tag = "div",
  className,
  ...rest
}: ContainerProps) {
  return (
    <Tag
      className={className ? `${styles.container} ${className}` : styles.container}
      {...rest}
    />
  );
}
