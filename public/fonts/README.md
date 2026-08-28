# Fonts

The design system expects two licensed families. Drop the web files here and
the `@font-face` rules in `src/styles/fonts.css` pick them up automatically.
Until the files exist, the fallback stacks in `src/styles/tokens.css` are used.

## Suisse Intl (Swiss Typefaces) — primary UI font

| Weight | File |
| ------ | ---- |
| 400 Regular | `SuisseIntl-Regular.woff2` + `.woff` |
| 500 Medium  | `SuisseIntl-Medium.woff2` + `.woff` |
| 700 Bold    | `SuisseIntl-Bold.woff2` + `.woff` |

## Newton (ParaType) — accent, italic only

| Style | File |
| ----- | ---- |
| 400 Italic | `Newton-Italic.woff2` + `.woff` |

## Converting

If you only have `.otf` / `.ttf`, generate `.woff2` / `.woff` with
[fonttools](https://github.com/fonttools/fonttools):

```bash
pip install "fonttools[woff]"
fonttools ttLib.woff2 compress SuisseIntl-Regular.ttf
```
