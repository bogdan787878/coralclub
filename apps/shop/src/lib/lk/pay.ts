/**
 * Переход к банку по заказу участника. У заказа в API кабинета есть ссылка оплаты (paymentLink, сессия участника в
 * самой ссылке); шлюз проходит страницу заказа так же, как сам магазин (выбор способа — orderSelectPaysystem) и
 * отдаёт адрес банка. Используют оформление (сразу после заказа) и история заказов («Оплатить» у неоплаченного).
 */
import { cc4 } from "@coral/api";
import { shopFetch } from "@/lib/shopApi";

/** Открыть страницу банка. Пустая строка — переход начат; иначе причина, почему не вышло. */
export async function openBank(orderId: string, { country = "RU", paymentId = "" }: { country?: string; paymentId?: string } = {}): Promise<string> {
  try {
    const o = await cc4<{ data?: { paymentLink?: string } }>(`/personal-new/shop/orders/${orderId}`);
    const raw = o.json?.data?.paymentLink;
    if (!raw) return "у заказа нет ссылки оплаты";
    const u = new URL(raw);
    const sid = u.searchParams.get("session_id");
    // РФ и Беларусь открывают /order/payment/<номер>/, другие страны несут способ оплаты в адресе (как сам чек-аут)
    const short = country === "RU" || country.startsWith("BY") || !paymentId;
    const rel = short ? `/order/payment/${orderId}/?new_checkout=1` : `/order/payment/${orderId}/${paymentId}/?new_checkout=1`;
    const link = sid ? `${u.origin}/redirect.php?session_id=${sid}&url=${encodeURIComponent(rel)}` : raw;
    // шлюз проходит страницы магазина до банка (несколько запросов); дольше 40 секунд не ждём
    const r = await shopFetch("/pay", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ link, method: paymentId }), signal: AbortSignal.timeout(40000) });
    const j = (await r.json().catch(() => null)) as { target?: { url?: string; method?: string; fields?: Record<string, string> }; error?: string } | null;
    const t = j?.target;
    const target = t?.url ? new URL(t.url) : null;
    if (target && target.protocol === "https:" && !/(^|\.)(coral\.club|coralclub\.[a-z]+)$/i.test(target.hostname)) {
      submitToGateway(target.href, t?.method === "POST" ? "POST" : "GET", t?.fields ?? {});
      return "";
    }
    return j?.error ?? (r.ok ? "банк не найден" : `шлюз ответил ${r.status}`);
  } catch (e) {
    return (e as Error)?.name === "TimeoutError" ? "шлюз не ответил вовремя" : "нет связи со шлюзом";
  }
}

function submitToGateway(url: string, method: "GET" | "POST", fields: Record<string, string>): void {
  if (method === "GET" && !Object.keys(fields).length) {
    window.location.assign(url);
    return;
  }
  const f = document.createElement("form");
  f.method = method;
  f.action = url;
  for (const [name, value] of Object.entries(fields)) {
    const i = document.createElement("input");
    i.type = "hidden";
    i.name = name;
    i.value = value;
    f.appendChild(i);
  }
  document.body.appendChild(f);
  f.submit();
}
