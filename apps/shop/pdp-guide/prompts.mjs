/** Промты и референсы карточек — общие для сайта (build.mjs), guide.md и spec.json. */
import * as C from "./content.mjs";
const { img, bySlug, BASE } = C;
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


const AGENT_PROMPT = `Ты делаешь картинки для галереи карточки товара Coral Club.
1. Прочитай гайд: ${BASE}guide.md (или данные ${BASE}spec.json).
2. Найди продукт и номер карточки. Возьми промт этой карточки целиком.
3. Скачай и приложи все референсы из списка «Приложить к промту» этой карточки: фото продукта, интерьер, стакан-мерку, линейку масштаба, пример карточки.
4. Упаковку не рисуй заново — бери её с фото продукта, этикетку не меняй.
5. Соблюдай реальный размер упаковки из гайда и главное правило кадра продукта.
6. Текст на карточке — только из гайда, на русском, без ошибок. Если не уверен в кириллице — сделай версию без текста.
7. Формат: квадрат 1:1, 2000 × 2000 px.`;


export { esc, interior, cardPrompts, cardRefs, productCards, AGENT_PROMPT };
