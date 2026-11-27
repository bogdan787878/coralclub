import assert from "node:assert/strict";
import { createSearch, fixLayout, stem, type SearchDoc } from "../src/index";

const docs: SearchDoc[] = [
  { id: "2141", title: "ПентоКан", aliases: ["PentoKan"], codes: ["2141"], ingredients: ["Калий", "Витамин C", "Инулин", "D-рибоза"], domains: ["energy", "heart_cardiovascular"], phases: ["hydration"], feats: ["Без сои", "Для вегетарианцев"], forms: ["Таблетки"], text: "Помогает быстро восстанавливать энергетические ресурсы организма." },
  { id: "2200", title: "Корал-Майн Сильвер", aliases: ["Coral-Mine Silver"], codes: ["2200", "2201"], ingredients: ["Кальций", "Магний", "Серебро"], phases: ["hydration"], feats: [], forms: ["Саше и стики"], text: "Минерализация воды кораллом из Японии." },
  { id: "91881", title: "Корал Магний", aliases: ["Coral Magnesium"], codes: ["91881"], ingredients: ["Магний", "Витамин B6"], domains: ["sleep_stress", "energy"], feats: ["Без глютена"], forms: ["Капсулы"], text: "Поддержка нервной системы и спокойного сна." },
  { id: "91803", title: "ФлексиКор", aliases: ["FlexiCor"], codes: ["91803"], ingredients: ["Глюкозамин", "Хондроитин"], domains: ["bones_joints"], feats: ["Без сои"], forms: ["Капсулы"], text: "Для здоровья суставов и связок." },
  { id: "918141", title: "Би-Лурон", aliases: ["B-Luron"], codes: ["918141"], ingredients: ["Гиалуроновая кислота"], domains: ["bones_joints"], feats: [], forms: ["Капсулы"], text: "Гиалуроновая кислота для суставов." },
  { id: "2260", title: "Промарин Пептиды Коллагена", aliases: ["Promarine Collagen"], codes: ["2260"], ingredients: ["Коллаген", "Витамин C"], domains: ["skin_hair_nails"], feats: [], forms: ["Жидкость"], text: "Коллаген для кожи, волос и ногтей." },
];
const { search } = createSearch(docs);
const ids = (q: string) => search(q).ids;

// морфология
assert.equal(stem("суставов"), stem("суставы"));
assert.equal(stem("бессонницей"), stem("бессонница"));
// совпадение по названию и началу слова
assert.equal(ids("пентокан")[0], "2141");
assert.equal(ids("пенто")[0], "2141");
assert.equal(ids("Коралл майн")[0], "2200");
// название через дефис — и слитно, и раздельно, и по началу
assert.equal(ids("билурон")[0], "918141");
assert.equal(ids("би-лурон")[0], "918141");
assert.equal(ids("би лурон")[0], "918141");
assert.equal(ids("билур")[0], "918141");
assert.equal(ids("bluron")[0], "918141");
assert.equal(ids("коралмайн")[0], "2200");
// артикул и фасовка
assert.equal(ids("2201")[0], "2200");
// латиница и раскладка
assert.equal(ids("pentokan")[0], "2141");
assert.equal(fixLayout("gtynjrfy"), "пентокан");
assert.equal(ids("gtynjrfy")[0], "2141");
assert.equal(search("gtynjrfy").understood, "пентокан");
// опечатка
assert.equal(ids("пентакан")[0], "2141");
assert.equal(ids("колаген")[0], "2260");
// состав
assert.ok(ids("магний").includes("91881"));
assert.ok(ids("магний").includes("2200"));
// интент: намерение без названий
assert.deepEqual(search("плохо сплю").intents.map((i) => i.id), ["sleep"]);
assert.equal(ids("плохо сплю")[0], "91881");
assert.ok(ids("для суставов").slice(0, 2).includes("91803"));
assert.ok(ids("устаю").includes("2141"));
// интент-фильтр: особенности и формы
assert.deepEqual(ids("без глютена"), ["91881"]);
assert.deepEqual(new Set(ids("капсулы")), new Set(["91881", "91803", "918141"]));
assert.deepEqual(ids("магний в капсулах"), ["91881"]);
// стоп-слова БАД: болезнь — товаров нет
for (const q of ["рак", "от рака", "лечение онкологии", "диабет", "инсульт", "онкалогия"]) {
  const r = search(q);
  assert.equal(r.status, "blocked", q);
  assert.equal(r.ids.length, 0, q);
  assert.ok(r.notice, q);
}
// лечение — предупреждение, выдача по остальным словам
const t = search("лекарство от усталости");
assert.equal(t.status, "ok");
assert.ok(t.notice);
assert.ok(t.ids.includes("2141"));
// служебные слова не мешают
assert.equal(ids("купить пентокан")[0], "2141");
// пустой
assert.equal(search("   ").status, "empty");

console.log("search: все проверки прошли");
