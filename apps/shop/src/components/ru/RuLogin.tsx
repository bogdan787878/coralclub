"use client";

import { useEffect, useState, type FormEvent } from "react";
import { useSearchParams } from "next/navigation";
import { cc4, login, logout } from "@coral/api";
import { Button, FloatInput } from "@/components/ui";
import { moveGuestCartToMember } from "@/lib/ru/cart";
import { RU_BASE } from "@/lib/ru/shop";
import { useRuMember } from "@/lib/ru/live";
import { RuRegister } from "./RuRegister";
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
  // пришли из корзины («Оформить заказ») — это шаг оформления, а не просто вход
  const checkout = next.startsWith(`${RU_BASE}/checkout`);
  const [tab, setTab] = useState<"login" | "register">("login");

  const [user, setUser] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<{ text: string; bad: boolean }>({ text: "", bad: false });
  const [name, setName] = useState("");
  // вход прошёл — уходим дальше без экрана «Вы вошли» (он мелькал, пока переносится корзина)
  const [leaving, setLeaving] = useState(false);
  const goCheckout = raw !== "" && checkout;

  // уже вошёл и пришёл из корзины — сразу в оформление
  useEffect(() => {
    if (member && goCheckout && !leaving) window.location.replace(`${base}${next}`);
  }, [member, goCheckout, leaving, next]);

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

  /** Куда после входа или регистрации: из корзины — в оформление; из меню с товарами в корзине — тоже в оформление. */
  const dest = (moved: number) => (raw ? next : moved > 0 ? `${RU_BASE}/checkout/` : `${RU_BASE}/`);

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setLeaving(true);
    setMsg({ text: "Входим…", bad: false });
    const r = await login({ login: user.trim(), password, country: "RU", language: "ru" });
    setPassword(""); // пароль не остаётся в форме
    if (!r.ok) {
      setBusy(false);
      setLeaving(false);
      setMsg({ text: r.step === "auth" ? `Не удалось войти: ${r.message}` : `Нет связи с Coral Club (${r.message}).`, bad: true });
      return;
    }
    const moved = await moveGuestCartToMember();
    // новая загрузка: Layout и корзина начинают работать с корзиной участника
    window.location.assign(`${base}${dest(moved)}`);
  };

  const signOut = async () => {
    setBusy(true);
    await logout();
    window.location.assign(`${base}${RU_BASE}/`);
  };

  if (member === null) return null;

  // идёт вход или переход в оформление — без промежуточного экрана
  if (leaving || (member && goCheckout)) {
    return (
      <main className={styles.auth} aria-busy="true">
        <p className={styles.authText} role="status">
          {checkout ? "Переходим к оформлению заказа…" : "Входим…"}
        </p>
      </main>
    );
  }

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
      {checkout && <p className={styles.authStep}>Оформление заказа</p>}
      <h1 className={styles.authTitle}>
        {tab === "register" ? (checkout ? "Зарегистрируйтесь, чтобы оформить заказ" : "Регистрация") : checkout ? "Войдите, чтобы оформить заказ" : "Вход в магазин"}
      </h1>
      <p className={styles.authText}>
        {tab === "register"
          ? "Регистрация бесплатная: цены участника — до 20% ниже обычных и бонусные баллы за каждую покупку. Корзина сохранится."
          : "Заказы оформляют участники клуба — по ценам участника. Нет аккаунта — зарегистрируйтесь, корзина сохранится."}
      </p>

      <div className={styles.authTabs} role="tablist" aria-label="Вход или регистрация">
        <button type="button" role="tab" aria-selected={tab === "login"} className={tab === "login" ? styles.authTabOn : ""} onClick={() => setTab("login")}>
          Вход
        </button>
        <button type="button" role="tab" aria-selected={tab === "register"} className={tab === "register" ? styles.authTabOn : ""} onClick={() => setTab("register")}>
          Регистрация
        </button>
      </div>

      {tab === "login" ? (
        <form className={styles.authForm} onSubmit={submit} autoComplete="on">
          <FloatInput name="login" label="Coral ID или e-mail" value={user} onChange={setUser} autoComplete="username" />
          <FloatInput name="password" type="password" label="Пароль" value={password} onChange={setPassword} autoComplete="current-password" />
          <Button variant="primary" block type="submit" disabled={busy || !user.trim() || !password}>
            {checkout ? "Войти и продолжить" : "Войти"}
          </Button>
          <p className={`${styles.authMsg} ${msg.bad ? styles.authBad : ""}`} role="status">
            {msg.text}
          </p>
        </form>
      ) : (
        <>
          <RuRegister
            dest={dest}
            onLeaving={setLeaving}
            onLogin={(id) => {
              setUser(id);
              setTab("login");
              setMsg({ text: "Аккаунт создан. Войдите с паролем, который вы придумали.", bad: false });
            }}
          />
        </>
      )}
    </main>
  );
}
