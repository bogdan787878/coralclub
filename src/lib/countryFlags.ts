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

/**
 * The product's primary country of origin as a flag + label — for a
 * "Japan, USA, Taiwan, Germany"-style multi-country string, just the
 * first (the actual manufacturing site; the rest are usually component
 * sourcing). Returns null when the field is empty.
 */
export function primaryOrigin(
  countryOfOrigin: string | undefined,
): { flag: string; label: string } | null {
  const label = countryOfOrigin?.split(",")[0]?.trim();
  if (!label) return null;
  return { flag: FLAGS[label] ?? "", label };
}
