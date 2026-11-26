/**
 * Сборка гайда по картинкам PDP: node apps/shop/pdp-guide/build.mjs
 * Пишет apps/shop/public/pdp-guide/: *.html (разметка и стили Eclectica DS — чтобы перенести страницы в DS),
 * guide.md, spec.json, llms.txt (для нейросетей). Картинки — public/pdp-guide/img (готовятся отдельно).
 */
import { mkdirSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import * as C from "./content.mjs";

const OUT = join(dirname(fileURLToPath(import.meta.url)), "../public/pdp-guide");
const { BASE, img, PRODUCTS, bySlug } = C;
const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c]);
const interior = (id) => C.INTERIORS.find((i) => i.id === id);
const PROP = Object.fromEntries(C.PROPS.map((p) => [p.id, p.file]));

/* ---------- промты ---------- */

const cap = (t) => t[0].toUpperCase() + t.slice(1);
const list = (items) => items.map((t) => `«• ${t}»`).join(", ");

function cardPrompts(p, kind, extra = {}) {
  const c = p.cards[kind === "packshot-grey" ? "grey" : kind === "interior-volume" ? "volume" : kind === "how-to-use" ? "howto" : kind];
  const real = `Real size: ${p.sizeEn}.`;
  if (kind === "packshot-grey")
    return {
      main: `${C.LOCK_PROMPT} Studio e-commerce packshot: ${c.what}. Flat seamless light grey background ${C.COLORS.grey}, no gradient, no props. The product is centered and fills about 70% of the frame height. Soft natural contact shadow under it, no reflections, even soft light, true colors. ${real} Square 1:1, 2000 × 2000 px. No text, no watermarks.`,
    };
  if (kind === "interior-volume")
    return {
      main: `${C.STYLE_PROMPT} Scene: ${interior(c.scene).en}. ${C.LOCK_PROMPT} Show the purchased quantity clearly: ${c.what}. ${real} ${C.SCALE_PROMPT} ${p.rule.en} No text in the image.`,
      badge: c.badge,
    };
  if (kind === "claims" || kind === "how-to-use") {
    const scene = `${C.STYLE_PROMPT} Scene: ${interior(c.scene).en}. ${C.LOCK_PROMPT} ${cap(c.what)}. ${real} ${C.SCALE_PROMPT} ${p.rule.en}`;
    const side = kind === "claims" ? "left half" : "bottom third";
    return {
      main: `${scene} Keep the ${side} of the frame calm and empty for text. Text on that ${side}, color ${C.COLORS.ink}: a title in an elegant italic serif «${c.title}», below it a list in a clean sans-serif: ${list(c.items)}. ${C.TEXT_RULE}`,
      noText: `${scene} Keep the ${side} of the frame calm and empty for a text overlay added later. No text in the image.`,
      text: { title: c.title, items: c.items },
    };
  }
  if (kind === "composition") {
    const q = extra.product ?? p;
    const comp = q.composition;
    const head = [`«Название ингредиента»`, `«Количество ${comp.unit}»`, ...(comp.rusp ? [`«% РУСП*»`] : [])].join(" | ");
    const body = comp.rows.map((r) => [r.name, r.amount, ...(comp.rusp ? [r.rusp] : [])].map((x) => `«${x}»`).join(" | ")).join("; ");
    const title = extra.product ? `Состав: ${q.name}` : "Состав";
    const notes = [...comp.notes, `Страна производства: ${q.origin}. Срок годности: ${q.shelf}.`, "БАД. Не является лекарственным средством."];
    return {
      main: `Typographic product card, no photo. Square 1:1, 2000 × 2000 px. Flat background ${C.COLORS.cream}, all text ${C.COLORS.ink}. Title centered at the top in an elegant italic serif: «${title}». Below it a clean table in a sans-serif, thick black rule above and below the header row, thin rules between rows. Header: ${head}. Rows: ${body}. Small footnotes at the bottom, one per line: ${notes.map((n) => `«${n}»`).join(", ")}. ${C.TEXT_RULE}`,
      table: { title, unit: comp.unit, rusp: comp.rusp, rows: comp.rows, notes },
    };
  }
}

function cardRefs(p, kind, extra = {}) {
  const c = p.cards[{ "packshot-grey": "grey", "interior-volume": "volume", "how-to-use": "howto" }[kind] ?? kind];
  const r = [];
  if (kind === "composition") {
    const ex = C.EXAMPLES["coral-mine"].composition;
    return [{ url: img(ex), what: "пример оформления состава (стиль, не данные)" }];
  }
  for (const f of p.refs) r.push({ url: img(f), what: "фото продукта — точная упаковка" });
  if (kind !== "packshot-grey") {
    r.push({ url: img(interior(c.scene).file), what: `интерьер: ${interior(c.scene).title}` });
    r.push({ url: img(PROP["ribbed-glass"]), what: "стакан 9 см — мерка масштаба" });
    r.push({ url: img(C.SCALE_IMAGE), what: "линейка масштаба упаковок" });
  }
  const ex = (C.EXAMPLES[p.slug] ?? C.EXAMPLES[p.type === "pack" ? "hydramax-plus" : "coral-mine"])[kind];
  if (ex) r.push({ url: img(ex), what: "пример этой карточки (стиль и композиция)" });
  return r;
}

