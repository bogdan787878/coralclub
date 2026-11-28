"use client";

import { useEffect, useMemo, useState } from "react";
import { Button, Container, Heading, Icon, OptionCard, OptionCards, Sheet } from "@/components/ui";
import { DOMAIN_ICONS } from "@/components/organisms/domainIcons";
import { loadRuBanners, loadRuSale, promoSlug, useRuPrices, type RuBanner } from "@/lib/ru/live";
import { RU_DOMAINS, RU_PRODUCTS, ruProductByCode, type RuProduct } from "@/lib/ru/shop";
import { RuCard } from "./RuCards";
import promo from "./Ru.module.css";
import styles from "./RuCatalog.module.css";


type Sort = "name" | "cheap" | "dear";
const SORTS: { id: Sort; label: string }[] = [
  { id: "name", label: "По названию" },
  { id: "cheap", label: "Сначала дешевле" },
  { id: "dear", label: "Сначала дороже" },
];

/** Значения фильтра со счётчиками (как в Product Master), по убыванию количества. */
function facet(list: RuProduct[], values: (p: RuProduct) => string[]): [string, number][] {
  const n = new Map<string, number>();
  for (const p of list) for (const v of new Set(values(p))) if (v) n.set(v, (n.get(v) ?? 0) + 1);
  return [...n.entries()].sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0], "ru"));
}

const toggle = (set: string[], v: string) => (set.includes(v) ? set.filter((x) => x !== v) : [...set, v]);

/**
 * Каталог магазина России: 12 доменов здоровья плитками (на телефоне — два ряда с прокруткой вбок), под ними
 * фильтры «Форма» и «Особенности» со счётчиками (как в Product Master: lucidos.ru/assembler/domen/…) и
 * сортировка, ниже — товары сеткой по два. Домен в адресе: /catalog/?d=energy.
 */
