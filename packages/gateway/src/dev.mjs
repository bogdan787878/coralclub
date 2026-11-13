// Локальный шлюз: тот же код Worker на Node, сессии магазина в памяти (вместо KV). Запуск: npm run dev:gateway (порт 8787).
// Для разработки на localhost; в продакшене работает Cloudflare Worker (wrangler deploy).
import http from "node:http";
import gateway from "./worker.mjs";

const PORT = Number(process.env.PORT ?? 8787);
const store = new Map();
const env = {
  ALLOWED_ORIGINS: process.env.ALLOWED_ORIGINS ?? "http://localhost:3100,http://localhost:3300,http://127.0.0.1:3100",
  CC4_BASE: process.env.CC4_BASE ?? "https://api.coral.club",
  GOOGLE_PLACES_KEY: process.env.GOOGLE_PLACES_KEY ?? "",
  SESSIONS: {
    async get(k) {
      const v = store.get(k);
      if (!v || v.until < Date.now()) return (store.delete(k), null);
      return v.value;
    },
    async put(k, value, { expirationTtl = 3600 } = {}) {
      store.set(k, { value, until: Date.now() + expirationTtl * 1000 });
    },
  },
};

http
  .createServer(async (req, res) => {
    const chunks = [];
    for await (const c of req) chunks.push(c);
    const body = chunks.length ? Buffer.concat(chunks) : undefined;
    const request = new Request(`http://localhost:${PORT}${req.url}`, {
      method: req.method,
      headers: Object.entries(req.headers).flatMap(([k, v]) => (Array.isArray(v) ? v.map((x) => [k, x]) : [[k, String(v)]])),
      body: ["GET", "HEAD"].includes(req.method ?? "GET") ? undefined : body,
    });
    const r = await gateway.fetch(request, env);
    res.writeHead(r.status, Object.fromEntries(r.headers));
    res.end(Buffer.from(await r.arrayBuffer()));
  })
  .listen(PORT, () => console.log(`шлюз чек-аута (локально) на http://localhost:${PORT}`));
