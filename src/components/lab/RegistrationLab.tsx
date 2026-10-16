"use client";

import { useEffect, useMemo, useState } from "react";
import { FRIEND_USER_ID } from "@/lib/beautySystem";
import styles from "./RegistrationLab.module.css";

/**
 * Test registration form for the coralclub.ru shop. The field set, the
 * checks and the request body mirror the shop's own three-step form
 * (/auth/registration → invitation → final), collapsed into one page:
 *
 *   GET  /restApi/registration/init          countries, date formats, languages
 *   POST /restApi/validEmail/                is the e-mail free (read-only)
 *   GET  /restApi/registration/consultant/   find the sponsor (read-only)
 *   POST /restApi/registration/new/          CREATES THE ACCOUNT
 *
 * It only works through the local proxy (npm run dev:proxy → localhost:3200),
 * which forwards /restApi to the shop and keeps its session cookies.
 */

const SITE = "coralclub.ru";

type DateFormat = { value: string; mask: string; placeholder: string };
type Init = {
  COUNTRIES_FILTERED: Record<string, string>;
  birthdayFormats: Record<string, DateFormat>;
  langsMore: Record<string, Record<string, string>>;
};

type Consultant = { id: string; name: string; avatar: string };

/** Dial codes for the usual markets; the field stays editable. */
const DIAL: Record<string, string> = {
  RU: "+7",
  KZ: "+7",
  BY: "+375",
  BY_BY: "+375",
  UA: "+380",
  MD: "+373",
  AM: "+374",
  GE: "+995",
  AZ: "+994",
  KG: "+996",
  UZ: "+998",
  US: "+1",
  CA: "+1",
  GB: "+44",
  DE: "+49",
  PL: "+48",
  RO: "+40",
  BG: "+359",
  HU: "+36",
  CZ: "+420",
  SK: "+421",
  IT: "+39",
  ES: "+34",
  FR: "+33",
  AT: "+43",
  LV: "+371",
  LT: "+370",
  EE: "+372",
  TR: "+90",
  AE: "+971",
  IL: "+972",
};

const FALLBACK_COUNTRIES: Record<string, string> = {
  RU: "Россия",
  BY_BY: "Беларусь",
  KZ: "Казахстан",
  US: "США",
};

const OTHER_FORMAT: DateFormat = {
  value: "DD.MM.YYYY",
  mask: "99.99.9999",
  placeholder: "дд.мм.гггг",
};

/* ------------------------------ helpers ------------------------------ */

function shopFetch(url: string, init: RequestInit = {}) {
  return fetch(url, {
    credentials: "same-origin",
    cache: "no-store",
    ...init,
    headers: { "x-shop-site": SITE, ...(init.headers ?? {}) },
  });
}

async function asJson<T>(r: Response): Promise<T | null> {
  const text = await r.text();
  try {
    return JSON.parse(text) as T;
  } catch {
    return null;
  }
}

/** "01011990" + mask "99.99.9999" → "01.01.1990" */
function applyMask(raw: string, mask: string): string {
  const digits = raw.replace(/\D/g, "");
  let out = "";
  let i = 0;
  for (const ch of mask) {
    if (i >= digits.length) break;
    if (ch === "9") out += digits[i++];
    else out += ch;
  }
  return out;
}

/** A real calendar date in the country's format (the shop only needs ≥10 chars,
 *  the server does the rest — this just catches typos early). */
function validBirthday(value: string, fmt: DateFormat): boolean {
  if (value.length < fmt.mask.length) return false;
  const parts = value.split(/\D/).map(Number);
  const order = fmt.value.split(/[^A-Z]/);
  const pick = (k: string) => parts[order.indexOf(k)];
  const d = pick("DD");
  const m = pick("MM");
  const y = pick("YYYY");
  if (!d || !m || !y || y < 1900) return false;
  const date = new Date(y, m - 1, d);
  return (
    date.getFullYear() === y &&
    date.getMonth() === m - 1 &&
    date.getDate() === d &&
    date.getTime() <= Date.now()
  );
}

