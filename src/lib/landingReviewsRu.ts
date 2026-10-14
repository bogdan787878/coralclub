import type { BeautySlug } from "./landingCatalogRu";

/**
 * Customer reviews from Отзовик (otzovik.com), shown on the landing and on
 * the matching product page. Text, "Достоинства" and "Недостатки" are taken
 * as they appear on the review list — nothing is edited. Texts end with
 * "..." because that is how the list shows them; each review links to the
 * full text at the source. Photos are the ones attached to the reviews.
 */
export type LandingReview = {
  id: string;
  product: BeautySlug;
  author: string;
  /** As on the source site, e.g. "22 авг 2026". */
  date: string;
  rating: number;
  title: string;
  text: string;
  plus?: string;
  minus?: string;
  /** Paths under /public. */
  photos: string[];
  url: string;
};

export type ReviewSummary = {
  rating: number;
  count: number;
  /** The product's review page on Отзовик. */
  url: string;
};

export const REVIEW_SUMMARY: Partial<Record<BeautySlug, ReviewSummary>> = {
  "hydramax-plus": {
    rating: 5.0,
    count: 5,
    url: "https://otzovik.com/reviews/bad_coral_club_gidramaks_plyus/",
  },
  hydramax: {
    rating: 5.0,
    count: 2,
    url: "https://otzovik.com/reviews/bad_coral_club_gidramaks/",
  },
  "promarine-collagen-tripeptides-pack": {
    rating: 5.0,
    count: 9,
    url: "https://otzovik.com/reviews/kollagen_promarin_tripiptidi_coral_club/",
  },
  "advanced-collagen-biocellulose-facial-mask": {
    rating: 5.0,
    count: 1,
    url: "https://otzovik.com/reviews/maska_dlya_lica_biocellyuloznaya_coral_club_advanced_collagen/",
  },
  "skin-harmony-biocellulose-facial-mask": {
    rating: 5.0,
    count: 1,
    url: "https://otzovik.com/reviews/maska_dlya_lica_biocellyuloznaya_coral_club_skin_harmony/",
  },
};

