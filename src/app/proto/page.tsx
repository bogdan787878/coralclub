"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { Button, Container, Heading, Section } from "@/components/ui";
import { PriceSelector } from "@/components/organisms";
import { ProtoHeader } from "@/components/proto/ProtoHeader";
import { ProtoPriceBlock } from "@/components/proto/ProtoPriceBlock";
import { setLine, type ProtoVariant } from "@/lib/protoCart";
import { asset } from "@/lib/asset";
import styles from "./page.module.css";

const PRODUCT_NAME = "Promarine Collagen Tripeptides";
const IMAGE = asset("/images/products/promarine-collagen-tripeptides-pack.png");

/** Single pack = 10 vials. Course = 3 packs (30 vials). */
const SINGLE_PRICE_WAS = 6900;
const SINGLE_PRICE = 5520; // −20% club price
const COURSE_PRICE_WAS = SINGLE_PRICE * 3; // "same thing bought x3 separately"
const COURSE_PRICE = 14490;
const COURSE_SAVINGS = COURSE_PRICE_WAS - COURSE_PRICE;

export default function ProtoPdpPage() {
  const router = useRouter();
  const [variant, setVariant] = useState<ProtoVariant>("single");

  const isCourse = variant === "course";
  const price = isCourse ? COURSE_PRICE : SINGLE_PRICE;
  const priceWas = isCourse ? COURSE_PRICE_WAS : SINGLE_PRICE_WAS;

  const addToCart = () => {
    setLine({
      variant,
      name: PRODUCT_NAME,
      variantLabel: isCourse ? "Курс — 30 шт (3 упаковки по 10 флаконов)" : "1 упаковка — 10 флаконов",
      image: IMAGE,
      price,
      priceWas,
      qty: 1,
    });
    router.push("/proto/cart");
  };

  return (
    <main>
      <ProtoHeader step="pdp" />

      <Section tone="surface">
        <Container>
          <div className={styles.layout}>
            <div className={styles.media}>
              <Image src={IMAGE} alt={PRODUCT_NAME} fill sizes="(max-width: 1023px) 100vw, 480px" priority />
            </div>

            <div className={styles.info}>
              <span className={styles.category}>Кожа, волосы, ногти</span>
              <Heading className={styles.name}>{PRODUCT_NAME}</Heading>

              <p className={styles.releaseForm}>
                Форма выпуска: <b>1 упаковка по 10 флаконов</b>
              </p>

              <div className={styles.selectorLabel}>Выберите объём</div>
              <PriceSelector
                options={[
                  { id: "single", label: "10 шт", note: "1 упаковка", price: `${SINGLE_PRICE.toLocaleString("ru-RU")} ₽` },
                  { id: "course", label: "Курс — 30 шт", note: "3 упаковки", price: `${COURSE_PRICE.toLocaleString("ru-RU")} ₽` },
                ]}
                value={variant}
                onChange={(id) => setVariant(id as ProtoVariant)}
              />

              <div className={styles.priceWrap}>
                <ProtoPriceBlock
                  price={price}
                  priceWas={priceWas}
                  extraTag={isCourse ? `Выгода курса −${COURSE_SAVINGS.toLocaleString("ru-RU")} ₽` : undefined}
                />
              </div>

              <Button variant="primary" className={styles.cta} onClick={addToCart}>
                Добавить в корзину
              </Button>
            </div>
          </div>
        </Container>
      </Section>
    </main>
  );
}
