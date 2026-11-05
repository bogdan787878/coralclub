"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { Button, Container, Heading, Section } from "@/components/ui";
import { InfoAccordion, PeriodicElements, PriceSelector } from "@/components/organisms";
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

const fmt = (n: number) => `${n.toLocaleString("ru-RU")} ₽`;

const DESCRIPTION =
  "Современная форма коллагена для лёгкого усвоения: жидкие трипептиды MAXICOLLAGEN в сочетании с растительными экстрактами, витаминами и гиалуроновой кислотой — для гладкой, сияющей кожи, крепких волос и ногтей.";

const TAGS = ["Без лактозы", "Халяль", "Без сои", "Пескетарианцам", "Сделано на Тайване"];

const ELEMENTS = [
  { symbol: "C", name: "Витамин C" },
  { symbol: "B2", name: "Витамин B2" },
  { symbol: "B6", name: "Витамин B6" },
  { symbol: "B7", name: "Биотин" },
];

const BENEFITS = [
  {
    title: "Трипептиды — быстрее и легче",
    text: "Молекула трипептида примерно в 4 раза меньше пептида коллагена, поэтому усваивается проще.",
  },
  {
    title: "Гиалуроновая кислота",
    text: "Увлажняет кожу изнутри, делая её более гладкой и наполненной.",
  },
  {
    title: "Витамины C, B2, B6 и биотин",
    text: "Витамин C необходим для синтеза коллагена, витамины группы B поддерживают кожу, волосы и ногти.",
  },
  {
    title: "Гибискус, белая смородина, шпинат",
    text: "Растительные экстракты поддерживают упругость кожи и выравнивают её тон.",
  },
  {
    title: "Удобный формат",
    text: "Жидкая форма даёт точную дозировку и удобна в дороге. Вместо сахара — концентраты яблочного и черничного сока.",
  },
];

const FACTS = [
  ["Витамин C (L-аскорбиновая кислота)", "100 мг", "111%"],
  ["Рибофлавин (витамин B2)", "1,7 мг", "131%"],
  ["Витамин B6 (пиридоксина гидрохлорид)", "1,8 мг", "106%"],
  ["Биотин", "50 мкг", "167%"],
  ["Гидролизованный коллаген рыбы (MAXICOLLAGEN)", "15 г", ""],
  ["в т. ч. трипептиды", "3,5 г", ""],
  ["Экстракт цветков гибискуса", "1,5 г", ""],
  ["Экстракт плодов белой смородины", "700 мг", ""],
  ["Гиалуроновая кислота (гиалуронат натрия)", "72 мг", ""],
  ["Листья шпината", "1 мг", ""],
];

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

              <p className={styles.desc}>{DESCRIPTION}</p>

              <div className={styles.selectorLabel}>Выберите объём</div>
              <PriceSelector
                options={[
                  { id: "single", label: "10 шт", note: "1 упаковка", price: fmt(SINGLE_PRICE) },
                  { id: "course", label: "Курс — 30 шт", note: "3 упаковки", price: fmt(COURSE_PRICE), priceWas: fmt(COURSE_PRICE_WAS) },
                ]}
                value={variant}
                onChange={(id) => setVariant(id as ProtoVariant)}
              />

              <div className={styles.priceWrap}>
                <ProtoPriceBlock price={price} priceWas={priceWas} />
              </div>

              <Button variant="primary" className={styles.cta} onClick={addToCart}>
                Добавить в корзину
              </Button>

              <ul className={styles.tags}>
                {TAGS.map((t) => (
                  <li className={styles.tagItem} key={t}>
                    {t}
                  </li>
                ))}
              </ul>

              <div className={styles.block}>
                <PeriodicElements items={ELEMENTS} heading="Ключевые компоненты" />
              </div>

              <div className={styles.block}>
                <h3 className={styles.blockTitle}>Почему это работает</h3>
                <ul className={styles.benefits}>
                  {BENEFITS.map((b) => (
                    <li className={styles.benefit} key={b.title}>
                      <span className={styles.benefitTitle}>{b.title}</span>
                      <span className={styles.benefitText}>{b.text}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <div className={styles.block}>
                <InfoAccordion
                  items={[
                    {
                      title: "Как применять",
                      content: (
                        <p>
                          Взрослым — 1 флакон (50 мл) в день во время еды. Курс — 10–30 дней, при необходимости
                          повторить. Упаковка из 10 флаконов рассчитана на 10 дней приёма, курс из 30 флаконов — на
                          30 дней.
                        </p>
                      ),
                    },
                    {
                      title: "Состав",
                      content: (
                        <p>
                          Жидкий гидролизованный коллаген рыбы MaxiCollagen с трипептидами, экстракт цветков
                          гибискуса, экстракт плодов белой смородины, витамин C (L-аскорбиновая кислота),
                          гиалуроновая кислота, витамин B6 (пиридоксина гидрохлорид), витамин B2 (рибофлавин),
                          листья шпината, биотин, вспомогательные вещества (концентраты яблочного и черничного
                          сока, натуральные ароматизаторы, растительные подсластители).
                        </p>
                      ),
                    },
                    {
                      title: "Пищевая ценность",
                      content: (
                        <div>
                          <p>В 1 флаконе (50 мл):</p>
                          <table className={styles.facts}>
                            <thead>
                              <tr>
                                <th>Компонент</th>
                                <th>Количество</th>
                                <th>% от суточной нормы</th>
                              </tr>
                            </thead>
                            <tbody>
                              {FACTS.map(([name, amount, dv]) => (
                                <tr key={name}>
                                  <td>{name}</td>
                                  <td>{amount}</td>
                                  <td>{dv || "—"}</td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      ),
                    },
                    {
                      title: "Производство и хранение",
                      content: (
                        <p>
                          Страна происхождения: Тайвань. Срок годности — 2 года со дня производства. Хранить в
                          сухом месте, защищённом от прямого солнечного света, недоступном для детей, при
                          температуре не выше +25 °C.
                        </p>
                      ),
                    },
                  ]}
                />
              </div>

              <p className={styles.disclaimer}>
                Биологически активная добавка. Не является лекарственным средством. Перед применением
                проконсультируйтесь со специалистом.
              </p>
            </div>
          </div>
        </Container>
      </Section>
    </main>
  );
}
