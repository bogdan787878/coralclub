"use client";

import { useEffect, useState, type FormEvent } from "react";
import { cc4 } from "@coral/api";
import { count, dmy, initials, money, monthLabel, points, problem, tz } from "@/lib/lk/cabinet/format";
import type { Cabinet } from "./useCabinet";
import { SkLines, SkRows } from "./Sheet";

/**
 * Нижние листы быстрых действий кабинета (перенесено из home.js): перевод баллов, перевод бонусов, пригласить в клуб,
 * вывести на карту, выписка, оплата бонусами. Переводы — по подтверждению участника (confirm), как в кабинете.
 */
type Note = { text: string; kind?: "ok" | "bad" | "" };
const NoteLine = ({ n }: { n: Note }) => (
  <p className={`note ${n.kind ?? ""}${!n.kind && /…$/.test(n.text) ? " busy" : ""}`} role="status">
    {n.text}
  </p>
);

/* ---------- перевод баллов ---------- */
export function PointsSheet({ cab, onDone }: { cab: Cabinet; onDone: () => void }) {
  const months = (cab.months ?? []).filter((m) => Number(m.balanceMonth) > 0);
  const [month, setMonth] = useState(String(months[0]?.month ?? ""));
  const [memberId, setMemberId] = useState("");
  const [amount, setAmount] = useState("");
  const [person, setPerson] = useState<{ id: number | string; name?: string; surname?: string; avatar?: string; recipient?: boolean } | null>(null);
  const [checked, setChecked] = useState(false);
  const [note, setNote] = useState<Note>({ text: "" });
  const [busy, setBusy] = useState(false);
  if (!months.length) return <p className="sheet-empty">На трансферном счёте нет баллов для перевода.</p>;

  const check = async () => {
    const id = memberId.trim();
    if (!id) return setNote({ text: "Введите Coral ID", kind: "bad" }), null;
    setNote({ text: "Проверяем…" });
    const r = await cc4<{ data?: { id: number; name?: string; surname?: string; avatar?: string; recipient?: boolean } }>(
      `/personal-new/transfer/check-person?month=${encodeURIComponent(month)}&memberId=${encodeURIComponent(id)}&timeZone=${encodeURIComponent(tz())}`,
    );
    const d = r.json?.data;
    setChecked(!!d);
    if (!r.ok || !d) {
      setPerson(null);
      setNote({ text: problem(r), kind: "bad" });
      return null;
    }
    setPerson(d);
    setNote(d.recipient ? { text: "" } : { text: "Этому участнику перевести нельзя", kind: "bad" });
    return d.recipient ? d : null;
  };
  const submit = async (e: FormEvent) => {
    e.preventDefault();
    const who = person?.recipient ? person : await check();
    if (!who) return;
    const value = Number(amount.replace(",", "."));
    const have = Number(months.find((m) => String(m.month) === month)?.balanceMonth ?? 0);
    if (!(value > 0) || value > have) return setNote({ text: `Сумма от 0 до ${points(have)}`, kind: "bad" });
    if (!window.confirm(`Перевести ${points(value)} участнику ${who.surname ?? ""} ${who.name ?? ""} (${who.id})?`)) return;
    setBusy(true);
    setNote({ text: "Отправляем…" });
    const r = await cc4<{ success?: boolean }>("/personal-new/transfer/create", { method: "POST", body: { month: Number(month) || month, timeZone: tz(), members: [{ member: Number(who.id), amount: value }] } });
    setBusy(false);
    if (r.ok && r.json?.success !== false) {
      setNote({ text: "Перевод выполнен", kind: "ok" });
      onDone();
    } else setNote({ text: problem(r), kind: "bad" });
  };
  return (
    <form className="sheet-form" onSubmit={submit}>
      <label>
        Месяц
        <select name="month" value={month} onChange={(e) => (setMonth(e.target.value), setPerson(null))}>
          {months.map((m) => (
            <option key={String(m.month)} value={String(m.month)}>
              {monthLabel(m.month)}: {points(Number(m.balanceMonth))}
            </option>
          ))}
        </select>
      </label>
      <label>
        Coral ID получателя
        <span className="inline">
          <input name="member" inputMode="numeric" pattern="[0-9]*" required value={memberId} onChange={(e) => (setMemberId(e.target.value), setPerson(null), setChecked(false))} />
          <button className="btn small ghost" type="button" onClick={() => void check()}>
            Проверить
          </button>
        </span>
      </label>
      {checked && person && (
        <div className="person">
          {person.avatar ? (
            // eslint-disable-next-line @next/next/no-img-element -- аватар из API кабинета, без оптимизатора картинок
            <img src={person.avatar} alt="" />
          ) : (
            <span className="h-avatar">{initials(person)}</span>
          )}
          <div>
            <b>{[person.surname, person.name].filter(Boolean).join(" ")}</b>
            <span>{person.recipient ? "Может получить перевод" : "Не может получить перевод"}</span>
          </div>
        </div>
      )}
      <label>
        Сколько баллов
        <input name="amount" inputMode="decimal" required value={amount} onChange={(e) => setAmount(e.target.value)} />
      </label>
      <button className="btn" type="submit" disabled={busy}>
        Перевести
      </button>
      <NoteLine n={note} />
    </form>
  );
}

