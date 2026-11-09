/**
 * Тексты главной кабинета (участник, русский): та же структура, что у главной витрины (content/home.tsx), —
 * герой и заголовок карусели каждой фазы, статьи, научный совет, ролики. Картинки, ролики и состав научного совета
 * берутся с витрины. Товары — из разделов каталога API (lib/lk/domains.ts).
 */
import { HOME_CONTENT, type AdvisoryBoardItem, type EditorialItem } from "./home";

type Title = { lead: string | string[]; accent: string };
export type LkPhaseContent = {
  name: string;
  hero: { title: Title; body: string[]; cta: { label: string; href: string } };
  headline: { lead: string; accent: string };
  editorials: { title: { lead: string; accent: string }; badge: string; body: string[]; image: EditorialItem["image"] }[];
  advisory: boolean;
  reels: { title: { lead: string; accent: string }; body: string };
};

const sectionsOf = (id: keyof typeof HOME_CONTENT) => HOME_CONTENT[id].sections;
const editorial = (id: keyof typeof HOME_CONTENT, n: number) => sectionsOf(id).filter((s): s is EditorialItem => s.kind === "editorial")[n];
export const LK_ADVISORS = (sectionsOf("hydration").find((s) => s.kind === "advisory-board") as AdvisoryBoardItem | undefined)?.members ?? [];
export const LK_REELS = HOME_CONTENT.hydration.reels.reels;
export const lkHeroImage = (id: keyof typeof HOME_CONTENT) => HOME_CONTENT[id].hero.image;

export const LK_HOME: Record<"hydration" | "restart" | "personalization", LkPhaseContent> = {
  hydration: {
    name: "Гидратация",
    hero: { title: { lead: "Утро начинается", accent: "с воды" }, body: ["Гидратация — первый шаг программы Coral Club: на нём строится всё остальное."], cta: { label: "Выбрать набор", href: "#phases" } },
    headline: { lead: "Вода сама не увлажняет.", accent: "Увлажняют минералы." },
    editorials: [
      {
        title: { lead: "Вы на 90% состоите из воды.", accent: "От неё зависит всё остальное." },
        badge: "90% воды",
        body: [
          "Большинство добавок пропускают первый шаг — воду, которую вы пьёте каждый день.",
          "Можно принимать лучшие добавки, но при обезвоживании организм их просто не усваивает. Поэтому Coral Club начинает с главного: с воды, которую вы пьёте ежедневно. Всё остальное строится на этом.",
        ],
        image: editorial("hydration", 0)?.image,
      },
      {
        title: { lead: "Минералы с японских островов,", accent: "где живут до 100 лет" },
        badge: "🇯🇵 Окинава, Япония",
        body: ["У берегов Окинавы, одной из пяти «голубых зон» планеты, лежит ископаемый коралл Санго — природный источник кальция, магния и более 70 микроэлементов."],
        image: editorial("hydration", 1)?.image,
      },
    ],
    advisory: true,
    reels: { title: { lead: "Доказательство не на этикетке.", accent: "Оно в сообществе." }, body: "Настоящие участники и их привычки. Чаще всего в Coral Club приходят потому, что раньше пришёл тот, кому они доверяют." },
  },
  restart: {
    name: "Перезагрузка",
    hero: { title: { lead: "Выйти лёгкой,", accent: "спокойной, ясной" }, body: ["Внутренняя нагрузка снижается в три шага примерно за три месяца."], cta: { label: "Начать перезагрузку", href: "#phases" } },
    headline: { lead: "Сила воли не перезагружает организм.", accent: "Это делает последовательность шагов." },
    editorials: [
      {
        title: { lead: "Детокс — это рывок.", accent: "Перезагрузка — это последовательность." },
        badge: "3 месяца · 3 шага",
        body: [
          "Большинство очищений — несколько дней усилий и возврат туда, откуда начали.",
          "Перезагрузка устроена иначе: шаги идут всё глубже, и у организма есть время привыкнуть, прежде чем следующий шаг попросит больше. Каждый шаг опирается на предыдущий — ровный прогресс вместо одной тяжёлой недели, которая быстро забывается.",
        ],
        image: editorial("restart", 0)?.image,
      },
      {
        title: { lead: "Организм восстанавливается", accent: "слоями." },
        badge: "Слой за слоем",
        body: ["Сначала вода. Затем снижается внутренняя нагрузка. И только потом — точечная, личная работа.", "Перезагрузка — средний слой, и привычка гидратации из первой фазы всё это время продолжает работать."],
        image: editorial("restart", 1)?.image,
      },
    ],
    advisory: false,
    reels: { title: { lead: "Доказательство не на этикетке.", accent: "Оно в перезагрузке." }, body: "Участники о том, какой была перезагрузка на самом деле: мягкое начало, середина, финиш." },
  },
  personalization: {
    name: "Персонализация",
    hero: { title: { lead: ["Поймите себя.", "Выберите путь."], accent: "Почувствуйте себя лучше." }, body: ["Гидратация и перезагрузка позади — выберите направление здоровья и соберите свой маршрут."], cta: { label: "Найти мой маршрут", href: "#phases" } },
    headline: { lead: "Общее питание не подходит всем.", accent: "Подходит план под вашу цель." },
    editorials: [],
    advisory: false,
    reels: { title: { lead: "Доказательство не на этикетке.", accent: "Оно в сообществе." }, body: "Настоящие участники и их привычки. Чаще всего в Coral Club приходят потому, что раньше пришёл тот, кому они доверяют." },
  },
};
