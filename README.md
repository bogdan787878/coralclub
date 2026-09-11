# Coral Club — content-shop

Контент-витрина Coral Club с мини-магазином. Регистрация/авторизация и
добавление в корзину — **редиректом во внешний магазин Coral Club**; это
приложение — тонкий слой, который пробрасывает параметры / токены / deep-link.

## Стек

- **Next.js 16** (App Router, Turbopack) + **TypeScript** + React 19
- Стили: CSS-переменные (дизайн-токены) + CSS Modules, без UI-фреймворка
- Node **20** (через `nvm`; см. `.nvmrc`)

## Запуск

```bash
nvm use            # Node 20
npm install
npm run dev        # http://localhost:3000  (в этом окружении — порт 3100)
```

Прочие команды: `npm run build`, `npm run lint`.

## Картинки — Cloudflare Images

Растровые картинки из `public/images/**` (`.png/.jpg/.webp`) отдаются через
**Cloudflare Images** с ресайзом и `format=auto` (WebP/AVIF). Всё остальное —
HTML/JS/SVG и `public/reels/**` — по-прежнему с GitHub Pages.

Как это устроено:

- `src/lib/cf-image-loader.ts` — кастомный loader для `next/image`. Если картинка
  есть в манифесте — URL вида `imagedelivery.net/<hash>/<id>/w=…,format=auto`;
  если нет (или манифест пустой) — фолбэк на оригинал в `/public`.
- `src/lib/image-manifest.json` — карта `путь → id` + хэши. **Коммитится.**
- `scripts/sync-images.mjs` (`npm run images:sync`) — заливает изменённые файлы
  в Cloudflare Images и обновляет манифест. Запускается **локально**, не в CI.

Первичная настройка (один раз):

1. Cloudflare Dashboard → **Images → Variants** → включить **Flexible variants**.
2. **My Profile → API Tokens → Create Token** → права
   *Account › Cloudflare Images › Edit*. Сохранить токен (в CI не нужен).
3. Узнать **Account ID** (в URL дашборда).

Каждый раз при изменении картинок:

```bash
CF_ACCOUNT_ID=xxx CF_IMAGES_TOKEN=yyy npm run images:sync
git add src/lib/image-manifest.json && git commit -m "images: sync"
```

Токен нигде не хранится в репозитории — только в переменных окружения при ручном
запуске скрипта.

### Пэкшоты товаров — авто-вырезка фона

`scripts/cutout-product.py` тянет фото товара с coralclub.us, вырезает фон
локально (`rembg`/u2net, без платных API) и кладёт результат на прозрачный
канвас высотой 1400px (ширина — по силуэту товара; та же логика, что у уже
существующих пэкшотов). Один файл используется и в карусели, и на PDP.

```bash
pip3 install rembg onnxruntime pillow   # разово; первый запуск качает модель ~176 МБ
python3 scripts/cutout-product.py memo-prime cardiopack
```

Результат — `public/images/products/<slug>.png`. Скрипт **не** прописывает его в
`content/products/<slug>.json` (`carouselImages`/`pdpImages`) — это отдельный шаг.

Ограничения:
- для товаров с вариантами (вкус/цвет) картинка по умолчанию на странице может
  относиться к другому варианту — сверяй `src=` в выводе скрипта;
- чисто студийные фото на светлом фоне вырезаются надёжно; постановочные/lifestyle
  кадры — не факт.

### Оригиналы без вырезки фона — обрезка полей

Если фон вырезать не нужно (вставляем фото с coralclub.us как есть),
`scripts/crop-photo.py` только обрезает лишние белые поля вокруг товара —
исходники там обычно ~1920×1280 с товаром на маленьком пятачке по центру,
из-за чего в квадратном фрейме PDP/карточки он выглядит крошечным. Фон и
сам товар скрипт не трогает — только обрезает кадр плотнее по содержимому.

```bash
python3 scripts/crop-photo.py flexicor                                  # кроп на месте
python3 scripts/crop-photo.py flexicor --url "https://coralclub.us/..."  # скачать + кроп
```

## Дизайн-система

| Слой | Файл |
| ---- | ---- |
| Токены (цвет, типографика, отступы) | `src/styles/tokens.css` |
| `@font-face` | `src/styles/fonts.css` |
| Reset + база | `src/app/globals.css` |
| Базовые компоненты | `src/components/ui/` |
| Витрина UI-KIT | `/ui-kit` → `src/app/ui-kit/` |

Спецификация (mobile-first):

- **Цвет:** Primary 100 `#011130` · Primary 30 `#C6D6ED` · Primary 10 `#E3ECFA`
- **Типографика:** H1 `28/32 · -2%` · Body long `14/20` · Button `16/24`
- **Отступы:** page block `32` · page inline `16` · gap-base `24` · gap-text `16`
- **Шрифты:** Suisse Intl (осн.) + Newton Italic (акцент) — файлы положить в
  `public/fonts/` (см. `public/fonts/README.md`); до этого работают фолбэки.

## Компоненты

```tsx
import { Container, Section, Stack, Heading, BodyLong, Accent, Button } from "@/components/ui";
```

- `Container` — inline-паддинг 16, центрирование, max-width
- `Section` — block-паддинг 32, `tone="default | surface | primary"`
- `Stack` — flex-колонка/строка с `gap="base" | "text" | number`
- `Heading` / `BodyLong` / `Accent` — типографика по токенам (Accent = Newton italic)
- `Button` — `variant="primary | secondary | ghost"`, `block`; при `href`
  рендерится `<a>` — для redirect-флоу авторизации и корзины
