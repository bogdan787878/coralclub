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

⚠️ **Do NOT click "Sign In with GitHub".** That button needs an OAuth relay
we haven't deployed, so it falls back to Netlify's and dead-ends on a
"Not Found" page. Use **"Sign In Using Access Token"** instead:

1. GitHub → **Settings → Developer settings → Personal access tokens →
   Fine-grained tokens → Generate new token**.
2. **Repository access:** Only select repositories → `bogdan787878/coralclub`.
3. **Permissions → Repository permissions → Contents: Read and write.**
   (Leave everything else "No access".)
4. Set a short expiry, generate, copy the token.
5. On the CMS sign-in screen click **Sign In Using Access Token** and paste
   it. The token stays in your browser; it is never committed.

Treat the token like a password; revoke it from the same GitHub page when
you're done.

> Optional: to get a working one-click "Sign In with GitHub" button, deploy
> the [`sveltia-cms-auth`](https://github.com/sveltia/sveltia-cms-auth)
> Cloudflare Worker (it has a "Deploy to Cloudflare" button), register a
> GitHub OAuth App with the callback the worker prints, then add
> `backend.base_url: https://<your-worker>.workers.dev` to
> `public/admin/config.yml`. Until then, the token flow above is the way in.

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

### Series blocks

The **"Series blocks"** collection edits `content/series/*.json` — the
standalone homepage blocks (large image + heading + a carousel of products),
e.g. **LIŪMI** in the Hydration area, rendered right after the "You Are 90%
Water" block. Fields: an `id`, a two-line heading (`titleLead` + italic
`titleAccent`), a `blurb` paragraph, one large image (optional — a gradient
placeholder shows until you add one; uploads go to `public/images/series/`),
and an ordered list of product slugs (each must match a product's Slug).
Rendered on the homepage by `SeriesShowcase`; the `liumi` and `privilege`
blocks are wired in right now (`src/app/page.tsx`), one after the other in
the Hydration area.

## 2. Straight in GitHub (zero setup)

Edit `content/products/<slug>.json` in the GitHub web editor (or locally),
commit to `main`. Same rebuild. To add a product, add a new
`content/products/<slug>.json` — the next build picks it up.

## Local

```bash
npm run gen   # re-compile content/*.json -> src/lib/products.generated.ts
npm run dev   # predev runs gen automatically
```