/* все карточки продукта: [{n, id, title, rules, goal, prompts, refs, example, product?}] */
function productCards(p) {
  const tpl = p.type === "pack" ? C.PACK_CARDS : C.MONO_CARDS;
  const out = [];
  for (const t of tpl) {
    if (t.id === "composition" && p.type === "pack") {
      p.contents.forEach((slug, i) => {
        const q = bySlug(slug);
        out.push({ ...t, n: 5 + i, title: `Состав: ${q.name}`, prompts: cardPrompts(p, "composition", { product: q }), refs: cardRefs(p, "composition"), example: i === 0 ? C.EXAMPLES[p.slug]?.composition : undefined });
      });
      continue;
    }
    out.push({ ...t, prompts: cardPrompts(p, t.id), refs: cardRefs(p, t.id), example: C.EXAMPLES[p.slug]?.[t.id] });
  }
  return out;
}

/* ---------- страницы ---------- */

const NAV = [
  { href: "index.html", title: "Введение", icon: "home-24" },
  { group: "Основы", icon: "calibrate-24", items: [["format.html", "Формат и размеры"], ["style.html", "Стиль и свет"], ["scale.html", "Масштаб упаковок"]] },
  { group: "Карточки", icon: "checklist-24", items: [["mono.html", "Монопродукт"], ["pack.html", "Набор"]] },
  { group: "Продукты", icon: "composit-object-tree-view-24", items: PRODUCTS.map((p) => [`${p.slug}.html`, p.name]) },
  { group: "Референсы", icon: "composit-object-tree-view-24", items: [["interiors.html", "Интерьеры"], ["props.html", "Предметы интерьера"], ["forms.html", "Формы продуктов"]] },
  { href: "ai.html", title: "Для нейросетей", icon: "checklist-24" },
];
const ORDER = NAV.flatMap((n) => (n.items ? n.items : [[n.href, n.title]]));

const N = 'data-astro-cid-pux6a34n'; // скоуп стилей меню DS
function sidebar(active) {
  const link = (href, title, cls, icon) =>
    `<li ${N} class="nav-item"><a ${N} href="${href}" class="nav-link single-link ${cls}${href === active ? " is-active" : ""}"><div ${N} class="title-with-icon">${icon ? `<img ${N} src="assets/icons/${icon}.svg" alt="">` : ""}<span ${N}>${esc(title)}</span></div></a></li>`;
  return NAV.map((n) =>
    n.items
      ? `<li ${N} class="nav-item"><details ${N} class="nav-details" open><summary ${N} class="nav-summary"><div ${N} class="title-with-icon"><img ${N} src="assets/icons/${n.icon}.svg" alt=""><span ${N} class="nav-text level-1">${esc(n.group)}</span></div><span ${N} class="chevron"></span></summary><div ${N} class="children-wrapper"><ul ${N} class="nav-list">${n.items.map(([h, t]) => link(h, t, "level-sub")).join("")}</ul></div></details></li>`
      : link(n.href, n.title, "level-1", n.icon),
  ).join("");
}

const A = 'data-astro-cid-tklfeeew'; // скоуп стилей таблиц и разделителей DS

const section = (id, title, desc = "", level = 1, first = false) =>
  `<div class="section-title"><section class="case-card"${id ? ` id="${id}"` : ""}>${first ? "" : `<hr class="block-divider" ${A}>`}<div class="case-title"><h${level} class="case-title">${esc(title)}</h${level}>${desc ? `<p class="case-description">${desc}</p>` : ""}</div></section></div>`;

const photo = (file, caption = "", { label, dont } = {}) =>
  `<div class="comparison-item"><div class="case-preview${dont ? " dont-bg" : ""}" style="--custom-pad:0px"><a href="img/${file}.jpg" target="_blank" rel="noopener"><img class="guide-photo" src="img/${file}.jpg" alt="${esc(caption.replace(/<[^>]+>/g, ""))}" loading="lazy"></a></div><div class="caption-wrapper">${label ? `<div class="comparison-label ${label}"><img src="assets/${label === "do" ? "do" : "dont"}.svg" class="icon-svg" alt=""><strong>${label === "do" ? "можно" : "нельзя"}</strong></div>` : ""}${caption ? `<p class="comparison-description">${caption}</p>` : ""}</div></div>`;

const grid = (items, single) => `<div class="${single ? "single-preview" : "comparison-grid"}">${items.join("")}</div>`;

const table = (head, body, widths = []) =>
  `<div class="table-container"><table class="custom-table" ${A}><tbody ${A}><tr class="table-header-row" ${A}>${head.map((h, i) => `<td ${A}${widths[i] ? ` style="width:${widths[i]}"` : ""}><div ${A}>${esc(h)}</div></td>`).join("")}</tr>${body.map((r) => `<tr ${A}>${r.map((c) => `<td ${A}><div ${A}>${c}</div></td>`).join("")}</tr>`).join("")}</tbody></table></div>`;

const bullets = (items) => `<ul class="guide-list">${items.map((t) => `<li>${t}</li>`).join("")}</ul>`;
/* пример карточки слева, правила справа */
const cardBlock = (example, html) =>
  example ? `<div class="guide-card"><a class="guide-card__img" href="img/${example}.jpg" target="_blank" rel="noopener"><img src="img/${example}.jpg" alt="Пример карточки" loading="lazy"><span>Пример из текущей галереи</span></a><div>${html}</div></div>` : html;
