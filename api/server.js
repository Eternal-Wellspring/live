const http = require("http");
const fs = require("fs");
const path = require("path");
const { URL } = require("url");

const scriptures = require("./scriptures.js");
const bible = require("./bible.js");

const ROOT = path.join(__dirname, "..");
const SITES = path.join(ROOT, "sites");
const PORT = Number(process.argv[2] || 8780);
const RESERVED = new Set([
  "api",
  "images",
  "sites",
  "bible",
  "scriptures",
  "published",
  "sky-images",
]);
const ALIAS = {
  sons: "sons-of-god-arise",
  soga: "sons-of-god-arise",
  sonsofgodarise: "sons-of-god-arise",
  "sons-of-god-arise": "sons-of-god-arise",
};
const MIME = {
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".svg": "image/svg+xml",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".webp": "image/webp",
  ".gif": "image/gif",
  ".ico": "image/x-icon",
  ".txt": "text/plain; charset=utf-8",
  ".xml": "application/xml; charset=utf-8",
  ".woff2": "font/woff2",
};

function sendJson(res, status, obj) {
  const body = JSON.stringify(obj);
  res.writeHead(status, {
    "Content-Type": "application/json; charset=utf-8",
    "Cache-Control": "no-store",
  });
  res.end(body);
}

function vercelRes(res) {
  return {
    setHeader: function (k, v) {
      res.setHeader(k, v);
    },
    status: function (code) {
      res.statusCode = code;
      return this;
    },
    json: function (obj) {
      sendJson(res, res.statusCode || 200, obj);
    },
  };
}

function vercelReq(req, url) {
  const q = {};
  url.searchParams.forEach(function (v, k) {
    q[k] = v;
  });
  return { method: req.method, query: q, headers: req.headers };
}

function safeJoin(root, rel) {
  const resolved = path.resolve(root, rel);
  if (resolved !== root && !resolved.startsWith(root + path.sep)) return null;
  return resolved;
}

function sendFile(res, file, noStore) {
  const ext = path.extname(file).toLowerCase();
  const type = MIME[ext] || "application/octet-stream";
  const headers = { "Content-Type": type };
  if (noStore || ext === ".html" || ext === "") {
    headers["Cache-Control"] = "no-store, max-age=0";
  }
  const stream = fs.createReadStream(file);
  stream.on("error", function () {
    res.writeHead(404);
    res.end();
  });
  res.writeHead(200, headers);
  stream.pipe(res);
}

function resolveSite(folder) {
  folder = ALIAS[String(folder || "").toLowerCase()] || folder;
  if (!folder) return null;
  const direct = path.join(SITES, folder);
  if (fs.existsSync(direct) && fs.statSync(direct).isDirectory()) return direct;
  if (!fs.existsSync(SITES)) return null;
  const names = fs.readdirSync(SITES);
  const want = String(folder).toLowerCase();
  for (let i = 0; i < names.length; i++) {
    const p = path.join(SITES, names[i]);
    if (names[i].toLowerCase() === want && fs.statSync(p).isDirectory()) return p;
  }
  return null;
}

function pretty(urlPath) {
  const parts = urlPath.split("/").filter(Boolean);
  if (!parts.length) return null;
  if (RESERVED.has(parts[0]) || parts[0].indexOf(".") >= 0) return null;
  const site = resolveSite(parts[0]);
  if (!site) return null;
  const rest = parts.slice(1);
  if (!rest.length) {
    const index = path.join(site, "index.html");
    const home = path.join(site, "home.html");
    if (fs.existsSync(index)) return index;
    if (fs.existsSync(home)) return home;
    return index;
  }
  return safeJoin(site, rest.join("/"));
}

function handler(req, res) {
  const url = new URL(req.url || "/", "http://127.0.0.1");
  const p = url.pathname;

  if (p === "/scriptures") {
    scriptures(vercelReq(req, url), vercelRes(res));
    return;
  }
  if (p === "/bible") {
    Promise.resolve(bible(vercelReq(req, url), vercelRes(res))).catch(function () {
      sendJson(res, 502, { error: "Could not open that passage." });
    });
    return;
  }
  if (p === "/sky-images") {
    const list = path.join(ROOT, "images", "sky", "list.json");
    if (fs.existsSync(list)) return sendFile(res, list, true);
    sendJson(res, 200, { images: [], layers: { "1": [], "2": [], "3": [] } });
    return;
  }
  if (p === "/scriptures.json") {
    const master = path.join(SITES, "scriptures.json");
    const fallback = path.join(ROOT, "scriptures.json");
    if (fs.existsSync(master)) return sendFile(res, master, true);
    if (fs.existsSync(fallback)) return sendFile(res, fallback, true);
  }

  let file = pretty(p);
  if (!file) {
    let rel = decodeURIComponent(p);
    if (rel.endsWith("/")) rel += "index.html";
    if (rel === "/") rel = "/index.html";
    file = safeJoin(ROOT, rel.replace(/^\//, ""));
  }
  if (!file) {
    res.writeHead(404);
    res.end();
    return;
  }
  fs.stat(file, function (err, st) {
    if (!err && st.isDirectory()) {
      const index = path.join(file, "index.html");
      if (fs.existsSync(index)) return sendFile(res, index, true);
      res.writeHead(404);
      res.end();
      return;
    }
    if (err) {
      res.writeHead(404);
      res.end();
      return;
    }
    sendFile(res, file, true);
  });
}

http.createServer(handler).listen(PORT, "0.0.0.0", function () {
  console.log("Web Live APIs  http://127.0.0.1:%s/", PORT);
});
