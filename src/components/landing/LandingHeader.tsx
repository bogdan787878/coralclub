import type { ReactNode } from "react";
import { CoralClubLogo } from "./CoralClubLogo";
import styles from "./LandingHeader.module.css";

/** Standalone landing header: just the logo, linking to the main shop.
 *  No cart / account / tab bar — those live on the main site. `end` is an
 *  optional control at the right edge (the checkout puts the country there). */
export function LandingHeader({
  homeHref,
  end,
}: {
  homeHref: string;
  end?: ReactNode;
}) {
  return (
    <header className={styles.root} data-analytics-location="header">
      <a
        href={homeHref}
        className={styles.brand}
        aria-label="Coral Club"
        data-analytics-id="header_logo"
      >
        <CoralClubLogo className={styles.logo} />
      </a>
      {end && (
        <div
          style={{
            position: "absolute",
            top: "50%",
            right: "var(--page-padding-inline)",
            transform: "translateY(-50%)",
          }}
        >
          {end}
        </div>
      )}
    </header>
  );
}
