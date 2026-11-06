"use client";

import Link from "next/link";
import { useEffect, useState, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { cc4, logout } from "@coral/api";
import { Icon } from "@/components/ui";
import { count, dmy, fio, money, points, problem, titleCase } from "@/lib/lk/cabinet/format";
import { RANKS, rankRu } from "@/lib/lk/cabinet/ranks";
import { useLkCountry } from "@/lib/lk/country";
import { openBank } from "@/lib/lk/pay";
import { PaySheet, PayoutSheet, PointsSheet, StatementSheet } from "./Actions";
import { Avatar } from "./ProfileHome";
import { SkRows, useSheet } from "./Sheet";
import { useCabinet, type Cabinet } from "./useCabinet";

/** Внутренняя страница кабинета: закреплённая шапка «Назад · заголовок» (как в iOS) и содержимое. */
export function DetailPage({ title, back = "/lk/me/", id, children }: { title: string; back?: string; id: string; children: ReactNode }) {
  const [scrolled, setScrolled] = useState(false);
  useEffect(() => {
    const on = () => setScrolled(window.scrollY > 4); // под шапкой появляется тонкая линия, когда контент уходит под неё
    window.addEventListener("scroll", on, { passive: true });
    return () => window.removeEventListener("scroll", on);
  }, []);
  return (
    <main className="home">
      <div id="h-detail">
        <header className={`h-dhead${scrolled ? " scrolled" : ""}`}>
          <Link className="h-back" href={back} aria-label="Назад">
            <Icon name="back" />
            <span>Назад</span>
          </Link>
          <h2>{title}</h2>
          <div className="h-dside" />
        </header>
        <div id={id}>{children}</div>
      </div>
    </main>
  );
}

const Row = ({ inc, title, sub, sum }: { inc: boolean; title: ReactNode; sub: string; sum: string }) => (
  <li className="h-row">
    <span className={`h-ico ${inc ? "in" : "out"}`}>{inc ? "↓" : "↑"}</span>
    <div className="h-main">
      <b>{title}</b>
      <span>{sub}</span>
    </div>
    <span className={`h-sum ${inc ? "in" : ""}`}>
      {inc ? "+" : "−"}
      {sum}
    </span>
  </li>
);

/* ---------- Coral Кошелёк: баланс, действия, история по счёту ---------- */
type Op = { date?: string; typeName?: string; comment?: string; eventId?: string; income?: number | null; expense?: number | null; currency?: string };
export function WalletPage() {
  const cab = useCabinet();
  const sheet = useSheet();
  const [monthsBack, setMonthsBack] = useState(6);
  const [shown, setShown] = useState(8);
  const [ops, setOps] = useState<{ items: Op[] } | { error: string } | null>(null);
  useEffect(() => {
    let alive = true;
    cc4<{ data?: { items?: Op[] } }>(`/personal-new/wallet/baRep?monthReport=${monthsBack}`).then((r) => {
      if (!alive) return;
      const items = r.json?.data?.items;
      setOps(r.ok && Array.isArray(items) ? { items } : { error: problem(r) });
    });
    return () => {
      alive = false;
    };
  }, [monthsBack]);
  const all = ops && "items" in ops ? ops.items.filter((i) => !i.currency || i.currency === cab.currency) : [];
  const income = all.reduce((a, i) => a + Number(i.income ?? 0), 0);
  const expense = all.reduce((a, i) => a + Number(i.expense ?? 0), 0);
  return (
    <DetailPage title="Coral Кошелёк" id="h-wallet">
      <section className="h-balance" aria-label="Coral Кошелёк">
        <p className={`h-amount${cab.balance === undefined ? " sk" : ""}`}>{typeof cab.balance === "number" ? money(cab.balance, cab.currency) : "—"}</p>
        <p className="h-caption">Coral Кошелёк</p>
      </section>
      <nav className="h-actions h-actions-4" aria-label="Действия по счёту">
        <button className="h-act" type="button" onClick={() => sheet.open("Оплатить заказ бонусами", <PaySheet cab={cab} shopHref="/lk/" />)}>
          <span>
            <Icon name="bag" />
          </span>
          Оплатить бонусами
        </button>
        <button className="h-act" type="button" onClick={() => sheet.open("Вывести на карту", <PayoutSheet cab={cab} />)}>
          <span>
            <Icon name="card" />
          </span>
          Вывести на карту
        </button>
        <button className="h-act" type="button" onClick={() => sheet.open("Перевод баллов", <PointsSheet cab={cab} onDone={cab.reload} />)}>
          <span>
            <Icon name="arrowRight" />
          </span>
          Перевести баллы
        </button>
        <button className="h-act" type="button" onClick={() => sheet.open("Выписка", <StatementSheet cab={cab} />)}>
          <span>
            <Icon name="doc" />
          </span>
          Выписка
        </button>
      </nav>
      <section className="h-card" aria-label="История по счету">
        {!ops ? (
          <>
            <h3>История по счету</h3>
            <SkRows n={4} />
          </>
        ) : "error" in ops ? (
          <>
            <h3>История по счету</h3>
            <p className="muted">{ops.error}</p>
          </>
        ) : (
          <>
            <div className="h-head">
              <h3>История по счету</h3>
              <div className="seg" role="group" aria-label="Период">
                {[1, 3, 6].map((n) => (
                  <button key={n} type="button" className={n === monthsBack ? "on" : ""} onClick={() => (setOps(null), setShown(8), setMonthsBack(n))}>
                    {n} мес.
                  </button>
                ))}
              </div>
            </div>
            <div className="h-stats">
              <div>
                <span>Приход</span>
                <b className="in">+{money(income, cab.currency)}</b>
              </div>
              <div>
                <span>Расход</span>
                <b>−{money(expense, cab.currency)}</b>
              </div>
            </div>
            {all.length ? (
              <ul className="h-list">
                {all.slice(0, shown).map((i, k) => {
                  const inc = i.income !== null && i.income !== undefined && Number(i.income) !== 0;
                  const sum = inc ? Number(i.income) : Number(i.expense ?? 0);
                  return <Row key={k} inc={inc} title={i.typeName || "Операция"} sub={[dmy(i.date), i.comment || i.eventId || ""].filter(Boolean).join(" · ")} sum={money(sum, i.currency || cab.currency)} />;
                })}
              </ul>
            ) : (
              <p className="muted">Операций за период нет.</p>
            )}
            {all.length > shown && (
              <button className="h-more" type="button" onClick={() => setShown((n) => n + 20)}>
                Показать ещё
              </button>
            )}
          </>
        )}
      </section>
    </DetailPage>
  );
}

/* ---------- трансферный счёт: баланс, перевод баллов, история ---------- */
type TOrder = { orderId?: number | string; type?: string; amount?: number | string; date?: string; client?: { surname?: string; name?: string }; branch?: { city?: string } };
const TRANSFER_TYPES: Record<string, string> = { TRANSFER_ORDER: "Заказ по трансферу" };
export function TransferPage() {
  const cab = useCabinet();
  const sheet = useSheet();
  const [shown, setShown] = useState(8);
  const [hist, setHist] = useState<{ orders: TOrder[] } | { error: string } | null>(null);
  useEffect(() => {
    let alive = true;
    cc4<{ data?: { orders?: TOrder[] } }>("/personal-new/transfer/reports/branches?displayBalance=true&displayOrders=true").then((r) => {
      if (!alive) return;
      const orders = r.json?.data?.orders;
      setHist(r.ok && Array.isArray(orders) ? { orders: [...orders].sort((a, b) => String(b.date).localeCompare(String(a.date)) || Number(b.orderId) - Number(a.orderId)) } : { error: problem(r) });
    });
    return () => {
      alive = false;
    };
  }, [cab.months]);
  return (
    <DetailPage title="Трансферный счёт" id="h-transfer">
      <section className="h-balance" aria-label="Трансферный счёт">
        <p className={`h-amount${cab.points === undefined ? " sk" : ""}`}>{typeof cab.points === "number" ? points(cab.points) : "—"}</p>
        <p className="h-caption">Трансферный счёт</p>
      </section>
      <nav className="h-actions h-actions-one" aria-label="Действия">
        <button className="h-act" type="button" onClick={() => sheet.open("Перевод баллов", <PointsSheet cab={cab} onDone={cab.reload} />)}>
          <span>
            <Icon name="arrowRight" />
          </span>
          Перевод баллов
        </button>
      </nav>
      <section className="h-card" aria-label="История">
        {!hist ? (
          <>
            <h3>История</h3>
            <SkRows n={3} />
          </>
        ) : "error" in hist ? (
          <>
            <h3>История</h3>
            <p className="muted">{hist.error}</p>
          </>
        ) : (
          <>
            <div className="h-head">
              <h3>История</h3>
            </div>
            {hist.orders.length ? (
              <ul className="h-list">
                {hist.orders.slice(0, shown).map((o, k) => {
                  const amount = Number(o.amount ?? 0);
                  const who = [o.client?.surname, o.client?.name].filter(Boolean).join(" ");
                  return <Row key={k} inc={amount > 0} title={o.orderId ? `Заказ № ${o.orderId}` : TRANSFER_TYPES[o.type ?? ""] || "Операция"} sub={[dmy(o.date), who, o.branch?.city].filter(Boolean).join(" · ")} sum={points(Math.abs(amount))} />;
                })}
              </ul>
            ) : (
              <p className="muted">Операций пока нет.</p>
            )}
            {hist.orders.length > shown && (
              <button className="h-more" type="button" onClick={() => setShown((n) => n + 20)}>
                Показать ещё
              </button>
            )}
          </>
        )}
      </section>
    </DetailPage>
  );
}

/* ---------- история заказов ---------- */
type Order = { id: number | string; status?: string; createdAt?: string; productsCount?: number; isPersonal?: boolean; isTransfer?: boolean; isGroup?: boolean; bonus?: { total?: number | string }; totalPrice?: { amount?: number | string; currency?: string } };
const STATUS: Record<string, [string, string]> = { PAID: ["Оплачен", "ok"], UNPAID: ["Не оплачен", "wait"], CANCELED: ["Отменён", "bad"], CANCELLED: ["Отменён", "bad"], PARTIALLY_PAID: ["Оплачен частично", "wait"] };
/** «Оплатить» у неоплаченного заказа: тот же переход к банку, что после оформления. */
function PayButton({ id }: { id: string }) {
  const country = useLkCountry();
  const [state, setState] = useState<{ busy: boolean; error: string }>({ busy: false, error: "" });
  return (
    <>
      <button
        type="button"
        className="btn small"
        disabled={state.busy}
        onClick={async () => {
          setState({ busy: true, error: "" });
          const why = await openBank(id, { country });
          setState({ busy: false, error: why });
        }}
      >
        {state.busy ? "Открываем банк…" : "Оплатить"}
      </button>
      {state.error && <span className="note bad">Не удалось открыть оплату: {state.error}</span>}
    </>
  );
}

export function OrdersPage() {
  const [orders, setOrders] = useState<{ items: Order[] } | { error: string } | null>(null);
  const [shown, setShown] = useState(5);
  const [currency, setCurrency] = useState("RUB");
  useEffect(() => {
    let alive = true;
    cc4<{ data?: { currency?: string } }>("/account").then((r) => alive && setCurrency(r.json?.data?.currency || "RUB"));
    cc4<{ data?: Order[] }>("/personal-new/shop/orders").then((r) => {
      if (!alive) return;
      const items = r.json?.data;
      setOrders(r.ok && Array.isArray(items) ? { items: [...items].sort((a, b) => String(b.createdAt).localeCompare(String(a.createdAt)) || Number(b.id) - Number(a.id)) } : { error: problem(r) });
    });
    return () => {
      alive = false;
    };
  }, []);
  return (
    <DetailPage title="История заказов" id="h-orders">
      <section className="h-card" aria-label="История заказов">
        {!orders ? (
          <>
            <h3>История заказов</h3>
            <SkRows n={4} />
          </>
        ) : "error" in orders ? (
          <>
            <h3>История заказов</h3>
            <p className="muted">{orders.error}</p>
          </>
        ) : (
          <>
            <div className="h-head">
              <h3>История заказов</h3>
              <span className="muted">{count(orders.items.length, ["заказ", "заказа", "заказов"])}</span>
            </div>
            {orders.items.length ? (
              <ul className="h-list">
                {orders.items.slice(0, shown).map((o) => {
                  const [label, kind] = STATUS[o.status ?? ""] ?? [o.status || "—", "wait"];
                  const tags = [o.isPersonal && "Личный", o.isTransfer && "Трансфер", o.isGroup && "Групповой"].filter(Boolean) as string[];
                  const sub = [dmy(o.createdAt), o.productsCount ? count(o.productsCount, ["товар", "товара", "товаров"]) : "", o.bonus?.total ? points(Number(o.bonus.total)) : ""].filter(Boolean).join(" · ");
                  return (
                    <li key={String(o.id)} className="h-row">
                      <div className="h-main">
                        <b>Заказ № {o.id}</b>
                        <span>{sub}</span>
                        {tags.length > 0 && (
                          <span className="h-tags">
                            {tags.map((t) => (
                              <i key={t}>{t}</i>
                            ))}
                          </span>
                        )}
                      </div>
                      <div className="h-side">
                        <span className="h-sum">{o.totalPrice ? money(Number(o.totalPrice.amount), o.totalPrice.currency || currency) : "—"}</span>
                        <em className={`pill ${kind}`}>{label}</em>
                        {o.status === "UNPAID" && <PayButton id={String(o.id)} />}
                      </div>
                    </li>
                  );
                })}
              </ul>
            ) : (
              <p className="muted">Заказов пока нет.</p>
            )}
            {orders.items.length > shown && (
              <button className="h-more" type="button" onClick={() => setShown(orders.items.length)}>
                Показать все
              </button>
            )}
          </>
        )}
      </section>
    </DetailPage>
  );
}

/* ---------- профиль участника (только чтение) и выход ---------- */
const POSITIONS: Record<string, string> = { DISTRIBUTOR: "Дистрибьютор", CONSUMER: "Потребитель", CANDIDATE: "Кандидат", FRIEND: "Друг клуба" };
const LADDER = ["5*", "M", "PM", "jA", "A", "D", "SD", "GD", "ED", "DD", "DD+", "E", "SE", "SE1", "GE", "GE1", "PE", "PE1", "PE2", "PE3", "2SE", "StE"];
const rankLine = (code?: string) => (code ? (RANKS.find((r) => r.codes.includes(code))?.name ?? rankRu(code)) : "");

function LogoutSheet() {
  const sheet = useSheet();
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  return (
    <div className="sheet-form">
      <p className="muted">Чтобы снова войти, понадобятся логин и пароль.</p>
      <div className="row2">
        <button className="btn ghost" type="button" onClick={sheet.close}>
          Отмена
        </button>
        <button
          className="btn pf-out"
          type="button"
          disabled={busy}
          onClick={async () => {
            setBusy(true);
            await logout();
            sheet.close();
            router.replace("/lk/login/");
          }}
        >
          Выйти
        </button>
      </div>
    </div>
  );
}

export function ProfilePage() {
  const cab: Cabinet = useCabinet();
  const sheet = useSheet();
  const p = cab.profile;
  const row = (k: string, v: ReactNode) => (v ? (
    <li key={k}>
      <span>{k}</span>
      <b>{v}</b>
    </li>
  ) : null);
  const block = (title: string, rows: ReactNode[]) => (rows.some(Boolean) ? (
    <section className="h-card">
      <h3>{title}</h3>
      <ul className="pf-list">{rows}</ul>
    </section>
  ) : null);
  if (!p) {
    return (
      <DetailPage title="Профиль" id="h-profile">
        <SkRows n={4} />
      </DetailPage>
    );
  }
  const maxCode = String(p.maxRank ?? "").split("/")[0];
  const max = maxCode && LADDER.indexOf(maxCode) > LADDER.indexOf(p.fullRank || p.rank || "") ? rankLine(maxCode) : "";
  const adviser = p.consultant ? titleCase([p.consultant.surname, p.consultant.name, p.consultant.patronymic].filter(Boolean).join(" ")) : "";
  const where = [p.address?.city, p.address?.country].filter(Boolean).join(", ");
  return (
    <DetailPage title="Профиль" id="h-profile">
      <section className="pf-head">
        <Avatar p={p} className="pf-ava" />
        <h2>{fio(p)}</h2>
        <p>Coral ID {p.id}</p>
      </section>
      {block("В клубе", [row("Статус", POSITIONS[p.position ?? ""] ?? p.position), row("Ранг", rankLine(p.fullRank || p.rank)), row("Максимальный ранг", max), row("Наставник", adviser)])}
      {block("Контакты", [
        row("Телефон", p.phone),
        row(
          "E-mail",
          p.email ? (
            <>
              {p.email}
              {(p.emailNeedConfirm || p.confirmedEmail === false) && (
                <>
                  {" "}
                  <em className="pill wait">не подтверждён</em>
                </>
              )}
            </>
          ) : null,
        ),
        row("Telegram", p.telegram),
        row("WhatsApp", p.whatsApp),
        row("Viber", p.viber),
      ])}
      {block("Личное", [row("Дата рождения", dmy(p.birthday ?? "")), row("Город", where)])}
      <p className="muted pf-note">Профиль только для просмотра: менять данные нужно в кабинете на сайте.</p>
      <button className="pf-logout" type="button" onClick={() => sheet.open("Выйти из кабинета?", <LogoutSheet />)}>
        Выйти
      </button>
    </DetailPage>
  );
}