const EMAIL_RX =
  /^(([^<>()[\].,;:\s@"]+(\.[^<>()[\].,;:\s@"]+)*)|(".+"))@(([^<>()[\].,;:\s@"]+\.)+[^<>()[\].,;:\s@"]{2,})$/i;

/** The shop's own password filter: only these characters are kept. */
const PASSWORD_BAD = /[^A-Za-z\d!@#$%^&*()_+=\-[\]{};:'",.<>?/\\|`~]/g;

function randomPassword(): string {
  const a = "abcdefghjkmnpqrstuvwxyz";
  const A = "ABCDEFGHJKLMNPQRSTUVWXYZ";
  const n = "23456789";
  const pool = a + A + n;
  const pick = (s: string) => s[Math.floor(Math.random() * s.length)];
  const chars = [pick(a), pick(A), pick(n), pick("!@#$")];
  while (chars.length < 12) chars.push(pick(pool));
  return chars.sort(() => Math.random() - 0.5).join("");
}

/* ------------------------------ component ----------------------------- */

type Reply = {
  ok: boolean;
  title: string;
  body: unknown;
};

export function RegistrationLab() {
  const [mode, setMode] = useState<"register" | "login">("register");
  const [init, setInit] = useState<Init | null>(null);
  const [initError, setInitError] = useState("");

  const [country, setCountry] = useState("RU");
  const [name, setName] = useState("");
  const [surname, setSurname] = useState("");
  const [otchestvo, setOtchestvo] = useState("");
  const [birthday, setBirthday] = useState("");
  const [gender, setGender] = useState<"" | "M" | "F">("");
  const [email, setEmail] = useState("");
  const [phoneCode, setPhoneCode] = useState("+7");
  const [phone, setPhone] = useState("");

  const [byPhone, setByPhone] = useState(false);
  const [sponsorId, setSponsorId] = useState("");
  const [sponsorPhone, setSponsorPhone] = useState("");
  const [consultant, setConsultant] = useState<Consultant | null>(null);
  const [consultantMsg, setConsultantMsg] = useState("");

  const [city, setCity] = useState("");
  const [state, setState] = useState("");
  const [langChoice, setLangChoice] = useState("");

  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  const [agreement, setAgreement] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [subscribe, setSubscribe] = useState(false);

  const [emailMsg, setEmailMsg] = useState<{
    ok: boolean;
    text: string;
  } | null>(null);
  const [confirmReal, setConfirmReal] = useState(false);
  const [attempted, setAttempted] = useState(false);
  const [busy, setBusy] = useState("");
  const [reply, setReply] = useState<Reply | null>(null);
  const [preview, setPreview] = useState<Record<string, string> | null>(null);

  /* shop settings: countries, date formats, languages */
  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const r = await shopFetch("/restApi/registration/init", {
          headers: { Accept: "application/json" },
        });
        const data = await asJson<Init & { status?: boolean }>(r);
        if (!alive) return;
        if (!data?.COUNTRIES_FILTERED) {
          setInitError(
            "Магазин не ответил на /restApi/registration/init. Откройте страницу через локальный прокси: http://localhost:3200/lab/registration/",
          );
          return;
        }
        setInit(data);
      } catch {
        if (alive)
          setInitError(
            "Нет связи с магазином. Запустите прокси (npm run dev:proxy) и откройте http://localhost:3200/lab/registration/",
          );
      }
    })();
    return () => {
      alive = false;
    };
  }, []);

  const countries = init?.COUNTRIES_FILTERED ?? FALLBACK_COUNTRIES;
  const dateFormat: DateFormat =
    init?.birthdayFormats[country] ??
    init?.birthdayFormats.OTHER ??
    OTHER_FORMAT;
  const languages = useMemo(
    () => init?.langsMore[country] ?? { ru: "Русский" },
    [init, country],
  );
  const langKeys = Object.keys(languages);
  const isRu = country === "RU";

  // a single language is chosen for you, as on the shop's own form
  const lang =
    langKeys.length === 1
      ? langKeys[0]
      : langKeys.includes(langChoice)
        ? langChoice
        : "";

  const changeCountry = (code: string) => {
    setCountry(code);
    setPhoneCode(DIAL[code] ?? "+");
    setBirthday("");
    setCity("");
    setState("");
  };

  /* ---------------------------- validation ---------------------------- */

  const errors = {
    name: !name.trim() && "Заполните поле",
    surname: !surname.trim() && "Заполните поле",
    birthday:
      !validBirthday(birthday, dateFormat) && "Введите верный формат даты",
    gender: !gender && "Выберите пол",
    email: !EMAIL_RX.test(email) && "Введите корректный email",
    phone:
      (phone.replace(/\D/g, "").length < 6 ||
        phoneCode.replace(/\D/g, "").length < 1) &&
      "Введите номер телефона",
    consultant: !consultant && "Найдите консультанта по Coral ID или телефону",
    city: !city.trim() && "Заполните поле",
    lang: !lang && "Выберите язык общения",
    password:
      !(password.length > 5 && /[^A-Za-zа-яА-Я]/.test(password)) &&
      "Не менее 6 символов и хотя бы одна цифра или символ",
    agreement: !agreement && "Нужно согласиться с правилами",
    processing: isRu && !processing && "Нужно дать согласие",
  };
  const firstError = Object.values(errors).find(Boolean);
  const show = (key: keyof typeof errors) =>
    attempted && errors[key] ? (
      <span className={styles.err}>{errors[key]}</span>
    ) : null;

  /* ----------------------------- shop calls ---------------------------- */

  const checkEmail = async () => {
    if (!EMAIL_RX.test(email)) {
      setEmailMsg({ ok: false, text: "Введите корректный email" });
      return;
    }
    setBusy("email");
    try {
      const r = await shopFetch("/restApi/validEmail/", {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: new URLSearchParams({
          action: "CheckEmail",
          email,
          country,
        }),
      });
      const data = await asJson<{ status?: boolean; error?: string }>(r);
      if (!data)
        setEmailMsg({ ok: false, text: `Ответ не JSON (HTTP ${r.status})` });
      else if (data.status) setEmailMsg({ ok: true, text: "Email свободен" });
      else
        setEmailMsg({
          ok: false,
          text: (data.error ?? "Email уже занят").replace(/<[^>]+>/g, " "),
        });
    } catch {
      setEmailMsg({ ok: false, text: "Нет связи с магазином" });
    } finally {
      setBusy("");
    }
  };

  const findConsultant = async () => {
    const query: Record<string, string> = byPhone
      ? { phone: sponsorPhone.trim() }
      : { memberId: sponsorId.trim() };
    if (!Object.values(query)[0]) return;
    setBusy("consultant");
    setConsultant(null);
    setConsultantMsg("");
    try {
      const r = await shopFetch(
        `/restApi/registration/consultant/?${new URLSearchParams(query)}`,
        { headers: { Accept: "application/json" } },
      );
      const data = await asJson<{
        status?: boolean;
        result?: { MEMBER_ID: string; NAME: string; AVATAR: string };
      }>(r);
      if (!data?.status || !data.result) {
        setConsultantMsg(
          "Консультант не найден. Попробуйте другой Coral ID или телефон.",
        );
      } else {
        setConsultant({
          id: String(data.result.MEMBER_ID),
          name: data.result.NAME,
          avatar: data.result.AVATAR,
        });
      }
    } catch {
      setConsultantMsg("Нет связи с магазином");
    } finally {
      setBusy("");
    }
  };

  /** Exactly the body the shop's own final step posts. */
  const buildBody = (): Record<string, string> => ({
    name: name.trim(),
    lastName: surname.trim(),
    secondName: otchestvo.trim(),
    birthday,
    email: email.trim(),
    phone: phone.trim(),
    phoneCode: phoneCode.replace(/^\+/, ""),
    gender,
    country,
    city: city.trim(),
    state: state.trim(),
    password,
    passwordConfirmed: password,
    consultant: consultant?.id ?? "",
    memberPhone: "",
    autoselect: "0",
    agreement: agreement ? "on" : "",
    lang_more: lang,
    communication: lang,
    subscribe_agree: subscribe ? "on" : "",
    regScenario: "default",
    coords: "",
    ...(isRu ? { agreePersonalData: processing ? "on" : "" } : {}),
  });

  const showRequest = () => {
    setAttempted(true);
    setPreview(buildBody());
  };

  const create = async () => {
    setAttempted(true);
    if (firstError || !confirmReal) return;
    setBusy("create");
    setReply(null);
    try {
      const r = await shopFetch("/restApi/registration/new/", {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: new URLSearchParams(buildBody()),
      });
      const data = await asJson<{
        status?: boolean;
        error?: string;
        result?: { memberId?: string };
      }>(r);
      setReply({
        ok: Boolean(data?.status),
        title: data?.status
          ? `Аккаунт создан. Coral ID: ${data.result?.memberId ?? "—"}`
          : (data?.error ?? `Ответ не JSON (HTTP ${r.status})`).replace(
              /<[^>]+>/g,
              " ",
            ),
        body: data ?? { http: r.status },
      });
    } catch {
      setReply({ ok: false, title: "Нет связи с магазином", body: null });
    } finally {
      setBusy("");
    }
  };

  const disabled = !init;

  return (
    <div className={styles.page}>
      <main className={styles.card}>
        <h1 className={styles.h1}>Регистрация и вход — тестовый стенд</h1>

        <div className={styles.modes} role="tablist" aria-label="Режим">
          <button
            type="button"
            role="tab"
            aria-selected={mode === "register"}
            className={mode === "register" ? styles.segOn : ""}
            onClick={() => setMode("register")}
          >
            Регистрация
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={mode === "login"}
            className={mode === "login" ? styles.segOn : ""}
            onClick={() => setMode("login")}
          >
            Вход по Coral ID
          </button>
        </div>

        {mode === "register" && (
          <p className={styles.warn} role="note">
            <strong>Эта форма создаёт настоящий аккаунт на coralclub.ru</strong>{" "}
            через локальный прокси: клубный номер, письмо с подтверждением,
            запись у консультанта. Для проверки без отправки есть «Показать
            запрос».
          </p>
        )}

        {initError && <p className={styles.bad}>{initError}</p>}
        {!init && !initError && (
          <p className={styles.muted}>Загружаю настройки магазина…</p>
        )}

        {mode === "login" ? (
          <LoginPanel ready={Boolean(init)} />
        ) : (
          <>
            <fieldset className={styles.group} disabled={disabled}>
              <legend>Страна</legend>
              <label className={styles.field}>
                <span>Страна *</span>
                <select
                  value={country}
                  onChange={(e) => changeCountry(e.target.value)}
                >
                  {Object.entries(countries).map(([code, label]) => (
                    <option key={code} value={code}>
                      {label.trim()}
                    </option>
                  ))}
                </select>
              </label>
            </fieldset>

            <fieldset className={styles.group} disabled={disabled}>
              <legend>Личные данные</legend>
              <div className={styles.row}>
                <label className={styles.field}>
                  <span>Имя *</span>
                  <input
                    value={name}
                    autoComplete="given-name"
                    onChange={(e) => setName(e.target.value)}
                  />
                  {show("name")}
                </label>
                <label className={styles.field}>
                  <span>Фамилия *</span>
                  <input
                    value={surname}
                    autoComplete="family-name"
                    onChange={(e) => setSurname(e.target.value)}
                  />
                  {show("surname")}
                </label>
              </div>

              {isRu && (
                <label className={styles.field}>
                  <span>Отчество</span>
                  <input
                    value={otchestvo}
                    onChange={(e) => setOtchestvo(e.target.value)}
                  />
                </label>
              )}

              <div className={styles.row}>
                <label className={styles.field}>
                  <span>Дата рождения *</span>
                  <input
                    inputMode="numeric"
                    placeholder={dateFormat.placeholder}
                    maxLength={dateFormat.mask.length}
                    value={birthday}
                    autoComplete="bday"
                    onChange={(e) =>
                      setBirthday(applyMask(e.target.value, dateFormat.mask))
                    }
                  />
                  {show("birthday")}
                </label>

                <div
                  className={styles.field}
                  role="radiogroup"
                  aria-label="Пол"
                >
                  <span>Пол *</span>
                  <div className={styles.seg}>
                    {(
                      [
                        ["M", "Мужской"],
                        ["F", "Женский"],
                      ] as const
                    ).map(([v, label]) => (
                      <button
                        key={v}
                        type="button"
                        role="radio"
                        aria-checked={gender === v}
                        className={gender === v ? styles.segOn : ""}
                        onClick={() => setGender(v)}
                      >
                        {label}
                      </button>
                    ))}
                  </div>
                  {show("gender")}
                </div>
              </div>

              <label className={styles.field}>
                <span>Email *</span>
                <div className={styles.inline}>
                  <input
                    type="email"
                    inputMode="email"
                    autoComplete="email"
                    autoCapitalize="none"
                    spellCheck={false}
                    value={email}
                    onChange={(e) => {
                      setEmail(e.target.value.trim());
                      setEmailMsg(null);
                    }}
                  />
                  <button
                    type="button"
                    className={styles.ghost}
                    onClick={checkEmail}
                    disabled={busy === "email"}
                  >
                    {busy === "email" ? "…" : "Проверить"}
                  </button>
                </div>
                {show("email")}
                {emailMsg && (
                  <span className={emailMsg.ok ? styles.okText : styles.err}>
                    {emailMsg.text}
                  </span>
                )}
              </label>

              <div className={styles.field}>
                <span>Телефон *</span>
                <div className={styles.inline}>
                  <input
                    className={styles.code}
                    inputMode="tel"
                    aria-label="Код страны"
                    value={phoneCode}
                    onChange={(e) =>
                      setPhoneCode(
                        "+" + e.target.value.replace(/\D/g, "").slice(0, 4),
                      )
                    }
                  />
                  <input
                    type="tel"
                    inputMode="tel"
                    autoComplete="tel-national"
                    aria-label="Номер телефона"
                    value={phone}
                    onChange={(e) =>
                      setPhone(e.target.value.replace(/[^\d\s()-]/g, ""))
                    }
                  />
                </div>
                {show("phone")}
              </div>
            </fieldset>

            <fieldset className={styles.group} disabled={disabled}>
              <legend>Консультант (кто пригласил) *</legend>
              <div className={styles.seg} role="tablist">
                <button
                  type="button"
                  className={!byPhone ? styles.segOn : ""}
                  onClick={() => {
                    setByPhone(false);
                    setConsultant(null);
                  }}
                >
                  Coral ID
                </button>
                <button
                  type="button"
                  className={byPhone ? styles.segOn : ""}
                  onClick={() => {
                    setByPhone(true);
                    setConsultant(null);
                  }}
                >
                  Телефон
                </button>
              </div>

              <div className={styles.inline}>
                {byPhone ? (
                  <input
                    type="tel"
                    inputMode="tel"
                    placeholder="Телефон консультанта"
                    value={sponsorPhone}
                    onChange={(e) => {
                      setSponsorPhone(e.target.value);
                      setConsultant(null);
                    }}
                  />
                ) : (
                  <input
                    inputMode="numeric"
                    maxLength={7}
                    placeholder="_______"
                    aria-label="Coral ID консультанта"
                    value={sponsorId}
                    onChange={(e) => {
                      setSponsorId(
                        e.target.value.replace(/\D/g, "").slice(0, 7),
                      );
                      setConsultant(null);
                    }}
                  />
                )}
                <button
                  type="button"
                  className={styles.ghost}
                  onClick={findConsultant}
                  disabled={busy === "consultant"}
                >
                  {busy === "consultant" ? "…" : "Найти"}
                </button>
              </div>

              {!byPhone && (
                <button
                  type="button"
                  className={styles.link}
                  onClick={() => {
                    setSponsorId(FRIEND_USER_ID);
                    setConsultant(null);
                  }}
                >
                  Подставить консультанта из «Друга клуба» ({FRIEND_USER_ID})
                </button>
              )}

              {consultant && (
                <div className={styles.found}>
                  {consultant.avatar && (
                    // eslint-disable-next-line @next/next/no-img-element -- avatar comes from the shop, any host
                    <img
                      src={consultant.avatar}
                      alt=""
                      width={40}
                      height={40}
                    />
                  )}
                  <span>
                    <strong>{consultant.name}</strong>
                    <br />
                    Coral ID {consultant.id}
                  </span>
                </div>
              )}
              {consultantMsg && (
                <span className={styles.err}>{consultantMsg}</span>
              )}
              {!consultant && show("consultant")}
              <p className={styles.muted}>
                Вариант «меня никто не приглашал» (подбор по городу и карте
                Google) в стенде не сделан.
              </p>
            </fieldset>

            <fieldset className={styles.group} disabled={disabled}>
              <legend>Город и язык</legend>
              <div className={styles.row}>
                <label className={styles.field}>
                  <span>Город *</span>
                  <input
                    placeholder="Москва"
                    autoComplete="address-level2"
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                  />
                  {show("city")}
                </label>
                <label className={styles.field}>
                  <span>Область / штат</span>
                  <input
                    autoComplete="address-level1"
                    value={state}
                    onChange={(e) => setState(e.target.value)}
                  />
                </label>
              </div>
              {langKeys.length > 1 && (
                <label className={styles.field}>
                  <span>Язык общения *</span>
                  <select
                    value={lang}
                    onChange={(e) => setLangChoice(e.target.value)}
                  >
                    <option value="">Выберите язык</option>
                    {langKeys.map((k) => (
                      <option key={k} value={k}>
                        {languages[k]}
                      </option>
                    ))}
                  </select>
                  {show("lang")}
                </label>
              )}
            </fieldset>

            <fieldset className={styles.group} disabled={disabled}>
              <legend>Пароль</legend>
              <label className={styles.field}>
                <span>Пароль *</span>
                <div className={styles.inline}>
                  <input
                    type={showPassword ? "text" : "password"}
                    autoComplete="new-password"
                    autoCapitalize="none"
                    spellCheck={false}
                    value={password}
                    onChange={(e) =>
                      setPassword(e.target.value.replace(PASSWORD_BAD, ""))
                    }
                  />
                  <button
                    type="button"
                    className={styles.ghost}
                    onClick={() => setShowPassword((v) => !v)}
                  >
                    {showPassword ? "Скрыть" : "Показать"}
                  </button>
                  <button
                    type="button"
                    className={styles.ghost}
                    onClick={() => {
                      setPassword(randomPassword());
                      setShowPassword(true);
                    }}
                  >
                    Придумать
                  </button>
                </div>
                {show("password")}
              </label>
              <ul className={styles.rules}>
                <li className={password.length > 5 ? styles.okText : ""}>
                  не менее 6 символов
                </li>
                <li
                  className={
                    /[^A-Za-zа-яА-Я]/.test(password) ? styles.okText : ""
                  }
                >
                  хотя бы одна цифра (0-9) или символ
                </li>
              </ul>
            </fieldset>

            <fieldset className={styles.group} disabled={disabled}>
              <legend>Согласия</legend>
              <label className={styles.check}>
                <input
                  type="checkbox"
                  checked={agreement}
                  onChange={(e) => setAgreement(e.target.checked)}
                />
                <span>
                  Я согласен с Правилами регистрации, Условиями использования
                  сайта, Политикой обработки персональных данных *
                </span>
              </label>
              {show("agreement")}
              {isRu && (
                <>
                  <label className={styles.check}>
                    <input
                      type="checkbox"
                      checked={processing}
                      onChange={(e) => setProcessing(e.target.checked)}
                    />
                    <span>Даю согласие на обработку персональных данных *</span>
                  </label>
                  {show("processing")}
                </>
              )}
              <label className={styles.check}>
                <input
                  type="checkbox"
                  checked={subscribe}
                  onChange={(e) => setSubscribe(e.target.checked)}
                />
                <span>
                  Я согласен получать по электронной почте и СМС информацию о
                  новых продуктах, специальных предложениях, мероприятиях или
                  услугах
                </span>
              </label>
            </fieldset>

            <div className={styles.actions}>
              <label className={`${styles.check} ${styles.real}`}>
                <input
                  type="checkbox"
                  checked={confirmReal}
                  onChange={(e) => setConfirmReal(e.target.checked)}
                />
                <span>Понимаю: будет создан настоящий аккаунт в магазине</span>
              </label>

              <button
                type="button"
                className={styles.ghostWide}
                onClick={showRequest}
              >
                Показать запрос (без отправки)
              </button>
              <button
                type="button"
                className={styles.primary}
                onClick={create}
                disabled={disabled || !confirmReal || busy === "create"}
              >
                {busy === "create" ? "Создаю…" : "Создать аккаунт"}
              </button>
              {attempted && firstError && (
                <span className={styles.err}>Заполните отмеченные поля</span>
              )}
            </div>

            {preview && (
              <section className={styles.out} aria-label="Запрос">
                <h2>POST /restApi/registration/new/</h2>
                <pre>
                  {JSON.stringify(
                    {
                      ...preview,
                      password: preview.password ? "••••••••" : "",
                      passwordConfirmed: preview.passwordConfirmed
                        ? "••••••••"
                        : "",
                    },
                    null,
                    2,
                  )}
                </pre>
                <p className={styles.muted}>
                  Пароль в показе скрыт, в запрос уходит как введён.
                </p>
              </section>
            )}

            {reply && (
              <section
                className={`${styles.out} ${reply.ok ? styles.outOk : styles.outBad}`}
                aria-label="Ответ"
              >
                <h2>{reply.title}</h2>
                <pre>{JSON.stringify(reply.body, null, 2)}</pre>
              </section>
            )}
          </>
        )}
      </main>
    </div>
  );
}

