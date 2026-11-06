"use client";

import { useCallback, useEffect, useRef, useState, type FormEvent } from "react";
import { cc4 } from "@coral/api";
import { fmt, problem, titleCase, ym } from "@/lib/lk/cabinet/format";
import { RANKS, rankRu } from "@/lib/lk/cabinet/ranks";
import { DetailPage } from "./Pages";
import { SkRows, useSheet } from "./Sheet";
import { useCabinet } from "./useCabinet";

/**
 * «Моя структура» (перенесено из home.js кабинета): разметка маркетинг-плана — уровни подгружаются по клику, фильтры
 * хранит кабинет (общие с сайтом). Если разметка недоступна — дерево из отчёта по структуре (PRep) без фильтров.
 */
type Node = { id: string; name: string; avatar?: string | null; rank?: string; position?: string; go?: number | string; depth?: number | null; children?: Node[]; error?: string };
type MpItem = { memberId: number | string; surname?: string; name?: string; avatar?: string; rank?: string; position?: string; volumeGroup?: number; hasReferredMembers?: boolean };
type RepItem = { memberId: number | string; fullName?: string; surname?: string; name?: string; rank?: string; position?: string; volumeGroup?: number; level?: string; avatar?: string };
type Filter = Record<string, unknown> & { type?: string; openRanks?: string[]; newbies?: boolean; minRegistrationDate?: string; maxRegistrationDate?: string | null; directorGenerations?: number };
type Struct = { mp: true; number: string | number; root: Node; filter: Filter | null; filterError: string } | { mp: false; root: Node; note: string; flat: boolean } | { error: string };

const POS: Record<string, string> = { CONSUMER: "Потребитель", DISTRIBUTOR: "Дистрибьютор", CANDIDATE: "Кандидат", FRIEND: "Друг клуба" };
const roleOf = (n: Node) => RANKS.find((r) => r.codes.includes(n.rank ?? ""))?.name || POS[n.position ?? ""] || (n.rank ? `Ранг ${rankRu(n.rank)}` : "Участник");
const VOL: [string, string][] = [["PersonalVolume", "ЛО"], ["GroupVolume", "ГО"], ["QualifyingVolume", "СОП"], ["QualifyingStarVolume", "СОП*"]];
const volKeys = () => VOL.flatMap(([b]) => ["", "Plan"].flatMap((k) => [`min${b}${k}`, `max${b}${k}`]));
const TYPES: [string, string][] = [["ALL", "Все"], ["CONSUMER", "Потребители"], ["DIRECTOR", "Директора"]];
const RANK_CODES = ["D", "SD", "GD", "ED", "DD", "DD+", "E", "SE", "SE1", "GE", "GE1", "PE", "PE1", "PE2", "PE3", "2SE", "StE", "A", "jA", "PM", "M", "5*"];
const rankLabel = (c: string) => RANKS.find((r) => r.codes.includes(c))?.name ?? (c === "DD+" ? "Бриллиантовый+" : rankRu(c));
const mpNode = (it: MpItem): Node => ({
  id: String(it.memberId),
  name: titleCase([it.surname, it.name].filter(Boolean).join(" ")) || `ID ${it.memberId}`,
  avatar: it.avatar || null,
  rank: it.rank,
  position: it.position,
  go: it.volumeGroup,
  children: it.hasReferredMembers === false ? [] : undefined,
});
/** Глубина из поля level: «.0» → 0, «.2» → 2, «.1.2» → 2, «..3» → 3. */
const depthOf = (level: unknown): number | null => {
  const nums = String(level ?? "").match(/-?\d+/g);
  if (nums?.length === 1) return Number(nums[0]);
  if (nums && nums.length > 1) return nums.length;
  const dots = String(level ?? "").match(/\./g);
  return dots ? dots.length : null;
};
/** Дерево из плоского отчёта: порядок обхода, родитель — ближайшая запись с глубиной на 1 меньше. */
function buildTree(items: RepItem[]): { root: Node; flat: boolean; byId: Map<string, Node> } {
  const nodes: Node[] = items.map((it) => ({ id: String(it.memberId), name: titleCase(it.fullName || [it.surname, it.name].filter(Boolean).join(" ")) || `ID ${it.memberId}`, rank: it.rank, position: it.position, go: it.volumeGroup, depth: depthOf(it.level), children: [] }));
  if (!nodes.some((n) => n.depth !== null)) return { flat: true, root: { id: "root", name: "Моя структура", children: nodes }, byId: new Map(nodes.map((n) => [n.id, n])) };
  const stack: Node[] = [];
  let root: Node | null = null;
  for (const n of nodes) {
    while (stack.length && (stack[stack.length - 1].depth ?? 0) >= (n.depth ?? 0)) stack.pop();
    if (stack.length) stack[stack.length - 1].children!.push(n);
    else if (!root) root = n;
    stack.push(n);
  }
  const byId = new Map<string, Node>();
  const walk = (n: Node) => {
    byId.set(n.id, n);
    n.children?.forEach(walk);
  };
  walk(root as Node);
  return { flat: false, root: root as Node, byId };
}
function filterCount(f: Filter | null) {
  if (!f) return 0;
  let n = 0;
  if (f.type && f.type !== "ALL") n++;
  if (f.openRanks?.length) n++;
  if (f.newbies) n++;
  if (f.minRegistrationDate || f.maxRegistrationDate) n++;
  for (const k of volKeys()) if (Number(f[k]) > 0) n++;
  return n;
}

