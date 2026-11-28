/**
 * Шрифты дизайн-системы (Suisse Intl, Newton Italic) — @font-face с путём сайта (basePath): на GitHub Pages сайт живёт
 * в /coralclub/, и путь /fonts/... из CSS там не найден (Next не добавляет basePath в url() стилей).
 * Файлы — лицензионные, в публичный репозиторий не кладутся: в сборку их кладёт scripts/fonts.mjs (из секрета CI или
 * из локальной папки public/fonts). Нет файлов — работают запасные шрифты из tokens.css.
 */
const base = process.env.NEXT_PUBLIC_BASE_PATH ?? "";

const face = (family: string, file: string, weight: number, style: "normal" | "italic") =>
  `@font-face{font-family:"${family}";src:url("${base}/fonts/${file}.woff2") format("woff2"),url("${base}/fonts/${file}.woff") format("woff");font-weight:${weight};font-style:${style};font-display:swap}`;

const CSS = [
  face("Suisse Intl", "SuisseIntl-Regular", 400, "normal"),
  face("Suisse Intl", "SuisseIntl-Medium", 500, "normal"),
  face("Suisse Intl", "SuisseIntl-Bold", 700, "normal"),
  face("Newton", "Newton-Italic", 400, "italic"),
].join("");

export function FontFaces() {
  return (
    <>
      {/* основной текст и акцент — заранее, чтобы не мигал запасной шрифт */}
      <link rel="preload" href={`${base}/fonts/SuisseIntl-Regular.woff2`} as="font" type="font/woff2" crossOrigin="anonymous" />
      <link rel="preload" href={`${base}/fonts/Newton-Italic.woff2`} as="font" type="font/woff2" crossOrigin="anonymous" />
      <style>{CSS}</style>
    </>
  );
}