const note = (html, tone = "info") => `<div class="guide-note guide-note--${tone}">${html}</div>`;

const promptBlock = (label, text) =>
  `<div class="guide-prompt"><div class="guide-prompt__head"><span>${esc(label)}</span><button type="button" class="guide-copy">Скопировать</button></div><pre><code>${esc(text)}</code></pre></div>`;

const refList = (refs) =>
  `<div class="guide-refs">${refs.map((r) => `<a class="guide-ref" href="${r.url}" target="_blank" rel="noopener"><img src="${r.url.replace(BASE, "")}" alt="" loading="lazy"><span>${esc(r.what)}</span></a>`).join("")}</div>`;

function page({ file, title, lead, body, tabs, toc, status = "stable" }) {
  const i = ORDER.findIndex(([h]) => h === file);
  const prev = ORDER[i - 1];
  const next = ORDER[i + 1];
  const tocHtml = tabs
    ? tabs.map((t, k) => `<div class="toc-sticky${k === 0 ? " active" : ""}" id="toc-${t.id}"><h4 class="toc-label">На этой странице</h4><ul class="toc-list">${t.toc.map(([id, l]) => `<li><a href="#${id}">${esc(l)}</a></li>`).join("")}</ul></div>`).join("")
    : `<div class="toc-sticky active"><h4 class="toc-label">На этой странице</h4><ul class="toc-list">${(toc ?? []).map(([id, l]) => `<li><a href="#${id}">${esc(l)}</a></li>`).join("")}</ul></div>`;
  const content = tabs
    ? `<div class="tabs-nav">${tabs.map((t, k) => `<button class="tab-btn${k === 0 ? " active" : ""}" data-tab="${t.id}">${esc(t.label)}</button>`).join("")}</div>${tabs.map((t, k) => `<div id="tab-${t.id}" class="tab-pane${k === 0 ? " active" : ""}">${t.body}</div>`).join("")}`
    : `<div class="general-content">${body}</div>`;
  return `<!DOCTYPE html><html lang="ru"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1"><title>${esc(title)} — гайд по картинкам PDP</title>
<link rel="preconnect" href="https://fonts.googleapis.com"><link rel="preconnect" href="https://fonts.gstatic.com" crossorigin><link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;700&display=swap" rel="stylesheet">
<link rel="stylesheet" href="assets/ds.css"><link rel="stylesheet" href="assets/guide.css">
<link rel="alternate" type="text/markdown" href="guide.md" title="Весь гайд одним Markdown-файлом для нейросетей"><link rel="alternate" type="application/json" href="spec.json">
<meta name="description" content="${esc(lead.replace(/<[^>]+>/g, ""))}"></head><body>
<div class="layout-container"><aside class="sidebar"><div class="sidebar-header"><a href="index.html" class="sidebar-logo" aria-label="На главную"><img src="assets/logo.svg" alt="Coral Club" width="128" height="22"></a></div><nav class="sticky-nav"><ul class="nav-list" data-astro-cid-pux6a34n>${sidebar(file)}</ul></nav></aside>
<main class="page-wrapper"><div class="content-sticky-header"><div class="header-inner"><nav class="lang-switch" aria-label="Язык"><a href="${file}" class="lang-link is-active" aria-current="true">RU</a></nav><nav class="guide-ai-links"><a href="guide.md">guide.md</a><a href="spec.json">spec.json</a><a href="llms.txt">llms.txt</a></nav></div><div class="header-divider"></div></div>
<div class="main-content-layout"><article><header class="main-header"><p class="hero page-title"> ${esc(title)} <span class="status-badge" data-status="${status}"> ${status} </span></p><div class="page-lead">${lead}</div></header>
<div class="content-grid">${content}</div>
<nav class="page-navigation">${prev ? `<a href="${prev[0]}" class="nav-card prev"><span class="nav-label-small">Назад</span><span class="nav-title">${esc(prev[1])}</span></a>` : "<span></span>"}${next ? `<a href="${next[0]}" class="nav-card next"><span class="nav-label-small">Далее</span><span class="nav-title">${esc(next[1])}</span></a>` : ""}</nav></article>
<aside class="toc-sidebar">${tocHtml}</aside></div>
<footer class="main-footer"><div class="footer-links"><span class="guide-foot">Coral Club · гайд по картинкам карточки товара · данные о продуктах — coralclub.ru</span></div></footer></main></div>
<script>
document.querySelectorAll(".tab-btn").forEach(b=>b.addEventListener("click",()=>{const t=b.dataset.tab;document.querySelectorAll(".tab-btn,.tab-pane,.toc-sticky").forEach(e=>e.classList.remove("active"));b.classList.add("active");document.getElementById("tab-"+t)?.classList.add("active");document.getElementById("toc-"+t)?.classList.add("active");scrollTo({top:0,behavior:"smooth"})}));
const openHash=()=>{const e=location.hash?document.getElementById(decodeURIComponent(location.hash.slice(1))):null;const p=e?.closest(".tab-pane");if(!e||!p||p.classList.contains("active"))return;document.querySelector('.tab-btn[data-tab="'+p.id.slice(4)+'"]')?.click();setTimeout(()=>e.scrollIntoView(),50)};openHash();addEventListener("hashchange",openHash);
document.querySelectorAll(".guide-copy").forEach(b=>b.addEventListener("click",async()=>{const t=b.closest(".guide-prompt").querySelector("code").innerText;try{await navigator.clipboard.writeText(t);b.textContent="Скопировано"}catch{b.textContent="Выделите и скопируйте"}setTimeout(()=>b.textContent="Скопировать",1600)}));
</script></body></html>`;
}