function Avatar({ n, cls = "" }: { n: Node; cls?: string }) {
  const hue = (Number(n.id) * 47) % 360;
  const ini = n.name.split(/\s+/).filter(Boolean).slice(0, 2).map((x) => x[0]).join("").toUpperCase() || "•";
  return (
    <span className={`st-av ${cls}`} style={{ ["--h" as string]: hue }}>
      {n.avatar ? (
        // eslint-disable-next-line @next/next/no-img-element -- фото из API кабинета, без оптимизатора картинок
        <img src={n.avatar} alt="" referrerPolicy="no-referrer" />
      ) : (
        ini
      )}
    </span>
  );
}

function FilterSheet({ f0, onSaved }: { f0: Filter; onSaved: () => void }) {
  const sheet = useSheet();
  const [type, setType] = useState(f0.type || "ALL");
  const [note, setNote] = useState<{ text: string; kind?: string }>({ text: "" });
  const [busy, setBusy] = useState(false);
  const formRef = useRef<HTMLFormElement>(null);
  const num = (k: string) => (Number(f0[k]) > 0 ? String(f0[k]) : "");
  const nz = (v: unknown) => {
    const x = Number(String(v ?? "").replace(/\s/g, "").replace(",", "."));
    return Number.isFinite(x) && x > 0 ? x : 0;
  };
  const save = async (body: Filter) => {
    setBusy(true);
    setNote({ text: "Сохраняем…" });
    const r = await cc4<{ success?: boolean }>("/marketing-plans/calculations/filter", { method: "PUT", body });
    setBusy(false);
    if (!(r.ok && r.json?.success !== false)) return setNote({ text: problem(r), kind: "bad" });
    sheet.close();
    onSaved();
  };
  const submit = (e: FormEvent) => {
    e.preventDefault();
    const el = formRef.current!.elements as unknown as Record<string, HTMLInputElement>;
    const body: Filter = {
      type,
      directorGenerations: Math.max(0, Math.floor(nz(el.directorGenerations.value))),
      openRanks: [...formRef.current!.querySelectorAll<HTMLInputElement>('input[name="rank"]:checked')].map((i) => i.value),
      newbies: el.newbies.checked,
      minRegistrationDate: el.minRegistrationDate.value || undefined,
      maxRegistrationDate: el.maxRegistrationDate.value || null,
    };
    for (const k of volKeys()) body[k] = nz(el[k].value);
    void save(body);
  };
  const reset = () => {
    if (!window.confirm("Сбросить фильтры структуры? Они сохранены в вашем аккаунте и на сайте тоже сбросятся.")) return;
    const body: Filter = { type: "ALL", directorGenerations: Number(f0.directorGenerations) || 0, openRanks: [], newbies: false, maxRegistrationDate: null };
    for (const k of volKeys()) body[k] = 0;
    void save(body);
  };
  const volTable = (kind: string, title: string) => (
    <details className="fl-det">
      <summary>{title}</summary>
      <div className="fl-vol">
        {VOL.map(([b, name]) => (
          <span key={b} style={{ display: "contents" }}>
            <span className="fl-name">{name}</span>
            <input name={`min${b}${kind}`} inputMode="decimal" placeholder="от" defaultValue={num(`min${b}${kind}`)} />
            <input name={`max${b}${kind}`} inputMode="decimal" placeholder="до" defaultValue={num(`max${b}${kind}`)} />
          </span>
        ))}
      </div>
    </details>
  );
  return (
    <form className="sheet-form" ref={formRef} onSubmit={submit}>
      <fieldset className="fl-set">
        <legend>Кого показывать</legend>
        <div className="seg fl-seg" role="group">
          {TYPES.map(([v, t]) => (
            <button key={v} type="button" className={type === v ? "on" : ""} onClick={() => setType(v)}>
              {t}
            </button>
          ))}
        </div>
      </fieldset>
      <label>
        Поколений директоров
        <input name="directorGenerations" inputMode="numeric" defaultValue={String(Number(f0.directorGenerations) || 0)} />
      </label>
      <fieldset className="fl-set">
        <legend>Ранги</legend>
        <div className="fl-chips">
          {RANK_CODES.map((c) => (
            <label key={c} className="fl-chip">
              <input type="checkbox" name="rank" value={c} defaultChecked={f0.openRanks?.includes(c)} />
              <span>{rankLabel(c)}</span>
            </label>
          ))}
        </div>
      </fieldset>
      <label className="fl-check">
        <input type="checkbox" name="newbies" defaultChecked={!!f0.newbies} /> Новички
      </label>
      <fieldset className="fl-set">
        <legend>Дата регистрации</legend>
        <div className="fl-two">
          <input type="date" name="minRegistrationDate" defaultValue={f0.minRegistrationDate ?? ""} />
          <input type="date" name="maxRegistrationDate" defaultValue={f0.maxRegistrationDate ?? ""} />
        </div>
      </fieldset>
      {volTable("", "Объёмы: факт")}
      {volTable("Plan", "Объёмы: план")}
      <button className="btn" type="submit" disabled={busy}>
        Применить
      </button>
      <button className="btn ghost" type="button" onClick={reset}>
        Сбросить
      </button>
      <p className={`note ${note.kind ?? ""}`} role="status">
        {note.text}
      </p>
    </form>
  );
}

