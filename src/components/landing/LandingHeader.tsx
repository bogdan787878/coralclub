import { CoralClubLogo } from "./CoralClubLogo";
import styles from "./LandingHeader.module.css";

/** Standalone landing header: just the logo, linking to the main shop.
 *  No cart / account / tab bar — those live on the main site. */
export function LandingHeader({ homeHref }: { homeHref: string }) {
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
    </header>
  );
}
