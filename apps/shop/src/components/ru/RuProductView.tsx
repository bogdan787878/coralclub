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
import { useRuSaleInfo } from "@/lib/ru/live";
import { openRuCity } from "./RuCity";
import styles from "./RuPdp.module.css";

/* ------------------------------- описание ------------------------------- */

/** «КАЛИЙ» → «Калий»; заголовки сайта набраны капсом. */
const unshout = (s: string) => (/[a-zа-яё]/.test(s) || !/[A-ZА-ЯЁ]/.test(s) ? s : s.charAt(0) + s.slice(1).toLowerCase());

/** Строка: **жирный** — жирным; ссылки сайта [текст](url) — просто текстом. */
function inline(text: string): ReactNode[] {
  const plain = text.replace(/\[([^\]]+)\]\([^)]+\)/g, "$1");
  return plain
    .split(/(\*\*[^*]+\*\*)/g)
    .map((part, i) =>
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
        if (heading)
          return (
            <h3 key={i}>
              {unshout(
                heading[0]
                  .replace(/^#+\s*/, "")
                  .replace(/\*\*/g, "")
                  .trim(),
              )}
            </h3>
          );
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

/** Лавровая ветвь (макет: ветвь.svg), цветом текста — золотистый --color-special. */
function Laurel({ className }: { className?: string }) {
  return (
    <svg className={className} width="16" height="35" viewBox="0 0 16 35" fill="currentColor" aria-hidden="true">
      <path d="M8.0596 0.00346051C8.41684 -0.0293726 8.60851 0.176961 8.8671 0.387887C9.56336 0.955794 10.0964 1.62866 10.5687 2.38395C11.6406 4.12917 11.9735 6.21895 11.4957 8.20338C11.0628 9.97086 10.1484 11.1616 8.58878 12.0968C8.99134 13.0332 9.27908 13.7936 9.32135 14.829C9.37457 16.1319 9.09683 17.0765 8.2429 18.0684C8.33095 18.1697 8.40542 18.2379 8.49717 18.3309C9.98264 19.8351 10.6648 21.763 10.6693 23.8272C13.359 24.4815 14.9363 26.3387 15.7773 28.8595C16.5811 31.269 15.1235 33.2976 12.7793 33.9781C12.221 34.1403 11.2653 34.356 10.7114 34.1521C10.3905 34.0338 10.3088 33.3173 10.4844 33.0624C10.6218 32.8471 11.4288 32.8338 11.7116 32.7531C12.5751 32.5074 13.3523 32.084 13.8212 31.3018C14.3413 30.4342 14.2064 29.6222 13.9611 28.7181C13.8617 28.7891 13.7296 28.8664 13.6241 28.932C11.6983 30.0859 8.97739 30.3246 6.91415 29.4054C5.68022 28.8556 4.6969 27.9275 4.02953 26.7668C3.90228 26.5453 3.39939 25.8238 3.56562 25.5105C4.07332 24.9459 5.12063 24.4339 5.83816 24.2077C2.99158 23.8708 0.815065 21.4641 0.197204 18.8213C0.1366 18.5621 -0.151948 17.6813 0.104575 17.4977C1.03629 16.8305 2.45568 16.5598 3.58899 16.5471C1.14758 15.063 -0.1722 11.9354 0.663663 9.21578C0.812035 8.73305 1.1839 8.79556 1.60927 8.75524C2.82971 8.63955 3.96036 8.85021 5.10574 9.25275C4.28082 7.79013 4.03408 6.25498 4.47094 4.62845C4.8614 3.17459 5.74658 1.88579 6.87369 0.888046C7.20529 0.5945 7.67143 0.222842 8.0596 0.00346051ZM8.84628 22.7472C8.44817 19.9139 6.39703 17.9629 3.42165 18.1638C2.82247 18.2092 2.38128 18.2849 1.80347 18.4708C2.17998 19.927 3.16513 21.3317 4.49232 22.0888C5.4335 22.6257 6.18068 22.7832 7.23786 22.8517C7.81847 22.8575 8.26542 22.8371 8.84628 22.7472ZM7.99108 10.6306L8.02433 10.6531C8.19463 10.5343 8.32776 10.3455 8.46432 10.1857C9.04891 9.50151 9.42235 8.76729 9.66584 7.90215C10.2177 5.94126 9.54552 3.90297 8.28641 2.34981C8.25447 2.31043 8.16287 2.20742 8.12129 2.18508C7.11724 3.02905 6.26004 4.50416 6.16643 5.82141C6.06691 7.22201 6.65817 8.43699 7.34966 9.62626C7.54389 9.96036 7.76072 10.3268 7.99108 10.6306ZM7.33603 16.3C7.5394 15.5409 7.60823 14.9358 7.44366 14.1555C7.05823 12.328 5.58087 11.0291 3.77837 10.5644C3.27413 10.4314 2.75437 10.3639 2.23232 10.3636C1.91336 13.4085 4.41249 15.8391 7.28569 16.4517L7.33603 16.3ZM5.43684 25.9462C6.2291 27.5543 8.09503 28.532 9.87815 28.5226C11.049 28.502 12.1866 28.1361 13.1441 27.4724C12.3327 25.905 10.5131 25.0431 8.76246 25.1384C7.73458 25.1824 6.32947 25.4305 5.43684 25.9462Z" />
    </svg>
  );
}

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
  const frees = (list ?? [])
    .filter((o) => o.price > 0)
    .map((o) => o.free)
    .filter((f): f is number => f !== null);
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
              <span className={v === undefined ? styles.wait : v ? styles.yes : styles.no}>
                {v === undefined ? "…" : v ? "Есть" : v === false ? "Нет" : "—"}
              </span>
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
  // товар в акции — цена до акции зачёркнута, тег — скидка акции и её сроки
  const sale = useRuSaleInfo().get(p.code);
  const off = d.club !== null && d.retail && d.retail > d.club ? Math.round((1 - d.club / d.retail) * 100) : 0;
  const price = d.club !== null ? rub(d.club) : "";
  const was = sale ? rub(sale.was) : off > 0 && d.retail ? rub(d.retail) : undefined;
  const offTag = sale ? sale.tag : off > 0 ? `−${off}%` : "";

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
  const storage = [
    d.storage && `Хранение: ${d.storage}`,
    d.shelfLife && `Срок годности: ${d.shelfLife}`,
    d.country && `Страна производства: ${d.country}`,
  ].filter(Boolean) as string[];
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
                {offTag && <span className={styles.off}>{offTag}</span>}
                {sale?.dates && <span className={styles.saleDates}>Акция {sale.dates}</span>}
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
        </div>
      </div>

      {/* всё остальное — под фото и покупкой (на телефоне — той же лентой; на вебе — во всю ширину, сеткой) */}
      <div className={styles.details}>
        {/* теги и ключевые элементы — компоненты основного магазина */}
        {badges.length > 0 && (
          <div className={`${styles.dWide} ${styles.d1}`}>
            <DietaryBadges items={badges} labels={BADGE_LABEL} variant="chip" />
          </div>
        )}
        {elements.length > 0 && (
          <div className={`${styles.dWide} ${styles.d2}`}>
            <PeriodicElements items={elements} heading="Ключевые элементы" />
          </div>
        )}
        {(p.release || p.pack) && (
          <section className={`${styles.block} ${styles.d6}`}>
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
          <section className={`${styles.block} ${styles.dWide} ${styles.d3}`}>
            <h3 className={styles.h3}>Описание</h3>
            <RichText text={d.components} />
            {d.isSupplement && <p className={styles.small}>{BAD_NOTE}</p>}
          </section>
        )}
        {!d.components && d.isSupplement && <p className={`${styles.small} ${styles.dWide} ${styles.d3}`}>{BAD_NOTE}</p>}

        {/* применение и противопоказания — на странице, не в свёрнутых строках */}
        {d.howToUse.length > 0 && (
          <section className={`${styles.block} ${styles.d4}`}>
            <h3 className={styles.h3}>Способ применения</h3>
            <RichText text={d.howToUse.join("\n\n")} />
          </section>
        )}
        {d.contraindications && (
          <section className={`${styles.block} ${styles.d5}`}>
            <h3 className={styles.h3}>Противопоказания</h3>
            <RichText text={d.contraindications} />
          </section>
        )}

        {/* таблица состава — открыто, не в свёрнутой строке */}
        {(rows.length > 0 || d.composition) && (
          <div className={`${styles.facts} ${styles.d8}`}>
            <Facts p={facts} headingId={`ru-facts-${p.code}`} />
            {notes.map((n) => (
              <p key={n} className={styles.small}>
                {n}
              </p>
            ))}
          </div>
        )}

        {storage.length > 0 && (
          <section className={`${styles.block} ${styles.d7}`}>
            <h3 className={styles.h3}>Хранение</h3>
            <RichText text={storage.join("\n\n")} />
          </section>
        )}

        {/* сертификаты */}
        {d.certificates.length > 0 && (
          // сертификаты — картинка и кнопка «Сертификат качества» в лавровых ветвях; по нажатию — список документов
          <section className={`${styles.certBlock} ${styles.d9}`} aria-label="Сертификаты">
            <div className={styles.certMedia}>
              <Image src="/images/ru/cert-media.webp" alt="" fill sizes="(max-width: 1023px) 100vw, 480px" />
            </div>
            <button type="button" className={styles.cert} onClick={() => setDocsOpen(true)}>
              <Laurel className={styles.laurel} />
              <span>Сертификат качества</span>
              <Laurel className={`${styles.laurel} ${styles.laurelRight}`} />
            </button>
          </section>
        )}
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
