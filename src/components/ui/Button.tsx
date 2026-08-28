import type {
  AnchorHTMLAttributes,
  ButtonHTMLAttributes,
  ReactNode,
} from "react";
import Link from "next/link";
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
 * With `href` it renders a link: internal paths ("/...") use next/link for
 * client-side navigation; anything else (external URLs, "#" anchors) stays a
 * plain `<a>` for redirect-based flows.
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
    const anchorProps = rest as AnchorHTMLAttributes<HTMLAnchorElement> & {
      href: string;
    };
    if (anchorProps.href.startsWith("/")) {
      return (
        <Link className={cls} {...anchorProps}>
          {children}
        </Link>
      );
    }
    return (
      <a className={cls} {...anchorProps}>
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
