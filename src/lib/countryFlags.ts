/** Flag emoji for the countries seen in content/products/*.json's
 *  manufacturing.countryOfOrigin. */
const FLAGS: Record<string, string> = {
  Japan: "🇯🇵",
  USA: "🇺🇸",
  Germany: "🇩🇪",
  Taiwan: "🇹🇼",
  Netherlands: "🇳🇱",
  Norway: "🇳🇴",
  Slovenia: "🇸🇮",
  "South Korea": "🇰🇷",
  Spain: "🇪🇸",
};

export type Origin = { flag: string; label: string };

/**
 * Every country in the product's country of origin — a
 * "Japan, USA, Taiwan, Germany"-style string becomes one tag per
 * country, in order. Empty for an empty/missing field.
 */
export function allOrigins(countryOfOrigin: string | undefined): Origin[] {
  return (countryOfOrigin ?? "")
    .split(",")
    .map((label) => label.trim())
    .filter(Boolean)
    .map((label) => ({ flag: FLAGS[label] ?? "", label }));
}
