import type {
  AnchorHTMLAttributes,
  ButtonHTMLAttributes,
  ReactNode,
} from "react";
import styles from "./Button.module.css";

type Variant = "primary" | "secondary" | "ghost";

type CommonProps = {
  variant?: Variant;
  /** Stretch to the full width of the parent. */
  block?: boolean;
  children: ReactNode;
  className?: string;
};

type ButtonAsButton = CommonProps &
  Omit<ButtonHTMLAttributes<HTMLButtonElement>, keyof CommonProps> & {
    href?: undefined;
  };

type ButtonAsLink = CommonProps &
  Omit<AnchorHTMLAttributes<HTMLAnchorElement>, keyof CommonProps> & {
    /** When set, the button renders as an `<a>` — used for auth / cart redirects. */
    href: string;
  };

type ButtonProps = ButtonAsButton | ButtonAsLink;

/**
 * Button — text token 16/24.
 * Renders an `<a>` when `href` is provided so redirect-based flows
 * (registration, add-to-cart handoff to the external store) stay declarative.
 */
export function Button({
  variant = "primary",
  block = false,
  className,
  children,
  ...rest
}: ButtonProps) {
  const cls = [styles.button, styles[variant], block && styles.block, className]
    .filter(Boolean)
    .join(" ");

  if ("href" in rest && rest.href !== undefined) {
    return (
      <a className={cls} {...(rest as AnchorHTMLAttributes<HTMLAnchorElement>)}>
        {children}
      </a>
    );
  }

  return (
    <button className={cls} {...(rest as ButtonHTMLAttributes<HTMLButtonElement>)}>
      {children}
    </button>
  );
}
