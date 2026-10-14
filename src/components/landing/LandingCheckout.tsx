"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { cartSubtotal, priceValue, useCart, type CartLine } from "@/lib/cart";
import { FRIEND_REF_CODE, FRIEND_USER_ID } from "@/lib/beautySystem";
import { formatRub } from "@/lib/landingCatalogRu";
import { BackButton } from "../../app/(shop)/products/[slug]/BackButton";
import styles from "./LandingCheckout.module.css";

/**
 * LandingCheckout — prototype of an own checkout UI on top of the shop's
 * internal JSON API (/sv-api/*). It works only on the shop's own origin:
 * on coralclub.ru, or locally through `npm run dev:proxy`
 * (http://localhost:3200/landing/checkout/).
 *
 * Flow: sync our cart into the shop's session cart → read delivery /
 * payment options and totals → POST /sv-api/order (only on the shopper's
 * click) → open the payment page (/order/payment/<id>/) of the shop.
 */

type PayMethod = { ID: string; NAME: string; IMAGE?: string | null };
type DeliveryItem = {
  ID: string;
  NAME: string;
  TYPE: string;
  TRANSIT?: string;
  PRICE?: number;
  FREE_DELIVERY?: number;
  PAYSYSTEMS: PayMethod[];
};
type DeliveryGroup = {
  ID: string;
  NAME: string;
  DESCRIPTION?: string;
  ITEMS: DeliveryItem[];
};
type Totals = Record<string, string | number | null | undefined>;

/** Currency symbol of the shop site (by the country it serves). */
const CURRENCY: Record<string, string> = {
  RU: "₽",
  US: "$",
  GB: "£",
  KZ: "₸",
  BY: "Br",
  UA: "₴",
};

/** City to start with when a country is picked in the test panel. */
const DEFAULT_CITY: Record<string, string> = {
  RU: "Москва",
  KZ: "Алматы",
  BY: "Минск",
  UA: "Киев",
  AM: "Ереван",
  KG: "Бишкек",
  DE: "Berlin",
  PL: "Warszawa",
  ES: "Madrid",
  IT: "Roma",
};

/**
 * Friend-of-the-club session (every price is the club price). Off: the
 * shopper pays the shop's ordinary prices, and the totals below are exactly
 * what the shop charges.
 */
const USE_FRIEND_CLUB = false;
const FRIEND_QUERY = USE_FRIEND_CLUB
  ? `&REF_CODE=${FRIEND_REF_CODE}&langss=ru&user=${FRIEND_USER_ID}&f=y`
  : "";

/** { a: 1, PROFILE: { CITY: "x" } } → "a=1&PROFILE[CITY]=x" */
function qs(params: Record<string, unknown>): string {
  const out: string[] = [];
  const add = (key: string, value: unknown) => {
    if (value === undefined || value === null) return;
    if (typeof value === "object") {
      for (const [k, v] of Object.entries(value as object))
        add(`${key}[${k}]`, v);
    } else {
      out.push(
        `${encodeURIComponent(key)}=${encodeURIComponent(String(value))}`,
      );
    }
  };
  for (const [k, v] of Object.entries(params)) add(k, v);
  return out.join("&");
}

async function api<T = unknown>(
  path: string,
  params: Record<string, unknown> = {},
): Promise<T> {
  const r = await fetch(`/sv-api${path}?${qs({ ...params, language: "ru" })}`, {
    credentials: "same-origin",
  });
  return (await r.json()) as T;
}

/** Empty the shop's session cart, then put our lines into it. */
async function syncShopCart(lines: CartLine[]): Promise<void> {
  const html = await (
    await fetch("/basket/", { credentials: "same-origin" })
  ).text();
  const doc = new DOMParser().parseFromString(html, "text/html");
  const items = [
    ...doc.querySelectorAll<HTMLElement>(".basket-member__basic-item"),
  ];
  if (items.length) {
    const body = new URLSearchParams();
    items.forEach((el, i) => {
      body.append(
        `basket_products[${i}][basket_id]`,
        el.dataset.basket_id ?? "",
      );
      body.append(`basket_products[${i}][member_id]`, el.dataset.member ?? "");
      body.append(`basket_products[${i}][vendor_code]`, el.dataset.code ?? "");
    });
    body.append("basket_count", String(items.length));
    body.append("basket_member_count", "1");
    await fetch("/ajax/deleteBasketItems.php", {
      method: "POST",
      credentials: "same-origin",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded; charset=UTF-8",
      },
      body,
    });
  }
  const pairs = lines
    .filter((l) => l.qty > 0)
    .map((l) => `${encodeURIComponent(l.coralId)}=${l.qty}`);
  if (pairs.length) {
    await fetch(`/shop/shop_basket.php?${pairs.join("&")}${FRIEND_QUERY}`, {
      credentials: "same-origin",
    });
  }
}

