"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { Button, Container, Heading, Section } from "@/components/ui";
import { ProtoHeader } from "@/components/proto/ProtoHeader";
import { AccountPerksBlock } from "@/components/proto/AccountPerksBlock";
import { formatRub, protoCartTotal, useProtoCart } from "@/lib/protoCart";
import styles from "./page.module.css";

const DELIVERY = 300;

export default function ProtoCartPage() {
  const router = useRouter();
  const lines = useProtoCart();
  const [createAccount, setCreateAccount] = useState(true);
  const subtotal = protoCartTotal(lines);
  const total = lines.length ? subtotal + DELIVERY : 0;

  return (
    <main>
      <ProtoHeader step="cart" />

      <Section tone="surface">
        <Container>
          <div className={styles.layout}>
            <Heading className={styles.title}>Корзина</Heading>

            {lines.length === 0 ? (
              <div className={styles.empty}>
                <p>Корзина пуста.</p>
                <Link href="/proto">Вернуться к товару</Link>
              </div>
            ) : (
              <>
                {lines.map((l) => (
                  <div className={styles.line} key={l.variant}>
                    <div className={styles.thumb}>
                      <Image src={l.image} alt={l.name} fill sizes="88px" />
                    </div>
                    <div className={styles.lineBody}>
                      <span className={styles.lineName}>{l.name}</span>
                      <span className={styles.lineVariant}>{l.variantLabel}</span>
                      <div className={styles.linePriceRow}>
                        <span className={styles.linePrice}>{formatRub(l.price)}</span>
                        <span className={styles.linePriceWas}>{formatRub(l.priceWas)}</span>
                      </div>
                    </div>
                  </div>
                ))}

                <AccountPerksBlock checked={createAccount} onChange={setCreateAccount} />

                <div className={styles.summary}>
                  <div className={styles.summaryRow}>
                    <span>Товары</span>
                    <span>{formatRub(subtotal)}</span>
                  </div>
                  <div className={styles.summaryRow}>
                    <span>Доставка</span>
                    <span>{formatRub(DELIVERY)}</span>
                  </div>
                  <div className={styles.summaryRow}>
                    <span>Итого</span>
                    <span className={styles.summaryTotal}>{formatRub(total)}</span>
                  </div>
                </div>

                <Button
                  variant="primary"
                  className={styles.cta}
                  onClick={() => router.push("/proto/checkout")}
                >
                  Перейти к оформлению
                </Button>
              </>
            )}
          </div>
        </Container>
      </Section>
    </main>
  );
}
