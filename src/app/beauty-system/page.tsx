import type { Metadata } from "next";
import { Container, Heading, Section } from "@/components/ui";
import { SiteFooter, SiteHeader, TabBar } from "@/components/organisms";
import { BeautyGrid } from "@/components/landing/BeautyGrid";
import { BEAUTY_SLUGS } from "@/lib/beautySystem";
import { getProductCards } from "@/lib/products";
import styles from "./page.module.css";

export const metadata: Metadata = {
  title: "Система красоты — Coral Club",
  // hidden section: reachable from /landing only, not indexed
  robots: { index: false, follow: false },
};


/**
 * /beauty-system — the hidden "Система красоты" section the /landing cards
 * open into. Not linked from the main navigation; purchasing needs no
 * account (the local cart hands off to the basket as a guest).
 */
export default function BeautySystemPage() {
  const cards = getProductCards([...BEAUTY_SLUGS]);

  return (
    <div className="appShell">
      <main className={styles.page}>
        <SiteHeader />
        <Section tone="surface">
          <Container>
            <Heading className={styles.title}>Система красоты</Heading>
            <p className={styles.note}>
              Продукты системы красоты. Покупка без регистрации — добавьте в корзину и оформите заказ.
            </p>
            <p className={styles.promo}>
              Промокод <b>LABSPACE15</b> — специальная скидка на продукты Системы Красоты.
            </p>
            <BeautyGrid cards={cards} />
          </Container>
        </Section>
        <SiteFooter />
        <TabBar />
      </main>
    </div>
  );
}