/* ---------- содержимое страниц ---------- */

const pages = [];
const add = (p) => pages.push(p);

const productLinks = PRODUCTS.map((p) => `<a href="${p.slug}.html">${esc(p.name)}</a>`).join(" · ");

add({
  file: "index.html",
  title: "Картинки карточки товара",
  lead: "Правила и промты для галереи карточки товара (PDP): пэкшоты, интерьер, claims, применение и состав. Гайд написан так, чтобы его можно было целиком отдать нейросети — она возьмёт правила, тексты и ссылки на референсы.",
  toc: [["how", "Как пользоваться"], ["gallery", "Состав галереи"], ["products", "Продукты"], ["ai", "Для нейросетей"]],
  body:
    section("how", "Как пользоваться", "", 1, true) +
    bullets([
      "Выберите продукт в разделе «Продукты»: там факты (дозировка, объём, размер, состав) и готовый промт для каждой карточки.",
      "Приложите к промту референсы из списка под ним — минимум фото продукта, интерьер и стакан-мерку.",
      "Генерируйте по одной карточке в чате. Карточки с большим количеством текста (состав) надёжнее собрать в Figma.",
      "Перед публикацией сверьте текст на картинке с гайдом: дозировка, цифры и единицы — только отсюда.",
    ]) +
    section("gallery", "Состав галереи") +
    table(["№", "Монопродукт", "Набор (пэк)"], [
      ["1", "Упаковка на сером фоне", "Коробка на сером фоне"],
      ["2", "Упаковка в интерьере и что внутри — объём покупки", "Коробка и всё, что внутри"],
      ["3", "Killer claims: предмет интерьера + способ употребления", "Killer claims набора"],
      ["4", "Как применять: сколько, по сколько, сколько раз в день", "Как принимать: распорядок по каждому продукту"],
      ["5", "Состав", "5–8: состав каждого продукта отдельно"],
    ], ["10%", "45%", "45%"]) +
    grid([photo(C.EXAMPLES["coral-mine"]["interior-volume"], "<strong>Монопродукт</strong><br>Корал-Майн Сильвер — пример карточки 2."), photo(C.EXAMPLES["hydramax-plus"]["interior-volume"], "<strong>Набор</strong><br>Гидрамакс Плюс — пример карточки 2.")]) +
    section("products", "Продукты") +
    `<p class="case-description">Монопродукты: ${PRODUCTS.filter((p) => p.type === "mono").map((p) => `<a href="${p.slug}.html">${esc(p.name)}</a>`).join(", ")}. Набор: <a href="hydramax-plus.html">Гидрамакс Плюс</a>.</p>` +
    section("ai", "Для нейросетей") +
    `<p class="case-description">Весь гайд одним файлом: <a href="guide.md">guide.md</a> (Markdown) и <a href="spec.json">spec.json</a> (данные и промты). Короткая инструкция — на странице <a href="ai.html">«Для нейросетей»</a>.</p>`,
});

add({
  file: "format.html",
  title: "Формат и размеры",
  lead: "Все картинки галереи — квадрат 1:1. Один формат на все карточки, чтобы галерея не прыгала на телефоне и на сайте.",
  toc: [["size", "Размер"], ["safe", "Поля и текст"], ["names", "Имена файлов"]],
  body:
    section("size", "Размер", "", 1, true) +
    table(["Параметр", "Значение"], [
      ["Пропорции", C.FORMAT.ratio],
      ["Исходник", C.FORMAT.master],
      ["Выгрузка на сайт", C.FORMAT.export],
      ["Фон пэкшота", `${C.COLORS.grey} — ровный светло-серый`],
      ["Фон текстовых карточек", `${C.COLORS.cream} — тёплый кремовый`],
      ["Цвет текста", C.COLORS.ink],
    ], ["35%", "65%"]) +
    note("Примеры в гайде сейчас 1304 × 1264 — почти квадрат. Новые карточки делаем строго 1:1, старые при выгрузке обрезаем до квадрата.", "warn") +
    section("safe", "Поля и текст") +
    bullets([`Безопасная зона: ${C.FORMAT.safe}.`, ...C.FORMAT.text]) +
    section("names", "Имена файлов") +
    `<p class="case-description">${esc(C.FORMAT.naming)}. Номер — позиция в галерее (01–05, для набора до 08).</p>`,
});

