# Общие пакеты Coral Club

Монорепозиторий на npm workspaces (`"workspaces": ["packages/*"]` в корневом `package.json`). Приложение магазина
(Next, корень репозитория) и другие сервисы берут общий код только через эти пакеты. Линтер запрещает пакетам
импортировать код приложения и Next (а API, Layout и шлюзу ещё и React), а приложению запрещает импортировать файлы пакетов по пути.

| Пакет | Что внутри | Как подключается |
|---|---|---|
| `@coral/api` | API кабинета (`api.coral.club`): сессия участника, каталог, корзина участника (basket) | импорт по имени; без React, годится для любого сервиса |
| `@coral/api/shop` | чек-аут магазина (`/sv-api/*`), сменный транспорт, клиент шлюза; рынок задаёт приложение (`configureShop`) | импорт по имени |
| `@coral/ui` | токены `tokens.css` и UI kit на React (Button, FloatInput, OptionCards, Sheet, Loader…); внутренние ссылки кнопки подставляет приложение (`linkAs`) | импорт по имени; в Next через фасад `@/components/ui` |
| `@coral/gateway` | шлюз чек-аута на Cloudflare Worker и общее ядро прохода оплаты для Node-стенда; офлайн-тесты `npm test -w @coral/gateway` | деплой `npx wrangler deploy` из `packages/gateway` |
| `@coral/layout` | Layout продукта: веб-компонент `<cc-layout>` (шапка, нижнее меню с кнопкой и бейджем корзины) | **по адресу**: `layout.js` (на Pages `/coralclub/layout/layout.js`) |
| `@coral/cart` | Корзина как отдельное приложение: веб-компонент `<cc-cart>` (страница корзины) и общее хранилище корзины | **по адресу**: `cart.js` (на Pages `/coralclub/cart/cart.js`) на странице корзины сервиса |

## Layout: контракт

```html
<script src="/coralclub/layout/layout.js" defer></script>
<cc-layout active="me" parts="tabbar" links='{"cart":"#/cart"}'></cc-layout>
```

- `active`: `home` | `catalog` | `cart` | `fav` | `me`.
- `parts`: без атрибута шапка и меню; `"tabbar"`, `"header"`; пустая строка: ничего.
- `header`: `center` (по умолчанию) | `bar` (меню и логотип слева, как в «Друге клуба»); слоты `menu`, `brand`, `actions`.
- `tabs`: разделы по порядку (по умолчанию `home catalog cart fav me`); `labels`, `locale` (`ru` | `en`).
- `links`: JSON с адресами `home`, `catalog`, `cart`, `fav`, `me`. Кнопка корзины — ссылка на страницу корзины сервиса.
- `cart` (`member` | `local`) и `cart-key`: чью корзину считает бейдж.
- Внутрь: `window.coralLayout.cart.open()` (перейти на страницу корзины), `.count()`, `.refresh()`, `.add(…)`; `openCart()` магазина тоже ведёт на страницу корзины.

## Корзина: отдельное приложение

Корзина — не шторка, а своя страница и своё приложение, отдельно от оформления заказа. Сервис ставит на свою
страницу корзины элемент и подключает `cart.js`:

```html
<script src="/coralclub/cart/cart.js" defer></script>
<cc-cart links='{"checkout":"#/checkout","shop":"#/catalog","login":"./"}'></cc-cart>
```

- Источник: `cart="member"` (по умолчанию, корзина участника в API кабинета, она же корзина магазина) или
  `cart="local"` + `cart-key` (гостевая корзина в localStorage в формате `lib/cart.ts` магазина, с теми же событиями).
- `links`: `checkout` (оформление — следующий отдельный шаг), `shop` («Перейти в каталог»), `login`.
- `labels`, `locale` (`ru` | `en`), `currency`, `money-locale` (суммы гостевой корзины).
- Слоты: `cart-banner`, `cart-extra` (например, «Вам может понравиться»), `cart-summary`, `cart-note`.
- Свойства: `linePrice(raw) → {now, was, save, note}` (цена по правилам сервиса), `imageUrl(src)` (basePath, CDN).
- События: `cc:cart:checkout` на элементе (отменяемое: `preventDefault()` — переход делает сервис), `cc:cart:changed` на `window`.
- `window.coralCart`: `add(…)`, `count()`, `refresh()`.
- Хранилище одно на страницу: `layout.js` и `cart.js` собраны отдельно, но первый загрузившийся кладёт хранилище в
  `window.__ccCartStore`, второй берёт его оттуда. Поэтому бейдж в меню и страница корзины всегда совпадают.
- На телефоне итог и «Оформить заказ» закреплены внизу над меню Layout; цвет каймы панели берётся из `--cc-page-bg`.

Правда о корзине хранится на сервере (корзина участника) или в браузере (гостевая); у экранов сервисов только копии
(например, оформление `/lk/checkout` считает итог по копии, которую обновляет `cc:cart:changed`).
