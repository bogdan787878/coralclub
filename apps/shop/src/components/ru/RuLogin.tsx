"use client";

import { useEffect, useState, type FormEvent } from "react";
import { useSearchParams } from "next/navigation";
import { cc4, login, logout } from "@coral/api";
import { Button, FloatInput } from "@/components/ui";
import { moveGuestCartToMember } from "@/lib/ru/cart";
import { RU_BASE, RU_REGISTRATION_URL } from "@/lib/ru/shop";
import { useRuMember } from "@/lib/ru/live";
import styles from "./Ru.module.css";

const base = process.env.NEXT_PUBLIC_BASE_PATH ?? "";

/**
 * Вход магазина России (личного кабинета нет). Логин и пароль уходят только в API Coral Club; после входа
 * корзина гостя переносится в корзину участника, и страница открывается заново уже с его ценами.
 * Вошедшему — кто он и «Выйти».
 */
export function RuLogin() {
  const member = useRuMember();
  const q = useSearchParams();
  const raw = q?.get("next") ?? "";
  const next = raw.startsWith(`${RU_BASE}/`) ? raw : `${RU_BASE}/`;

  const [user, setUser] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<{ text: string; bad: boolean }>({ text: "", bad: false });
  const [name, setName] = useState("");

  useEffect(() => {
    if (!member) return;
    let alive = true;
    cc4<{ data?: { name?: string; surname?: string; id?: number } }>("/account").then((r) => {
      const d = r.json?.data;
      if (alive && d) setName([d.name, d.surname].filter(Boolean).join(" ") || (d.id ? `Coral ID ${d.id}` : ""));
    });
    return () => {
      alive = false;
    };
  }, [member]);

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setMsg({ text: "Входим…", bad: false });
    const r = await login({ login: user.trim(), password, country: "RU", language: "ru" });
    setPassword(""); // пароль не остаётся в форме
    if (!r.ok) {
      setBusy(false);
      setMsg({ text: r.step === "auth" ? `Не удалось войти: ${r.message}` : `Нет связи с Coral Club (${r.message}).`, bad: true });
      return;
    }
    setMsg({ text: "Переносим корзину…", bad: false });
    await moveGuestCartToMember();
    // новая загрузка: Layout и корзина начинают работать с корзиной участника
    window.location.assign(`${base}${next}`);
  };

  const signOut = async () => {
    setBusy(true);
    await logout();
    window.location.assign(`${base}${RU_BASE}/`);
  };

  if (member === null) return null;

  if (member) {
    return (
      <main className={styles.auth}>
        <h1 className={styles.authTitle}>Вы вошли</h1>
        {name && <p className={styles.authText}>{name}</p>}
        <p className={styles.authText}>В магазине для вас цены участника клуба.</p>
        <Button variant="primary" block href={`${RU_BASE}/`}>
          В магазин
        </Button>
        <Button variant="secondary" block onClick={signOut} disabled={busy}>
          Выйти
        </Button>
      </main>
    );
  }

  return (
    <main className={styles.auth}>
      <h1 className={styles.authTitle}>Вход</h1>
      <p className={styles.authText}>Войдите, чтобы покупать по цене участника. Логин и пароль уходят только в Coral Club.</p>
      <form className={styles.authForm} onSubmit={submit} autoComplete="on">
        <FloatInput name="login" label="Coral ID или e-mail" value={user} onChange={setUser} autoComplete="username" />
        <FloatInput name="password" type="password" label="Пароль" value={password} onChange={setPassword} autoComplete="current-password" />
        <Button variant="primary" block type="submit" disabled={busy || !user.trim() || !password}>
          Войти
        </Button>
        <p className={`${styles.authMsg} ${msg.bad ? styles.authBad : ""}`} role="status">
          {msg.text}
        </p>
      </form>

      <div className={styles.authAlt}>
        <p className={styles.authText}>Ещё не участник? Регистрация бесплатная и даёт:</p>
        <ul className={styles.authPerks}>
          <li>цены участника — до 20% ниже обычных;</li>
          <li>бонусные баллы за каждую покупку.</li>
        </ul>
        <Button variant="secondary" block href={RU_REGISTRATION_URL} target="_blank" rel="noopener noreferrer">
          Зарегистрироваться
        </Button>
      </div>
    </main>
  );
}
