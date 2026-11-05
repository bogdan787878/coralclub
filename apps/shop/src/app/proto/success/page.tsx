import { Button, Container, Heading, Section } from "@/components/ui";
import { ProtoHeader } from "@/components/proto/ProtoHeader";
import styles from "./page.module.css";

function CheckIcon() {
  return (
    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M4 12.5l5 5L20 7" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

/**
 * /proto/success — the end of the demo flow. No real order was placed
 * (this whole /proto tree is a prototype), just a clean stop so "Перейти
 * к оплате" doesn't dead-end.
 */
export default function ProtoSuccessPage() {
  return (
    <main>
      <ProtoHeader step="checkout" />
      <Section tone="surface">
        <Container>
          <div className={styles.wrap}>
            <span className={styles.icon}>
              <CheckIcon />
            </span>
            <Heading className={styles.title}>Заказ оформлен</Heading>
            <p className={styles.body}>
              Это прототип флоу оформления заказа без регистрации — на этом демонстрация
              заканчивается. Реальная оплата не выполнялась.
            </p>
            <Button href="/proto" className={styles.cta}>
              Начать заново
            </Button>
          </div>
        </Container>
      </Section>
    </main>
  );
}
