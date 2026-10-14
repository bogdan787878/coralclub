#!/usr/bin/env node
/**
 * Local one-origin proxy for testing the landing against the real shop.
 *
 *   npm run dev            # landing on :3100
 *   npm run dev:proxy      # this proxy on :3200
 *   open http://localhost:3200/landing/checkout/
 *
 * The checkout test page switches the shop site itself (cookie `cc_shop_site`:
 * coralclub.ru, coralclub.us, es.coral.club …); SHOP_HOST sets the default.
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
/** Which shop site to front: coralclub.ru, es.coral.club, pl.coral.club … */
const DEFAULT_HOST = process.env.SHOP_HOST ?? "coralclub.ru";
/** Site hosts the test page may switch to (cookie `cc_shop_site`). */
const ALLOWED_HOST = /^(coralclub\.(ru|us)|([a-z0-9-]+\.)?coral\.club)$/i;
const hostOf = (req) => {
  const m = /(?:^|;\s*)cc_shop_site=([^;]+)/.exec(req.headers.cookie ?? "");
  const h = m ? decodeURIComponent(m[1]) : "";
  return ALLOWED_HOST.test(h) ? h : DEFAULT_HOST;
};

/**
 * One cookie jar per shop site, kept here (not in the browser): every site
 * names its session cookie the same (PHPSESSID …), so they cannot share the
 * browser's single localhost cookie space.
 */
const jars = new Map();
const jarOf = (host) => {
  if (!jars.has(host)) jars.set(host, new Map());
  return jars.get(host);
};
function storeCookies(host, setCookie = []) {
  const jar = jarOf(host);
  for (const line of setCookie) {
    const [pair, ...attrs] = line.split(";");
    const eq = pair.indexOf("=");
    if (eq < 0) continue;
    const name = pair.slice(0, eq).trim();
    const value = pair.slice(eq + 1).trim();
    const dead =
      value === "" ||
      attrs.some((a) => /^\s*max-age=0\s*$/i.test(a)) ||
      attrs.some((a) => /^\s*expires=.*1970/i.test(a));
    if (dead) jar.delete(name);
    else jar.set(name, value);
  }
}
const cookieHeader = (host) =>
  [...jarOf(host)].map(([k, v]) => `${k}=${v}`).join("; ");
const SELF = `http://localhost:${PORT}`;

const REMOTE_PREFIXES = [
  "/sv-api",
  "/shop",
  "/basket",
  "/checkout",
  "/ajax",
  "/faq",
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

function toRemoteHeaders(headers, host) {
  const h = { ...headers, host, "accept-encoding": "identity" };
  for (const k of ["origin", "referer"]) {
    if (h[k]) h[k] = h[k].replace(SELF, `https://${host}`);
  }
  const jar = cookieHeader(host);
  if (jar) h.cookie = jar;
  else delete h.cookie;
  return h;
}

/** https://coralclub.ru[:443]/x → http://localhost:3200/x */
const toSelf = (text, host) =>
  text
    .replaceAll(`https://${host}:443`, SELF)
    .replaceAll(`https://${host}`, SELF);

function fromRemoteHeaders(headers, host) {
  const h = { ...headers };
  if (h.location) h.location = toSelf(h.location, host);
  // the shop's session cookies stay in the proxy's jar
  storeCookies(host, h["set-cookie"]);
  delete h["set-cookie"];
  return h;
}

function request(opts, body) {
  const lib = opts.protocol === "https:" ? https : http;
  return new Promise((resolve, reject) => {
    const r = lib.request(opts, resolve);
    r.setTimeout(60_000, () => r.destroy(new Error("upstream timeout")));
    r.on("error", reject);
    if (body?.length) r.write(body);
    r.end();
  });
}

/**
 * Some country sites (by.coral.club → coral-club.by …) redirect to a domain
 * of their own. A redirect to another origin would make the page's fetch()
 * fail (Safari: "Load failed"), so the proxy follows it itself and answers
 * from the final site — each site keeps its own cookie jar.
 */
const REDIRECT_CODES = new Set([301, 302, 303, 307, 308]);
const SHOP_DOMAIN = /coral[-.]?club/i;
/** by.coral.club → coral-club.by …: learnt from the redirects, so the API
 *  calls (which that site does not redirect) reach the same site and cart. */
const canonical = new Map();

async function toRemote(req, res, body, start = hostOf(req), hops = 0) {
  const host = canonical.get(start) ?? start;
  const upstream = await request(
    {
      protocol: "https:",
      host,
      port: 443,
      method: req.method,
      path: req.url,
      headers: toRemoteHeaders(req.headers, host),
    },
    body,
  );
  const location = upstream.headers.location;
  if (REDIRECT_CODES.has(upstream.statusCode ?? 0) && location && hops < 4) {
    let target = null;
    try {
      target = new URL(location, `https://${host}`);
    } catch {
      /* not a URL — handled below as a plain redirect */
    }
    if (
      target &&
      target.hostname !== host &&
      SHOP_DOMAIN.test(target.hostname)
    ) {
      upstream.resume();
      storeCookies(host, upstream.headers["set-cookie"]);
      canonical.set(start, target.hostname);
      // those redirects drop the query (?610205=1 …): carry it over
      const original = new URL(req.url, "http://x");
      for (const [k, v] of original.searchParams) {
        if (!target.searchParams.has(k)) target.searchParams.append(k, v);
      }
      const toGet =
        [301, 302, 303].includes(upstream.statusCode ?? 0) &&
        req.method !== "GET" &&
        req.method !== "HEAD";
      return toRemote(
        {
          headers: req.headers,
          method: toGet ? "GET" : req.method,
          url: target.pathname.replace(/^\/{2,}/, "/") + target.search,
        },
        res,
        toGet ? Buffer.alloc(0) : body,
        target.hostname,
        hops + 1,
      );
    }
  }
  const headers = fromRemoteHeaders(upstream.headers, host);
  const type = String(headers["content-type"] ?? "");
  if (type.includes("text/html")) {
    const chunks = [];
    for await (const c of upstream) chunks.push(c);
    const html = Buffer.concat(chunks).toString("utf8");
    const rewritten = toSelf(html, host);
    delete headers["content-length"];
    res.writeHead(upstream.statusCode ?? 502, headers);
    res.end(rewritten);
    return;
  }
  res.writeHead(upstream.statusCode ?? 502, headers);
  upstream.on("error", () => res.destroy());
  res.on("error", () => upstream.destroy());
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
  // an unknown local *page* must stay a 404: the shop would redirect it to
  // a regional site (coral-club.by …) and take the tester away from here.
  // Only non-page requests (images, fonts …) fall back to the shop.
  const wantsPage = String(req.headers.accept ?? "").includes("text/html");
  if (
    upstream.statusCode === 404 &&
    !wantsPage &&
    (req.method === "GET" || req.method === "HEAD")
  ) {
    upstream.resume();
    return toRemote(req, res, body);
  }
  res.writeHead(upstream.statusCode ?? 502, upstream.headers);
  upstream.on("error", () => res.destroy());
  res.on("error", () => upstream.destroy());
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

// a broken connection must never take the proxy down
process.on("uncaughtException", (e) => console.error("uncaught:", e.message));
process.on("unhandledRejection", (e) => console.error("unhandled:", e));

server.listen(PORT, () => {
  console.log(
    `proxy ${SELF}  →  shop https://${DEFAULT_HOST} (switchable by cookie cc_shop_site), landing :${LOCAL.port}`,
  );
});