export function RuCatalog() {
  const prices = useRuPrices();
  const [domain, setDomain] = useState("");
  const [forms, setForms] = useState<string[]>([]);
  const [feats, setFeats] = useState<string[]>([]);
  const [sort, setSort] = useState<Sort>("name");
  // ?sale=<акция> — товары по акции (блок «Акции» главной сайта) под картинкой акции; null — не режим акций
  const [sale, setSale] = useState<RuProduct[] | null>(null);
  const [banner, setBanner] = useState<RuBanner | null | undefined>(undefined);
  // фильтры и сортировка — в шторках (на вебе фильтры — колонкой слева)
  const [sheet, setSheet] = useState<"" | "filters" | "sort">("");

  // домен из адреса (ссылки с главной) — после загрузки, страница статическая
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const d = params.get("d") ?? "";
    // eslint-disable-next-line react-hooks/set-state-in-effect -- адрес известен только в браузере
    if (RU_DOMAINS.some((x) => x.id === d)) setDomain(d);
    const promoId = params.get("sale") ?? "";
    if (promoId) {
      setSale([]);
      loadRuBanners().then((list) => setBanner(list.find((b) => promoSlug(b.href) === promoId) ?? list[0] ?? null));
      loadRuSale().then((codes) =>
        setSale([
          ...new Map(
            codes
              .map((c) => ruProductByCode(c))
              .filter((p): p is RuProduct => Boolean(p))
              .map((p) => [p.code, p]),
          ).values(),
        ]),
      );
    }
  }, []);

  const pick = (id: string) => {
    const next = id === domain ? "" : id;
    setDomain(next);
    setForms([]);
    setFeats([]);
    setSale(null);
    const url = new URL(window.location.href);
    url.searchParams.delete("sale");
    if (next) url.searchParams.set("d", next);
    else url.searchParams.delete("d");
    window.history.replaceState(null, "", url);
  };

  const canon = RU_DOMAINS.find((d) => d.id === domain)?.canon;
  const inDomain = useMemo(() => (sale ? sale : canon ? RU_PRODUCTS.filter((p) => p.domains.includes(canon)) : RU_PRODUCTS), [canon, sale]);
  const formFacet = facet(inDomain, (p) => [p.formGroup]);
  const featFacet = facet(inDomain, (p) => p.feat);

  const shown = useMemo(() => {
    const list = inDomain.filter((p) => (!forms.length || forms.includes(p.formGroup)) && feats.every((f) => p.feat.includes(f)));
    const price = (p: RuProduct) => prices.get(p.code)?.club ?? null;
    const sold = (p: RuProduct) => {
      const l = prices.get(p.code);
      return !l || (l.available && l.club !== null);
    };
    const sorted = sale ? list : [...list].sort((a, b) => {
      if (sort === "name") return a.name.localeCompare(b.name, "ru");
      const pa = price(a);
      const pb = price(b);
      // цена ещё не пришла — в конец
      if (pa === null || pb === null) return (pa === null ? 1 : 0) - (pb === null ? 1 : 0);
      return sort === "cheap" ? pa - pb : pb - pa;
    });
    // нет в наличии в городе покупателя — в конце
    return [...sorted.filter(sold), ...sorted.filter((p) => !sold(p))];
  }, [inDomain, forms, feats, sort, prices, sale]);

  const title = RU_DOMAINS.find((d) => d.id === domain)?.label ?? "Каталог";
  const active = forms.length + feats.length;
  const sortLabel = SORTS.find((x) => x.id === sort)?.label ?? "";
  const close = () => setSheet("");

  const facets = (
    <>
      {formFacet.length > 1 && (
        <div className={styles.facet}>
          <span className={styles.facetName}>Форма</span>
          {formFacet.map(([v, n]) => (
            <button key={v} type="button" aria-pressed={forms.includes(v)} className={`${styles.chip} ${forms.includes(v) ? styles.chipOn : ""}`} onClick={() => setForms((x) => toggle(x, v))}>
              {v} <span>{n}</span>
            </button>
          ))}
        </div>
      )}
      {featFacet.length > 0 && (
        <div className={styles.facet}>
          <span className={styles.facetName}>Особенности</span>
          {featFacet.map(([v, n]) => (
            <button key={v} type="button" aria-pressed={feats.includes(v)} className={`${styles.chip} ${feats.includes(v) ? styles.chipOn : ""}`} onClick={() => setFeats((x) => toggle(x, v))}>
              {v} <span>{n}</span>
            </button>
          ))}
        </div>
      )}
    </>
  );

  const grid = shown.length ? (
    <ul className={styles.grid} data-analytics-list={sale ? "catalog_sale" : `catalog_${domain || "all"}`}>
      {shown.map((p, i) => (
        <li key={p.code}>
          <RuCard p={p} index={i + 1} eager={i < 4} />
        </li>
      ))}
    </ul>
  ) : (
    <p className={styles.empty}>{sale ? "Товары акции загружаются…" : "Под эти фильтры товаров нет."}</p>
  );

  // акция: сверху только картинка акции, под ней — её товары
  if (sale) {
    return (
      <main className={styles.page} data-analytics-location="catalog_sale">
        <Container>
          <h1 className={styles.visuallyHidden}>{banner?.title ?? "Акция"}</h1>
          <div className={`${promo.promoMedia} ${styles.saleHero} ${banner ? "" : promo.promoSkeleton}`}>
            {banner && (
              <>
                {/* eslint-disable-next-line @next/next/no-img-element -- баннер с сайта магазина, внешний адрес */}
                <img src={banner.image} alt={banner.title} />
                {banner.logo && (
                  // eslint-disable-next-line @next/next/no-img-element -- логотип акции с сайта магазина
                  <img className={promo.promoLogo} src={banner.logo} alt="" />
                )}
              </>
            )}
          </div>
          <div className={styles.saleGrid}>{grid}</div>
        </Container>
      </main>
    );
  }

  return (
    <main className={styles.page} data-analytics-location="catalog">
      <Container>
        <Heading className={styles.title}>{title}</Heading>
      </Container>

      {/* домены — плитки, на телефоне два ряда с прокруткой вбок */}
      <div className={styles.domains} role="tablist" aria-label="Домены здоровья">
        {RU_DOMAINS.map((d) => {
          const DomainIcon = DOMAIN_ICONS[d.id];
          const on = d.id === domain;
          return (
            <button key={d.id} type="button" role="tab" aria-selected={on} className={`${styles.domain} ${on ? styles.domainOn : ""}`} onClick={() => pick(d.id)}>
              <span className={styles.domainLabel}>{d.label}</span>
              {DomainIcon && <DomainIcon className={styles.domainIcon} />}
            </button>
          );
        })}
      </div>

      <Container>
        {/* веб: фильтры — липкая колонка слева; телефон и планшет — кнопка-иконка и шторка */}
        <div className={styles.body}>
          <aside className={styles.filters} aria-label="Фильтры">
            {facets}
          </aside>
          <div className={styles.main}>
            <div className={styles.bar}>
              <span className={styles.count}>
                {shown.length} {plural(shown.length)}
              </span>
              <div className={styles.tools}>
                <button type="button" className={styles.tool} onClick={() => setSheet("sort")} aria-haspopup="dialog">
                  <Icon name="sort" size={18} />
                  {sortLabel}
                </button>
                <button type="button" className={`${styles.tool} ${styles.filterBtn}`} onClick={() => setSheet("filters")} aria-haspopup="dialog" aria-label={active ? `Фильтры: выбрано ${active}` : "Фильтры"}>
                  <Icon name="filter" size={18} />
                  {active > 0 && <em className={styles.toolBadge}>{active}</em>}
                </button>
              </div>
            </div>
            {grid}
          </div>
        </div>
      </Container>

      <Sheet open={sheet === "filters"} onClose={close} title="Фильтры" closeLabel="Закрыть">
        <div className={styles.sheetFacets}>{facets}</div>
        <div className={styles.sheetActions}>
          {active > 0 && (
            <Button
              variant="ghost"
              onClick={() => {
                setForms([]);
                setFeats([]);
              }}
            >
              Сбросить
            </Button>
          )}
          <Button variant="primary" block onClick={close}>
            Показать {shown.length} {plural(shown.length)}
          </Button>
        </div>
      </Sheet>
      <Sheet open={sheet === "sort"} onClose={close} title="Сортировка" closeLabel="Закрыть">
        <OptionCards label="Сортировка" layout="group">
          {SORTS.map((x) => (
            <OptionCard
              key={x.id}
              name="sort"
              checked={sort === x.id}
              onChange={() => {
                setSort(x.id);
                close();
              }}
              title={x.label}
            />
          ))}
        </OptionCards>
      </Sheet>
    </main>
  );
}

function plural(n: number) {
  const a = n % 10;
  const b = n % 100;
  if (a === 1 && b !== 11) return "товар";
  if (a >= 2 && a <= 4 && (b < 12 || b > 14)) return "товара";
  return "товаров";
}
