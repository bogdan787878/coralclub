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
| Категория | the accent tag — on the carousel card and above the PDP title |
| Строка цели | short goal line on the carousel card |
| Цели | one or more of `energy / sleep / skin / detox / weight / immune / hydration` — drives quiz matching |
| coralclub.ru ID | product id from a share-cart link; blank ⇒ "Add to Cart" links out to the shop |
| Цена | regular price, e.g. `$29.99` |
| Клубная цена | club price, e.g. `$21.99`. PDP shows this as the main price; the carousel card shows it struck through |
| Описание | PDP body copy |
| Картинки — карусель / PDP | image lists → swipe sliders with dots. One image = no dots |
| How to use | PDP accordion |
| Manufacturing detail | PDP accordion, incl. the editable **Supplement Facts** row list |

### Packs

The **"Packs"** collection edits `content/series/*.json` — each file
drives one `SeriesFeature` block: a big card (your own photos or a linked
product's) with, optionally, a heading and description above it and a
carousel below. Every field but `id` is optional — fill in only what a
given pack needs. Two shapes in practice:

- **A full pack** — a two-line heading (`titleLead` + italic
  `titleAccent`), a `blurb` paragraph, and an ordered list of product
  slugs for the carousel below the card (Coral Detox, Go Detox, Privilege,
  the Collagen sets).
- **A bare spotlight** — just the single-line `heading` field (leave
  `titleLead`/`blurb`/the product-slugs list empty) for a pack shown as
  nothing but a heading and a product card, no description, no carousel
  (B-Luron, Women's Balance, Immunity Pack).

An optional **big-card images** list (uploads go to `public/images/series/`)
gives the card its own photos; leave empty to fall back to the linked
product's own PDP photos, or a gradient placeholder if there's no product
either. The **linked product** field (a `content/products/<slug>.json`
slug) makes the big card a real, sellable SKU with its own price and cart
button (e.g. `hydramax-plus`, `coral-detox-plus`, `b-luron`); leave it
blank for a product line with no single bundle SKU (e.g. Privilege) — the
card then just shows the images, no price/cart. **Order** (`weight`, a
plain number, lower first) controls display order when several packs
render back-to-back in the same spot — leave it blank to sort after any
pack that has a number set.

Currently wired in: `hydramax-plus` and `b-luron` (rendered by
`PhasesSection`, in Hydration's and Personalization's own carousels), and
`coral-detox` / `go-detox` / `privilege` / `collagen-sets` /
`womens-balance` / `immunity-pack` (rendered by `HomeView`, in each
phase's tail sections). `liumi` exists as content but isn't linked into a
page yet.

### Hero images

The **"Hero images"** collection edits `content/hero-images.json` — a list
of **"Hero blocks"**, each the background photo behind one phase's hero
panel (Hydration, Restart). Click **Add** to add a block, or open an
existing one to edit it. Each block has an **ID** (must match a phase —
currently `hydration` or `restart`) and two image slots, **Desktop image**
and **Mobile image**. Below 768px wide the site shows the mobile image; at
768px and up, the desktop one. Upload the same photo to both if you don't
have a dedicated mobile crop. Uploads go to `public/images/hero/`. If a
block has no image yet, the panel just shows a plain gray background
instead of erroring. The hero's title/body/CTA text is still in code
(`src/content/home.tsx`), not editable here yet — and adding a new ID here
alone won't make a new phase appear on the site, that needs a code change
too.

## 2. Straight in GitHub (zero setup)

Edit `content/products/<slug>.json` in the GitHub web editor (or locally),
commit to `main`. Same rebuild. To add a product, add a new
`content/products/<slug>.json` — the next build picks it up.

## Local

```bash
npm run gen   # re-compile content/*.json -> src/lib/products.generated.ts
npm run dev   # predev runs gen automatically
```
