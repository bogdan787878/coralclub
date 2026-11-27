/**
 * Регистрация магазина России — упрощённая, как на coralclub.ru для России (5 полей). Поиск консультанта и
 * проверка e-mail — сайт магазина через шлюз (гостевая сессия coralclub.ru: страница на GitHub Pages сама её не
 * держит); сам аккаунт — API кабинета напрямую.
 *
 *   GET  /restApi/registration/consultant/   найти консультанта по Coral ID или телефону
 *   POST /restApi/validEmail/                свободен ли e-mail
 *   POST api.coral.club /account/register    СОЗДАЁТ АККАУНТ (упрощённая регистрация) — только по нажатию человека
 */
import { cc4Base, guestToken } from "@coral/api";
import { shop } from "./site";

export type Consultant = { id: string; name: string; avatar: string; /** реферальный код участника (ссылки и реферальная корзина сайта) */ refCode: string };


/** Консультант по Coral ID или телефону. */
export async function findConsultant(q: { memberId?: string; phone?: string }): Promise<Consultant | null> {
  const query: Record<string, string> = q.phone ? { phone: q.phone } : { memberId: q.memberId ?? "" };
  const d = await shop<{ status?: boolean; result?: { MEMBER_ID: string; NAME: string; AVATAR: string; REF_CODE?: string } }>(
    `/restApi/registration/consultant/?${new URLSearchParams(query)}`,
  );
  return d?.status && d.result ? { id: String(d.result.MEMBER_ID), name: d.result.NAME, avatar: d.result.AVATAR, refCode: String(d.result.REF_CODE ?? "") } : null;
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

/* ---------- проверки полей (как у формы сайта) ---------- */

export const EMAIL_RX = /^[^\s@<>()[\],;:"]+@[^\s@<>()[\],;:"]+\.[^\s@<>()[\],;:"]{2,}$/i;

/** Пароль сайта: не короче 6 символов и хотя бы одна цифра или символ. */
export const validPassword = (p: string) => p.length > 5 && /[^A-Za-zА-Яа-яЁё]/.test(p);

/* ---------- упрощённая регистрация России (как на coralclub.ru: 5 полей) ---------- */

export type SimpleRegForm = {
  name: string;
  surname: string;
  email: string;
  /** 10 цифр номера без +7 */
  phone: string;
  password: string;
  /** Coral ID консультанта */
  consultant: string;
  subscribe: boolean;
};

export type SimpleRegResult = { ok: true; memberId: string } | { ok: false; error: string; exists?: boolean; memberId?: string };

/**
 * Упрощённая регистрация (сценарий сайта refCodeSimple, Россия — в списке registration/simplified-countries):
 * POST /account/register API кабинета по гостевой сессии России, тело — как у формы сайта (registrationPayload:
 * personalData, location, consultant, password, subscribeAgree). СОЗДАЁТ АККАУНТ — только по нажатию человека.
 */
export async function registerSimple(f: SimpleRegForm): Promise<SimpleRegResult> {
  const body = {
    personalData: { surname: f.surname.trim(), name: f.name.trim(), email: f.email.trim(), phone: `+7${f.phone.replace(/\D/g, "")}` },
    location: { country: "RU" },
    consultant: { id: /^\d+$/.test(f.consultant) ? Number(f.consultant) : f.consultant, privacy: true, language: "ru", communication: "ru" },
    password: f.password,
    subscribeAgree: f.subscribe,
  };
  for (let attempt = 0; attempt < 2; attempt++) {
    const token = await guestToken("RU", "ru");
    if (!token) return { ok: false, error: "Нет связи с Coral Club" };
    let r: Response;
    try {
      r = await fetch(`${cc4Base()}/account/register`, {
        method: "POST",
        headers: { accept: "application/json", "content-type": "application/json", authorization: `Bearer ${token}` },
        body: JSON.stringify(body),
      });
    } catch {
      return { ok: false, error: "Нет связи с Coral Club. Проверьте интернет и попробуйте ещё раз." };
    }
    if (r.status === 401 && attempt === 0) {
      // гостевая сессия истекла — новая, один раз
      try {
        window.sessionStorage.removeItem("cc_guest:RU:ru");
      } catch {
        /* без хранилища */
      }
      continue;
    }
    const j = (await r.json().catch(() => null)) as {
      success?: boolean;
      message?: string;
      error?: string;
      errors?: Record<string, string[] | string>;
      data?: { memberId?: number | string };
    } | null;
    const id = j?.data?.memberId;
    if (r.ok && j?.success !== false && id !== undefined && id !== null && String(id) !== "") return { ok: true, memberId: String(id) };
    const detail = j?.errors ? Object.values(j.errors).flat().join(" ") : "";
    const text = plain(j?.message || j?.error || detail || `Coral Club ответил ${r.status}`);
    const memberId = id ? String(id) : (/\b\d{5,9}\b/.exec(text)?.[0] ?? undefined);
    if (r.status === 409) return { ok: false, exists: true, memberId, error: `Аккаунт с такими данными уже есть${memberId ? ` (Coral ID ${memberId})` : ""}. Войдите с его паролем.` };
    return { ok: false, error: detail && j?.message ? `${plain(j.message)}: ${plain(detail)}` : text };
  }
  return { ok: false, error: "Нет связи с Coral Club" };
}
