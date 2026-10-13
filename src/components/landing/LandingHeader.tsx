import styles from "./LandingHeader.module.css";

/** Standalone landing header: just the wordmark, linking to the main shop.
 *  No cart / account / tab bar — those live on the main site. */
export function LandingHeader({ homeHref }: { homeHref: string }) {
  return (
    <header className={styles.root}>
      <a href={homeHref} className={styles.brand}>
        coralclub
      </a>
    </header>
  );
}
