"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { login } from "@coral/api";

/** Вход в кабинет (перенесено из кабинета на чистом JS): логин и пароль уходят только в API Coral Club. */
export function LoginForm() {
  const router = useRouter();
  const [user, setUser] = useState("");
  const [password, setPassword] = useState("");
  const [msg, setMsg] = useState<{ text: string; kind: "" | "busy" | "bad" }>({ text: "", kind: "" });
  const [busy, setBusy] = useState(false);
  const submit = async (e: FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setMsg({ text: "Входим…", kind: "busy" });
    const r = await login({ login: user.trim(), password });
    setPassword(""); // пароль не остаётся в форме
    setBusy(false);
    if (!r.ok) return setMsg({ text: `Не вошли (${r.step}${r.status ? `, ${r.status}` : ""}): ${r.message}`, kind: "bad" });
    const next = new URLSearchParams(window.location.search).get("next");
    router.replace(next && next.startsWith("/lk/") ? next : "/lk/me/");
  };
  return (
    <main className="center">
      <form className="card login" autoComplete="off" onSubmit={submit}>
        <h1>Вход в личный кабинет</h1>
        <p className="muted">Логин и пароль уходят только в Coral Club.</p>
        <label>
          Логин
          <input name="login" autoComplete="username" required value={user} onChange={(e) => setUser(e.target.value)} />
        </label>
        <label>
          Пароль
          <input name="password" type="password" autoComplete="current-password" required value={password} onChange={(e) => setPassword(e.target.value)} />
        </label>
        <button className="btn" type="submit" disabled={busy}>
          Войти
        </button>
        <p className={`msg ${msg.kind}`} role="status">
          {msg.text}
        </p>
      </form>
    </main>
  );
}
