"use client";

import { useEffect, useState, type FormEvent } from "react";
import { login } from "@coral/api";
import { Button, Checkbox, FloatInput } from "@/components/ui";
import { moveGuestCartToMember } from "@/lib/ru/cart";
import { savedRef } from "@/lib/ru/ref";
import { EMAIL_RX, checkEmail, findConsultant, registerSimple, validPassword, type Consultant } from "@/lib/ru/registration";
import styles from "./Ru.module.css";

const base = process.env.NEXT_PUBLIC_BASE_PATH ?? "";

/** 10 цифр номера → «+7 (900) 000-00-00», по мере ввода. */
function formatRuPhone(d: string): string {
  if (!d) return "";
  let s = `+7 (${d.slice(0, 3)}`;
  if (d.length > 3) s += `) ${d.slice(3, 6)}`;
  if (d.length > 6) s += `-${d.slice(6, 8)}`;
  if (d.length > 8) s += `-${d.slice(8, 10)}`;
  return s;
}

/**
 * Маска российского номера: +7 (XXX) XXX-XX-XX. Первая 8 или 7 — код страны («8 900…» и «+7 900…» дают одно и
 * то же), вставка номера целиком — тоже; стирание сквозь скобки и дефисы убирает цифру.
 */
function maskRuPhone(next: string, prev: string): string {
  let d = next.replace(/\D/g, "");
  if (next.trim().startsWith("+7")) d = d.slice(1);
  else if (d.length >= 11 && /^[78]/.test(d)) d = d.slice(1);
  else if (!prev && (d === "7" || d === "8")) return "+7 (";
  d = d.slice(0, 10);
  const had = prev.replace(/\D/g, "").replace(/^7/, "");
  // стёрли скобку, пробел или дефис — цифры те же: убираем последнюю цифру
  if (next.length < prev.length && d === had) d = d.slice(0, -1);
  return formatRuPhone(d);
}

/**
 * Регистрация магазина России — упрощённая, как на coralclub.ru для России: имя, фамилия, телефон, e-mail, пароль,
 * согласие (и подписка по желанию). Консультант: по пригласительной ссылке он уже известен, иначе — поиск по
 * Coral ID или телефону. Аккаунт — POST /account/register API кабинета (lib/ru/registration: registerSimple),
 * создаётся только по нажатию. После регистрации — сразу вход, перенос корзины и переход дальше, без экрана «готово».
 */
