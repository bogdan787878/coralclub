# @coral/gateway — шлюз чек-аута

Cloudflare Worker `coral-lk-checkout` (`https://coral-lk-checkout.bogdan787878.workers.dev`). Магазин принимает
вызовы чек-аута только по своей сессии (cookie `PHPSESSID`, `HttpOnly`); страница на `github.io` её не получит,
поэтому сессию держит шлюз. Пароль не нужен: сессия открывается по токену API кабинета.

| Путь | Что делает |
|---|---|
| `POST /session` (`Authorization: Bearer <токен кабинета>`) | открывает сессию магазина, отдаёт `sid` (хранится в KV) |
| `GET/POST /shop/<путь>` (`X-Lk-Sid`) | пропускает разрешённые пути чек-аута (`/sv-api/*`, POST только `/sv-api/order`) |
| `POST /shop/pay` (`{ link, method }`) | проходит ссылку оплаты заказа до банка, отдаёт `{ target: { url, method, fields } }` |
| `GET /config` | ключ Google Places для поиска адреса |

`src/payment.mjs` и `src/bootstrap.mjs` на стандартном `fetch`: их же использует Node-стенд кабинета (`server.mjs`).

```bash
npm test -w @coral/gateway        # офлайн-проверки прохода оплаты
cd packages/gateway && npx wrangler deploy
```

Секрет `GOOGLE_PLACES_KEY` хранится в Cloudflare у Worker (`npx wrangler secret put GOOGLE_PLACES_KEY`), в репозиторий не попадает.
