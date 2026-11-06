"use client";

import { useEffect, useState } from "react";
import { loadStores, sessionCountry, switchStore, type Store } from "@coral/api";
import { COUNTRY_RU, CountryMenu } from "@/components/checkout";
import { rememberLkCountries, setLkCountry, useLkCountry } from "@/lib/lk/country";

/**
 * Флаг магазина (перенесено из кабинета на чистом JS): страна — это витрина сессии API кабинета. Выбор страны
 * переключает витрину (PATCH /auth/session), после чего каталог, цены, валюта, корзина и оформление идут по ней.
 */
export function StoreFlag() {
  const country = useLkCountry();
  const [stores, setStores] = useState<Record<string, Store>>({});
  const [busy, setBusy] = useState(false);
  useEffect(() => {
    let alive = true;
    Promise.all([loadStores(), sessionCountry()]).then(([list, cur]) => {
      if (!alive) return;
      setStores(list);
      if (Object.keys(list).length) rememberLkCountries(Object.fromEntries(Object.entries(list).map(([c, v]) => [c, v.name])));
      if (cur) setLkCountry(cur); // флаг показывает витрину, по которой сейчас идут каталог и цены
    });
    return () => {
      alive = false;
    };
  }, []);
  const names = Object.fromEntries(Object.entries(stores).map(([c, v]) => [c, v.name]));
  return (
    <div aria-busy={busy} style={{ opacity: busy ? 0.5 : 1 }}>
      <CountryMenu
        countries={Object.keys(names).length ? names : { [country]: country }}
        value={country}
        labels={COUNTRY_RU}
        onChange={async (code) => {
          const store = stores[code];
          if (!store || code === country) return;
          setBusy(true);
          if (await switchStore(store.id)) {
            setLkCountry(code);
            window.location.reload(); // всё перечитывается уже по новой витрине
          } else setBusy(false);
        }}
      />
    </div>
  );
}