export function StructurePage() {
  const cab = useCabinet();
  const sheet = useSheet();
  const [s, setS] = useState<Struct | null>(null);
  const [path, setPath] = useState<string[]>([]);
  const [, bump] = useState(0); // узлы дерева меняются на месте (подгрузка уровней): перерисовка
  const [run, setRun] = useState(0);
  const meId = String(cab.profile?.id ?? "");

  const loadKids = useCallback(async (node: Node, number: string | number) => {
    if (node.children !== undefined) return;
    const r = await cc4<{ data?: MpItem[] }>(`/marketing-plans/levels/children?number=${number}&memberId=${encodeURIComponent(node.id)}`);
    const list = r.json?.data;
    node.children = r.ok && Array.isArray(list) ? list.map(mpNode).filter((n) => n.id !== node.id) : [];
    if (!r.ok) node.error = problem(r);
    bump((n) => n + 1);
  }, []);

  useEffect(() => {
    if (!cab.profile) return;
    let alive = true;
    const fallback = async (note: string) => {
      const months = [ym(), ym(new Date(new Date().getFullYear(), new Date().getMonth() - 1, 1))];
      let rep: RepItem[] | null = null;
      let lastErr = "";
      for (const m of months) {
        const r = await cc4<{ data?: { structure?: RepItem[] } }>(`/personal-new/structure/reports?month=${m}&type=PRep`);
        const list = r.json?.data?.structure;
        if (r.ok && Array.isArray(list) && list.length) {
          rep = list;
          break;
        }
        if (!r.ok) lastErr = problem(r);
      }
      if (!alive) return;
      if (!rep) return setS({ error: lastErr || "В отчёте нет данных по структуре." });
      const tree = buildTree(rep);
      setS({ mp: false, root: tree.root, note, flat: tree.flat });
      setPath([]);
      // фото участников: из отчёта по контактам
      const c = await cc4<{ data?: { structure?: RepItem[] } }>("/personal-new/structure/reports/contact?showInactive=false");
      const people = c.json?.data?.structure;
      if (alive && c.ok && Array.isArray(people)) {
        const photo = new Map(people.filter((p) => p.avatar).map((p) => [String(p.memberId), p.avatar as string]));
        tree.byId.forEach((n) => (n.avatar = photo.get(n.id) ?? null));
        bump((n) => n + 1);
      }
    };
    (async () => {
      setS(null);
      const [calc, flt] = await Promise.all([cc4<{ data?: { number: string | number; month?: string; date?: string }[] }>("/marketing-plans/calculations"), cc4<{ data?: Filter }>("/marketing-plans/calculations/filter")]);
      const list = calc.json?.data;
      if (!(calc.ok && Array.isArray(list) && list.length)) return fallback(`Разметка недоступна (${calc.ok ? "нет расчётов" : problem(calc)}): показан отчёт по структуре без фильтров.`);
      const number = [...list].sort((a, b) => String(b.month).localeCompare(String(a.month)) || String(b.date).localeCompare(String(a.date)))[0].number;
      const top = await cc4<{ data?: MpItem[] }>(`/marketing-plans/levels/children?number=${number}`);
      const items = top.json?.data;
      if (!(top.ok && Array.isArray(items))) return fallback(`Разметка недоступна (${problem(top)}): показан отчёт по структуре без фильтров.`);
      const p = cab.profile;
      const mine = items.find((it) => String(it.memberId) === meId);
      const root: Node = mine ? { ...mpNode(mine), children: undefined } : { id: meId || "root", name: titleCase([p?.surname, p?.name].filter(Boolean).join(" ")) || "Моя структура", rank: cab.member?.rank, position: p?.position, children: items.map(mpNode) };
      root.name = titleCase(root.name);
      if (!alive) return;
      setS({ mp: true, number, root, filter: flt.ok ? (flt.json?.data ?? null) : null, filterError: flt.ok ? "" : problem(flt) });
      setPath([]);
      if (mine) await loadKids(root, number);
    })();
    return () => {
      alive = false;
    };
  }, [cab.profile, cab.member?.rank, meId, run, loadKids]);

  if (!s) {
    return (
      <DetailPage title="Моя структура" id="h-structure">
        <section className="h-card">
          <SkRows n={5} />
        </section>
      </DetailPage>
    );
  }
  if ("error" in s) {
    return (
      <DetailPage title="Моя структура" id="h-structure">
        <section className="h-card">
          <p className="muted">{s.error}</p>
        </section>
      </DetailPage>
    );
  }
  const { root } = s;
  const chain: Node[] = [root];
  for (const id of path) {
    const n = chain[chain.length - 1].children?.find((c) => c.id === id);
    if (!n) break;
    chain.push(n);
  }
  const nf = s.mp ? filterCount(s.filter) : 0;
  const pick = async (levelIndex: number, node: Node) => {
    setPath((p) => [...p.slice(0, levelIndex), node.id]);
    if (s.mp) await loadKids(node, s.number);
  };
  const openFilter = () => {
    if (!s.mp) return;
    if (!s.filter) return sheet.open("Фильтры", <p className="sheet-empty">{s.filterError || "Фильтры не загрузились."}</p>);
    sheet.open("Фильтры", <FilterSheet f0={s.filter} onSaved={() => setRun((n) => n + 1)} />);
  };
  return (
    <DetailPage title="Моя структура" id="h-structure">
      <section className="h-card st-wrap">
        {s.mp ? (
          <div className="st-bar">
            <span className="muted">{nf ? `Фильтры включены: ${nf}` : "Фильтры не заданы"}</span>
            <button type="button" className="st-filter" onClick={openFilter}>
              Фильтры{nf ? <em>{nf}</em> : null}
            </button>
          </div>
        ) : (
          <p className="muted st-note">{s.note}</p>
        )}
        <div className="st-me">
          <Avatar n={root} cls="big" />
          <div>
            <b>{root.name}</b>
            <span>{!s.mp && s.flat ? "Все участники" : roleOf(root)}</span>
          </div>
        </div>
        {chain.map((node, i) => {
          const kids = node.children;
          const next = chain[i + 1];
          if (kids === undefined) return <SkRows key={node.id} n={2} />;
          const label = <p className="st-label">Подчинённых: {kids.length}</p>;
          if (!kids.length)
            return (
              <div key={node.id}>
                {label}
                <p className="muted st-empty">{node.error ? node.error : nf ? "Никого нет по выбранным фильтрам." : "У этого участника пока нет подчинённых."}</p>
              </div>
            );
          if (next) {
            return (
              <section key={node.id} className="st-level">
                {label}
                <div className="st-row">
                  {kids.map((k) => (
                    <button key={k.id} type="button" className={`st-chip ${k === next ? "on" : ""}`} aria-label={k.name} onClick={() => void pick(i, k)}>
                      <Avatar n={k} cls={k === next ? "sel" : ""} />
                    </button>
                  ))}
                </div>
                <div className="st-pick">
                  <b>{next.name}</b>
                  <span>{roleOf(next)}</span>
                </div>
              </section>
            );
          }
          return (
            <section key={node.id} className="st-level">
              {label}
              <div className="st-grid">
                {kids.map((k) => (
                  <button key={k.id} type="button" className="st-card" onClick={() => void pick(i, k)}>
                    <Avatar n={k} />
                    <b>{k.name}</b>
                    <span>{roleOf(k)}</span>
                    {k.go ? <em>ГО {fmt(Number(k.go))}</em> : null}
                  </button>
                ))}
              </div>
            </section>
          );
        })}
      </section>
    </DetailPage>
  );
}
