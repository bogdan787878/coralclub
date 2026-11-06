"use client";

import { useEffect, useState } from "react";
import { getStore } from "@coral/cart/store";
import { Accent, Container, Heading, Section } from "@/components/ui";
import { Carousel, CommunityReels, Editorial, Hero, ProductCard } from "@/components/organisms";
import { FriendAdvisors } from "@/components/friend/FriendAdvisors";
import { ShopSkeleton } from "@/components/lk/LkShop";
import { HOME_CONTENT, type EditorialItem } from "@/content/home";
import { useCart } from "@/lib/cart";
import { fetchProducts, rub, type LkProduct } from "@/lib/lk/catalog";
import grid from "@/components/friend/FriendGrid.module.css";
import styles from "@/components/friend/Friend.module.css";

/** Раздел «Гидратация» магазина РФ: наборы и продукты по одному (как на главной «Друга клуба»). */
const SETS = [80720, 80380, 91800];
const SINGLES = [2201, 2221, 91883, 225115];

/** Карточка товара участника: цена участника, обычная зачёркнута; корзина — общее хранилище (бейдж в Layout). */
function MemberCard({ p, qty }: { p: LkProduct; qty: number }) {
  const store = getStore();
  const club = p.club !== null ? rub(p.club, p.currency) : "Цена при оформлении";
  const off = p.club !== null && p.retail && p.retail > p.club ? Math.round((1 - p.club / p.retail) * 100) : 0;
  const title = p.note ? `${p.name} – ${p.note}` : p.name;
  return (
    <ProductCard
      fluid
      title={title}
      tag={p.badges[0]}
      price={club}
      priceWas={off ? rub(p.retail ?? 0, p.currency) : undefined}
      priceTag={off ? `−${off}%` : undefined}
      images={p.image ? [{ src: p.image, alt: p.name }] : []}
      cartQty={qty}
      onSetQty={(next) => void store.setQty(String(p.code), next)}
      onAddToCart={() => void store.add(p.code, 1)}
    />
  );
}

function Cards({ codes, products, label, failed, onRetry }: { codes: number[]; products: Map<number, LkProduct> | null; label: string; failed: boolean; onRetry: () => void }) {
  const cart = useCart(); // копия корзины участника (обновляет Layout)
  const list = codes.map((c) => products?.get(c)).filter((p): p is LkProduct => !!p && p.available);
  if (failed || (products && !list.length)) {
    return (
      <Container>
        <p className={styles.lead}>
          Не удалось загрузить товары.{" "}
          <button type="button" onClick={onRetry} style={{ textDecoration: "underline", font: "inherit", background: "none", border: 0, padding: 0, cursor: "pointer" }}>
            Повторить
          </button>
        </p>
      </Container>
    );
  }
  if (!products) {
    return (
      <Container>
        <ShopSkeleton n={2} />
      </Container>
    );
  }
  return (
    <Carousel label={label} maxCols={4} minCols={2} stretchFew>
      {list.map((p) => (
        <MemberCard key={p.code} p={p} qty={cart.find((l) => l.coralId === String(p.code))?.qty ?? 0} />
      ))}
    </Carousel>
  );
}

/**
 * Главная участника: интерфейс главной «Друга клуба» (Hero, наборы, по одному, статьи, научный совет, ролики) на
 * русском, с товарами и ценами участника из API кабинета. Корзина — общая (Layout и приложение корзины).
 */
export function LkHome() {
  // null — ещё грузим; пустой ответ каталога — показываем повтор вместо вечного шимера
  const [products, setProducts] = useState<Map<number, LkProduct> | null>(null);
  const [failed, setFailed] = useState(false);
  const [attempt, setAttempt] = useState(0);
  useEffect(() => {
    let alive = true;
    fetchProducts([...SETS, ...SINGLES]).then((list) => {
      if (!alive) return;
      setProducts(new Map(list.map((p) => [p.code, p])));
      setFailed(list.length === 0);
    });
    return () => {
      alive = false;
    };
  }, [attempt]);
  const retry = () => {
    setProducts(null);
    setFailed(false);
    setAttempt((n) => n + 1);
  };

  const hydration = HOME_CONTENT.hydration;
  const [water, minerals] = hydration.sections.filter((x): x is EditorialItem => x.kind === "editorial");
  const { hero, reels } = hydration;

  return (
    <div className={`appShell ${grid.home}`}>
      <main className={styles.page} data-analytics-location="home">
        <Hero
          title={
            <>
              Утро начинается
              <br />
              <Accent>с воды</Accent>
            </>
          }
          body={<p>Гидратация — первый шаг программы Coral Club: на нём строится всё остальное.</p>}
          image={hero.image}
          cta={{ label: "Выбрать набор", href: "#hydration" }}
        />

        <Section id="hydration" tone="default" className={styles.section}>
          <Container>
            <Heading as="h2" className={styles.h2}>
              Вода сама не увлажняет. <Accent>Увлажняют минералы.</Accent>
            </Heading>
            <p className={styles.lead}>Обычная вода быстро уходит из организма — удержать её помогают минералы и электролиты.</p>
          </Container>
          <Cards codes={SETS} products={products} label="Наборы для гидратации" failed={failed} onRetry={retry} />
        </Section>

        <Section tone="surface" className={styles.section}>
          <Container>
            <Heading as="h2" className={styles.h2}>
              Или <Accent>по одному</Accent>
            </Heading>
          </Container>
          <Cards codes={SINGLES} products={products} label="Продукты для гидратации" failed={failed} onRetry={retry} />
        </Section>

        {water && (
          <Editorial
            title={{ lead: "Вы на 90% состоите из воды.", accent: "От неё зависит всё остальное." }}
            image={water.image}
            badge="90% воды"
            body={
              <>
                <p>Большинство добавок пропускают первый шаг — воду, которую вы пьёте каждый день.</p>
                <p>
                  Можно принимать лучшие добавки, но при обезвоживании организм их просто не усваивает. Поэтому Coral Club
                  начинает с главного: с воды, которую вы пьёте ежедневно. Всё остальное строится на этом.
                </p>
              </>
            }
          />
        )}

        {minerals && (
          <Editorial
            title={{ lead: "Минералы с японских островов,", accent: "где живут до 100 лет" }}
            image={minerals.image}
            badge={
              <>
                <span aria-hidden="true">🇯🇵 </span>Окинава, Япония
              </>
            }
            body={
              <p>
                У берегов Окинавы, одной из пяти «голубых зон» планеты, лежит ископаемый коралл Санго — природный источник
                кальция, магния и более 70 микроэлементов.
              </p>
            }
          />
        )}

        <FriendAdvisors lang="ru" />

        <CommunityReels
          title={{ lead: "Доказательство не на этикетке.", accent: "Оно в сообществе." }}
          body="Настоящие участники и их привычки. Чаще всего в Coral Club приходят потому, что раньше пришёл тот, кому они доверяют."
          reels={reels.reels}
        />

        <footer className={styles.footer} data-analytics-location="footer">
          <Container>
            <p>
              Биологически активные добавки не являются лекарственными средствами и не заменяют разнообразное питание и
              здоровый образ жизни. Не превышайте рекомендуемую суточную дозу. Хранить в недоступном для детей месте.
            </p>
          </Container>
        </footer>
      </main>
    </div>
  );
}