/* ---------- перевод бонусов ---------- */
export function BonusSheet({ cab, onDone }: { cab: Cabinet; onDone: () => void }) {
  const [recipient, setRecipient] = useState("");
  const [amount, setAmount] = useState("");
  const [note, setNote] = useState<Note>({ text: "" });
  const [busy, setBusy] = useState(false);
  const balance = typeof cab.balance === "number" ? cab.balance : null;
  const submit = async (e: FormEvent) => {
    e.preventDefault();
    const value = Number(amount.replace(",", "."));
    const recipientId = Number(recipient);
    if (!(value > 0) || (balance !== null && value > balance)) return setNote({ text: "Сумма больше нуля и не больше доступной", kind: "bad" });
    if (!window.confirm(`Перевести ${money(value, cab.currency)} участнику ${recipientId}?`)) return;
    setBusy(true);
    setNote({ text: "Отправляем…" });
    const r = await cc4<{ success?: boolean }>("/personal-new/transfer/bonus", { method: "POST", body: { recipientId, amount: value, currency: cab.currency } });
    setBusy(false);
    if (r.ok && r.json?.success !== false) {
      setNote({ text: "Перевод выполнен", kind: "ok" });
      onDone();
    } else setNote({ text: problem(r), kind: "bad" });
  };
  return (
    <form className="sheet-form" onSubmit={submit}>
      <p className="muted">
        Доступно: <b>{balance === null ? "—" : money(balance, cab.currency)}</b>
      </p>
      <label>
        Coral ID получателя
        <input name="recipient" inputMode="numeric" pattern="[0-9]*" required value={recipient} onChange={(e) => setRecipient(e.target.value)} />
      </label>
      <label>
        Сумма, {cab.currency}
        <input name="amount" inputMode="decimal" required value={amount} onChange={(e) => setAmount(e.target.value)} />
      </label>
      <button className="btn" type="submit" disabled={busy}>
        Перевести
      </button>
      <NoteLine n={note} />
    </form>
  );
}