add({
  file: "style.html",
  title: "Стиль и свет",
  lead: "Тёплый солнечный минимализм: дерево, травертин, мрамор, жёсткий свет из окна с тенями от листьев. Продукт всегда точный — как на фото упаковки.",
  toc: [["look", "Как выглядит"], ["prompt", "Базовый промт"], ["lock", "Точность упаковки"], ["dont", "Чего не делаем"]],
  body:
    section("look", "Как выглядит", "", 1, true) +
    grid(C.INTERIORS.slice(0, 2).map((i) => photo(i.file, `<strong>${esc(i.title)}</strong><br>${esc(i.text)}`))) +
    section("prompt", "Базовый промт", "Вставляется в начало каждого промта сцены. В промтах на страницах продуктов он уже подставлен.") +
    promptBlock("Стиль", C.STYLE_PROMPT) +
    section("lock", "Точность упаковки", "Нейросеть перерисовывает этикетки. Поэтому в каждый промт добавляем фразу ниже и прикладываем настоящее фото упаковки.") +
    promptBlock("Точная упаковка", C.LOCK_PROMPT) +
    promptBlock("Масштаб", C.SCALE_PROMPT) +
    section("dont", "Чего не делаем") +
    bullets(["Не генерируем упаковку с нуля — только по фото.", "Не меняем и не переводим текст на этикетке.", "Не добавляем чужие логотипы, водяные знаки, случайные надписи.", "Не ставим продукт меньше или больше реального: рядом всегда стакан 9 см или рука.", "Не обещаем лечебный эффект в тексте карточки."]),
});

add({
  file: "scale.html",
  title: "Масштаб упаковок",
  lead: "По картинке должен быть понятен реальный размер упаковки. Нейросети не знают размеров, поэтому задаём их в промте и ставим в кадр предмет-мерку.",
  toc: [["lineup", "Линейка"], ["table", "Размеры"], ["anchor", "Предметы-мерки"]],
  body:
    section("lineup", "Линейка", "Официальное фото набора с подписанными размерами. Прикладывайте его к промту как референс масштаба.", 1, true) +
    grid([photo(C.SCALE_IMAGE, "Масштаб посчитан от тубы ПентоКан (Ø ≈ 3 см). Размеры приблизительные — сверьте линейкой перед финальной съёмкой.")], true) +
    section("table", "Размеры") +
    table(["Продукт", "Упаковка", "Единица внутри"], PRODUCTS.map((p) => [`<a href="${p.slug}.html">${esc(p.name)}</a>`, esc(p.size.split(";")[0]), esc(p.size.split(";")[1]?.trim() ?? "—")]), ["25%", "40%", "35%"]) +
    section("anchor", "Предметы-мерки") +
    table(["Предмет", "Размер", "Зачем"], C.PROPS.map((p) => [esc(p.title), esc(p.size), esc(p.text)]), ["25%", "30%", "45%"]),
});

const cardRulesPage = (file, title, lead, cards, examples) =>
  add({
    file,
    title,
    lead,
    toc: cards.map((c) => [c.id, `${c.n}. ${c.title}`]),
    body: cards
      .map((c, i) => section(c.id, `${c.n}. ${c.title}`, esc(c.goal), 1, i === 0) + cardBlock(examples[c.id], bullets(c.rules.map(esc))))
      .join(""),
  });

cardRulesPage("mono.html", "Монопродукт", "Пять карточек галереи одного продукта. Порядок постоянный — покупатель привыкает к нему от товара к товару.", C.MONO_CARDS, C.EXAMPLES["coral-mine"]);
cardRulesPage("pack.html", "Набор", "Набор — несколько продуктов в одной коробке. Главное — показать, что внутри и сколько, и как всё принимать в течение дня.", C.PACK_CARDS, C.EXAMPLES["hydramax-plus"]);

for (const p of PRODUCTS) {
  const cards = productCards(p);
  const facts = [
    ["Артикулы", p.codes],
    ["Форма", `${p.form}. ${p.formText}`],
    ["Упаковка", p.pack],
    ["Размер", p.size],
    ["Применение", p.dose.join(". ") + "."],
    ["На сколько хватит", p.days],
    ["Страна производства", p.origin],
    ["Срок годности", p.shelf],
  ];
  const spec =
    section(`facts-${p.slug}`, "Факты", "Источник — карточка товара на coralclub.ru. Тексты на картинках берём только отсюда.", 1, true) +
    table(["Параметр", "Значение"], facts.map(([a, b]) => [esc(a), esc(b)]), ["30%", "70%"]) +
    section(`rule-${p.slug}`, "Главное правило кадра") +
    note(esc(p.rule.ru), "warn") +
    (p.slug === "coral-mine" ? grid([photo("refs/forms/coral-mine-sachet-in-hand", "Саше целое и закрытое.", { label: "do" }), photo("examples/coral-mine/sachet-into-glass", "В воду опускают целиком.", { label: "do" }), photo("refs/forms/oceanmin-stick-pouring", "Так высыпается только Оушенмин. У Корал-Майн из саше ничего не сыплется.", { label: "dont", dont: true })]) : "") +
    section(`refs-${p.slug}`, "Фото продукта для референса") +
    refList(p.refs.map((f) => ({ url: img(f), what: f.split("/").pop() }))) +
    (p.composition ? section(`comp-${p.slug}`, "Состав", `Количество ${esc(p.composition.unit)}.`) + table(["Ингредиент", "Количество", ...(p.composition.rusp ? ["% РУСП*"] : [])], p.composition.rows.map((r) => [esc(r.name), esc(r.amount), ...(p.composition.rusp ? [esc(r.rusp)] : [])])) + (p.composition.notes.length ? bullets(p.composition.notes.map(esc)) : "") : "") +
    (p.contents ? section(`contents-${p.slug}`, "Что в наборе") + bullets(p.contents.map((s) => `<a href="${s}.html">${esc(bySlug(s).name)}</a>`)) + `<p class="case-description">${esc(p.pack)}</p>` : "") +
    (p.issues?.length ? section(`issues-${p.slug}`, "Что поправить в примерах") + grid(p.issues.map((i) => photo(i.file, esc(i.text), { label: "dont", dont: true }))) : "");
  const cardsHtml = cards
    .map((c, i) => {
      const id = `card-${String(c.n)}-${p.slug}`;
      const pr = c.prompts;
      return (
        section(id, `${c.n}. ${c.title}`, esc(c.goal), 1, i === 0) +
        cardBlock(
          c.example,
          bullets(c.rules.map(esc)) +
            (pr.text ? `<p class="case-description"><strong>Текст на карточке:</strong> ${esc(pr.text.title)} — ${pr.text.items.map(esc).join(" · ")}</p>` : "") +
            (pr.badge ? `<p class="case-description"><strong>Плашка (добавить в Figma):</strong> ${esc(pr.badge)}</p>` : ""),
        ) +
        promptBlock(pr.text ? "Промт с текстом" : "Промт", pr.main) +
        (pr.noText ? promptBlock("Промт без текста (текст — в Figma)", pr.noText) : "") +
        `<p class="case-description guide-refs-title">Приложить к промту:</p>` +
        refList(c.refs)
      );
    })
    .join("");
  add({
    file: `${p.slug}.html`,
    title: p.name,
    lead: `${p.type === "pack" ? "Набор" : "Монопродукт"} · ${esc(p.form.toLowerCase())} · ${esc(p.days)}. Факты, правило кадра и промты для каждой карточки галереи.`,
    tabs: [
      { id: "spec", label: "Спецификация", body: spec, toc: [[`facts-${p.slug}`, "Факты"], [`rule-${p.slug}`, "Главное правило кадра"], [`refs-${p.slug}`, "Фото продукта"], ...(p.composition ? [[`comp-${p.slug}`, "Состав"]] : []), ...(p.contents ? [[`contents-${p.slug}`, "Что в наборе"]] : []), ...(p.issues?.length ? [[`issues-${p.slug}`, "Что поправить"]] : [])] },
      { id: "cards", label: "Карточки и промты", body: cardsHtml, toc: cards.map((c) => [`card-${String(c.n)}-${p.slug}`, `${c.n}. ${c.title}`]) },
    ],
  });
}

