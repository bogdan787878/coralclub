"use client";

import { useCallback, useEffect, useState } from "react";
import { cc4 } from "@coral/api";
import { problem, tz, ym } from "@/lib/lk/cabinet/format";
import { computeTasks, type Member, type Tasks } from "@/lib/lk/cabinet/tasks";
import type { Dash } from "@/lib/lk/cabinet/metrics";

export type Profile = {
  id?: number;
  name?: string;
  surname?: string;
  patronymic?: string;
  avatar?: string;
  currency?: string;
  position?: string;
  rank?: string;
  fullRank?: string;
  maxRank?: string;
  phone?: string;
  email?: string;
  emailNeedConfirm?: boolean;
  confirmedEmail?: boolean;
  telegram?: string;
  whatsApp?: string;
  viber?: string;
  birthday?: string;
  address?: { city?: string; country?: string };
  consultant?: { surname?: string; name?: string; patronymic?: string };
};
export type TransferMonth = { month: string | number; balanceMonth?: number | string };
export type MetricsState = { json: unknown; at: Date } | { error: string } | null;
export type TasksState = Tasks | { error: string } | null;

/**
 * Данные главной кабинета (перенесено из load() кабинета на чистом JS): профиль, основной счёт, трансферный счёт,
 * дашборд, ранг из структуры, показатели, задачи. Каждый кусок приходит сам по себе: медленный запрос не прячет остальное.
 */
export function useCabinet() {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [balance, setBalance] = useState<number | null | undefined>(undefined); // undefined — ещё грузим
  const [months, setMonths] = useState<TransferMonth[] | null>(null);
  const [dash, setDash] = useState<Dash>(null);
  const [member, setMember] = useState<{ rank?: string; fullNameRank?: string } | null>(null);
  const [metrics, setMetrics] = useState<MetricsState>(null);
  const [tasks, setTasks] = useState<TasksState>(null);
  const [run, setRun] = useState(0);

  useEffect(() => {
    let alive = true;
    const set = <T,>(fn: (v: T) => void) => (v: T) => alive && fn(v);
    (async () => {
      const acc = await cc4<{ data?: Profile }>("/account");
      const p = acc.json?.data ?? null;
      set(setProfile)(p);
      const currency = p?.currency || "RUB";
      cc4<{ data?: { balance?: number } | { balance?: number }[] }>(`/account/checking_accounts?currency=${encodeURIComponent(currency)}`).then((chk) => {
        const row = Array.isArray(chk.json?.data) ? chk.json.data[0] : chk.json?.data;
        set(setBalance)(chk.ok && row && row.balance !== undefined ? Number(row.balance) : null);
      });
    })();
    cc4<{ data?: { item?: TransferMonth[] } }>(`/personal-new/transfer/month?timeZone=${encodeURIComponent(tz())}`).then((mon) =>
      set(setMonths)(mon.ok ? [...(mon.json?.data?.item ?? [])].sort((a, b) => (String(a.month) < String(b.month) ? 1 : -1)) : []),
    );
    cc4<{ data?: Record<string, unknown> }>("/account/dashboard").then((r) => set(setDash)(r.ok ? (r.json?.data ?? null) : null));
    cc4<{ data?: { rank?: string; fullNameRank?: string } }>(`/personal-new/structure/current/member?month=${ym()}&type=PRep`).then((r) => set(setMember)(r.ok ? (r.json?.data ?? null) : null));
    cc4("/account/metrics").then((met) =>
      set(setMetrics)(met.ok ? { json: met.json, at: new Date() } : { error: met.status === 403 ? "Показатели недоступны для этого аккаунта (403)." : `Не удалось получить показатели: ${problem(met)}` }),
    );
    Promise.all([cc4<{ data?: { structure?: Member[] } }>("/personal-new/structure/reports/contact?showInactive=false"), cc4<{ data?: { structure?: Member[] } }>(`/personal-new/structure/reports?month=${ym()}&type=PRep`)]).then(([c, p]) => {
      const contact = c.json?.data?.structure;
      const prep = p.json?.data?.structure;
      set(setTasks)(c.ok && p.ok && Array.isArray(contact) && Array.isArray(prep) ? computeTasks(contact, prep) : { error: `Задачи недоступны: ${problem(c.ok ? p : c)}` });
    });
    return () => {
      alive = false;
    };
  }, [run]);

  const reload = useCallback(() => setRun((n) => n + 1), []);
  const currency = profile?.currency || "RUB";
  // на трансферном счёте: баллы текущего (последнего) месяца
  const points = months === null ? undefined : months.length ? Number(months[0].balanceMonth ?? 0) : null;
  return { profile, currency, balance, months, points, dash, member, metrics, tasks, reload };
}
export type Cabinet = ReturnType<typeof useCabinet>;
