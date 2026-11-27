"use client";

import { useEffect, useMemo, useState } from "react";
import { Container, Heading } from "@/components/ui";
import { DOMAIN_ICONS } from "@/components/organisms/domainIcons";
import { useRuPrices } from "@/lib/ru/live";
import { RU_DOMAINS, RU_PRODUCTS, type RuProduct } from "@/lib/ru/shop";
import { RuCard } from "./RuCards";
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

  // домен из адреса (ссылки с главной) — после загрузки, страница статическая
  useEffect(() => {
    const d = new URLSearchParams(window.location.search).get("d") ?? "";
    // eslint-disable-next-line react-hooks/set-state-in-effect -- адрес известен только в браузере
    if (RU_DOMAINS.some((x) => x.id === d)) setDomain(d);
  }, []);

  const pick = (id: string) => {
    const next = id === domain ? "" : id;
    setDomain(next);
    setForms([]);
    setFeats([]);
    const url = new URL(window.location.href);
    if (next) url.searchParams.set("d", next);
    else url.searchParams.delete("d");
    window.history.replaceState(null, "", url);
  };

  const canon = RU_DOMAINS.find((d) => d.id === domain)?.canon;
  const inDomain = useMemo(() => (canon ? RU_PRODUCTS.filter((p) => p.domains.includes(canon)) : RU_PRODUCTS), [canon]);
  const formFacet = facet(inDomain, (p) => [p.formGroup]);
  const featFacet = facet(inDomain, (p) => p.feat);

  const shown = useMemo(() => {
    const list = inDomain.filter((p) => (!forms.length || forms.includes(p.formGroup)) && feats.every((f) => p.feat.includes(f)));
    const price = (p: RuProduct) => prices.get(p.code)?.club ?? null;
    const sold = (p: RuProduct) => {
      const l = prices.get(p.code);
      return !l || (l.available && l.club !== null);
    };
    const sorted = [...list].sort((a, b) => {
      if (sort === "name") return a.name.localeCompare(b.name, "ru");
      const pa = price(a);
      const pb = price(b);
      // цена ещё не пришла — в конец
      if (pa === null || pb === null) return (pa === null ? 1 : 0) - (pb === null ? 1 : 0);
      return sort === "cheap" ? pa - pb : pb - pa;
    });
    // нет в наличии в городе покупателя — в конце
    return [...sorted.filter(sold), ...sorted.filter((p) => !sold(p))];
  }, [inDomain, forms, feats, sort, prices]);

  const title = RU_DOMAINS.find((d) => d.id === domain)?.label ?? "Каталог";

  return (
    <main className={styles.page} data-analytics-location="catalog">
      <Container>
        <Heading className={styles.title}>{title}</Heading>
      </Container>

      {/* домены — плитки, на телефоне два ряда с прокруткой вбок */}
      <div className={styles.domains} role="tablist" aria-label="Домены здоровья">
        {RU_DOMAINS.map((d) => {
          const Icon = DOMAIN_ICONS[d.id];
          const on = d.id === domain;
          return (
            <button key={d.id} type="button" role="tab" aria-selected={on} className={`${styles.domain} ${on ? styles.domainOn : ""}`} onClick={() => pick(d.id)}>
              <span className={styles.domainLabel}>{d.label}</span>
              {Icon && <Icon className={styles.domainIcon} />}
            </button>
          );
        })}
      </div>

      <Container>
        <div className={styles.filters}>
          {formFacet.length > 1 && (
            <div className={styles.facet}>
              <span className={styles.facetName}>Форма</span>
              {formFacet.map(([v, n]) => (
                <button key={v} type="button" aria-pressed={forms.includes(v)} className={`${styles.chip} ${forms.includes(v) ? styles.chipOn : ""}`} onClick={() => setForms((s) => toggle(s, v))}>
                  {v} <span>{n}</span>
                </button>
              ))}
            </div>
          )}
          {featFacet.length > 0 && (
            <div className={styles.facet}>
              <span className={styles.facetName}>Особенности</span>
              {featFacet.map(([v, n]) => (
                <button key={v} type="button" aria-pressed={feats.includes(v)} className={`${styles.chip} ${feats.includes(v) ? styles.chipOn : ""}`} onClick={() => setFeats((s) => toggle(s, v))}>
                  {v} <span>{n}</span>
                </button>
              ))}
            </div>
          )}
          <div className={styles.bar}>
            <span className={styles.count}>
              {shown.length} {plural(shown.length)}
            </span>
            <label className={styles.sort}>
              <span className={styles.visuallyHidden}>Сортировка</span>
              <select value={sort} onChange={(e) => setSort(e.target.value as Sort)}>
                {SORTS.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.label}
                  </option>
                ))}
              </select>
            </label>
          </div>
        </div>

        {shown.length ? (
          <ul className={styles.grid} data-analytics-list={`catalog_${domain || "all"}`}>
            {shown.map((p, i) => (
              <li key={p.code}>
                <RuCard p={p} index={i + 1} />
              </li>
            ))}
          </ul>
        ) : (
          <p className={styles.empty}>Под эти фильтры товаров нет.</p>
        )}
      </Container>
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