add({
  file: "interiors.html",
  title: "Интерьеры",
  lead: "Сцены для карточек 2–4. Внутри одной галереи сцены не повторяются: у каждой карточки своя сцена или свой ракурс.",
  toc: C.INTERIORS.map((i) => [i.id, i.title]).concat([["map", "Какая сцена где"]]),
  body:
    C.INTERIORS.map((i, k) => section(i.id, i.title, esc(i.text), 1, k === 0) + grid([photo(i.file, `<code>${img(i.file)}</code>`)], true)).join("") +
    section("map", "Какая сцена где") +
    table(["Продукт", "2. Объём", "3. Claims", "4. Применение"], PRODUCTS.map((p) => [esc(p.name), esc(interior(p.cards.volume.scene).title), esc(interior(p.cards.claims.scene).title), esc(interior(p.cards.howto.scene).title)])),
});

add({
  file: "props.html",
  title: "Предметы интерьера",
  lead: "Отдельные предметы на чёрном фоне — чтобы нейросеть точно повторила их форму и фактуру. Предметы не перекрывают упаковку и не спорят с ней.",
  toc: C.PROPS.map((p) => [p.id, p.title]),
  body: C.PROPS.map((p, k) => section(p.id, p.title, `${esc(p.size)}. ${esc(p.text)}`, 1, k === 0) + grid([photo(p.file, `<code>${img(p.file)}</code>`)], true)).join(""),
});

add({
  file: "forms.html",
  title: "Формы продуктов",
  lead: "Как выглядит то, что внутри упаковки, и как это показывать. Ошибка в форме — самая заметная: саше, стик, таблетка и капсула ведут себя по-разному.",
  toc: [["sachet", "Саше — Корал-Майн"], ["stick", "Стик — Оушенмин"], ["tablet", "Шипучая таблетка — ПентоКан"], ["capsule", "Капсула — H-500"]],
  body:
    section("sachet", "Саше — Корал-Майн", esc(bySlug("coral-mine").rule.ru), 1, true) +
    grid([photo("refs/forms/coral-mine-sachet-in-hand", "Саше: закрытый пористый пакетик ≈ 2,5 × 9 см, внутри гранулы коралла.", { label: "do" }), photo("examples/coral-mine/sachet-into-glass", "Саше опускают в воду целиком, не вскрывая.", { label: "do" })]) +
    section("stick", "Стик — Оушенмин", esc(bySlug("oceanmin").rule.ru)) +
    grid([photo("refs/forms/oceanmin-stick", "Стик-пакет, 1 г порошка."), photo("refs/forms/oceanmin-stick-pouring", "Порошок высыпают в воду — это правильно для Оушенмина.", { label: "do" })]) +
    section("tablet", "Шипучая таблетка — ПентоКан", esc(bySlug("pentokan").rule.ru)) +
    grid([photo("refs/forms/pentokan-tube", "Туба на 20 таблеток ≈ Ø 3 × 14,5 см.")], true) +
    note("На сайте нет фото самой таблетки. Описание для нейросети: <em>one flat round white effervescent tablet about 2.5 cm across and 5 mm thick, dissolving with fine bubbles in about 60 ml of water</em>. Цвет и размер сверьте с реальной таблеткой — по сайту известен только вес 2,5 г.", "warn") +
    section("capsule", "Капсула — H-500", esc(bySlug("h-500").rule.ru)) +
    grid([photo("refs/forms/h500-bottle", "Банка на 60 капсул ≈ Ø 5 × 8,5 см.")], true) +
    note("На сайте нет фото капсулы. По составу это желатиновая капсула с 300 мг порошка, длина около 2 см. Цвет сверьте с реальной капсулой и допишите в промт.", "warn"),
});

