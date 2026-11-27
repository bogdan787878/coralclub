/**
 * Регистрация магазина России — форма сайта coralclub.ru (те же поля, проверки и тело запроса, что у его
 * собственной формы, см. components/lab/RegistrationLab.tsx), через шлюз: страница на GitHub Pages не может
 * держать сессию сайта магазина, её держит шлюз (гостевая сессия coralclub.ru).
 *
 *   GET  /restApi/registration/init          настройки формы (форматы даты, языки)
 *   GET  /restApi/registration/consultant/   найти консультанта по Coral ID или телефону
 *   POST /restApi/validEmail/                свободен ли e-mail
 *   POST /restApi/registration/new/          СОЗДАЁТ АККАУНТ — только по нажатию человека
 */
import { shop } from "./site";

export type Consultant = { id: string; name: string; avatar: string };
export type RegInit = { dateMask: string; datePlaceholder: string; lang: string };


/** Настройки формы России: маска даты рождения и язык общения. */
export async function regInit(): Promise<RegInit | null> {
  const d = await shop<{
    birthdayFormats?: Record<string, { mask: string; placeholder: string }>;
    langsMore?: Record<string, Record<string, string>>;
  }>("/restApi/registration/init");
  if (!d?.birthdayFormats) return null;
  const f = d.birthdayFormats.RU ?? d.birthdayFormats.OTHER ?? { mask: "99.99.9999", placeholder: "дд.мм.гггг" };
  const langs = Object.keys(d.langsMore?.RU ?? { ru: "" });
  return { dateMask: f.mask, datePlaceholder: f.placeholder, lang: langs.includes("ru") ? "ru" : (langs[0] ?? "ru") };
}

/** Консультант по Coral ID или телефону. */
export async function findConsultant(q: { memberId?: string; phone?: string }): Promise<Consultant | null> {
  const query: Record<string, string> = q.phone ? { phone: q.phone } : { memberId: q.memberId ?? "" };
  const d = await shop<{ status?: boolean; result?: { MEMBER_ID: string; NAME: string; AVATAR: string } }>(
    `/restApi/registration/consultant/?${new URLSearchParams(query)}`,
  );
  return d?.status && d.result ? { id: String(d.result.MEMBER_ID), name: d.result.NAME, avatar: d.result.AVATAR } : null;
}

const plain = (s: string) => s.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();

/** Свободен ли e-mail: null — свободен, строка — почему нет. */
export async function checkEmail(email: string): Promise<string | null> {
  const d = await shop<{ status?: boolean; error?: string }>("/restApi/validEmail/", {
    method: "POST",
    form: { action: "CheckEmail", email, country: "RU" },
  });
  if (!d) return "Не удалось проверить e-mail";
  return d.status ? null : plain(d.error ?? "Этот e-mail уже зарегистрирован");
}

export type RegForm = {
  name: string;
  surname: string;
  middleName: string;
  birthday: string;
  gender: "M" | "F";
  email: string;
  phone: string;
  city: string;
  password: string;
  consultant: string;
  lang: string;
  subscribe: boolean;
};

/** Создать аккаунт (тело — как у последнего шага формы сайта). Coral ID нового участника или текст ошибки. */
export async function register(f: RegForm): Promise<{ ok: true; memberId: string } | { ok: false; error: string }> {
  const d = await shop<{ status?: boolean; error?: string; result?: { memberId?: string } }>("/restApi/registration/new/", {
    method: "POST",
    form: {
      name: f.name.trim(),
      lastName: f.surname.trim(),
      secondName: f.middleName.trim(),
      birthday: f.birthday,
      email: f.email.trim(),
      phone: f.phone.replace(/\D/g, ""),
      phoneCode: "7",
      gender: f.gender,
      country: "RU",
      city: f.city.trim(),
      state: "",
      password: f.password,
      passwordConfirmed: f.password,
      consultant: f.consultant,
      memberPhone: "",
      autoselect: "0",
      agreement: "on",
      lang_more: f.lang,
      communication: f.lang,
      subscribe_agree: f.subscribe ? "on" : "",
      regScenario: "default",
      coords: "",
      agreePersonalData: "on",
    },
  });
  if (d?.status) return { ok: true, memberId: String(d.result?.memberId ?? "") };
  return { ok: false, error: d ? plain(d.error ?? "Не удалось зарегистрироваться") : "Нет связи с Coral Club" };
}

/* ---------- проверки полей (как у формы сайта) ---------- */

export const EMAIL_RX = /^[^\s@<>()[\],;:"]+@[^\s@<>()[\],;:"]+\.[^\s@<>()[\],;:"]{2,}$/i;

/** «01011990» по маске «99.99.9999» → «01.01.1990». */
export function maskDate(raw: string, mask: string): string {
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

/** Настоящая дата дд.мм.гггг и не в будущем (как проверяет форма сайта; остальное проверяет сервер). */
export function validBirthday(v: string): boolean {
  const m = /^(\d{2})\.(\d{2})\.(\d{4})$/.exec(v);
  if (!m) return false;
  const [d, mo, y] = [Number(m[1]), Number(m[2]), Number(m[3])];
  const date = new Date(y, mo - 1, d);
  return y >= 1900 && date.getFullYear() === y && date.getMonth() === mo - 1 && date.getDate() === d && date.getTime() <= Date.now();
}

/** Пароль сайта: не короче 6 символов и хотя бы одна цифра или символ. */
export const validPassword = (p: string) => p.length > 5 && /[^A-Za-zА-Яа-яЁё]/.test(p);
