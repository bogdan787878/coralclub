// Офлайн-проверка resolvePayment на подменённом fetch: цепочка редиректов магазина → внешний банк, форма, ссылка, тупик.
import { resolvePayment, gatewayFromHtml, gatewayFromAction, paysystemOptions, resolveFrom } from "../src/payment.mjs";
const real = globalThis.fetch;
const mk = (routes) => (url) => { const r = routes[new URL(url).host + new URL(url).pathname]; return Promise.resolve(r ? new Response(r.body ?? "", { status: r.status, headers: r.headers ?? {} }) : new Response("нет", { status: 404 })); };
const O = "https://ru.coral.club";
let ok = true; const check = (name, cond) => { console.log((cond ? "OK  " : "FAIL"), name); ok &&= cond; };

globalThis.fetch = mk({ "ru.coral.club/order/payment/1/": { status: 302, headers: { location: "https://pay.bank.example/p/abc?x=1" } } });
let r = await resolvePayment({ jar: new Map(), origin: O, path: "/order/payment/1/?new_checkout=1" });
check("редирект сразу на банк", r.target?.url === "https://pay.bank.example/p/abc?x=1" && r.target.method === "GET");

globalThis.fetch = mk({ "ru.coral.club/order/payment/2/": { status: 302, headers: { location: "/order/pay/2/" } }, "ru.coral.club/order/pay/2/": { status: 302, headers: { location: "https://bank.example/go" } } });
r = await resolvePayment({ jar: new Map(), origin: O, path: "/order/payment/2/" });
check("два перехода внутри магазина, потом банк", r.target?.url === "https://bank.example/go" && r.hops.length === 2);

globalThis.fetch = mk({ "ru.coral.club/order/payment/3/": { status: 200, body: '<div class="paysys-payment"><form method="POST" action="https://bank.example/pay"><input name="sid" value="S1"><input type="hidden" name="a" value="b&amp;c"></form></div></div>' } });
r = await resolvePayment({ jar: new Map(), origin: O, path: "/order/payment/3/" });
check("форма на банк", r.target?.url === "https://bank.example/pay" && r.target.method === "POST" && r.target.fields.sid === "S1" && r.target.fields.a === "b&c");

globalThis.fetch = mk({ "ru.coral.club/order/payment/4/": { status: 302, headers: { location: "https://ru.coral.club/personal-new/" } }, "ru.coral.club/personal-new/": { status: 200, body: "<p>кабинет</p>" } });
r = await resolvePayment({ jar: new Map(), origin: O, path: "/order/payment/4/" });
check("тупик: нет перехода на банк → понятная ошибка", !r.target && /нет перехода/.test(r.error));

globalThis.fetch = mk({ "ru.coral.club/order/payment/5/": { status: 302, headers: { location: "http://insecure.example/x" } } });
r = await resolvePayment({ jar: new Map(), origin: O, path: "/order/payment/5/" });
check("http-адрес не принимается как банк", !r.target);

globalThis.fetch = mk({ "ru.coral.club/order/payment/6/": { status: 302, headers: { location: "/personal-new/shop/orders/" } }, "ru.coral.club/personal-new/shop/orders/": { status: 301, headers: { location: "/personal-new/shop/orders/index.php" } }, "ru.coral.club/personal-new/shop/orders/index.php": { status: 302, headers: { location: "/personal-new/shop/orders/" } } });
r = await resolvePayment({ jar: new Map(), origin: O, path: "/order/payment/6/" });
check("круг «список заказов ↔ index.php» (оплата курьеру) → понятная ошибка", !r.target && /нет онлайн-оплаты/.test(r.error));

check("форма на сайт магазина не считается банком", gatewayFromHtml('<div class="paysys-payment"><a href="https://coralclub.ru/x">x</a></div></div>', "https://ru.coral.club/") === null);
// страница «Проверьте и оплатите»: способ выбирается через orderSelectPaysystem.php, в ответе кнопка банка
const opts = paysystemOptions(`<button id="p1" class="paysystems coral-button" data-select-option='JSON::[{"name":"SBP","value":"156:sbp"},{"name":"Card","value":"156:bank_card"}]'>`);
check("варианты оплаты со страницы заказа", opts.length === 2 && opts[1].value === "156:bank_card");
check("кнопка банка в ответе выбора способа", gatewayFromAction('<a class="pay-button" href="https://yoomoney.ru/checkout/payments/v2/contract?orderId=x">Pay</a>', "https://coralclub.ru/")?.url.startsWith("https://yoomoney.ru/"));
check("ссылка на сайт магазина в ответе не банк", gatewayFromAction('<a href="/personal-new/">x</a>', "https://coralclub.ru/") === null);
{
  const page = `<div class="paysys-payment none"></div><button class="paysystems coral-button" data-select-option='JSON::[{"name":"SBP","value":"156:sbp"},{"name":"Card","value":"156:bank_card"}]'></button><script>BX.message({'bitrix_sessid':'abc123'}); var data = { delivery: 'I_SDEK_D', order_id: '700000001', }</script>`;
  let posted = "";
  let cookie = "";
  globalThis.fetch = async (url, init = {}) => {
    const u = new URL(url);
    if (u.pathname === "/order/payment/700000001/") { cookie = init.headers?.cookie ?? ""; return new Response("", { status: 302, headers: { location: "/personal-new/shop/orders/" } }); }
    if (u.pathname === "/personal-new/shop/orders/") return new Response(page, { status: 200 });
    if (u.pathname === "/ajax/order/orderSelectPaysystem.php") { posted = String(init.body); return new Response(JSON.stringify({ paysystems_action: '<a class="pay-button" href="https://yoomoney.ru/checkout/payments/v2/contract?orderId=1">Оплатить</a>' }), { status: 200 }); }
    return new Response("нет", { status: 404 });
  };
  const r2 = await resolveFrom({ jar: new Map(), url: new URL("https://coralclub.ru/order/payment/700000001/?new_checkout=1"), method: "160:bank_card" });
  check("заказ РФ: выбор способа на странице заказа → ЮKassa", r2.target?.url.startsWith("https://yoomoney.ru/"));
  check("выбран тот же способ, что в чек-ауте (bank_card), с sessid и номером заказа", /paysystem=156%3Abank_card/.test(posted) && /sessid=abc123/.test(posted) && /order_id=700000001/.test(posted));
  check("перед страницей оплаты ставится cookie orderResultId", /orderResultId=700000001/.test(cookie));
}
globalThis.fetch = real;
console.log(ok ? "\nвсе проверки пройдены" : "\nЕСТЬ ПРОВАЛЫ"); process.exit(ok ? 0 : 1);
