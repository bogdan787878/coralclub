/**
 * 12 доменов здоровья витрины (content/domains.json, иконки DOMAIN_ICONS) ↔ разделы каталога Coral Club в API
 * кабинета (GET /catalog/sections/{code}). У разделов «по цели» одни и те же коды на витринах всех стран (проверено:
 * Россия, Германия, Казахстан), поэтому сопоставление одно на все страны, а товары и цены приходят по витрине сессии.
 *
 * Домен может собираться из нескольких разделов (пищеварение = пищеварение + пробиотики); товар, попавший в несколько
 * разделов домена, показывается один раз. Поменялись разделы на сайте — правьте только эту таблицу.
 */
export type LkDomain = { id: string; label: string; sections: string[] };

export const LK_DOMAINS: LkDomain[] = [
  { id: "energy", label: "Энергия", sections: ["energy"] },
  { id: "weight-metabolism", label: "Вес и обмен веществ", sections: ["weight-management"] },
  { id: "digestion-gut", label: "Пищеварение", sections: ["digestion", "probiotics"] },
  { id: "immunity", label: "Иммунитет", sections: ["immune-support"] },
  { id: "sleep-stress", label: "Сон и стресс", sections: ["antistress"] },
  { id: "brain-focus", label: "Память и внимание", sections: ["memory-and-attention"] },
  { id: "heart-vessels", label: "Сердце и сосуды", sections: ["cardiovascular-health"] },
  { id: "bones-joints", label: "Суставы и кости", sections: ["joints"] },
  { id: "skin-hair-nails", label: "Кожа, волосы, ногти", sections: ["skin-hair-nails"] },
  { id: "longevity", label: "Долголетие", sections: ["active-longevity", "antioxidant-protection"] },
  { id: "vision-eyes", label: "Зрение", sections: ["eye-care"] },
  { id: "reproductive", label: "Женское и мужское здоровье", sections: ["women-health", "men-health"] },
];

/** Фазы главной (Health Concept): гидратация и перезагрузка — свои разделы; персонализация — 12 доменов. */
export const LK_PHASE_SECTIONS = {
  hydration: ["hydration"],
  restart: ["detox"],
} as const;