const AGENT_PROMPT = `Ты делаешь картинки для галереи карточки товара Coral Club.
1. Прочитай гайд: ${BASE}guide.md (или данные ${BASE}spec.json).
2. Найди продукт и номер карточки. Возьми промт этой карточки целиком.
3. Скачай и приложи все референсы из списка «Приложить к промту» этой карточки: фото продукта, интерьер, стакан-мерку, линейку масштаба, пример карточки.
4. Упаковку не рисуй заново — бери её с фото продукта, этикетку не меняй.
5. Соблюдай реальный размер упаковки из гайда и главное правило кадра продукта.
6. Текст на карточке — только из гайда, на русском, без ошибок. Если не уверен в кириллице — сделай версию без текста.
7. Формат: квадрат 1:1, 2000 × 2000 px.`;

add({
  file: "ai.html",
  title: "Для нейросетей",
  lead: "Гайд читается машиной: один Markdown-файл, JSON с данными и промтами, прямые ссылки на все картинки. Отправьте нейросети ссылку и задачу.",
  toc: [["files", "Файлы"], ["task", "Как поставить задачу"], ["example", "Пример запроса"]],
  body:
    section("files", "Файлы", "", 1, true) +
    table(["Файл", "Что внутри"], [
      [`<a href="llms.txt">llms.txt</a>`, "Короткое описание гайда и ссылки — стандарт для ИИ-агентов."],
      [`<a href="guide.md">guide.md</a>`, "Весь гайд одним Markdown-файлом: правила, факты, промты, ссылки на референсы."],
      [`<a href="spec.json">spec.json</a>`, "То же в JSON: продукты, карточки, готовые промты, URL референсов."],
      [`<code>img/…</code>`, "Все картинки по прямым ссылкам, имена латиницей."],
    ], ["25%", "75%"]) +
    section("task", "Как поставить задачу", "Вставьте текст ниже в начало чата с нейросетью, которая умеет читать ссылки (ChatGPT, Claude и др.). Если она не открывает ссылки — скопируйте промт со страницы продукта и приложите картинки вручную.") +
    promptBlock("Инструкция для нейросети", AGENT_PROMPT) +
    section("example", "Пример запроса") +
    promptBlock("Запрос", `${AGENT_PROMPT}\n\nЗадача: сделай карточку 2 «Упаковка в интерьере и что внутри» для продукта «Оушенмин».`),
});

/* ---------- machine-readable ---------- */

const spec = {
  title: "Coral Club — гайд по картинкам галереи карточки товара (PDP)",
  base: BASE,
  updated: new Date().toISOString().slice(0, 10),
  format: C.FORMAT,
  colors: C.COLORS,
  prompts: { style: C.STYLE_PROMPT, product_lock: C.LOCK_PROMPT, scale: C.SCALE_PROMPT, text_rule: C.TEXT_RULE, agent: AGENT_PROMPT },
  scale_reference: img(C.SCALE_IMAGE),
  interiors: C.INTERIORS.map((i) => ({ id: i.id, title: i.title, use: i.text, description_en: i.en, url: img(i.file) })),
  props: C.PROPS.map((p) => ({ id: p.id, title: p.title, size: p.size, use: p.text, url: img(p.file) })),
  card_templates: { mono: C.MONO_CARDS, pack: C.PACK_CARDS },
  products: PRODUCTS.map((p) => ({
    slug: p.slug,
    type: p.type,
    name: p.name,
    name_en: p.en,
    page: `${BASE}${p.slug}.html`,
    codes: p.codes,
    form: p.form,
    form_description: p.formText,
    pack: p.pack,
    size: p.size,
    size_en: p.sizeEn,
    dose: p.dose,
    lasts: p.days,
    origin: p.origin,
    shelf_life: p.shelf,
    composition: p.composition ?? null,
    contents: p.contents ?? null,
    frame_rule: p.rule,
    product_photos: p.refs.map(img),
    known_issues: (p.issues ?? []).map((i) => ({ image: img(i.file), text: i.text })),
    cards: productCards(p).map((c) => ({
      n: c.n,
      id: c.id,
      title: c.title,
      goal: c.goal,
      rules: c.rules,
      prompt: c.prompts.main,
      prompt_no_text: c.prompts.noText ?? null,
      text_on_card: c.prompts.text ?? c.prompts.table ?? null,
      badge: c.prompts.badge ?? null,
      attach: c.refs,
      example: c.example ? img(c.example) : null,
    })),
  })),
};