export function LandingCheckout() {
  const cart = useCart();
  const subtotal = cartSubtotal(cart);

  const [ready, setReady] = useState<"idle" | "sync" | "ok" | "error">("idle");
  const [error, setError] = useState("");
  const [groups, setGroups] = useState<DeliveryGroup[]>([]);
  const [payments, setPayments] = useState<PayMethod[]>([]);
  const [totals, setTotals] = useState<Totals | null>(null);

  const [country, setCountry] = useState("RU");
  const [shopCountry, setShopCountry] = useState("RU");
  const [countries, setCountries] = useState<Record<string, string>>({
    RU: "Россия",
  });
  const [deliveryError, setDeliveryError] = useState("");
  const [city, setCity] = useState("Москва");
  const [area, setArea] = useState("Москва");
  const [cityDraft, setCityDraft] = useState("Москва");
  const [fio, setFio] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [street, setStreet] = useState("");
  const [build, setBuild] = useState("");
  const [apartment, setApartment] = useState("");
  const [postindex, setPostindex] = useState("");
  const [comment, setComment] = useState("");
  const [deliveryId, setDeliveryId] = useState("");
  const [paymentId, setPaymentId] = useState("");
  const [acceptTerms, setAcceptTerms] = useState(false);
  const [agreeData, setAgreeData] = useState(false);
  const [sending, setSending] = useState(false);

  const synced = useRef("");
  const cartKey = useMemo(
    () => cart.map((l) => `${l.coralId}:${l.qty}`).join(","),
    [cart],
  );

  // 1) our cart → the shop's session cart; 2) location + delivery options
  useEffect(() => {
    if (!cart.length || synced.current === cartKey) return;
    synced.current = cartKey;
    let cancelled = false;
    (async () => {
      setReady("sync");
      setError("");
      try {
        await syncShopCart(cart);
        const loc = (await (
          await fetch("/restApi/v4/location/getLocation?language=ru", {
            credentials: "same-origin",
          })
        ).json()) as { city?: string; area?: string };
        const c = loc.city || "Москва";
        const a = loc.area || c;
        const init = await api<{
          result?: {
            CUR_LOCATION?: { CODE?: string };
            CHECKOUT_OPTIONS?: { countries?: Record<string, string> };
          };
        }>("/init");
        if (cancelled) return;
        const list = init.result?.CHECKOUT_OPTIONS?.countries;
        if (list && Object.keys(list).length) setCountries(list);
        const site = init.result?.CUR_LOCATION?.CODE;
        if (site) {
          setShopCountry(site);
          setCountry(site);
        }
        setCity(c);
        setCityDraft(c);
        setArea(a);
        setReady("ok");
      } catch (e) {
        if (!cancelled) {
          setReady("error");
          setError(
            "Не удалось связаться с магазином. Страница работает только на coralclub.ru или через локальный прокси.",
          );
          console.error(e);
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [cart, cartKey]);

  // delivery options for the chosen country / city
  useEffect(() => {
    if (ready !== "ok" || !city.trim()) return;
    let cancelled = false;
    api<{ result?: DeliveryGroup[]; error?: string }>("/delivery", {
      COUNTRY: country,
      CITY: city,
      AREA: area,
    }).then((d) => {
      if (cancelled) return;
      const list = Array.isArray(d.result)
        ? d.result.map((g) => ({
            ...g,
            ITEMS: Array.isArray(g.ITEMS) ? g.ITEMS : [],
          }))
        : [];
      setGroups(list);
      setDeliveryError(list.length ? "" : d.error || "Нет способов доставки");
      const all = list.flatMap((g) => g.ITEMS);
      setDeliveryId((cur) =>
        all.some((i) => i.ID === cur)
          ? cur
          : (list.find((g) => g.ID === "COURIER")?.ITEMS[0]?.ID ??
            all[0]?.ID ??
            ""),
      );
      if (!list.length) {
        setPayments([]);
        setPaymentId("");
        setTotals(null);
      }
    });
    return () => {
      cancelled = true;
    };
  }, [country, city, area, ready]);

  const activeItem = groups
    .flatMap((g) => g.ITEMS)
    .find((i) => i.ID === deliveryId);

  // payments of the chosen delivery
  useEffect(() => {
    if (!deliveryId || ready !== "ok") return;
    let cancelled = false;
    api<{ result?: PayMethod[] }>("/payments", {
      deliveryId,
      COUNTRY: country,
      CITY: city,
      AREA: area,
    }).then((p) => {
      if (cancelled) return;
      const list = Array.isArray(p.result) ? p.result : [];
      setPayments(list);
      setPaymentId((cur) =>
        list.some((x) => x.ID === cur) ? cur : (list[0]?.ID ?? ""),
      );
    });
    return () => {
      cancelled = true;
    };
  }, [deliveryId, country, city, area, ready]);

  const profile = useCallback(
    () => ({
      COUNTRY: country,
      COUNTRY_NAME: countries[country] ?? country,
      CITY: city,
      AREA: area,
      STREET: street,
      BUILD: build,
      APARTMENT: apartment,
      POSTINDEX: postindex,
      DELIVERY_TYPE: activeItem?.TYPE ?? "COURIER",
      EMAIL: email,
      FIO: fio,
      PHONE: phone.replace(/[^0-9+]/g, ""),
    }),
    [
      country,
      countries,
      city,
      area,
      street,
      build,
      apartment,
      postindex,
      activeItem,
      email,
      fio,
      phone,
    ],
  );

  // totals: re-read on every change of delivery / payment / address
  useEffect(() => {
    if (!deliveryId || !paymentId || ready !== "ok") return;
    let cancelled = false;
    const t = setTimeout(() => {
      api<{ result?: Totals; error?: string }>("/order", {
        bonusUseValue: 0,
        promo: "",
        deliveryId,
        paymentId,
        pickPoint: false,
        COUNTRY: country,
        CITY: city,
        AREA: area,
        PROFILE: profile(),
        dutyEnabled: true,
      }).then((r) => {
        if (!cancelled && r.result) setTotals(r.result);
      });
    }, 250);
    return () => {
      cancelled = true;
      clearTimeout(t);
    };
  }, [deliveryId, paymentId, country, city, area, profile, ready]);

  const valid =
    fio.trim().length > 2 &&
    phone.replace(/\D/g, "").length >= 10 &&
    /\S+@\S+\.\S+/.test(email) &&
    street.trim() !== "" &&
    build.trim() !== "" &&
    postindex.trim().length >= 5 &&
    deliveryId !== "" &&
    activeItem?.TYPE !== "PICK_POINT" &&
    paymentId !== "" &&
    acceptTerms &&
    agreeData;

  // the only place that creates a real order — runs on the shopper's click
  async function submit() {
    if (!valid || sending) return;
    setSending(true);
    setError("");
    try {
      const body = {
        deliveryId,
        paymentId,
        EMAIL: email,
        FIO: fio,
        PHONE: phone.replace(/[^0-9+]/g, ""),
        PROFILE: {
          ...profile(),
          MANUAL: 1,
          ...(comment ? { COMMENT: comment } : {}),
        },
        // the shopper's two consents, exactly as the shop's own form sends them
        additionalOrderInfo: {
          orderComment: comment,
          needToContact: false,
          contactMethod: "",
          chosenMessenger: "",
          receiveEmails: false,
          acceptTerms,
          acceptTerms2: false,
          agreePersonalData: agreeData,
        },
        dutyEnabled: true,
      };
      const r = await fetch(`/sv-api/order?language=ru`, {
        method: "POST",
        credentials: "same-origin",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = (await r.json()) as {
        result?: string | number;
        error?: string;
      };
      if (data.result) {
        // the shop's own payment page → payment gateway
        window.location.href = `/order/payment/${data.result}/?new_checkout=1`;
        return;
      }
      setError(data.error || "Магазин не принял заказ. Проверьте данные.");
    } catch (e) {
      console.error(e);
      setError("Не удалось отправить заказ.");
    }
    setSending(false);
  }

  const symbol = CURRENCY[shopCountry] ?? "€";
  const fmt = (n: number) => formatRub(n).replace("₽", symbol);
  const money = (v: unknown) => {
    const n = priceValue(String(v ?? ""));
    return n > 0 ? fmt(n) : "—";
  };
  const num = (v: unknown) =>
    parseFloat(
      String(v ?? "")
        .replace(/\s/g, "")
        .replace(",", "."),
    ) || 0;

  if (!cart.length) {
    return (
      <main className={styles.page}>
        <div className={styles.wrap}>
          <h1 className={styles.h1}>Оформление заказа</h1>
          <p className={styles.muted}>Корзина пуста.</p>
          <Link href="/landing/" className={styles.link}>
            ← На главную
          </Link>
        </div>
      </main>
    );
  }

  const deliveryPrice =
    totals && totals.TOTAL_PRICE !== undefined && totals.PRICE !== undefined
      ? num(totals.TOTAL_PRICE) - num(totals.PRICE)
      : null;

  const allItems = groups.flatMap((g) =>
    g.ITEMS.map((it) => ({ ...it, group: g.NAME })),
  );
  const pickup = activeItem?.TYPE === "PICK_POINT";

  return (
    <main className={styles.page}>
      <div className={styles.shell}>
        <aside className={styles.aside}>
          <h2 className={styles.h2}>Тест: страна доставки</h2>
          <label className={styles.field}>
            Страна
            <select
              value={country}
              onChange={(e) => {
                const code = e.target.value;
                const c = DEFAULT_CITY[code] ?? "";
                setCountry(code);
                setCity(c);
                setArea(c);
                setCityDraft(c);
              }}
            >
              {Object.entries(countries)
                .sort((a, b) => a[1].localeCompare(b[1], "ru"))
                .map(([code, name]) => (
                  <option key={code} value={code}>
                    {name} ({code})
                  </option>
                ))}
            </select>
          </label>
          <label className={styles.field}>
            Город
            <input
              value={cityDraft}
              onChange={(e) => setCityDraft(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  setCity(cityDraft.trim());
                  setArea(cityDraft.trim());
                }
              }}
            />
          </label>
          <button
            type="button"
            className={styles.apply}
            onClick={() => {
              setCity(cityDraft.trim());
              setArea(cityDraft.trim());
            }}
          >
            Применить
          </button>
          <dl className={styles.debug}>
            <div>
              <dt>Способов доставки</dt>
              <dd>{allItems.length}</dd>
            </div>
            <div>
              <dt>Способов оплаты</dt>
              <dd>{payments.length}</dd>
            </div>
            {totals &&
              ["PRICE", "TOTAL_PRICE", "FULL_PRICE", "DUTY", "TAX"].map((k) => (
                <div key={k}>
                  <dt>{k}</dt>
                  <dd>{String(totals[k] ?? "—")}</dd>
                </div>
              ))}
          </dl>
          {deliveryError && <p className={styles.error}>{deliveryError}</p>}
        </aside>
        <div className={styles.wrap}>
          <div className={styles.top}>
            <BackButton className={styles.back} fallbackHref="/landing/" />
            <h1 className={styles.h1}>Оформление заказа</h1>
          </div>

          {ready === "sync" && <p className={styles.muted}>Готовим заказ…</p>}
          {error && <p className={styles.error}>{error}</p>}

          <section className={styles.card}>
            <h2 className={styles.h2}>Ваш заказ</h2>
            <ul className={styles.lines}>
              {cart.map((l) => (
                <li key={l.coralId}>
                  <span>{l.name}</span>
                  <span>× {l.qty}</span>
                </li>
              ))}
            </ul>
          </section>

          <section className={styles.card}>
            <h2 className={styles.h2}>Получатель</h2>
            <label className={styles.field}>
              ФИО
              <input
                value={fio}
                onChange={(e) => setFio(e.target.value)}
                autoComplete="name"
              />
            </label>
            <label className={styles.field}>
              Телефон
              <input
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                inputMode="tel"
                autoComplete="tel"
                placeholder="+7"
              />
            </label>
            <label className={styles.field}>
              Email
              <input
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                inputMode="email"
                autoComplete="email"
              />
            </label>
          </section>

          <section className={styles.card}>
            <h2 className={styles.h2}>Доставка</h2>
            <p className={styles.muted}>
              {countries[country] ?? country}, {city || "город не указан"}
            </p>
            {allItems.length > 0 ? (
              <div className={styles.options}>
                {allItems.map((it) => (
                  <label key={it.ID} className={styles.option}>
                    <input
                      type="radio"
                      name="delivery"
                      checked={deliveryId === it.ID}
                      onChange={() => setDeliveryId(it.ID)}
                    />
                    <span>
                      {it.NAME || it.group}
                      {it.TRANSIT ? ` · ${it.TRANSIT} дн.` : ""}
                      <small>
                        {it.PRICE ? fmt(it.PRICE) : "бесплатно"}
                        {it.FREE_DELIVERY
                          ? `, бесплатно от ${fmt(it.FREE_DELIVERY)}`
                          : ""}
                      </small>
                    </span>
                  </label>
                ))}
              </div>
            ) : (
              <p className={styles.muted}>
                Для этой страны и города магазин не вернул способов доставки.
              </p>
            )}
            {pickup && (
              <p className={styles.muted}>
                Для самовывоза нужен выбор пункта выдачи — в прототипе пока не
                сделан, можно смотреть расчёт и способы оплаты.
              </p>
            )}
            <label className={styles.field}>
              Улица
              <input
                value={street}
                onChange={(e) => setStreet(e.target.value)}
                autoComplete="address-line1"
              />
            </label>
            <div className={styles.row}>
              <label className={styles.field}>
                Дом
                <input
                  value={build}
                  onChange={(e) => setBuild(e.target.value)}
                />
              </label>
              <label className={styles.field}>
                Квартира
                <input
                  value={apartment}
                  onChange={(e) => setApartment(e.target.value)}
                />
              </label>
              <label className={styles.field}>
                Индекс
                <input
                  value={postindex}
                  onChange={(e) => setPostindex(e.target.value)}
                  inputMode="numeric"
                  autoComplete="postal-code"
                />
              </label>
            </div>
            <label className={styles.field}>
              Комментарий курьеру
              <input
                value={comment}
                onChange={(e) => setComment(e.target.value)}
              />
            </label>
          </section>

          <section className={styles.card}>
            <h2 className={styles.h2}>Оплата</h2>
            <div className={styles.options}>
              {payments.map((p) => (
                <label key={p.ID} className={styles.option}>
                  <input
                    type="radio"
                    name="payment"
                    checked={paymentId === p.ID}
                    onChange={() => setPaymentId(p.ID)}
                  />
                  <span>{p.NAME}</span>
                </label>
              ))}
            </div>
          </section>

          <section className={styles.card}>
            <h2 className={styles.h2}>Итого</h2>
            <dl className={styles.totals}>
              <div>
                <dt>Товары</dt>
                <dd>{totals ? money(totals.PRICE) : fmt(subtotal)}</dd>
              </div>
              <div>
                <dt>Доставка</dt>
                <dd>
                  {deliveryPrice === null
                    ? "—"
                    : deliveryPrice > 0
                      ? fmt(deliveryPrice)
                      : "бесплатно"}
                </dd>
              </div>
              <div className={styles.grand}>
                <dt>К оплате</dt>
                <dd>{totals ? money(totals.TOTAL_PRICE) : "—"}</dd>
              </div>
            </dl>
            <label className={styles.check}>
              <input
                type="checkbox"
                checked={acceptTerms}
                onChange={(e) => setAcceptTerms(e.target.checked)}
              />
              <span>
                Я принимаю{" "}
                <a href="/faq/terms/" target="_blank" rel="noopener noreferrer">
                  условия использования сервиса
                </a>{" "}
                и{" "}
                <a
                  href="/faq/privacy/"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  политику конфиденциальности
                </a>
              </span>
            </label>
            <label className={styles.check}>
              <input
                type="checkbox"
                checked={agreeData}
                onChange={(e) => setAgreeData(e.target.checked)}
              />
              <span>
                Даю согласие на{" "}
                <a
                  href="/faq/personalinformation/"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  обработку персональных данных
                </a>
              </span>
            </label>
            <button
              type="button"
              className={styles.pay}
              disabled={!valid || sending || ready !== "ok"}
              onClick={submit}
            >
              {sending ? "Создаём заказ…" : "Перейти к оплате"}
            </button>
            <p className={styles.muted}>
              После нажатия создаётся заказ в магазине и открывается страница
              оплаты.
            </p>
          </section>
        </div>
      </div>
    </main>
  );
}
