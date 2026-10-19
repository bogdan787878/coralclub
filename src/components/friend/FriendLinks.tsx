"use client";

import { useState } from "react";
import { asset } from "@/lib/asset";
import { lookupDistributor, referralLink, type Friend } from "@/lib/friend";
import styles from "./Friend.module.css";

type Row =
  | { input: string; status: "ok"; friend: Friend; link: string }
  | { input: string; status: "notfound" };

/** Lines of Coral IDs (5–9 digits) or REF_CODEs (12 digits). */
const parse = (text: string): string[] => [
  ...new Set(
    text
      .split(/[\s,;]+/)
      .map((t) => t.replace(/\D/g, ""))
      .filter((t) => t.length >= 5),
  ),
];

/**
 * Internal tool: a table of Coral IDs in → a unique referral link per
 * distributor out (the link carries the shop's own REF_CODE). The names come
 * from the shop, so a typo in an ID shows up as «не найден».
 */
export function FriendLinks() {
  const [text, setText] = useState("");
  const [rows, setRows] = useState<Row[] | null>(null);
  const [busy, setBusy] = useState(false);
  const [copied, setCopied] = useState("");

  const base = () =>
    new URL(asset("/friend/"), window.location.origin).toString();

  const generate = async () => {
    const ids = parse(text);
    if (!ids.length) return;
    setBusy(true);
    setRows(null);
    const b = base();
    const out: Row[] = [];
    // a few at a time: be polite to the shop
    for (let i = 0; i < ids.length; i += 4) {
      const chunk = ids.slice(i, i + 4);
      const found = await Promise.all(
        chunk.map((id) =>
          lookupDistributor(
            id.length >= 12 ? { refCode: id } : { memberId: id },
          ),
        ),
      );
      chunk.forEach((id, k) => {
        const f = found[k];
        out.push(
          f
            ? { input: id, status: "ok", friend: f, link: referralLink(b, f) }
            : { input: id, status: "notfound" },
        );
      });
    }
    setRows(out);
    setBusy(false);
  };

  const copy = async (key: string, value: string) => {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(key);
      window.setTimeout(() => setCopied(""), 1500);
    } catch {
      /* clipboard blocked — the text stays selectable */
    }
  };

  const ok = (rows ?? []).filter((r) => r.status === "ok");
  const table = ok
    .map((r) =>
      r.status === "ok"
        ? `${r.friend.memberId}\t${r.friend.name}\t${r.link}`
        : "",
    )
    .join("\n");

  return (
    <div className={styles.linksPage}>
      <main className={styles.linksCard}>
        <h1 className={styles.h1}>Реферальные ссылки</h1>
        <p className={styles.muted}>
          Вставьте Coral ID друзей клуба (по одному в строке или через пробел).
          Для каждого будет собрана уникальная ссылка: покупки по ней
          засчитываются этому дистрибьютору.
        </p>

        <textarea
          className={styles.textarea}
          rows={6}
          placeholder={"8819457\n1234567"}
          value={text}
          onChange={(e) => setText(e.target.value)}
          aria-label="Coral ID"
        />
        <button
          type="button"
          className={styles.primary}
          onClick={generate}
          disabled={busy || !parse(text).length}
        >
          {busy ? "Собираю…" : "Собрать ссылки"}
        </button>

        {rows && (
          <>
            <div className={styles.tableBar}>
              <span className={styles.muted}>
                Найдено: {ok.length} из {rows.length}
              </span>
              {ok.length > 0 && (
                <button
                  type="button"
                  className={styles.ghostBtn}
                  onClick={() => copy("all", table)}
                >
                  {copied === "all" ? "Скопировано" : "Копировать таблицу"}
                </button>
              )}
            </div>
            <ul className={styles.linkRows}>
              {rows.map((r) =>
                r.status === "ok" ? (
                  <li key={r.input}>
                    <div>
                      <strong>{r.friend.name}</strong>
                      <small> · Coral ID {r.friend.memberId}</small>
                      <p className={styles.linkText}>{r.link}</p>
                    </div>
                    <button
                      type="button"
                      className={styles.ghostBtn}
                      onClick={() => copy(r.input, r.link)}
                    >
                      {copied === r.input ? "Скопировано" : "Копировать"}
                    </button>
                  </li>
                ) : (
                  <li key={r.input}>
                    <div>
                      <strong>{r.input}</strong>
                      <small> · не найден в магазине</small>
                    </div>
                  </li>
                ),
              )}
            </ul>
          </>
        )}
      </main>
    </div>
  );
}
