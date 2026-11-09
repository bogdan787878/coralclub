"use client";

import { useEffect, useState } from "react";
import { catalogSection, type Product } from "@coral/api";
import { Container, Heading, Section } from "@/components/ui";
import { DOMAIN_ICONS } from "@/components/organisms/domainIcons";
import { CatalogNav } from "@/app/(shop)/catalog/CatalogNav";
import { ShopSkeleton } from "@/components/lk/LkShop";
import { StoreFlag } from "@/components/lk/StoreFlag";
import { LK_DOMAINS } from "@/lib/lk/domains";
import page from "@/app/(shop)/catalog/page.module.css";
import grid from "@/components/organisms/DomainProductGrid.module.css";
import { MemberCard } from "./MemberCard";
import own from "./LkCatalog.module.css";

type DomainState = Product[] | "error" | undefined;

/** Товары домена: товары всех его разделов, каждый один раз (по коду), в порядке разделов API. */
async function loadDomain(sections: string[]): Promise<Product[] | "error"> {
  const got = await Promise.all(sections.map(catalogSection));
  if (got.every((g) => g === null)) return "error";
  const seen = new Set<number>();
  const out: Product[] = [];
  for (const g of got) for (const p of g?.products ?? []) if (!seen.has(p.code) && seen.add(p.code)) out.push(p);
  return out;
}

/**
 * Каталог участника — как каталог витрины (/catalog): сетка из 12 доменов здоровья с иконками, закреплённая строка
 * доменов, под ней разделы с товарами. Товары и цены — из разделов каталога API кабинета по таблице LK_DOMAINS
 * (витрина сессии; флаг меняет страну).
 */
export function LkCatalog() {
  const [byDomain, setByDomain] = useState<Record<string, DomainState>>({});
  useEffect(() => {
    let alive = true;
    for (const d of LK_DOMAINS) {
      loadDomain(d.sections).then((list) => alive && setByDomain((s) => ({ ...s, [d.id]: list })));
    }
    return () => {
      alive = false;
    };
  }, []);
  // домены без товаров на витрине страны не показываем (после ответа API)
  const shown = LK_DOMAINS.filter((d) => {
    const v = byDomain[d.id];
    return v === undefined || v === "error" || v.length > 0;
  });
  return (
    <main className={page.page}>
      <Section tone="surface">
        <Container>
          <div className={own.head}>
            <h1 className={own.title}>Каталог</h1>
            <StoreFlag />
          </div>
          <div className={page.grid}>
            {shown.map((d) => {
              const Icon = DOMAIN_ICONS[d.id];
              return (
                <a key={d.id} href={`#${d.id}`} className={page.tile}>
                  <span className={page.tileIcon}>{Icon ? <Icon className={page.icon} /> : null}</span>
                  <span className={page.tileLabel}>{d.label}</span>
                </a>
              );
            })}
          </div>
        </Container>
      </Section>

      <CatalogNav domains={shown} />

      {shown.map((d, i) => {
        const v = byDomain[d.id];
        return (
          <Section key={d.id} id={d.id} tone={i % 2 === 0 ? "surface" : "default"} style={{ scrollMarginTop: 135 }}>
            <Container>
              <Heading as="h2" className={page.sectionTitle}>
                {d.label}
              </Heading>
              {v === undefined ? (
                <ShopSkeleton n={4} />
              ) : v === "error" ? (
                <p className={own.note}>Не удалось загрузить раздел.</p>
              ) : (
                <div className={grid.productGrid}>
                  {v.map((p) => (
                    <MemberCard key={p.code} p={p} />
                  ))}
                </div>
              )}
            </Container>
          </Section>
        );
      })}
    </main>
  );
}
