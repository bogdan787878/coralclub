/**
 * Гайд по картинкам галереи карточки товара (PDP) — одна страница-брендбук.
 * Сборка: node apps/shop/pdp-guide/build.mjs → apps/shop/public/pdp-guide/{index.html, guide.md, spec.json, llms.txt}
 * Порядок страницы: 1) две полные раскадровки (Корал-Майн, Гидрамакс Плюс), 2) требования к каждой картинке,
 * 3) справочник (формат, цвета, масштаб, формы, интерьеры, предметы, данные продуктов), 4) для нейросетей.
 */
import { mkdirSync, readdirSync, rmSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import * as C from "./content.mjs";
import { AGENT_PROMPT, esc, productCards } from "./prompts.mjs";

const OUT = join(dirname(fileURLToPath(import.meta.url)), "../public/pdp-guide");
const { BASE, img, PRODUCTS, bySlug } = C;
const src = (f) => `img/${f}.jpg`;

/* ---------- требования к картинкам (коротко) ---------- */

const REQS = [
  {
    id: "card-1",
    title: "Упаковка на сером фоне",
    why: "Покупатель узнаёт товар и видит, что именно приедет.",
    must: ["Ровный светло-серый фон #EFEFEF, без предметов", "Упаковка спереди, по центру, около 70% высоты кадра", "Все упаковки артикула: Корал-Майн 3 × 10 — три пакета", "Мягкая тень под упаковкой"],
    never: ["Перерисованная или переведённая этикетка", "Любой текст на картинке"],
    text: "Нет",
    pack: "Набор — закрытая коробка.",
  },
  {
    id: "card-2",
    title: "Упаковка в интерьере и что внутри",
    why: "Понятно, сколько покупаешь и какого размера упаковка.",
    must: ["Интерьер из референсов, тёплый свет из окна", "Содержимое рядом и в считываемом количестве: 10 саше веером, таблетки стопкой, стики веером", "Рифлёный стакан 9 см рядом — по нему виден реальный размер"],
    never: ["Упаковка не в масштабе", "Открытое или порванное саше Корал-Майн"],
    text: "Максимум плашка: «30 саше · 30 дней»",
    pack: "Набор — коробка и все продукты в точном количестве: 3 пакета Корал-Майн, 3 тубы ПентоКан, 1 Оушенмин, 1 H-500.",
  },
  {
    id: "card-3",
    title: "Killer claims",
    why: "Три факта о продукте, которые хочется запомнить.",
    must: ["Сцена: предмет интерьера + способ употребления (саше опускают в стакан, таблетка шипит, порошок сыплется)", "3–4 коротких пункта, до 8 слов", "Половина кадра спокойная — под текст"],
    never: ["Дозировка и цифры состава — они на картинках 4 и 5", "Та же сцена, что на картинке 2", "Одинаковые claims у разных продуктов", "Обещания лечения"],
    text: "Заголовок + 3–4 пункта",
    pack: "Набор — факты про программу целиком, не про отдельные продукты.",
  },
  {
    id: "card-4",
    title: "Как применять",
    why: "Сколько, как, сколько раз в день и на сколько дней хватит упаковки.",
    must: ["Дозировка — только с сайта (см. «Данные продуктов»)", "Объём воды честный: 60 мл — четверть стакана, 1,5 л — графин", "Последний пункт — на сколько дней хватит"],
    never: ["Придуманная схема приёма"],
    text: "«Как применять» + 3–4 пункта",
    pack: "Набор — по строке на каждый продукт: что, сколько, когда.",
  },
  {
    id: "card-5",
    title: "Состав",
    why: "Полный состав таблицей, как на упаковке.",
    must: ["Фон #F8EFE6, текст #3F2006, без фото", "Единица своя: на 1 саше / таблетку / стик / капсулу", "Колонка % РУСП, если она есть у продукта", "Внизу: страна, срок годности, «БАД. Не является лекарственным средством»"],
    never: ["Таблица соседнего продукта", "Цифры, сгенерированные нейросетью — собирать в Figma"],
    text: "Таблица",
    pack: "Набор — отдельная картинка на каждый продукт: 5–8.",
  },
];

/* ---------- раскадровки ---------- */

const EX = C.EXAMPLES;
const ISSUE = Object.fromEntries(PRODUCTS.flatMap((p) => (p.issues ?? []).map((i) => [i.file, i.text])));

const STORY = [
  {
    slug: "coral-mine",
    label: "Монопродукт",
    tiles: [
      ["Упаковка", EX["coral-mine"]["packshot-grey"]],
      ["Объём", EX["coral-mine"]["interior-volume"]],
      ["Claims", EX["coral-mine"].claims],
      ["Применение", EX["coral-mine"]["how-to-use"]],
      ["Состав", EX["coral-mine"].composition],
    ],
  },
  {
    slug: "hydramax-plus",
    label: "Набор",
    tiles: [
      ["Коробка", EX["hydramax-plus"]["packshot-grey"]],
      ["Что внутри", EX["hydramax-plus"]["interior-volume"]],
      ["Claims", EX["hydramax-plus"].claims],
      ["Применение", EX["hydramax-plus"]["how-to-use"]],
      ["Состав: Корал-Майн", EX["hydramax-plus"].composition],
      ["Состав: ПентоКан", { comp: "pentokan" }],
      ["Состав: H-500", { comp: "h-500" }],
      ["Состав: Оушенмин", { comp: "oceanmin" }],
    ],
  },
];

/* макет картинки состава в HTML — правильные данные, стиль как у картинки Корал-Майн */
function compCard(slug) {
  const p = bySlug(slug);
  const c = p.composition;
  return `<div class="comp"><div class="comp__in"><p class="comp__t">Состав: ${esc(p.name)}</p><table><thead><tr><th>Ингредиент</th><th>${esc(c.unit.replace(/^на /, "На "))}</th>${c.rusp ? "<th>% РУСП</th>" : ""}</tr></thead><tbody>${c.rows.map((r) => `<tr><td>${esc(r.name)}</td><td>${esc(r.amount)}</td>${c.rusp ? `<td>${esc(r.rusp)}</td>` : ""}</tr>`).join("")}</tbody></table><p class="comp__n">${esc(p.origin)} · срок годности ${esc(p.shelf)} · БАД</p></div></div>`;
}

const tile = ([label, what], i) => {
  const issue = typeof what === "string" ? ISSUE[what] : null;
  const media = typeof what === "string" ? `<img src="${src(what)}" alt="${esc(label)}" loading="lazy">` : compCard(what.comp);
  return `<figure class="tile"><div class="tile__m">${media}${issue ? `<span class="tile__flag" title="${esc(issue)}">поправить</span>` : ""}${typeof what === "string" ? "" : `<span class="tile__flag tile__flag--mock">макет</span>`}</div><figcaption><b>${i + 1}</b>${esc(label)}</figcaption></figure>`;
};

const storyboard = (s) => {
  const p = bySlug(s.slug);
  const fixes = s.tiles.map(([, w], i) => (typeof w === "string" && ISSUE[w] ? `<li><b>${i + 1}.</b> ${esc(ISSUE[w])}</li>` : "")).join("");
  const mock = s.tiles.some(([, w]) => typeof w !== "string") ? `<li>Картинки с пометкой «макет» собраны в HTML с правильными данными — по ним делать финальные в Figma.</li>` : "";
  return `<div class="story"><div class="story__head"><h3>${esc(p.name)}</h3><span>${esc(s.label)} · ${s.tiles.length} картинок</span></div><div class="strip strip--${s.tiles.length}">${s.tiles.map(tile).join("")}</div>${fixes || mock ? `<details class="fixes"><summary>Что поправить в этих примерах</summary><ul>${fixes}${mock}</ul></details>` : ""}</div>`;
};

/* ---------- требования ---------- */

const promptBox = (label, text) => `<div class="pr"><div class="pr__h"><span>${esc(label)}</span><button type="button" class="copy">Скопировать</button></div><pre>${esc(text)}</pre></div>`;

function promptsFor(n) {
  // промты картинки n (1–5) по всем продуктам; у набора 5 = состав каждого продукта
  return PRODUCTS.map((p) => {
    const cards = productCards(p).filter((c) => (n === 5 ? c.id === "composition" : c.n === n));
    if (!cards.length) return "";
    const body = cards
      .map((c) => promptBox(cards.length > 1 ? c.title : c.prompts.noText ? "С текстом" : "Промт", c.prompts.main) + (c.prompts.noText ? promptBox("Без текста — текст добавить в Figma", c.prompts.noText) : "") + `<p class="att">Приложить: ${c.refs.map((r) => `<a href="${r.url}" target="_blank" rel="noopener">${esc(r.what)}</a>`).join(" · ")}</p>`)
      .join("");
    return `<details class="pp"><summary>${esc(p.name)}</summary>${body}</details>`;
  }).join("");
}

const exImg = (what, cap) => `<figure>${typeof what === "string" ? `<img src="${src(what)}" alt="" loading="lazy">` : compCard(what.comp)}<figcaption>${esc(cap)}</figcaption></figure>`;

const reqBlock = (r, i) => {
  const n = i + 1;
  return `<article class="req" id="${r.id}"><div class="req__num">${String(n).padStart(2, "0")}</div><div class="req__body"><h3>${esc(r.title)}</h3><p class="why">${esc(r.why)}</p>
<div class="req__grid"><div class="req__ex">${exImg(STORY[0].tiles[i][1], "Корал-Майн")}${exImg(STORY[1].tiles[i][1], "Гидрамакс Плюс")}</div>
<div class="req__rules"><h4>Обязательно</h4><ul class="yes">${r.must.map((t) => `<li>${esc(t)}</li>`).join("")}</ul><h4>Нельзя</h4><ul class="no">${r.never.map((t) => `<li>${esc(t)}</li>`).join("")}</ul><dl><dt>Текст</dt><dd>${esc(r.text)}</dd><dt>Набор</dt><dd>${esc(r.pack)}</dd></dl></div></div>
<details class="prompts"><summary>Промты для этой картинки — по продуктам</summary>${promptsFor(n)}</details></div></article>`;
};

/* ---------- справочник ---------- */

const sw = (hex, name) => `<div class="sw"><span style="background:${hex}"></span><b>${hex}</b><small>${esc(name)}</small></div>`;

const ref = `
<div class="ref" id="format"><h3>Формат и цвета</h3>
<table class="t"><tr><td>Пропорции</td><td>1:1, исходник 2000 × 2000 px</td></tr><tr><td>На сайт</td><td>1200 × 1200 px, WebP или JPEG до 400 КБ</td></tr><tr><td>Поля</td><td>10% с каждой стороны — без текста и деталей продукта</td></tr><tr><td>Заголовок</td><td>антиква курсивом, 64–80 px при 1200 px</td></tr><tr><td>Текст</td><td>гротеск, 36–44 px при 1200 px; не больше 4 пунктов и 30 слов</td></tr><tr><td>Имя файла</td><td><code>coral-mine-02-interior-volume.webp</code></td></tr></table>
<div class="sws">${sw(C.COLORS.grey, "фон упаковки")}${sw(C.COLORS.cream, "фон текстовых картинок")}${sw(C.COLORS.ink, "текст")}</div></div>

<div class="ref" id="scale"><h3>Реальный размер</h3><p class="lead">По картинке должно быть понятно, какого размера упаковка. Мерка в кадре — стакан 9 см. Размеры посчитаны по пропорциям официального фото — перед финалом сверить линейкой.</p>
<img class="wide" src="${src(C.SCALE_IMAGE)}" alt="Упаковки с размерами в сантиметрах" loading="lazy">
<table class="t">${PRODUCTS.map((p) => `<tr><td>${esc(p.name)}</td><td>${esc(p.size)}</td></tr>`).join("")}${C.PROPS.map((p) => `<tr><td>${esc(p.title)}</td><td>${esc(p.size)}</td></tr>`).join("")}</table></div>

<div class="ref" id="forms"><h3>Формы продуктов</h3><p class="lead">Самая заметная ошибка — неправильная форма того, что внутри упаковки.</p>
<div class="gal gal--4">
<figure><img src="${src("refs/forms/coral-mine-sachet-in-hand")}" alt="" loading="lazy"><figcaption><b>Саше — Корал-Майн</b>Закрытый пакетик ≈ 2,5 × 9 см, опускают в воду целиком. <em>Из него ничего не высыпается.</em></figcaption></figure>
<figure><img src="${src("refs/forms/oceanmin-stick-pouring")}" alt="" loading="lazy"><figcaption><b>Стик — Оушенмин</b>Стик надрывают, порошок сыплется в воду. Так можно только с Оушенмином.</figcaption></figure>
<figure><img src="${src("refs/forms/pentokan-tube")}" alt="" loading="lazy"><figcaption><b>Шипучая таблетка — ПентоКан</b>Белая таблетка ≈ Ø 2,5 см в 60 мл воды. Фото таблетки на сайте нет — сверить с реальной.</figcaption></figure>
<figure><img src="${src("refs/forms/h500-bottle")}" alt="" loading="lazy"><figcaption><b>Капсула — H-500</b>Целая капсула ≈ 2 см, в кадре 1–2 штуки. Фото капсулы на сайте нет — сверить цвет.</figcaption></figure>
</div></div>

<div class="ref" id="interiors"><h3>Интерьеры</h3><p class="lead">Тёплый солнечный минимализм: дуб, травертин, мрамор, жёсткий свет из окна с тенями листьев. В одной галерее сцены не повторяются.</p>
<div class="gal gal--3">${C.INTERIORS.map((i) => `<figure><a href="${src(i.file)}" target="_blank"><img src="${src(i.file)}" alt="" loading="lazy"></a><figcaption><b>${esc(i.title)}</b>${esc(i.text)}</figcaption></figure>`).join("")}</div></div>

<div class="ref" id="props"><h3>Предметы интерьера</h3><p class="lead">Только эти предметы. Они не закрывают упаковку и не выше неё.</p>
<div class="gal gal--4">${C.PROPS.map((p) => `<figure><a href="${src(p.file)}" target="_blank"><img src="${src(p.file)}" alt="" loading="lazy"></a><figcaption><b>${esc(p.title)}</b>${esc(p.size)}</figcaption></figure>`).join("")}</div></div>

<div class="ref" id="data"><h3>Данные продуктов</h3><p class="lead">Источник — карточки товаров на coralclub.ru. Тексты на картинках берём только отсюда.</p>
<div class="tw"><table class="t t--data"><thead><tr><th>Продукт</th><th>Упаковка</th><th>Как применять</th><th>Хватает на</th></tr></thead><tbody>${PRODUCTS.map((p) => `<tr><td><b>${esc(p.name)}</b><br><small>${esc(p.origin)} · ${esc(p.shelf)}</small></td><td>${esc(p.pack)}</td><td>${p.dose.map(esc).join("<br>")}</td><td>${esc(p.days)}</td></tr>`).join("")}</tbody></table></div>
<div class="gal gal--4 comps">${PRODUCTS.filter((p) => p.composition).map((p) => compCard(p.slug)).join("")}</div></div>`;

/* ---------- страница ---------- */

const html = `<!DOCTYPE html><html lang="ru"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1">
<title>Картинки карточки товара — гайд Coral Club</title>
<meta name="description" content="Как делать картинки галереи карточки товара Coral Club: раскадровки, требования к каждой картинке, референсы и промты.">
<link rel="alternate" type="text/markdown" href="guide.md" title="Гайд одним Markdown-файлом для нейросетей"><link rel="alternate" type="application/json" href="spec.json">
<link rel="preconnect" href="https://fonts.googleapis.com"><link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@1,500;1,600&family=Inter:wght@400;500;600&display=swap" rel="stylesheet">
<link rel="stylesheet" href="guide.css"></head><body>
<header class="top"><a href="#" class="brand">coralclub <span>картинки PDP</span></a><nav><a href="#stories">Раскадровки</a><a href="#reqs">Требования</a><a href="#ref">Справочник</a><a href="#ai">Для ИИ</a></nav></header>

<section class="hero"><p class="kicker">Гайд · галерея карточки товара</p><h1>Пять картинок, которые объясняют продукт</h1>
<p class="lead">Каждый продукт показываем одной раскадровкой: упаковка, объём, главные факты, как применять, состав. Сначала — два полных примера, потом требования к каждой картинке, в конце — референсы и промты.</p>
<ol class="flow">${REQS.map((r, i) => `<li><a href="#${r.id}"><b>${i + 1}</b>${esc(r.title)}</a></li>`).join("")}</ol></section>

<section class="sec" id="stories"><p class="kicker">01</p><h2>Раскадровки</h2>${STORY.map(storyboard).join("")}</section>

<section class="sec" id="reqs"><p class="kicker">02</p><h2>Требования к каждой картинке</h2>${REQS.map(reqBlock).join("")}</section>

<section class="sec" id="ref"><p class="kicker">03</p><h2>Справочник</h2><nav class="subnav"><a href="#format">Формат и цвета</a><a href="#scale">Реальный размер</a><a href="#forms">Формы продуктов</a><a href="#interiors">Интерьеры</a><a href="#props">Предметы</a><a href="#data">Данные продуктов</a></nav>${ref}</section>

<section class="sec" id="ai"><p class="kicker">04</p><h2>Для нейросетей</h2><p class="lead">Отправьте нейросети ссылку на гайд и задачу — она возьмёт правила, тексты и референсы сама. Если нейросеть не открывает ссылки, скопируйте промт из раздела «Требования» и приложите картинки вручную.</p>
<div class="files"><a href="guide.md"><b>guide.md</b>весь гайд одним файлом</a><a href="spec.json"><b>spec.json</b>данные и готовые промты</a><a href="llms.txt"><b>llms.txt</b>оглавление для ИИ-агентов</a></div>
${promptBox("Инструкция для нейросети", `${AGENT_PROMPT}\n\nЗадача: сделай картинку 2 «Упаковка в интерьере и что внутри» для продукта «Оушенмин».`)}</section>

<footer class="foot">Coral Club · гайд по картинкам карточки товара · данные о продуктах — coralclub.ru</footer>
<script>document.querySelectorAll(".copy").forEach(b=>b.addEventListener("click",async()=>{const t=b.closest(".pr").querySelector("pre").innerText;try{await navigator.clipboard.writeText(t);b.textContent="Скопировано"}catch{b.textContent="Выделите вручную"}setTimeout(()=>b.textContent="Скопировать",1500)}));</script>
</body></html>`;

/* ---------- для нейросетей: guide.md, spec.json, llms.txt ---------- */

const spec = {
  title: "Coral Club — гайд по картинкам галереи карточки товара (PDP)",
  site: BASE,
  updated: new Date().toISOString().slice(0, 10),
  how_to_use: AGENT_PROMPT,
  gallery: REQS.map((r, i) => ({ n: i + 1, ...r })),
  storyboards: STORY.map((s) => ({ product: s.slug, images: s.tiles.map(([label, w], i) => ({ n: i + 1, label, image: typeof w === "string" ? img(w) : null, needs_fix: typeof w === "string" ? ISSUE[w] ?? null : null })) })),
  format: C.FORMAT,
  colors: C.COLORS,
  base_prompts: { style: C.STYLE_PROMPT, product_lock: C.LOCK_PROMPT, scale: C.SCALE_PROMPT, text_rule: C.TEXT_RULE },
  scale_reference: img(C.SCALE_IMAGE),
  interiors: C.INTERIORS.map((i) => ({ id: i.id, title: i.title, use: i.text, url: img(i.file) })),
  props: C.PROPS.map((p) => ({ id: p.id, title: p.title, size: p.size, url: img(p.file) })),
  products: PRODUCTS.map((p) => ({
    slug: p.slug,
    type: p.type,
    name: p.name,
    name_en: p.en,
    codes: p.codes,
    form: p.form,
    form_description: p.formText,
    pack: p.pack,
    size: p.size,
    dose: p.dose,
    lasts: p.days,
    origin: p.origin,
    shelf_life: p.shelf,
    composition: p.composition ?? null,
    contents: p.contents ?? null,
    frame_rule: p.rule.ru,
    product_photos: p.refs.map(img),
    cards: productCards(p).map((c) => ({ n: c.n, title: c.title, prompt: c.prompts.main, prompt_no_text: c.prompts.noText ?? null, text_on_card: c.prompts.text ?? c.prompts.table ?? null, badge: c.prompts.badge ?? null, attach: c.refs })),
  })),
};

const md = [`# ${spec.title}`, "", `Сайт: ${BASE} · данные: ${BASE}spec.json · обновлено ${spec.updated}`, "", "## Как сделать картинку", "", AGENT_PROMPT, ""];
md.push("## Раскадровка галереи", "", ...REQS.map((r, i) => `${i + 1}. **${r.title}** — ${r.why}`), "", "Примеры:", ...STORY.map((s) => `- ${bySlug(s.slug).name}: ${s.tiles.map(([l, w], i) => (typeof w === "string" ? `[${i + 1} ${l}](${img(w)})` : `${i + 1} ${l}`)).join(" · ")}`), "");
md.push("## Требования к каждой картинке", "");
for (const [i, r] of REQS.entries()) md.push(`### ${i + 1}. ${r.title}`, r.why, "", "Обязательно:", ...r.must.map((t) => `- ${t}`), "", "Нельзя:", ...r.never.map((t) => `- ${t}`), "", `Текст: ${r.text}`, `Набор: ${r.pack}`, "");
md.push("## Формат и цвета", "", `- ${C.FORMAT.ratio}, исходник ${C.FORMAT.master}, на сайт ${C.FORMAT.export}`, `- Поля: ${C.FORMAT.safe}`, ...C.FORMAT.text.map((t) => `- ${t}`), `- Цвета: упаковка на ${C.COLORS.grey}, текстовые картинки ${C.COLORS.cream}, текст ${C.COLORS.ink}`, "");
md.push("## Реальный размер", "", `Референс: ${img(C.SCALE_IMAGE)}`, "", ...PRODUCTS.map((p) => `- ${p.name}: ${p.size}`), ...C.PROPS.map((p) => `- ${p.title}: ${p.size} — ${img(p.file)}`), "");
md.push("## Базовые промты", "", "```", C.STYLE_PROMPT, "```", "```", C.LOCK_PROMPT, "```", "```", C.SCALE_PROMPT, "```", "");
md.push("## Интерьеры", "", ...C.INTERIORS.map((i) => `- ${i.title} — ${i.text} ${img(i.file)}`), "");
for (const p of spec.products) {
  md.push(`## ${p.name} (${p.name_en})`, "", `- Форма: ${p.form}. ${p.form_description}`, `- Упаковка: ${p.pack}`, `- Размер: ${p.size}`, `- Применение: ${p.dose.join("; ")}`, `- Хватает на: ${p.lasts}`, `- Страна: ${p.origin}; срок годности: ${p.shelf_life}`, `- Правило кадра: ${p.frame_rule}`, `- Фото продукта: ${p.product_photos.join(" ")}`, "");
  if (p.composition) md.push(`Состав (${p.composition.unit}):`, "", `| Ингредиент | Количество |${p.composition.rusp ? " % РУСП |" : ""}`, `|---|---|${p.composition.rusp ? "---|" : ""}`, ...p.composition.rows.map((r) => `| ${r.name} | ${r.amount} |${p.composition.rusp ? ` ${r.rusp} |` : ""}`), ...p.composition.notes.map((n) => `- ${n}`), "");
  for (const c of p.cards) {
    md.push(`### ${p.name} — картинка ${c.n}. ${c.title}`, "");
    if (c.badge) md.push(`Плашка (в Figma): ${c.badge}`, "");
    md.push("```", c.prompt, "```");
    if (c.prompt_no_text) md.push("Без текста:", "```", c.prompt_no_text, "```");
    md.push("Приложить:", ...c.attach.map((r) => `- ${r.url} — ${r.what}`), "");
  }
}

const llms = `# Coral Club — гайд по картинкам галереи карточки товара (PDP)

> Раскадровка галереи карточки товара (упаковка на сером фоне, объём, killer claims, как применять, состав), требования к каждой картинке, реальные размеры упаковок, факты о продуктах и готовые промты с прямыми ссылками на референсы.

## Документы
- [Гайд целиком (Markdown)](${BASE}guide.md)
- [Данные и промты (JSON)](${BASE}spec.json): products[].cards[].prompt и attach[]
- [Сайт](${BASE})
`;

/* ---------- запись: прошлую многостраничную версию убираем ---------- */
mkdirSync(OUT, { recursive: true });
for (const f of readdirSync(OUT)) if (f.endsWith(".html") || f === "assets") rmSync(join(OUT, f), { recursive: true, force: true });
writeFileSync(join(OUT, "index.html"), html);
writeFileSync(join(OUT, "spec.json"), JSON.stringify(spec, null, 2));
writeFileSync(join(OUT, "guide.md"), md.join("\n"));
writeFileSync(join(OUT, "llms.txt"), llms);
console.log(`pdp-guide: index.html, guide.md, spec.json, llms.txt → ${OUT}`);
