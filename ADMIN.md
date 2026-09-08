# Product admin

Products are content, not code. Each product is one JSON file in
`content/products/<slug>.json`. On every build, `scripts/gen-products.mjs`
compiles them into `src/lib/products.generated.ts`, which the app imports.

Edit them one of two ways.

## 1. The CMS (recommended)

**URL:** https://bogdan787878.github.io/coralclub/admin/

It's [Sveltia CMS](https://github.com/sveltia/sveltia-cms) (a Decap/Netlify-CMS
compatible editor) loaded from a CDN — config in `public/admin/config.yml`.
Saving a product **commits straight to `main`** (`content/products/*.json` +
any uploaded images under `public/images/products/`). The GitHub Action then
rebuilds and redeploys automatically — live in ~1–2 minutes.

### Signing in

The CMS talks to GitHub as *you*. A one-click "Sign in with GitHub" button
needs an OAuth relay we don't host, so use a token instead:

1. GitHub → **Settings → Developer settings → Personal access tokens →
   Fine-grained tokens → Generate new token**.
2. **Repository access:** Only select repositories → `bogdan787878/coralclub`.
3. **Permissions → Repository permissions → Contents: Read and write.**
4. Generate, copy the token.
5. On the CMS sign-in screen pick the **personal access token** option and
   paste it. (The token stays in your browser; it's never committed.)

Treat that token like a password. Revoke it from the same GitHub page when
you're done, or give it a short expiry.

> Optional upgrade: deploy the tiny `sveltia-cms-auth` Cloudflare Worker + a
> GitHub OAuth App to get the "Sign in with GitHub" button, then add
> `backend.base_url` to `config.yml`. See the Sveltia CMS docs.

### Fields

| Field | Notes |
| --- | --- |
| Slug (URL) | `lowercase-with-dashes` — the product page address |
| Название продукта | product name (also the PDP `<h1>`) |
| Заголовок карточки | two-line title on the carousel card |
| Категория | the tan tag |
| Строка цели | short goal line on the carousel card |
| Цели | one or more of `energy / sleep / skin / detox / weight / immune / hydration` — drives quiz matching |
| coralclub.ru ID | product id from a share-cart link; blank ⇒ "Add to Cart" links out to the shop |
| Цена | regular price, e.g. `$29.99` |
| Клубная цена | club price, e.g. `$21.99`. PDP shows this as the main price; the carousel card shows it struck through |
| Описание | PDP body copy |
| Картинки — карусель / PDP | image lists → swipe sliders with dots. One image = no dots |
| How to use | PDP accordion |
| Manufacturing detail | PDP accordion, incl. the editable **Supplement Facts** row list |
| Rating / Ratings / Reviews | numbers shown next to the stars |

## 2. Straight in GitHub (zero setup)

Edit `content/products/<slug>.json` in the GitHub web editor (or locally),
commit to `main`. Same rebuild. To add a product, add a new
`content/products/<slug>.json` — the next build picks it up.

## Local

```bash
npm run gen   # re-compile content/*.json -> src/lib/products.generated.ts
npm run dev   # predev runs gen automatically
```