/* ---------- пригласить в клуб ---------- */
export function InviteSheet({ cab }: { cab: Cabinet }) {
  const [state, setState] = useState<{ link: string; fromApi: boolean } | { error: string } | null>(null);
  const [note, setNote] = useState<Note>({ text: "" });
  useEffect(() => {
    let alive = true;
    cc4<{ data?: { link?: string } }>("/account/ref_link").then((r) => {
      if (!alive) return;
      // API может вернуть пустую ссылку: тогда личная страница участника (так её показывает «Рабочий стол»)
      const apiLink = r.json?.data?.link;
      const fallback = cab.profile?.id ? `https://coral.club/${cab.profile.id}.html` : "";
      const link = apiLink || fallback;
      setState(link ? { link, fromApi: !!apiLink } : { error: r.ok ? "Ссылка для этого аккаунта пока не выдана." : problem(r) });
    });
    return () => {
      alive = false;
    };
  }, [cab.profile?.id]);
  if (!state) return <div className="sheet-form"><SkLines n={2} /></div>;
  if ("error" in state) return <div className="sheet-form">{state.error}</div>;
  const canShare = typeof navigator !== "undefined" && !!navigator.share;
  return (
    <div className="sheet-form">
      <p className="muted">{state.fromApi ? "Ваша личная ссылка: по ней человек регистрируется в клубе под вами." : "Ваша личная страница в клубе. Именной реферальной ссылки в API для этого аккаунта нет."}</p>
      <input className="linkbox" readOnly value={state.link} aria-label="Реферальная ссылка" onFocus={(e) => e.currentTarget.select()} />
      <div className="row2">
        <button
          className="btn"
          type="button"
          onClick={async () => {
            try {
              await navigator.clipboard.writeText(state.link);
              setNote({ text: "Ссылка скопирована", kind: "ok" });
            } catch {
              setNote({ text: "Выделите ссылку и скопируйте вручную" });
            }
          }}
        >
          Скопировать
        </button>
        {canShare && (
          <button className="btn ghost" type="button" onClick={() => navigator.share({ title: "Приглашение в клуб", url: state.link }).catch(() => {})}>
            Поделиться
          </button>
        )}
      </div>
      <NoteLine n={note} />
    </div>
  );
}

/* ---------- вывести на карту: доступность, заявки; саму заявку оформляет страница кабинета (ссылка из API) ---------- */
const PAY_STATUS: Record<string, string> = { cancel: "Отменена", canceled: "Отменена", cancelled: "Отменена", rejected: "Отклонена", new: "Создана", processing: "В обработке", approved: "Одобрена", paid: "Выплачена", done: "Выплачена" };
type Payout = { id?: number | string; payableAmount?: number; amount?: number; sum?: number; total?: number; status?: string; statusName?: string; name?: string; date?: string; createdAt?: string; currency?: string };
export function PayoutSheet({ cab }: { cab: Cabinet }) {
  const [res, setRes] = useState<{ availOk: boolean; availErr: string; available: boolean; url: string; items: Payout[]; listOk: boolean } | null>(null);
  useEffect(() => {
    let alive = true;
    Promise.all([cc4<{ data?: unknown }>("/personal-new/wallet/assetDistributor/is-available"), cc4<{ data?: Payout[] | { items?: Payout[] } }>("/personal-new/wallet/bonus-payouts/list"), cc4<{ data?: unknown }>("/web_views/wallet/assetDistributor")]).then(([avail, list, link]) => {
      if (!alive) return;
      const ok = avail.ok ? (avail.json?.data as { available?: boolean; isAvailable?: boolean } | boolean | undefined) : null;
      const available = ok === true || (typeof ok === "object" && !!ok && (ok.available === true || ok.isAvailable === true));
      const ld = link.json?.data as string | { url?: string; link?: string } | undefined;
      const url = typeof ld === "string" ? ld : ld?.url || ld?.link || "";
      const raw = list.json?.data;
      const items = Array.isArray(raw) ? raw : Array.isArray(raw?.items) ? raw.items : [];
      setRes({ availOk: avail.ok, availErr: avail.ok ? "" : problem(avail), available, url, items, listOk: list.ok });
    });
    return () => {
      alive = false;
    };
  }, []);
  const have = typeof cab.balance === "number" ? money(cab.balance, cab.currency) : "—";
  if (!res) return <div className="sheet-form"><SkRows n={3} /></div>;
  const day = (v: unknown) => (/^\d{8}$/.test(String(v)) ? `${String(v).slice(6, 8)}.${String(v).slice(4, 6)}.${String(v).slice(0, 4)}` : dmy(String(v ?? "").slice(0, 10)));
  return (
    <div className="sheet-form">
      <p className="muted">
        Доступно: <b>{have}</b>
      </p>
      {!res.availOk ? (
        <p className="note bad">Не удалось проверить доступность выплат: {res.availErr}</p>
      ) : (
        !res.available && <p className="note">Выплата бонусов для этого аккаунта недоступна: раздел работает только для участников из России, при выполнении условий.</p>
      )}
      {res.url && (res.available || !res.availOk) && (
        <a className="btn" href={res.url} target="_blank" rel="noopener noreferrer">
          Оформить заявку в кабинете
        </a>
      )}
      {res.items.length ? (
        <>
          <h3 className="sheet-sub">Мои заявки</h3>
          <ul className="h-list">
            {res.items.slice(0, 5).map((i, k) => {
              const sum = Number(i.payableAmount ?? i.amount ?? i.sum ?? i.total ?? NaN);
              const st = PAY_STATUS[String(i.status ?? "").toLowerCase()] ?? i.statusName ?? i.status ?? "";
              return (
                <li key={String(i.id ?? k)} className="h-row">
                  <div className="h-main">
                    <b>Заявка{i.id ? ` № ${i.id}` : ""}</b>
                    <span>{[day(i.date ?? i.createdAt), st, i.name].filter(Boolean).join(" · ")}</span>
                  </div>
                  {Number.isFinite(sum) && <span className="h-sum">{money(sum, i.currency || cab.currency)}</span>}
                </li>
              );
            })}
          </ul>
        </>
      ) : (
        res.listOk && <p className="muted">Заявок на выплату пока нет.</p>
      )}
    </div>
  );
}

