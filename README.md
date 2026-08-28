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
