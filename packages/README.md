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
| `@coral/layout` | Layout продукта: веб-компонент `<cc-layout>` (шапка, нижнее меню, выдвижная корзина) | **по адресу**: собранный `layout.js` (`npm run layout:build` → `public/layout/layout.js`, на Pages `/coralclub/layout/layout.js`) |

## Layout: контракт

```html
<script src="/coralclub/layout/layout.js" defer></script>
<cc-layout active="me" parts="tabbar" links='{"checkout":"#/checkout"}'></cc-layout>
```

- `active`: `home` | `catalog` | `fav` | `me`.
- `parts`: без атрибута шапка и меню; `"tabbar"`, `"header"`; пустая строка: ничего (корзина остаётся доступной).
- `links`: JSON с адресами `home`, `catalog`, `fav`, `me`, `checkout`, `login` (по умолчанию: кабинет на GitHub Pages).
- Наружу: событие `cc:cart:changed` на `window` (`{count, lines}`); другие вкладки получают сообщение `BroadcastChannel("cc")`.
- Внутрь: `window.coralLayout.cart.add(code, qty)`, `.open()`, `.close()`, `.count()`, `.refresh()`; событие `cc:cart:refresh`, если сервис сам поменял корзину.
- Стили внутри shadow DOM; цвета берутся из токенов UI kit (`--color-*`, `--font-sans`), у каждого есть запасное значение.

Корзина принадлежит Layout. Правда хранится на сервере (корзина участника в API кабинета), у сервисов только копии для своих экранов
(например, оформление в `/lk/checkout` считает итог по копии, которую обновляет `cc:cart:changed`).