/* ------------------------------- sign in ------------------------------ */

/**
 * Sign in with Coral ID + password — the same request the shop's own login
 * page makes (POST /restApi/auth/, LOGIN + PASSWORD, form-encoded). The shop
 * answers with a session cookie; the proxy keeps it in its cookie jar, so
 * every later request through the proxy (the checkout stand included) is
 * made as that member until the proxy is restarted.
 */
function LoginPanel({ ready }: { ready: boolean }) {
  const [coralId, setCoralId] = useState("");
  const [password, setPassword] = useState("");
  const [show, setShow] = useState(false);
  const [busy, setBusy] = useState(false);
  const [reply, setReply] = useState<Reply | null>(null);

  const submit = async () => {
    if (!coralId || !password || busy) return;
    setBusy(true);
    setReply(null);
    try {
      const r = await shopFetch("/restApi/auth/", {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: new URLSearchParams({ LOGIN: coralId, PASSWORD: password }),
      });
      const data = await asJson<{ status?: boolean; error?: string }>(r);
      // ask the shop whether the session now counts as signed in
      let signedIn: boolean | null = null;
      try {
        const chk = await shopFetch("/restApi/registration/init", {
          headers: { Accept: "application/json" },
        });
        const init = await asJson<{ login?: boolean }>(chk);
        signedIn = typeof init?.login === "boolean" ? init.login : null;
      } catch {
        signedIn = null;
      }
      const ok = Boolean(data?.status);
      setReply({
        ok,
        title: ok
          ? `Вход выполнен${signedIn === true ? ": магазин видит вас как участника" : ""}`
          : (data?.error ?? "Неправильный Coral ID или пароль").replace(
              /<[^>]+>/g,
              " ",
            ),
        body: {
          response: data ?? { http: r.status },
          sessionSignedIn: signedIn,
        },
      });
      if (ok) setPassword("");
    } catch {
      setReply({ ok: false, title: "Нет связи с магазином", body: null });
    } finally {
      setBusy(false);
    }
  };

  return (
    <>
      <p className={styles.note}>
        Вход тем же запросом, что и на странице входа магазина. Сессия хранится
        в прокси и действует для всех запросов через него (в том числе
        чек-аута), пока прокси не перезапущен.
      </p>

      <form
        className={styles.group}
        onSubmit={(e) => {
          e.preventDefault();
          void submit();
        }}
      >
        <label className={styles.field}>
          <span>Coral ID</span>
          <input
            name="username"
            inputMode="numeric"
            autoComplete="username"
            autoCapitalize="none"
            spellCheck={false}
            placeholder="_______"
            value={coralId}
            onChange={(e) => setCoralId(e.target.value.replace(/\s+/g, ""))}
          />
        </label>

        <label className={styles.field}>
          <span>Пароль</span>
          <div className={styles.inline}>
            <input
              name="password"
              type={show ? "text" : "password"}
              autoComplete="current-password"
              autoCapitalize="none"
              spellCheck={false}
              value={password}
              onChange={(e) => setPassword(e.target.value.replace(/\s+/g, ""))}
            />
            <button
              type="button"
              className={styles.ghost}
              onClick={() => setShow((v) => !v)}
            >
              {show ? "Скрыть" : "Показать"}
            </button>
          </div>
        </label>

        <button
          type="submit"
          className={styles.primary}
          disabled={!ready || !coralId || !password || busy}
        >
          {busy ? "Вхожу…" : "Войти"}
        </button>
      </form>

      {reply && (
        <section
          className={`${styles.out} ${reply.ok ? styles.outOk : styles.outBad}`}
          aria-label="Ответ"
        >
          <h2>{reply.title}</h2>
          <pre>{JSON.stringify(reply.body, null, 2)}</pre>
        </section>
      )}
    </>
  );
}