export function RuRegister({
  dest,
  onLeaving,
  onLogin,
  sponsor,
  onDone,
}: {
  dest?: (moved: number) => string;
  onLeaving?: (v: boolean) => void;
  onLogin?: (login: string) => void;
  /** Регистрация вручную дистрибьютором: его Coral ID — консультант, после регистрации входа нет. */
  sponsor?: string;
  /** зарегистрирован (вручную) — Coral ID нового участника */
  onDone?: (memberId: string) => void;
}) {
  // имя и фамилия — одно поле; в базу уходят отдельно: первое слово — имя, остальное — фамилия
  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [emailTaken, setEmailTaken] = useState("");
  const [password, setPassword] = useState("");

  const [sponsorQuery, setSponsorQuery] = useState("");
  const [consultant, setConsultant] = useState<Consultant | null>(null);
  const [sponsorMsg, setSponsorMsg] = useState("");
  // консультант пришёл по ссылке или это ручная регистрация — поиск не показываем
  const [fixedSponsor, setFixedSponsor] = useState(Boolean(sponsor));

  const [subscribe, setSubscribe] = useState(false);

  const [tried, setTried] = useState(false);
  const [busy, setBusy] = useState("");
  const [msg, setMsg] = useState<{ text: string; bad: boolean }>({ text: "", bad: false });

  // консультант по ссылке (?ref=) или ручная регистрация (сам дистрибьютор)
  useEffect(() => {
    const id = sponsor || savedRef();
    if (!id) return;
    let alive = true;
    // eslint-disable-next-line react-hooks/set-state-in-effect -- ref известен только в браузере
    setSponsorQuery(id);
    findConsultant({ memberId: id })
      .then((c) => {
        if (!alive) return;
        setConsultant(c);
        setFixedSponsor(Boolean(c));
      })
      .catch(() => undefined);
    return () => {
      alive = false;
    };
  }, [sponsor]);

  const phoneDigits = phone.replace(/\D/g, "").replace(/^[78](?=\d{10}$)/, "");
  const words = fullName.trim().split(/\s+/).filter(Boolean);
  const name = words[0] ?? "";
  const surname = words.slice(1).join(" ");
  const errors = {
    fullName: (!fullName.trim() && "Укажите имя и фамилию") || (words.length < 2 && "Добавьте фамилию, например: Анна Иванова"),
    phone: phoneDigits.length !== 10 && "Введите номер полностью: +7 (900) 000-00-00",
    email: (!EMAIL_RX.test(email.trim()) && "Введите корректный e-mail") || emailTaken,
    password: !validPassword(password) && "Не короче 6 символов, хотя бы одна цифра или символ",
    consultant: !consultant && "Найдите консультанта по Coral ID или телефону",
  };
  const bad = (k: keyof typeof errors) => tried && Boolean(errors[k]);
  const hint = (k: keyof typeof errors) => (bad(k) ? String(errors[k]) : undefined);

  const lookUp = async () => {
    const q = sponsorQuery.trim();
    if (!q) return;
    setBusy("sponsor");
    setConsultant(null);
    setSponsorMsg("");
    const digits = q.replace(/\D/g, "");
    // телефон — с «+» или 10–11 цифр; иначе Coral ID
    const byPhone = q.startsWith("+") || digits.length >= 10;
    const c = await findConsultant(byPhone ? { phone: q } : { memberId: q }).catch(() => null);
    setBusy("");
    if (c) setConsultant(c);
    else setSponsorMsg("Консультант не найден. Проверьте Coral ID или телефон.");
  };

  // свободен ли e-mail — через полсекунды после ввода (проверка сайта магазина)
  useEffect(() => {
    const v = email.trim();
    if (!EMAIL_RX.test(v)) return;
    let alive = true;
    const t = setTimeout(() => {
      checkEmail(v)
        .then((why) => alive && setEmailTaken(why && !/не удалось/i.test(why) ? why : ""))
        .catch(() => undefined);
    }, 600);
    return () => {
      alive = false;
      clearTimeout(t);
    };
  }, [email]);

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    setTried(true);
    if (Object.values(errors).some(Boolean) || !consultant) {
      setMsg({ text: "Проверьте поля, отмеченные красным.", bad: true });
      return;
    }
    setBusy("create");
    setMsg({ text: "Регистрируем…", bad: false });
    const r = await registerSimple({ name, surname, email, phone: phoneDigits, password, consultant: consultant.id, subscribe });
    if (!r.ok) {
      setBusy("");
      setMsg({ text: r.error, bad: true });
      if (r.exists && !sponsor) onLogin?.(r.memberId || email.trim());
      return;
    }
    // регистрация вручную: новый участник создан, дистрибьютор остаётся в своём аккаунте
    if (sponsor) {
      setBusy("");
      setMsg({ text: "", bad: false });
      setPassword("");
      onDone?.(r.memberId);
      return;
    }
    // аккаунт создан — сразу входим и идём дальше, без экрана «готово»
    onLeaving?.(true);
    const signed = await login({ login: r.memberId || email.trim(), password, country: "RU", language: "ru" });
    setPassword("");
    if (!signed.ok) {
      // вход сразу не прошёл (например, нужно подтвердить e-mail) — вход по Coral ID
      onLeaving?.(false);
      setBusy("");
      onLogin?.(r.memberId || email.trim());
      return;
    }
    const moved = await moveGuestCartToMember();
    window.location.assign(`${base}${dest ? dest(moved) : "/"}`);
  };

  return (
    <form className={styles.authForm} onSubmit={submit} noValidate autoComplete="on">
      <FloatInput name="name" label="Имя и фамилия" value={fullName} onChange={setFullName} autoComplete="name" error={bad("fullName")} hint={hint("fullName")} />
      <FloatInput
        name="tel"
        type="tel"
        label="Телефон"
        placeholder="+7 (900) 000-00-00"
        value={phone}
        onChange={(v) => setPhone((prev) => maskRuPhone(v, prev))}
        inputMode="tel"
        autoComplete="tel"
        error={bad("phone")}
        hint={hint("phone")}
      />
      <FloatInput
        name="email"
        type="email"
        label="E-mail"
        value={email}
        onChange={(v) => {
          setEmail(v);
          setEmailTaken("");
        }}
        inputMode="email"
        autoComplete="email"
        error={bad("email") || Boolean(emailTaken)}
        hint={emailTaken || hint("email")}
      />
      <FloatInput
        name="new-password"
        type="password"
        label="Придумайте пароль"
        value={password}
        onChange={setPassword}
        autoComplete="new-password"
        error={bad("password")}
        hint={hint("password") ?? "Не менее 6 символов, хотя бы одна цифра или символ"}
      />

      {fixedSponsor && consultant ? (
        <div className={styles.regSponsor}>
          {consultant.avatar && (
            // eslint-disable-next-line @next/next/no-img-element -- аватар с сайта магазина
            <img src={consultant.avatar} alt="" width={40} height={40} />
          )}
          <span>
            <small>{sponsor ? "Консультант — вы" : "По приглашению"}</small>
            <strong>
              {consultant.name} {consultant.id}
            </strong>
          </span>
        </div>
      ) : (
        <div className={styles.regField}>
          <p className={styles.authText}>Консультант — участник клуба, который вас пригласил.</p>
          <div className={styles.regRow}>
            <FloatInput
              name="sponsor"
              label="Coral ID или телефон консультанта"
              value={sponsorQuery}
              onChange={(v) => {
                setSponsorQuery(v);
                setConsultant(null);
                setSponsorMsg("");
              }}
              error={bad("consultant") && !sponsorMsg}
              hint={sponsorMsg || hint("consultant")}
            />
            <Button variant="secondary" type="button" onClick={lookUp} disabled={busy === "sponsor" || !sponsorQuery.trim()}>
              {busy === "sponsor" ? "…" : "Найти"}
            </Button>
          </div>
          {consultant && (
            <div className={styles.regSponsor}>
              {consultant.avatar && (
                // eslint-disable-next-line @next/next/no-img-element -- аватар с сайта магазина
                <img src={consultant.avatar} alt="" width={40} height={40} />
              )}
              <span>
                <strong>{consultant.name}</strong>
                <small>Coral ID {consultant.id}</small>
              </span>
            </div>
          )}
        </div>
      )}

      <Checkbox name="subscribe" checked={subscribe} onChange={setSubscribe}>
        Я хочу получать новости, специальные предложения и другую информацию о товарах и услугах Coral Club по электронной почте, в смс и через мессенджеры
      </Checkbox>

      <Button variant="primary" block type="submit" disabled={busy === "create"}>
        {busy === "create" ? "Регистрируем…" : sponsor ? "Зарегистрировать участника" : "Стать членом клуба"}
      </Button>
      {/* согласие — как на сайте магазина: нажатием кнопки, текстом под ней */}
      <p className={styles.regConsent}>
        Нажимая «{sponsor ? "Зарегистрировать участника" : "Стать членом клуба"}», {sponsor ? "участник даёт" : "я даю"}{" "}
        <a href="https://coralclub.ru/faq/privacy/" target="_blank" rel="noopener noreferrer">
          согласие на обработку персональных данных
        </a>{" "}
        в соответствии с{" "}
        <a href="https://coralclub.ru/faq/privacy/" target="_blank" rel="noopener noreferrer">
          Политикой конфиденциальности
        </a>
        , {sponsor ? "принимает" : "принимаю"}{" "}
        <a href="https://coralclub.ru/faq/terms/" target="_blank" rel="noopener noreferrer">
          Условия регистрации
        </a>{" "}
        и {sponsor ? "подтверждает" : "подтверждаю"}, что {sponsor ? "ему" : "мне"} исполнилось 18 лет
      </p>
      <p className={`${styles.authMsg} ${msg.bad ? styles.authBad : ""}`} role="status">
        {msg.text}
      </p>
    </form>
  );
}