/* ---------- оплата бонусами: списываются при оформлении заказа ---------- */
export function PaySheet({ cab, shopHref }: { cab: Cabinet; shopHref: string }) {
  const have = typeof cab.balance === "number" ? money(cab.balance, cab.currency) : "—";
  return (
    <div className="sheet-form">
      <p className="muted">
        Доступно: <b>{have}</b>
      </p>
      <p>Бонусы списываются при оформлении заказа: на шаге оплаты выберите оплату бонусами.</p>
      <a className="btn" href={shopHref}>
        Перейти в магазин
      </a>
    </div>
  );
}

/* ---------- выписка: файл для Excel из отчёта «Движение бонусов» ---------- */
export function StatementSheet({ cab }: { cab: Cabinet }) {
  const [months, setMonths] = useState(3);
  const [note, setNote] = useState<Note>({ text: "" });
  const submit = async (e: FormEvent) => {
    e.preventDefault();
    setNote({ text: "Готовим выписку…" });
    const r = await cc4<{ data?: { items?: { date?: string; typeName?: string; comment?: string; eventId?: string; income?: number; expense?: number; currency?: string }[] } }>(`/personal-new/wallet/baRep?monthReport=${months}`);
    const items = r.json?.data?.items;
    if (!r.ok || !Array.isArray(items)) return setNote({ text: problem(r), kind: "bad" });
    const num = (v: unknown) => (v === null || v === undefined || v === "" ? "" : String(Number(v)).replace(".", ","));
    const cell = (v: unknown) => `"${String(v ?? "").replace(/"/g, '""')}"`;
    const lines = [["Дата", "Операция", "Комментарий", "Приход", "Расход", "Валюта"].map(cell).join(";")];
    items.forEach((i) => lines.push([dmy(i.date), i.typeName, i.comment || i.eventId || "", num(i.income), num(i.expense), i.currency || cab.currency].map(cell).join(";")));
    const url = URL.createObjectURL(new Blob(["﻿" + lines.join("\r\n")], { type: "text/csv;charset=utf-8" }));
    const a = Object.assign(document.createElement("a"), { href: url, download: `coral-koshelek-${months}m.csv` });
    document.body.append(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 2000);
    setNote({ text: `Выписка скачана: ${count(items.length, ["операция", "операции", "операций"])}`, kind: "ok" });
  };
  return (
    <form className="sheet-form" onSubmit={submit}>
      <p className="muted">Операции по Coral Кошельку: приход, расход, комментарии.</p>
      <div className="seg" role="group" aria-label="Период">
        {[1, 3, 6].map((n) => (
          <button key={n} type="button" className={n === months ? "on" : ""} onClick={() => setMonths(n)}>
            {n} мес.
          </button>
        ))}
      </div>
      <button className="btn" type="submit">
        Скачать для Excel
      </button>
      <NoteLine n={note} />
    </form>
  );
}
