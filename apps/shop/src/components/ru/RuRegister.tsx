"use client";

import { useEffect, useState, type FormEvent } from "react";
import { login } from "@coral/api";
import { Button, FloatInput } from "@/components/ui";
import { moveGuestCartToMember } from "@/lib/ru/cart";
import { savedRef } from "@/lib/ru/ref";
import { EMAIL_RX, checkEmail, findConsultant, registerSimple, validPassword, type Consultant } from "@/lib/ru/registration";
import styles from "./Ru.module.css";

const base = process.env.NEXT_PUBLIC_BASE_PATH ?? "";

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
  const [name, setName] = useState("");
  const [surname, setSurname] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [emailTaken, setEmailTaken] = useState("");
  const [password, setPassword] = useState("");

  const [sponsorQuery, setSponsorQuery] = useState("");
  const [consultant, setConsultant] = useState<Consultant | null>(null);
  const [sponsorMsg, setSponsorMsg] = useState("");
  // консультант пришёл по ссылке или это ручная регистрация — поиск не показываем
  const [fixedSponsor, setFixedSponsor] = useState(Boolean(sponsor));

  const [agree, setAgree] = useState(false);
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
  const errors = {
    name: !name.trim() && "Укажите имя",
    surname: !surname.trim() && "Укажите фамилию",
    phone: phoneDigits.length !== 10 && "10 цифр номера без +7",
    email: (!EMAIL_RX.test(email.trim()) && "Введите корректный e-mail") || emailTaken,
    password: !validPassword(password) && "Не короче 6 символов, хотя бы одна цифра или символ",
    consultant: !consultant && "Найдите консультанта по Coral ID или телефону",
    agree: !agree && "Нужно ваше согласие",
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
      <FloatInput name="given-name" label="Имя" value={name} onChange={setName} autoComplete="given-name" error={bad("name")} hint={hint("name")} />
      <FloatInput name="family-name" label="Фамилия" value={surname} onChange={setSurname} autoComplete="family-name" error={bad("surname")} hint={hint("surname")} />
      <FloatInput
        name="tel"
        type="tel"
        label="Телефон, +7"
        placeholder="900 000-00-00"
        value={phone}
        onChange={(v) => setPhone(v.replace(/[^\d\s()+-]/g, "").slice(0, 18))}
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
        hint={hint("password") ?? "Не короче 6 символов, хотя бы одна цифра или символ"}
      />

      {fixedSponsor && consultant ? (
        <div className={styles.regSponsor}>
          {consultant.avatar && (
            // eslint-disable-next-line @next/next/no-img-element -- аватар с сайта магазина
            <img src={consultant.avatar} alt="" width={40} height={40} />
          )}
          <span>
            <strong>{sponsor ? `Консультант: ${consultant.name}` : `Вас пригласил(а) ${consultant.name}`}</strong>
            <small>Coral ID {consultant.id}{sponsor ? " — вы" : ""}</small>
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

      <label className={styles.regCheck}>
        <input type="checkbox" checked={agree} onChange={(e) => setAgree(e.target.checked)} />
        <span>
          Соглашаюсь с{" "}
          <a href="https://coralclub.ru/faq/terms/" target="_blank" rel="noopener noreferrer">
            правилами Coral Club
          </a>{" "}
          и даю согласие на{" "}
          <a href="https://coralclub.ru/faq/privacy/" target="_blank" rel="noopener noreferrer">
            обработку персональных данных
          </a>
        </span>
      </label>
      {bad("agree") && <span className={styles.regErr}>{errors.agree}</span>}
      <label className={styles.regCheck}>
        <input type="checkbox" checked={subscribe} onChange={(e) => setSubscribe(e.target.checked)} />
        <span>Хочу получать новости и предложения</span>
      </label>

      <Button variant="primary" block type="submit" disabled={busy === "create"}>
        {busy === "create" ? "Регистрируем…" : sponsor ? "Зарегистрировать участника" : "Зарегистрироваться"}
      </Button>
      <p className={`${styles.authMsg} ${msg.bad ? styles.authBad : ""}`} role="status">
        {msg.text}
      </p>
    </form>
  );
}
