#!/usr/bin/env node
/**
 * Local one-origin proxy for testing the landing against the real shop.
 *
 *   npm run dev            # landing on :3100
 *   npm run dev:proxy      # this proxy on :3200
 *   open http://localhost:3200/landing/checkout/
 *
 * Shop paths (/sv-api, /shop, /basket, /checkout, /ajax, /order …) go to
 * https://coralclub.ru; everything else goes to the local Next dev server
 * (falling back to the shop on a 404, e.g. its /images/*). Cookies are made
 * host-only so the shop session lives on localhost:3200, and absolute
 * coralclub.ru links in HTML are rewritten to stay inside the proxy.
 */
import http from "node:http";
import https from "node:https";
import net from "node:net";

const PORT = Number(process.env.PROXY_PORT ?? 3200);
const LOCAL = {
  host: "127.0.0.1",
  port: Number(process.env.LOCAL_PORT ?? 3100),
};
const REMOTE_HOST = "coralclub.ru";
const SELF = `http://localhost:${PORT}`;

const REMOTE_PREFIXES = [
  "/sv-api",
  "/shop",
  "/basket",
  "/checkout",
  "/ajax",
  "/restApi",
  "/order",
  "/personal-new",
  "/login",
  "/lang_list",
  "/bitrix",
  "/qrcode",
  "/upload",
  "/local",
  "/wp",
];
const isRemote = (url) =>
  REMOTE_PREFIXES.some(
    (p) => url === p || url.startsWith(p + "/") || url.startsWith(p + "?"),
  );

const readBody = (req) =>
  new Promise((resolve) => {
    const chunks = [];
    req.on("data", (c) => chunks.push(c));
    req.on("end", () => resolve(Buffer.concat(chunks)));
  });

function toRemoteHeaders(headers) {
  const h = { ...headers, host: REMOTE_HOST, "accept-encoding": "identity" };
  for (const k of ["origin", "referer"]) {
    if (h[k]) h[k] = h[k].replace(SELF, `https://${REMOTE_HOST}`);
  }
  return h;
}

/** https://coralclub.ru[:443]/x → http://localhost:3200/x */
const toSelf = (text) =>
  text
    .replaceAll(`https://${REMOTE_HOST}:443`, SELF)
    .replaceAll(`https://${REMOTE_HOST}`, SELF);

function fromRemoteHeaders(headers) {
  const h = { ...headers };
  if (h.location) h.location = toSelf(h.location);
  if (h["set-cookie"]) {
    h["set-cookie"] = h["set-cookie"].map((c) =>
      c
        .replace(/;\s*domain=[^;]*/i, "")
        .replace(/;\s*secure/i, "")
        .replace(/;\s*samesite=none/i, "; SameSite=Lax"),
    );
  }
  return h;
}

function request(opts, body) {
  const lib = opts.protocol === "https:" ? https : http;
  return new Promise((resolve, reject) => {
    const r = lib.request(opts, resolve);
    r.on("error", reject);
    if (body?.length) r.write(body);
    r.end();
  });
}

async function toRemote(req, res, body) {
  const upstream = await request(
    {
      protocol: "https:",
      host: REMOTE_HOST,
      port: 443,
      method: req.method,
      path: req.url,
      headers: toRemoteHeaders(req.headers),
    },
    body,
  );
  const headers = fromRemoteHeaders(upstream.headers);
  const type = String(headers["content-type"] ?? "");
  if (type.includes("text/html")) {
    const chunks = [];
    for await (const c of upstream) chunks.push(c);
    const html = Buffer.concat(chunks).toString("utf8");
    const rewritten = toSelf(html);
    delete headers["content-length"];
    res.writeHead(upstream.statusCode ?? 502, headers);
    res.end(rewritten);
    return;
  }
  res.writeHead(upstream.statusCode ?? 502, headers);
  upstream.pipe(res);
}

async function toLocal(req, res, body) {
  const upstream = await request(
    {
      protocol: "http:",
      host: LOCAL.host,
      port: LOCAL.port,
      method: req.method,
      path: req.url,
      headers: { ...req.headers, host: `localhost:${LOCAL.port}` },
    },
    body,
  );
  if (
    upstream.statusCode === 404 &&
    (req.method === "GET" || req.method === "HEAD")
  ) {
    upstream.resume();
    return toRemote(req, res, body);
  }
  res.writeHead(upstream.statusCode ?? 502, upstream.headers);
  upstream.pipe(res);
}

const server = http.createServer(async (req, res) => {
  try {
    const body = await readBody(req);
    if (isRemote(req.url ?? "/")) await toRemote(req, res, body);
    else await toLocal(req, res, body);
  } catch (e) {
    res.writeHead(502, { "content-type": "text/plain; charset=utf-8" });
    res.end(`proxy error: ${e.message}`);
  }
});

// HMR websocket of the Next dev server
server.on("upgrade", (req, socket, head) => {
  const up = net.connect(LOCAL.port, LOCAL.host, () => {
    const lines = [`${req.method} ${req.url} HTTP/1.1`];
    for (const [k, v] of Object.entries({
      ...req.headers,
      host: `localhost:${LOCAL.port}`,
    })) {
      lines.push(`${k}: ${v}`);
    }
    up.write(lines.join("\r\n") + "\r\n\r\n");
    if (head?.length) up.write(head);
    socket.pipe(up).pipe(socket);
  });
  up.on("error", () => socket.destroy());
  socket.on("error", () => up.destroy());
});

server.listen(PORT, () => {
  console.log(
    `proxy ${SELF}  →  shop https://${REMOTE_HOST}, landing :${LOCAL.port}`,
  );
});
