"use client";

import { Fragment, useEffect, useRef, useState, type ReactNode } from "react";
import Image from "next/image";
import Link from "next/link";
import type { ProductDetail } from "@coral/api";
import { BodyLong, Button, Container, Heading, Icon, Sheet } from "@/components/ui";
import { DietaryBadges } from "@/components/organisms/DietaryBadges";
import { PeriodicElements } from "@/components/organisms/PeriodicElements";
import { LandingGallery } from "@/components/landing/LandingGallery";
import { Facts } from "@/components/catalog/ProductDetailView";
import { BackButton } from "@/app/(shop)/products/[slug]/BackButton";
import { ShareButton } from "@/app/(shop)/products/[slug]/ShareButton";
import shop from "@/app/(shop)/products/[slug]/page.module.css";
import { addRu, qtyOf, setRuQty, useRuCart } from "@/lib/ru/cart";
import { useRuCity } from "@/lib/ru/city";
import { WAREHOUSES, inStock } from "@/lib/ru/stock";
import { cheapest, daysText, loadDelivery, type DeliveryOption } from "@/lib/ru/delivery";
import { RU_BASE, rub, type RuProduct } from "@/lib/ru/shop";
import { openRuCity } from "./RuCity";
import styles from "./RuPdp.module.css";

/* ------------------------------- описание ------------------------------- */

/** «КАЛИЙ» → «Калий»; заголовки сайта набраны капсом. */
const unshout = (s: string) => (/[a-zа-яё]/.test(s) || !/[A-ZА-ЯЁ]/.test(s) ? s : s.charAt(0) + s.slice(1).toLowerCase());

/** Строка: **жирный** — жирным; ссылки сайта [текст](url) — просто текстом. */
function inline(text: string): ReactNode[] {
  const plain = text.replace(/\[([^\]]+)\]\([^)]+\)/g, "$1");
  return plain.split(/(\*\*[^*]+\*\*)/g).map((part, i) =>
    part.startsWith("**") && part.endsWith("**") ? <strong key={i}>{unshout(part.slice(2, -2))}</strong> : <Fragment key={i}>{part}</Fragment>,
  );
}

