"use client";

import { Fragment, useEffect, useRef, useState, type ReactNode } from "react";
import Image from "next/image";
import Link from "next/link";
import type { ProductDetail } from "@coral/api";
import { Button, Container, Icon, Sheet } from "@/components/ui";
import { InfoAccordion } from "@/components/organisms/InfoAccordion";
import { LandingGallery } from "@/components/landing/LandingGallery";
import { Facts } from "@/components/catalog/ProductDetailView";
import { BackButton } from "@/app/(shop)/products/[slug]/BackButton";
import { ShareButton } from "@/app/(shop)/products/[slug]/ShareButton";
import shop from "@/app/(shop)/products/[slug]/page.module.css";
import { addRu, qtyOf, setRuQty, useRuCart } from "@/lib/ru/cart";
import { useRuCity } from "@/lib/ru/city";
import { WAREHOUSES, inStock } from "@/lib/ru/stock";
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

/** Ключевые элементы состава: первые строки таблицы активных веществ — «Калий · 420 мг». */
function keyElements(p: ProductDetail): { name: string; amount: string }[] {
  return p.ingredients
    .filter((r) => r.name && r.amount && !/^(энергетическая|калорийность|белки|жиры|углеводы)/i.test(r.name))
    .slice(0, 6)
    .map((r) => {
      const unit = /,\s*([^,()]+)\s*$/.exec(r.name)?.[1]?.trim() ?? "";
      const name = r.name.replace(/\s*\(.*$/, "").replace(/,\s*[^,]+$/, "").trim();
      return { name, amount: `${r.amount.replace(".", ",")}${unit ? ` ${unit}` : ""}` };
    });
}

/* ------------------------------ покупка ------------------------------ */

function Qty({ p, member, price, was }: { p: RuProduct; member: boolean; price: string; was?: string }) {
  const cart = useRuCart();
  const qty = qtyOf(cart, p.code);
  if (qty === 0) {
    return (
      <Button variant="primary" block onClick={() => addRu(p, member, price, was)}>
        Добавить в корзину
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
 * → полное описание с заголовками → сертификаты → применение, состав, хранение. Кнопка «Добавить в корзину»
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
  const city = useRuCity();
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
  const storage = [d.storage && `Хранение: ${d.storage}`, d.shelfLife && `Срок годности: ${d.shelfLife}`, d.country && `Страна производства: ${d.country}`].filter(Boolean) as string[];
  const details = [
    ...(d.howToUse.length ? [{ title: "Способ применения", content: <RichText text={d.howToUse.join("\n\n")} /> }] : []),
    ...(d.ingredients.length || d.composition ? [{ title: "Состав", content: <Facts p={d} headingId={`ru-facts-${p.code}`} /> }] : []),
    ...(d.contraindications ? [{ title: "Противопоказания", content: <RichText text={d.contraindications} /> }] : []),
    ...(storage.length ? [{ title: "Хранение", content: <RichText text={storage.join("\n\n")} /> }] : []),
  ];

  return (
    <main className={styles.page} data-analytics-location="product_card">
      <TopBar title={title} backHref={backHref} galleryRef={gallery} />

      <div className={styles.layout}>
        <div ref={gallery} className={styles.gallery}>
          <LandingGallery images={images} title={title} fit="contain" />
        </div>

        <div className={styles.info}>
          {/* название, описание, цена */}
          <section className={styles.head}>
            <h1 className={styles.title}>{title}</h1>
            {(d.description || p.lead) && <p className={styles.lead}>{d.description || p.lead}</p>}
            {sold ? (
              <div className={styles.price}>
                <strong>{price}</strong>
                {was && <s>{was}</s>}
                {off > 0 && <span className={styles.off}>−{off}%</span>}
              </div>
            ) : (
              <p className={styles.soldOut}>Нет в наличии</p>
            )}
            {sold && off > 0 && <p className={styles.priceNote}>Цена участника клуба — после входа или регистрации при оформлении</p>}
            <div ref={buyRef} className={styles.buy}>
              {sold && <Qty p={p} member={member} price={price} was={was} />}
            </div>
          </section>

          {/* доставка и наличие */}
          <section className={styles.rows}>
            <div className={styles.row}>
              <Icon name="truck" size={22} />
              <span>
                <strong>Доставка в {city?.city ?? "Москва"}</strong>
                <small>Курьером, в пункт выдачи или офис Coral Club — сроки и стоимость при оформлении</small>
              </span>
            </div>
            <button type="button" className={styles.row} onClick={() => setStockOpen(true)}>
              <Icon name="package" size={22} />
              <span>
                <strong className={sold ? styles.yes : styles.no}>{sold ? "В наличии" : "Нет в наличии"}</strong>
                <small>Наличие на складах в других городах</small>
              </span>
              <Icon name="next" size={20} />
            </button>
          </section>

          {/* теги, ключевые элементы, форма выпуска */}
          {p.feat.length > 0 && (
            <ul className={styles.tags} aria-label="Особенности">
              {p.feat.map((t) => (
                <li key={t}>{t}</li>
              ))}
            </ul>
          )}
          {elements.length > 0 && (
            <section className={styles.block}>
              <h2 className={styles.h2}>Ключевые элементы</h2>
              <ul className={styles.elements}>
                {elements.map((e) => (
                  <li key={e.name}>
                    <strong>{e.amount}</strong>
                    <span>{e.name}</span>
                  </li>
                ))}
              </ul>
              {d.ingredientsHeader && <p className={styles.small}>{d.ingredientsHeader.replace(/^Количество\s*/i, "")}</p>}
            </section>
          )}
          {(p.release || p.pack) && (
            <section className={styles.block}>
              <h2 className={styles.h2}>Форма выпуска</h2>
              <p className={styles.form}>
                {p.release && <strong>{p.release}</strong>}
                {p.release && p.pack && " · "}
                {p.pack}
              </p>
            </section>
          )}

          {/* полное описание */}
          {d.components && (
            <section className={styles.block}>
              <h2 className={styles.h2}>Описание</h2>
              <RichText text={d.components} />
            </section>
          )}

          {/* сертификаты */}
          {d.certificates.length > 0 && (
            <section className={styles.cert} aria-labelledby={`cert-${p.code}`}>
              <div className={styles.certText}>
                <p className={styles.certEyebrow}>
                  <Icon name="doc" size={20} />
                  Качество и сертификация
                </p>
                <h2 id={`cert-${p.code}`} className={styles.certTitle}>
                  Качество, которое можно проверить
                </h2>
                <p className={styles.certLead}>Сертификаты и документы на продукт в одном месте</p>
                <button type="button" className={styles.certLink} onClick={() => setDocsOpen(true)}>
                  Смотреть сертификаты <Icon name="next" size={20} />
                </button>
              </div>
              <div className={styles.certMedia}>
                <Image src="/images/ru/cert-media.webp" alt="" fill sizes="(max-width: 1023px) 100vw, 400px" />
              </div>
            </section>
          )}

          {details.length > 0 && (
            <div className={styles.details}>
              <InfoAccordion items={details} />
            </div>
          )}
          {d.isSupplement && <p className={styles.small}>Биологически активная добавка. Не является лекарственным средством.</p>}
        </div>
      </div>

      {more}

      {/* кнопка внизу — после того, как кнопка под ценой ушла из виду */}
      {sold && (
        <div className={`${styles.sticky} ${sticky ? styles.stickyOn : ""}`} aria-hidden={!sticky}>
          <Container>
            <div className={styles.stickyRow}>
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