export const LANDING_REVIEWS_RU: LandingReview[] = [
  {
    id: "18614421",
    product: "hydramax-plus",
    author: "Катя Буровец",
    date: "22 авг 2026",
    rating: 5,
    title:
      "Решила купить этот напиток потому, что постоянно забываю пить воду.",
    text: "На работе целый день за ноутбуком, а вода стоит рядом и так и остаётся нетронутой. Подруга, которая всегда носит бутылку с собой, сказала, что ей помогают такие добавки, просто интереснее пить. Взяла попробовать, чтобы хотя...",
    plus: "Высокое качество продукта, помогло решить проблему с водой",
    minus: "Нет разных дозировок",
    photos: [],
    url: "https://otzovik.com/review_18614421.html",
  },
  {
    id: "18300080",
    product: "hydramax-plus",
    author: "Simonova Katya",
    date: "24 апр 2026",
    rating: 5,
    title: "Немного про Гидромакс",
    text: "Сначала хочу рассказать, что такое Гидрамакс Плюс. Это расширенная версия программы Гидрамакс. Классический курс дополняется Ошенмином и Корал Майном, что делает этот курс хорошим решениям, чтобы поддержать водный баланс. И больше всего мне понравилось, что...",
    plus: "Если соблюдать все рекомендации, то результат супер",
    minus: "Без скидки- дороговато",
    photos: [],
    url: "https://otzovik.com/review_18300080.html",
  },
  {
    id: "18034340",
    product: "hydramax-plus",
    author: "Ангелина Фомин",
    date: "18 янв 2026",
    rating: 5,
    title: "HydraMax Plus Бад от кораллового клуба",
    text: "Я давно замечала, что в течение дня почти не пью чистую воду, в основном ограничиваясь чаем и кофе. В какой-то момент усталость стала накапливаться, и коллега посоветовала попробовать HydraMax Plus, чтобы наладить питьевой режим. Я...",
    plus: "Продукт действительно помогает сформировать привычку пить воду, не вызывает неприятных ощущений и легко используется в течение дня",
    minus:
      "пакетики не всегда удобно носить с собой в небольшой сумке, особенно если день проходит активно.",
    photos: [],
    url: "https://otzovik.com/review_18034340.html",
  },
  {
    id: "18010365",
    product: "hydramax-plus",
    author: "Зуянова Лиза",
    date: "10 янв 2026",
    rating: 5,
    title: "Я редко пью воду, и это всегда отражалось на коже.",
    text: "Подруга посоветовала попробовать «Гидрамакс Плюс», сказала, что он помогает поддерживать водный баланс. Решила взять для простоты, думала, хуже точно не будет. Добавляла в воду каждое утро. На вкус лёгкий, без навязчивого аромата. Через пару недель...",
    plus: "Удобно брать с собой на работу.",
    minus:
      "Минус - хотелось бы, чтобы упаковка была больше, быстро заканчивается.",
    photos: [],
    url: "https://otzovik.com/review_18010365.html",
  },
  {
    id: "17720012",
    product: "hydramax-plus",
    author: "Veresova Nat",
    date: "29 сен 2025",
    rating: 5,
    title: "Замечательный набор",
    text: "Думаю, что многие уже слышали, что кофе, чай и впрочем напитки на самом деле на клеточном уровне обезвоживают организм. Как правило рекомендуют пить просто чистую питьевую воду. Но, к сожалению, минеральный состав воды из фильтра...",
    plus: "в составе очень много нужных организму минералов",
    minus: "Минусов не было",
    photos: [],
    url: "https://otzovik.com/review_17720012.html",
  },
  {
    id: "17036814",
    product: "hydramax",
    author: "Малеева Анна",
    date: "10 фев 2025",
    rating: 5,
    title: "Привет, друзья) Делюсь находкой",
    text: 'Хочу рассказать, как я решила не просто хлестать воду для водного баланса, а сделать это с пользой для организма. Нашла набор Гидрамакс на сайте Coral Club`a, так как ранее слышала о полезной коралловой воде от этого бренда, а тут целый комплекс попался, в том числе с саше Coral-mine. Так вот, когда я взглянул на этот набор, подумал: "Почему бы...',
    plus: "Вода вкусная стала. БАД качественный",
    minus: "Нет претензий и вопросов. Качественный БАД",
    photos: [],
    url: "https://otzovik.com/review_17036814.html",
  },
  {
    id: "16445064",
    product: "hydramax",
    author: "viktoria Ivnova",
    date: "19 авг 2024",
    rating: 5,
    title: "Кальций, магний и другие макроэлементы для лучшего самочувствия",
    text: "Всю жизнь я пила мало воды и практически никогда не ощущала чувство жажды, за целый день могла не сделать ни одного глотка воды. Меня это никогда особо не беспокоило, но после 30 лет... я начала замечать, что кожа стала хуже, стал беспокоить обмен веществ, стала какой то слабой, совсем не выдерживаю физические нагрузки. Решила разобраться в вопросе и практически...",
    plus: "в наборе хорошие продукты, вкусно и полезно",
    minus: "стоят прилично",
    photos: ["/images/reviews/16445064-1.webp"],
    url: "https://otzovik.com/review_16445064.html",
  },
  {
    id: "18702897",
    product: "promarine-collagen-tripeptides-pack",
    author: "Maria Arhipova",
    date: "1 окт 2026",
    rating: 5,
    title: "Брала ради ногтей, а больше заметила по коже",
    text: "Вообще коллаген я заказала из-за ногтей. Они у меня постоянно расслаиваются по краям, особенно если несколько недель подряд делаю покрытие. На волосы я особо не жалуюсь, а каких-то серьёзных возрастных изменений кожи у меня пока...",
    plus: "готовые порции, нет рыбного привкуса, кожа стала меньше сохнуть, ногти перестали слоиться",
    minus: "цена особенно чувствуется при длинном курсе",
    photos: ["/images/reviews/18702897-1.webp"],
    url: "https://otzovik.com/review_18702897.html",
  },
  {
    id: "18297675",
    product: "promarine-collagen-tripeptides-pack",
    author: "Волкова Карина",
    date: "23 апр 2026",
    rating: 5,
    title: "Заинтересовал меня промарин трипиптиды коллаген от корал клуба",
    text: "Понравилась форма приема, плюс в том, что не нужно ничего разводить или запивать горстью капсул, просто отмерил и выпил. Пила обычно утром каждый день, примерно месяц с небольшим, старалась не пропускать. Первое, что заметила спустя...",
    plus: "Удобная фома приема",
    minus: "Цена",
    photos: ["/images/reviews/18297675-1.webp"],
    url: "https://otzovik.com/review_18297675.html",
  },
  {
    id: "18036108",
    product: "promarine-collagen-tripeptides-pack",
    author: "flowerLud",
    date: "19 янв 2026",
    rating: 5,
    title: "Хороший результат",
    text: "В какой-то момент решила вернуться к теме коллагена, но уже более осознанно. Раньше пробовала порошки, и там все время было то лень размешивать, то вкус откровенно не очень. Тут выбрала Промарин трипептиды Коллаген, как раз...",
    plus: "жидкий формат, удобно принимать, трипептиды, хорошая усваиваемость, не надо смешивать и “уговаривать себя”.",
    minus:
      "если пропускать приём, результат ощущается слабее, и нужно настроиться на накопительный результат",
    photos: ["/images/reviews/18036108-1.webp"],
    url: "https://otzovik.com/review_18036108.html",
  },
  {
    id: "17711959",
    product: "promarine-collagen-tripeptides-pack",
    author: "Наталья Строган",
    date: "26 сен 2025",
    rating: 5,
    title: "Хорошие результаты",
    text: "Года три назад впервые стала принимать коллаген, чтобы кожа была более потянутая. Каких только я не перепробовала. И порошком, и жидкие, и говяжие, и морской. По сути все эти 3 года я подбирала по-настоящему хороший...",
    plus: "хорошие результаты, вкус приятный",
    minus: "нет",
    photos: ["/images/reviews/17711959-1.webp"],
    url: "https://otzovik.com/review_17711959.html",
  },
  {
    id: "18240142",
    product: "promarine-collagen-tripeptides-pack",
    author: "Кристи Жукова",
    date: "31 мар 2026",
    rating: 5,
    title: "Мои любимые позиции в корал клабе",
    text: "О коллагене я задумалась, когда заметила, что кожа после зимы стала более сухой, а ногти начали слоиться. А омегу решила добавить чуть позже, потому что хотелось усилить эффект и заодно поддержать волосы, которые выглядели тусклыми...",
    plus: "нейтральный вкус коллагена, удобные капсулы омеги, заметное улучшение кожи, волос и ногтей, плюс дополнительная энергия",
    minus:
      "результат требует регулярности и терпения, обе упаковки заканчиваются быстрее, чем хотелось бы, если не следить за запасом",
    photos: [
      "/images/reviews/18240142-1.webp",
      "/images/reviews/18240142-2.webp",
    ],
    url: "https://otzovik.com/review_18240142.html",
  },
  {
    id: "18111487",
    product: "promarine-collagen-tripeptides-pack",
    author: "ОксаСыркова",
    date: "12 фев 2026",
    rating: 5,
    title:
      "Долго сомневалась насчет коллагена, но решила попробовать именно этот",
    text: "Я долго сомневалась насчет коллагена, но решила попробовать именно Promarine, потому что у него формат приема не обычного коллагена, а пептидов. Как я поняла, это более мелкие частицы белка. Плюс понравилось, что он жидкий...",
    plus: "Меньше сухости стало, кожа более подтянутая",
    minus: "Я не нашла",
    photos: ["/images/reviews/18111487-1.webp"],
    url: "https://otzovik.com/review_18111487.html",
  },
  {
    id: "18684969",
    product: "promarine-collagen-tripeptides-pack",
    author: "Мария Услова",
    date: "23 сен 2026",
    rating: 5,
    title: "Приобрела Промарин в Коралл клаб, осталась довольна БАДом",
    text: "После утренней йоги в парке рядом с офисом кораллового клуба зашла на их небольшое мероприятие случайно, увидела Промарин с коллагеном на стенде среди продуктов для кожи и суставов. Суставы в коленях побаливали после родов и...",
    plus: "Заметно помогает суставам при движении, делает кожу мягче и эластичнее, коллаген кажется качественным и усваивается, вкус порошка вполне ок без химии.",
    minus:
      "Разводить каждый раз хлопотно пару минут, а также прием требует регулярности минимум месяц",
    photos: [],
    url: "https://otzovik.com/review_18684969.html",
  },
  {
    id: "17903913",
    product: "promarine-collagen-tripeptides-pack",
    author: "Агранова90",
    date: "3 дек 2025",
    rating: 5,
    title: "В общем, я очень довольна",
    text: "Про промарин коллаген узнала у нутрициолога, которая сказала, что после 25 лет организм делаем все меньше и меньше коллагена сам, и что промарин коллаген поможет коже выглядеть более живой и красивой. Мне 32 и я...",
    plus: "Результат",
    minus: "Не нашла",
    photos: [],
    url: "https://otzovik.com/review_17903913.html",
  },
  {
    id: "18493272",
    product: "promarine-collagen-tripeptides-pack",
    author: "Бурая Саша",
    date: "8 июл 2026",
    rating: 5,
    title: "Открыла для себя БАДы, попробовала Промарин",
    text: "Колени начали поскрипывать каждый раз, когда сажусь на корточки за ребенком или поднимаюсь по лестнице с сумками из магазина, особенно после родов, когда набрала пару лишних кило и начала осторожно бегать по утрам для формы...",
    plus: "Суставы перестают скрипеть при нагрузках, кожа напитывается и уплотняется, порошок мешается без усилий в любом напитке, эффект нарастает плавно и держится.",
    minus:
      "Каждый раз нужно шейкер или венчик для разведения, вкус сам по себе слабоват, лучше с фруктами.",
    photos: [],
    url: "https://otzovik.com/review_18493272.html",
  },
  {
    id: "16790366",
    product: "advanced-collagen-biocellulose-facial-mask",
    author: "Svetlana2410",
    date: "30 ноя 2024",
    rating: 5,
    title: "Самые новые технологии по уходу за лицом, в составе коллаген",
    text: "После открытия предпродажи новых биоцеллюлозных масок для лица от компании CORALCLUB я решила сразу заказать себе один комплект. Всего в продаже три вида масок с разным назначением. В одной упаковке 5 масок, как раз на курсовое применение. Основа маски состоит из биоцеллюлозы. Такая основа хорошо проводит питательный состав в кожу. Она биоразлагаемая. Маска хорошо прилегает и равномерно распределяется по...",
    plus: "Легкая основа, состав, приятные ощущения",
    minus: "Цена без скидки",
    photos: [
      "/images/reviews/16790366-1.webp",
      "/images/reviews/16790366-2.webp",
      "/images/reviews/16790366-3.webp",
      "/images/reviews/16790366-4.webp",
    ],
    url: "https://otzovik.com/review_16790366.html",
  },
  {
    id: "17626605",
    product: "skin-harmony-biocellulose-facial-mask",
    author: "dianochka23",
    date: "23 авг 2025",
    rating: 5,
    title: "Эффективная маска",
    text: 'Добрый день дорогие читатели сайта "Отзовик" с компание Coral club, я познакомилась не так давно и получила свои результаты по здоровью и вот в компании появилась новиночка маска для лица биоцеллюлозная, вообще в серии три вида масок, но я свой выбор остановила именно на этой Skin Harmony. Маски можно купить как по одной штуке 688 рублей, так и упаковкой...',
    plus: "Применение, эффект, лёгкость в использовании",
    minus: "Если только цена, надо ловить моменты когда есть акция",
    photos: [
      "/images/reviews/17626605-1.webp",
      "/images/reviews/17626605-2.webp",
      "/images/reviews/17626605-3.webp",
      "/images/reviews/17626605-4.webp",
    ],
    url: "https://otzovik.com/review_17626605.html",
  },
];

/** Reviews of one product, newest first as listed on the source. */
export const reviewsFor = (slug: string): LandingReview[] =>
  LANDING_REVIEWS_RU.filter((r) => r.product === slug);

/** Overall rating across every review shown on the landing. */
export function overallSummary() {
  const count = LANDING_REVIEWS_RU.length;
  const rating =
    count > 0
      ? LANDING_REVIEWS_RU.reduce((sum, r) => sum + r.rating, 0) / count
      : 0;
  return { count, rating };
}

/** Review pages that make up the landing summary link. */
export const ALL_REVIEWS_URL =
  "https://otzovik.com/reviews/produkciya_kompanii_coral_club/";

/** Reviews picked for the landing: positive, with photos where possible. */
export const LANDING_FEATURED_IDS = [
  "16790366", // Advanced Collagen, 4 photos
  "17626605", // Skin Harmony, 4 photos
  "18240142", // Трипептиды, 2 photos
  "18702897", // Трипептиды
  "18614421", // Гидрамакс Плюс
  "16445064", // Гидрамакс, photo
];