/** Полное описание сайта (markdown): абзац из одного **жирного** — заголовок, «- » — список. */
export function RichText({ text }: { text: string }) {
  const blocks = text
    .replace(/\r/g, "")
    .split(/\n\s*\n/)
    .map((b) => b.trim())
    .filter(Boolean);
  return (
    <div className={styles.rich}>
      {blocks.map((b, i) => {
        const heading = /^(\*\*[^*]+\*\*|#{1,4}\s.+)$/.exec(b.replace(/\[([^\]]+)\]\([^)]+\)/g, "$1"));
        if (heading) return <h3 key={i}>{unshout(heading[0].replace(/^#+\s*/, "").replace(/\*\*/g, "").trim())}</h3>;
        const lines = b.split("\n");
        if (lines.every((l) => /^\s*[-•]\s+/.test(l))) {
          return (
            <ul key={i}>
              {lines.map((l, j) => (
                <li key={j}>{inline(l.replace(/^\s*[-•]\s+/, ""))}</li>
              ))}
            </ul>
          );
        }
        return (
          <p key={i}>
            {lines.map((l, j) => (
              <Fragment key={j}>
                {j > 0 && <br />}
                {inline(l.replace(/^\s*[-•]\s+/, "— "))}
              </Fragment>
            ))}
          </p>
        );
      })}
    </div>
  );
}

/** Дисклеймер БАД — сразу после описания. */
const BAD_NOTE = "Биологически активная добавка. Не является лекарственным средством.";

/* ----------------------- теги и ключевые элементы ----------------------- */

/** Теги канона → значки основного магазина (DietaryBadges); «Без ГМО» значка не имеет — не показываем. */
const BADGE_SLUG: Record<string, string> = {
  "Без сои": "soy-free",
  "Без глютена": "gluten-free",
  "Без лактозы": "lactose-free",
  "Содержит лактозу": "contains-lactose",
  "Растительные капсулы": "plant-capsule",
  "Капсулы из говяжьего желатина": "beef-gelatin",
  "Капсулы из рыбьего желатина": "fish-gelatin",
  "Для вегетарианцев": "vegetarian",
  "Для пескетарианцев": "pescatarian",
  Халяль: "halal",
  Кошер: "kosher",
};
const BADGE_LABEL: Record<string, string> = {
  "gluten-free": "Без глютена",
  "soy-free": "Без сои",
  "lactose-free": "Без лактозы",
  "contains-lactose": "Содержит лактозу",
  "plant-capsule": "Растительная капсула",
  "beef-gelatin": "Капсула из говяжьего желатина",
  "fish-gelatin": "Капсула из рыбьего желатина",
  vegetarian: "Для вегетарианцев",
  pescatarian: "Для пескетарианцев",
  halal: "Сертификат «Халяль»",
  kosher: "Сертификат «Кошер»",
};

/** Вещество таблицы состава → плитка «как в таблице Менделеева» (символ и название), как на основном сайте. */
const SYMBOLS: [RegExp, string, string][] = [
  [/^калий/i, "K", "Калий"],
  [/^кальций/i, "Ca", "Кальций"],
  [/^магний/i, "Mg", "Магний"],
  [/^натрий/i, "Na", "Натрий"],
  [/^цинк/i, "Zn", "Цинк"],
  [/^селен/i, "Se", "Селен"],
  [/^железо/i, "Fe", "Железо"],
  [/^йод/i, "I", "Йод"],
  [/^медь/i, "Cu", "Медь"],
  [/^марганец/i, "Mn", "Марганец"],
  [/^хром/i, "Cr", "Хром"],
  [/^кремний/i, "Si", "Кремний"],
  [/^фосфор/i, "P", "Фосфор"],
  [/^серебро/i, "Ag", "Серебро"],
  [/^бор\b/i, "B", "Бор"],
  [/^молибден/i, "Mo", "Молибден"],
  [/^(тиамин|витамин\s*b1\b)/i, "B1", "Витамин B1"],
  [/^(рибофлавин|витамин\s*b2\b)/i, "B2", "Витамин B2"],
  [/^(ниацин|никотинамид|витамин\s*(b3|pp)\b)/i, "B3", "Витамин B3"],
  [/^(пантотенов|витамин\s*b5\b)/i, "B5", "Витамин B5"],
  [/^(пиридоксин|витамин\s*b6\b)/i, "B6", "Витамин B6"],
  [/^(биотин|витамин\s*b7\b)/i, "B7", "Биотин"],
  [/^(фолиев|фолат|витамин\s*b9\b)/i, "B9", "Фолиевая кислота"],
  [/^(цианокобаламин|метилкобаламин|витамин\s*b12\b)/i, "B12", "Витамин B12"],
  [/^витамин\s*[cс]\b/i, "C", "Витамин C"],
  [/^витамин\s*d3/i, "D3", "Витамин D3"],
  [/^витамин\s*d/i, "D", "Витамин D"],
  [/^витамин\s*e\b|^витамин\s*е\b/i, "E", "Витамин E"],
  [/^витамин\s*a\b|^витамин\s*а\b/i, "A", "Витамин A"],
  [/^витамин\s*k2/i, "K2", "Витамин K2"],
  [/^коллаген|^гидролизованный коллаген/i, "Col", "Коллаген"],
  [/^коэнзим|^убихинон/i, "Q10", "Коэнзим Q10"],
  [/^(омега|эпк|дгк|эйкозапентаен|докозагексаен)/i, "Ω3", "Омега-3"],
  [/^гиалурон/i, "HA", "Гиалуроновая кислота"],
  [/^куркумин/i, "Cur", "Куркумин"],
  [/^l-?карнитин|^карнитин/i, "Car", "Карнитин"],
  [/^(мсм|метилсульфонилметан)/i, "MSM", "МСМ"],
];

function keyElements(p: ProductDetail): { symbol: string; name: string }[] {
  const out: { symbol: string; name: string }[] = [];
  for (const r of p.ingredients) {
    const hit = SYMBOLS.find(([re]) => re.test(r.name.trim()));
    if (hit && !out.some((e) => e.symbol === hit[1])) out.push({ symbol: hit[1], name: hit[2] });
    if (out.length === 6) break;
  }
  return out;
}

/* ------------------------------- доставка ------------------------------- */

function Delivery({ price }: { price: number | null }) {
  const city = useRuCity();
  const [state, setState] = useState<{ key: string; list: DeliveryOption[] } | null>(null);
  const key = city ? `${city.city}|${city.area}` : "";
  useEffect(() => {
    if (!city) return;
    let alive = true;
    loadDelivery(city).then((list) => alive && setState({ key, list }));
    return () => {
      alive = false;
    };
    // city — новый объект на каждый рендер: следим за ключом
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key]);
  const list = state?.key === key ? state.list : null;
  const rows = list
    ? [
        { label: "Пункт выдачи", o: cheapest(list, "PICK_POINT") },
        { label: "Курьером", o: cheapest(list, "COURIER") },
        { label: "Почтой", o: cheapest(list, "POST") },
        { label: "Офис Coral Club", o: cheapest(list, "OFFICE") },
      ].filter((r): r is { label: string; o: DeliveryOption } => Boolean(r.o))
    : [];
  // порог бесплатной доставки у способов разный — показываем самый низкий
  const frees = (list ?? []).filter((o) => o.price > 0).map((o) => o.free).filter((f): f is number => f !== null);
  const free = frees.length ? Math.min(...frees) : null;
  const freeNow = free !== null && price !== null && price >= free;

  return (
    <div className={styles.row}>
      <Icon name="truck" size={22} />
      <span>
        <span className={styles.rowTitle}>Доставка — {city?.city ?? "Москва"}</span>
        {list === null ? (
          <small>Считаем…</small>
        ) : rows.length ? (
          <>
            {rows.map(({ label, o }) => (
              <small key={label}>
                {label} · {o.price === 0 || freeNow ? "бесплатно" : `от ${rub(o.price)}`}
                {o.days && ` · ${daysText(o.days)}`}
              </small>
            ))}
            {free !== null && !freeNow && <small>Бесплатно при заказе от {rub(free)}</small>}
          </>
        ) : (
          <small>Способы и стоимость — при оформлении заказа</small>
        )}
      </span>
    </div>
  );
}

/* ------------------------------ покупка ------------------------------ */

function Qty({ p, member, price, was }: { p: RuProduct; member: boolean; price: string; was?: string }) {
  const cart = useRuCart();
  const qty = qtyOf(cart, p.code);
  if (qty === 0) {
    return (
      <Button variant="primary" block onClick={() => addRu(p, member, price, was)}>
        В корзину
      </Button>
    );
  }
  return (
    <div className={styles.stepper} role="group" aria-label="Количество в корзине">
      <button type="button" onClick={() => setRuQty(p.code, qty - 1)} aria-label="Убрать одну">
        <Icon name="minus" size={20} />
      </button>
      <span>
        {qty} в корзине
        <Link href={`${RU_BASE}/cart/`}>Перейти</Link>
      </span>
      <button type="button" onClick={() => setRuQty(p.code, qty + 1)} aria-label="Добавить ещё">
        <Icon name="plus" size={20} />
      </button>
    </div>
  );
}

/* ------------------------------ наличие ------------------------------ */

function StockSheet({ p, open, onClose, here }: { p: RuProduct; open: boolean; onClose: () => void; here: boolean }) {
  const city = useRuCity();
  const [stock, setStock] = useState<Record<number, boolean | null>>({});
  useEffect(() => {
    if (!open) return;
    let alive = true;
    for (const w of WAREHOUSES) inStock(p.code, w.at).then((v) => alive && setStock((s) => ({ ...s, [w.id]: v })));
    return () => {
      alive = false;
    };
  }, [open, p.code]);

  return (
    <Sheet open={open} onClose={onClose} title="Наличие" closeLabel="Закрыть">
      <div className={styles.stockHere}>
        <span className={here ? styles.yes : styles.no}>{here ? "В наличии" : "Нет в наличии"}</span>
        <p>
          в городе <strong>{city?.city ?? "Москва"}</strong>
        </p>
        <button
          type="button"
          className={styles.link}
          onClick={() => {
            onClose();
            openRuCity();
          }}
        >
          Изменить город
        </button>
      </div>
      <p className={styles.stockLabel}>На складах Coral Club</p>
      <ul className={styles.stockList}>
        {WAREHOUSES.map((w) => {
          const v = stock[w.id];
          return (
            <li key={w.id}>
              <span>
                <strong>{w.name}</strong>
                <small>{w.cities}</small>
              </span>
              <span className={v === undefined ? styles.wait : v ? styles.yes : styles.no}>{v === undefined ? "…" : v ? "Есть" : v === false ? "Нет" : "—"}</span>
            </li>
          );
        })}
      </ul>
      <p className={styles.stockNote}>Склад выбирается по вашему городу: от него зависит наличие и срок доставки.</p>
    </Sheet>
  );
}

/* ------------------------------ страница ------------------------------ */

/** Верх страницы на телефоне — как у маркетплейсов: над фото только круглые «назад» и «поделиться»; когда фото
 *  уехало, появляется белая полоса с названием. Шапки магазина на этой странице на телефоне нет. */
function TopBar({ title, backHref, galleryRef }: { title: string; backHref: string; galleryRef: React.RefObject<HTMLDivElement | null> }) {
  const [solid, setSolid] = useState(false);
  useEffect(() => {
    const sync = () => {
      const g = galleryRef.current;
      setSolid(g ? g.getBoundingClientRect().bottom < 72 : window.scrollY > 300);
    };
    sync();
    window.addEventListener("scroll", sync, { passive: true });
    window.addEventListener("resize", sync);
    return () => {
      window.removeEventListener("scroll", sync);
      window.removeEventListener("resize", sync);
    };
  }, [galleryRef]);
  return (
    <div className={`${styles.topBar} ${solid ? styles.topBarSolid : ""}`}>
      <BackButton className={shop.circleBtn} fallbackHref={backHref} />
      <p className={styles.topTitle} aria-hidden={!solid}>
        {title}
      </p>
      <ShareButton className={shop.circleBtn} title={title} />
    </div>
  );
}

/**
 * Страница товара магазина России (телефон): фото → название → краткое описание → цена участника, зачёркнутая
 * обычная, тег скидки → доставка → наличие (шторка по складам) → теги → ключевые элементы состава → форма выпуска
 * → полное описание с заголовками → сертификаты → применение, состав, хранение. Кнопка «В корзину»
 * прилипает к низу, когда своя кнопка под ценой ушла из виду.
 */
export function RuProductView({
  p,
  d,
  title,
  images,
  member,
  backHref,
  more,
}: {
  p: RuProduct;
  d: ProductDetail;
  title: string;
  images: { src: string; alt: string }[];
  member: boolean;
  backHref: string;
  more?: ReactNode;
}) {
  const gallery = useRef<HTMLDivElement>(null);
  const buyRef = useRef<HTMLDivElement>(null);
  const [sticky, setSticky] = useState(false);
  const [stockOpen, setStockOpen] = useState(false);
  const [docsOpen, setDocsOpen] = useState(false);

  const sold = d.available && d.club !== null;
  const off = d.club !== null && d.retail && d.retail > d.club ? Math.round((1 - d.club / d.retail) * 100) : 0;
  const price = d.club !== null ? rub(d.club) : "";
  const was = off > 0 && d.retail ? rub(d.retail) : undefined;

  // кнопка внизу — только когда своя кнопка под ценой ушла вверх (при первом открытии ничего не закрывает)
  useEffect(() => {
    const el = buyRef.current;
    if (!el) return;
    const io = new IntersectionObserver(([e]) => setSticky(!e.isIntersecting && e.boundingClientRect.top < 0), { threshold: 0 });
    io.observe(el);
    return () => io.disconnect();
  }, []);

  const elements = keyElements(d);
  const badges = p.feat.map((f) => BADGE_SLUG[f]).filter((x): x is string => Boolean(x));
  const storage = [d.storage && `Хранение: ${d.storage}`, d.shelfLife && `Срок годности: ${d.shelfLife}`, d.country && `Страна производства: ${d.country}`].filter(Boolean) as string[];
  // таблица состава: строки без количества (вспомогательные компоненты, сноски «*…») — не строки таблицы, а
  // пояснение под ней; текст «Состав: …» при таблице не нужен — он её повторяет
  const rows = d.ingredients.filter((r) => r.amount || r.percent);
  // сноску «* Рекомендуемый уровень суточного потребления» таблица пишет сама — из API её не повторяем
  const notes = d.ingredients
    .filter((r) => !r.amount && !r.percent)
    .map((r) => r.name)
    .filter((n) => n && !/^\*\s*рекомендуемый уровень суточного потребления\.?$/i.test(n.trim()));
  const facts = { ...d, ingredients: rows, composition: rows.length ? "" : d.composition };

  return (
    <main className={styles.page} data-analytics-location="product_card">
      <TopBar title={title} backHref={backHref} galleryRef={gallery} />

      <div className={styles.layout}>
        <div ref={gallery} className={styles.gallery}>
          <LandingGallery images={images} title={title} fit="contain" zoom />
        </div>

        <div className={styles.info}>
          {/* название, описание, цена */}
          <section className={styles.head}>
            <Heading className={styles.title}>{title}</Heading>
            {(d.description || p.lead) && <BodyLong muted>{d.description || p.lead}</BodyLong>}
            {sold ? (
              <div className={styles.price}>
                <span className={styles.now}>{price}</span>
                {was && <span className={styles.was}>{was}</span>}
                {off > 0 && <span className={styles.off}>−{off}%</span>}
              </div>
            ) : (
              <p className={styles.soldOut}>Нет в наличии</p>
            )}
            <div ref={buyRef} className={styles.buy}>
              {sold && <Qty p={p} member={member} price={price} was={was} />}
            </div>
          </section>

          {/* доставка и наличие */}
          <section className={styles.rows}>
            <Delivery price={d.club} />
            <button type="button" className={styles.row} onClick={() => setStockOpen(true)}>
              <Icon name="package" size={22} />
              <span>
                <span className={`${styles.rowTitle} ${sold ? styles.yes : styles.no}`}>{sold ? "В наличии" : "Нет в наличии"}</span>
                <small>Наличие на складах в других городах</small>
              </span>
              <Icon name="next" size={20} />
            </button>
          </section>

          {/* теги и ключевые элементы — компоненты основного магазина */}
          {badges.length > 0 && <DietaryBadges items={badges} labels={BADGE_LABEL} variant="chip" />}
          {elements.length > 0 && <PeriodicElements items={elements} heading="Ключевые элементы" />}
          {(p.release || p.pack) && (
            <section className={styles.block}>
              <h3 className={styles.h3}>Форма выпуска</h3>
              <BodyLong>
                {p.release}
                {p.release && p.pack && " · "}
                {p.pack}
              </BodyLong>
            </section>
          )}

          {/* полное описание */}
          {d.components && (
            <section className={styles.block}>
              <h3 className={styles.h3}>Описание</h3>
              <RichText text={d.components} />
              {d.isSupplement && <p className={styles.small}>{BAD_NOTE}</p>}
            </section>
          )}
          {!d.components && d.isSupplement && <p className={styles.small}>{BAD_NOTE}</p>}

          {/* применение и противопоказания — на странице, не в свёрнутых строках */}
          {d.howToUse.length > 0 && (
            <section className={styles.block}>
              <h3 className={styles.h3}>Способ применения</h3>
              <RichText text={d.howToUse.join("\n\n")} />
            </section>
          )}
          {d.contraindications && (
            <section className={styles.block}>
              <h3 className={styles.h3}>Противопоказания</h3>
              <RichText text={d.contraindications} />
            </section>
          )}

          {/* таблица состава — открыто, не в свёрнутой строке */}
          {(rows.length > 0 || d.composition) && (
            <div className={styles.facts}>
              <Facts p={facts} headingId={`ru-facts-${p.code}`} />
              {notes.map((n) => (
                <p key={n} className={styles.small}>
                  {n}
                </p>
              ))}
            </div>
          )}

          {storage.length > 0 && (
            <section className={styles.block}>
              <h3 className={styles.h3}>Хранение</h3>
              <RichText text={storage.join("\n\n")} />
            </section>
          )}

          {/* сертификаты */}
          {d.certificates.length > 0 && (
            <section className={styles.cert} aria-labelledby={`cert-${p.code}`}>
              <h2 id={`cert-${p.code}`} className={styles.certTitle}>
                Качество, которое можно проверить
              </h2>
              <div className={styles.certMedia}>
                <Image src="/images/ru/cert-media.webp" alt="" fill sizes="(max-width: 1023px) 100vw, 400px" />
              </div>
              <Button variant="ghost" block onClick={() => setDocsOpen(true)}>
                Смотреть сертификаты
              </Button>
            </section>
          )}

        </div>
      </div>

      {more}

      {/* кнопка внизу — после того, как кнопка под ценой ушла из виду */}
      {sold && (
        <div className={`${styles.sticky} ${sticky ? styles.stickyOn : ""}`} aria-hidden={!sticky}>
          <Container>
            <div className={styles.stickyRow}>
              {/* веб: название слева, цена и кнопка справа; на телефоне — только цена и кнопка */}
              <span className={styles.stickyName}>{title}</span>
              <span className={styles.stickyPrice}>
                <strong>{price}</strong>
                {was && <s>{was}</s>}
              </span>
              <div className={styles.stickyBtn}>
                <Qty p={p} member={member} price={price} was={was} />
              </div>
            </div>
          </Container>
        </div>
      )}

      <StockSheet p={p} open={stockOpen} onClose={() => setStockOpen(false)} here={sold} />
      <Sheet open={docsOpen} onClose={() => setDocsOpen(false)} title="Сертификаты" closeLabel="Закрыть">
        <ul className={styles.docs}>
          {d.certificates.map((c) => (
            <li key={c.link}>
              <a href={c.link} target="_blank" rel="noopener noreferrer">
                <Icon name="doc" size={20} />
                <span>{c.label.replace(/\.pdf$/i, "").replace(/[_]+/g, " ")}</span>
                <Icon name="external" size={18} />
              </a>
            </li>
          ))}
        </ul>
      </Sheet>
    </main>
  );
}

/**
 * Пока грузятся цена и наличие — та же страница товара: фото, название и краткое описание уже известны
 * (каталог), вместо цены, кнопки, доставки и блоков — серые плашки тех же размеров. Ничего не прыгает.
 */
export function RuProductSkeleton({ p, title, images, backHref }: { p: RuProduct; title: string; images: { src: string; alt: string }[]; backHref: string }) {
  const gallery = useRef<HTMLDivElement>(null);
  const bar = (w: string, h: number, r = 8) => <span className={styles.skel} style={{ width: w, height: h, borderRadius: r }} />;
  return (
    <main className={styles.page} aria-busy="true">
      <TopBar title={title} backHref={backHref} galleryRef={gallery} />
      <div className={styles.layout}>
        <div ref={gallery} className={styles.gallery}>
          <LandingGallery images={images} title={title} fit="contain" zoom />
        </div>
        <div className={styles.info}>
          <section className={styles.head}>
            <Heading className={styles.title}>{title}</Heading>
            {p.lead && <BodyLong muted>{p.lead}</BodyLong>}
            <div className={styles.price}>
              {bar("96px", 28)}
              {bar("64px", 20)}
            </div>
            <div className={styles.buy}>{bar("100%", 48, 999)}</div>
          </section>
          <section className={styles.rows}>
            {[0, 1].map((i) => (
              <div key={i} className={styles.row}>
                <i className={styles.skel} style={{ width: 22, height: 22, borderRadius: 6, flex: "none" }} />
                <span>
                  {bar("55%", 18)}
                  {bar("80%", 16)}
                </span>
              </div>
            ))}
          </section>
          <section className={styles.block}>
            {bar("40%", 20)}
            {bar("100%", 16)}
            {bar("100%", 16)}
            {bar("70%", 16)}
          </section>
        </div>
      </div>
    </main>
  );
}