const md = [];
md.push(`# ${spec.title}`, "", `Сайт: ${BASE} · данные: ${BASE}spec.json · обновлено ${spec.updated}`, "", "Гайд для людей и нейросетей. Факты о продуктах — с coralclub.ru. Размеры упаковок со знаком ≈ — оценка по пропорциям официального фото.", "");
md.push("## Как сделать картинку", "", AGENT_PROMPT, "");
md.push("## Формат", "", `- Пропорции: ${C.FORMAT.ratio}; исходник ${C.FORMAT.master}; выгрузка ${C.FORMAT.export}.`, `- Безопасная зона: ${C.FORMAT.safe}.`, `- Цвета: фон пэкшота ${C.COLORS.grey}, фон текстовых карточек ${C.COLORS.cream}, текст ${C.COLORS.ink}.`, ...C.FORMAT.text.map((t) => `- ${t}`), `- Имена файлов: ${C.FORMAT.naming}.`, "");
md.push("## Базовые промты", "", "Стиль:", "```", C.STYLE_PROMPT, "```", "Точная упаковка:", "```", C.LOCK_PROMPT, "```", "Масштаб:", "```", C.SCALE_PROMPT, "```", "");
md.push("## Масштаб упаковок", "", `Референс: ${img(C.SCALE_IMAGE)}`, "", "| Продукт | Размер |", "|---|---|", ...PRODUCTS.map((p) => `| ${p.name} | ${p.size} |`), "", "Предметы-мерки:", ...C.PROPS.map((p) => `- ${p.title}: ${p.size}. ${p.text} ${img(p.file)}`), "");
const mdCards = (title, cards) => [`## ${title}`, "", ...cards.flatMap((c) => [`### ${c.n}. ${c.title}`, c.goal, ...c.rules.map((r) => `- ${r}`), ""])];
md.push(...mdCards("Карточки монопродукта", C.MONO_CARDS), ...mdCards("Карточки набора", C.PACK_CARDS));
md.push("## Интерьеры", "", ...C.INTERIORS.map((i) => `- **${i.title}** (${i.id}) — ${i.text} ${img(i.file)}`), "");
for (const p of spec.products) {
  md.push(`## Продукт: ${p.name} (${p.name_en})`, "", `Страница: ${p.page}`, "");
  md.push(`- Тип: ${p.type === "pack" ? "набор" : "монопродукт"}`, `- Артикулы: ${p.codes}`, `- Форма: ${p.form}. ${p.form_description}`, `- Упаковка: ${p.pack}`, `- Размер: ${p.size}`, `- Применение: ${p.dose.join("; ")}`, `- На сколько хватит: ${p.lasts}`, `- Страна: ${p.origin}; срок годности: ${p.shelf_life}`, "");
  md.push(`**Главное правило кадра:** ${p.frame_rule.ru}`, "", "Фото продукта:", ...p.product_photos.map((u) => `- ${u}`), "");
  if (p.composition) md.push(`Состав (${p.composition.unit}):`, "", `| Ингредиент | Количество |${p.composition.rusp ? " % РУСП* |" : ""}`, `|---|---|${p.composition.rusp ? "---|" : ""}`, ...p.composition.rows.map((r) => `| ${r.name} | ${r.amount} |${p.composition.rusp ? ` ${r.rusp} |` : ""}`), "", ...p.composition.notes.map((n) => `- ${n}`), "");
  if (p.known_issues.length) md.push("Что поправить в текущих примерах:", ...p.known_issues.map((i) => `- ${i.text} (${i.image})`), "");
  for (const c of p.cards) {
    md.push(`### ${p.name} — карточка ${c.n}. ${c.title}`, "", c.goal, "");
    if (c.badge) md.push(`Плашка (добавить в Figma): ${c.badge}`, "");
    md.push("Промт:", "```", c.prompt, "```");
    if (c.prompt_no_text) md.push("Промт без текста:", "```", c.prompt_no_text, "```");
    md.push("Приложить:", ...c.attach.map((r) => `- ${r.url} — ${r.what}`), "");
  }
}

const llms = `# Coral Club — гайд по картинкам галереи карточки товара (PDP)

> Правила, факты о продуктах и готовые промты для генерации картинок галереи карточки товара Coral Club: пэкшот на сером фоне, упаковка в интерьере с содержимым (объём), killer claims, как применять, состав. Монопродукты и наборы. Все референсы — по прямым ссылкам.

## Документы
- [Весь гайд (Markdown)](${BASE}guide.md): правила, факты, промты и ссылки на референсы одним файлом
- [Данные и промты (JSON)](${BASE}spec.json): то же в структуре — products[].cards[].prompt и attach[]

## Продукты
${PRODUCTS.map((p) => `- [${p.name}](${BASE}${p.slug}.html): ${p.type === "pack" ? "набор" : "монопродукт"}, ${p.form.toLowerCase()}`).join("\n")}

## Референсы
- [Интерьеры](${BASE}interiors.html)
- [Предметы интерьера](${BASE}props.html)
- [Формы продуктов](${BASE}forms.html)
- [Масштаб упаковок](${BASE}scale.html)
`;

/* ---------- запись ---------- */
mkdirSync(OUT, { recursive: true });
for (const p of pages) writeFileSync(join(OUT, p.file), page(p));
writeFileSync(join(OUT, "spec.json"), JSON.stringify(spec, null, 2));
writeFileSync(join(OUT, "guide.md"), md.join("\n"));
writeFileSync(join(OUT, "llms.txt"), llms);
console.log(`pdp-guide: ${pages.length} pages, guide.md, spec.json, llms.txt → ${OUT}`);
