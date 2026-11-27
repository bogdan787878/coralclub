"use client";

import { useEffect, useState, type FormEvent } from "react";
import { login } from "@coral/api";
import { Button, FloatInput } from "@/components/ui";
import { moveGuestCartToMember } from "@/lib/ru/cart";
import {
  EMAIL_RX,
  checkEmail,
  findConsultant,
  maskDate,
  regInit,
  register,
  validBirthday,
  validPassword,
  type Consultant,
  type RegInit,
} from "@/lib/ru/registration";
import styles from "./Ru.module.css";

const base = process.env.NEXT_PUBLIC_BASE_PATH ?? "";

/**
 * Регистрация магазина России — поля формы coralclub.ru: ФИО, дата рождения, пол, e-mail, телефон, город, пароль,
 * консультант и согласия. После регистрации — сразу вход, перенос корзины и переход дальше (из корзины — в
 * оформление), без промежуточного экрана. Аккаунт создаётся только по нажатию «Зарегистрироваться».
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
  const [init, setInit] = useState<RegInit | null>(null);
  const [initFailed, setInitFailed] = useState(false);

  const [name, setName] = useState("");
  const [surname, setSurname] = useState("");
  const [middleName, setMiddleName] = useState("");
  const [birthday, setBirthday] = useState("");
  const [gender, setGender] = useState<"" | "M" | "F">("");
  const [email, setEmail] = useState("");
  const [emailTaken, setEmailTaken] = useState("");
  const [phone, setPhone] = useState("");
  const [city, setCity] = useState("");
  const [password, setPassword] = useState("");

  const [sponsorQuery, setSponsorQuery] = useState("");
  const [consultant, setConsultant] = useState<Consultant | null>(null);
  const [sponsorMsg, setSponsorMsg] = useState("");

  const [agreement, setAgreement] = useState(false);
  const [personal, setPersonal] = useState(false);
  const [subscribe, setSubscribe] = useState(false);

  const [tried, setTried] = useState(false);
  const [busy, setBusy] = useState("");
  const [msg, setMsg] = useState<{ text: string; bad: boolean }>({ text: "", bad: false });

  // регистрация вручную: консультант — сам дистрибьютор
  useEffect(() => {
    if (!sponsor) return;
    let alive = true;
    findConsultant({ memberId: sponsor })
      .then((c) => alive && setConsultant(c))
      .catch(() => undefined);
    return () => {
      alive = false;
    };
  }, [sponsor]);

  useEffect(() => {
    let alive = true;
    regInit()
      .then((d) => alive && (d ? setInit(d) : setInitFailed(true)))
      .catch(() => alive && setInitFailed(true));
    return () => {
      alive = false;
    };
  }, []);

  const phoneDigits = phone.replace(/\D/g, "");
  const errors = {
    name: !name.trim() && "Укажите имя",
    surname: !surname.trim() && "Укажите фамилию",
    birthday: !validBirthday(birthday) && "Дата в формате дд.мм.гггг",
    gender: !gender && "Выберите пол",
    email: (!EMAIL_RX.test(email.trim()) && "Введите корректный e-mail") || emailTaken,
    phone: phoneDigits.length !== 10 && "10 цифр номера без +7",
    city: !city.trim() && "Укажите город",
    password: !validPassword(password) && "Не короче 6 символов, хотя бы одна цифра или символ",
    consultant: !consultant && "Найдите консультанта по Coral ID или телефону",
    agreement: !agreement && "Нужно согласие с правилами",
    personal: !personal && "Нужно согласие на обработку данных",
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

  // свободен ли e-mail — через полсекунды после ввода
  useEffect(() => {
    const v = email.trim();
    if (!init || !EMAIL_RX.test(v)) return;
    let alive = true;
    const t = setTimeout(() => {
      checkEmail(v)
        .then((why) => alive && setEmailTaken(why ?? ""))
        .catch(() => undefined);
    }, 600);
    return () => {
      alive = false;
      clearTimeout(t);
    };
  }, [email, init]);

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    setTried(true);
    if (Object.values(errors).some(Boolean) || !init || !consultant || !gender) {
      setMsg({ text: "Проверьте поля, отмеченные красным.", bad: true });
      return;
    }
    setBusy("create");
    setMsg({ text: "Регистрируем…", bad: false });
    const r = await register({
      name,
      surname,
      middleName,
      birthday,
      gender,
      email,
      phone: phoneDigits,
      city,
      password,
      consultant: consultant.id,
      lang: init.lang,
      subscribe,
    }).catch(() => ({ ok: false as const, error: "Нет связи с Coral Club" }));
    if (!r.ok) {
      setBusy("");
      setMsg({ text: r.error, bad: true });
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
    const signed = await login({ login: email.trim(), password, country: "RU", language: "ru" });
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

  if (initFailed) {
    return (
      <div className={styles.authForm}>
        <p className={`${styles.authMsg} ${styles.authBad}`} role="status">
          Форма регистрации сейчас недоступна. Попробуйте позже.
        </p>
      </div>
    );
  }

  return (
    <form className={styles.authForm} onSubmit={submit} noValidate autoComplete="on">
      <FloatInput name="given-name" label="Имя" value={name} onChange={setName} autoComplete="given-name" error={bad("name")} hint={hint("name")} />
      <FloatInput name="family-name" label="Фамилия" value={surname} onChange={setSurname} autoComplete="family-name" error={bad("surname")} hint={hint("surname")} />
      <FloatInput name="additional-name" label="Отчество (если есть)" value={middleName} onChange={setMiddleName} autoComplete="additional-name" />
      <FloatInput
        name="bday"
        label="Дата рождения"
        placeholder={init?.datePlaceholder ?? "дд.мм.гггг"}
        value={birthday}
        onChange={(v) => setBirthday(maskDate(v, init?.dateMask ?? "99.99.9999"))}
        inputMode="numeric"
        autoComplete="bday"
        maxLength={10}
        error={bad("birthday")}
        hint={hint("birthday")}
      />

      <div className={styles.regField}>
        <div className={styles.authTabs} role="radiogroup" aria-label="Пол">
          {(["F", "M"] as const).map((g) => (
            <button key={g} type="button" role="radio" aria-checked={gender === g} className={gender === g ? styles.authTabOn : ""} onClick={() => setGender(g)}>
              {g === "F" ? "Женский" : "Мужской"}
            </button>
          ))}
        </div>
        {bad("gender") && <span className={styles.regErr}>{errors.gender}</span>}
      </div>

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
        name="tel"
        type="tel"
        label="Телефон, +7"
        placeholder="900 000-00-00"
        value={phone}
        onChange={(v) => setPhone(v.replace(/[^\d\s()-]/g, "").slice(0, 16))}
        inputMode="tel"
        autoComplete="tel-national"
        error={bad("phone")}
        hint={hint("phone")}
      />
      <FloatInput name="city" label="Город" value={city} onChange={setCity} autoComplete="address-level2" error={bad("city")} hint={hint("city")} />
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

      {sponsor ? (
        consultant && (
          <div className={styles.regSponsor}>
            <span>
              <strong>Консультант: {consultant.name}</strong>
              <small>Coral ID {consultant.id} — вы</small>
            </span>
          </div>
        )
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
        <input type="checkbox" checked={agreement} onChange={(e) => setAgreement(e.target.checked)} />
        <span>Согласен(на) с правилами Coral Club</span>
      </label>
      {bad("agreement") && <span className={styles.regErr}>{errors.agreement}</span>}
      <label className={styles.regCheck}>
        <input type="checkbox" checked={personal} onChange={(e) => setPersonal(e.target.checked)} />
        <span>Даю согласие на обработку персональных данных</span>
      </label>
      {bad("personal") && <span className={styles.regErr}>{errors.personal}</span>}
      <label className={styles.regCheck}>
        <input type="checkbox" checked={subscribe} onChange={(e) => setSubscribe(e.target.checked)} />
        <span>Хочу получать новости и предложения</span>
      </label>

      <Button variant="primary" block type="submit" disabled={busy === "create" || !init}>
        {busy === "create" ? "Регистрируем…" : sponsor ? "Зарегистрировать участника" : "Зарегистрироваться"}
      </Button>
      <p className={`${styles.authMsg} ${msg.bad ? styles.authBad : ""}`} role="status">
        {msg.text}
      </p>
    </form>
  );
}
