#!/usr/bin/env python3
"""Eternal Wellspring — public live site, port 8766."""

from __future__ import annotations

import json
import re
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path
from urllib.parse import parse_qs, urlparse
from urllib.request import Request, urlopen

LIVE = Path(__file__).resolve().parent
SKY_EXTS = {".jpg", ".jpeg", ".png", ".webp", ".gif"}
SOGA = LIVE / "soga"
PUBLISHED = LIVE / "published"
SCRIPTURES = LIVE / "scriptures.json"
PORT = 8766
_PUB_FOLDER = re.compile(r"/published/([^/]+)/")


def scriptures_path(handler) -> Path:
    q = parse_qs(urlparse(handler.path).query)
    folder = (q.get("folder") or [""])[0]
    if not folder:
        m = _PUB_FOLDER.search(handler.headers.get("Referer") or "")
        if m:
            folder = m.group(1)
    folder = re.sub(r"[^a-zA-Z0-9_-]", "", folder or "")
    if folder:
        path = PUBLISHED / folder / "scriptures.json"
        if path.exists():
            return path
    soga = PUBLISHED / "sons-of-god-arise" / "scriptures.json"
    if soga.exists():
        return soga
    return SCRIPTURES


class Handler(SimpleHTTPRequestHandler):
    def __init__(self, *args, **kwargs):
        SimpleHTTPRequestHandler.__init__(self, *args, directory=str(LIVE), **kwargs)

    def end_headers(self):
        path = urlparse(self.path).path
        if path.endswith(".html") or path.endswith("/") or not Path(path).suffix:
            self.send_header("Cache-Control", "no-store, max-age=0")
            self.send_header("Pragma", "no-cache")
        SimpleHTTPRequestHandler.end_headers(self)

    def _serve_dir(self, root: Path, rel: str):
        incoming = self.path
        q = urlparse(incoming).query
        suffix = ("?" + q) if q else ""
        clean = rel.lstrip("/") or "index.html"
        self.path = "/" + clean + suffix
        self.directory = str(root)
        try:
            return SimpleHTTPRequestHandler.do_GET(self)
        finally:
            self.directory = str(LIVE)
            self.path = incoming

    def _json(self, code, payload):
        body = json.dumps(payload).encode("utf-8")
        self.send_response(code)
        self.send_header("Content-Type", "application/json; charset=utf-8")
        self.send_header("Content-Length", str(len(body)))
        self.end_headers()
        self.wfile.write(body)

    def do_GET(self):
        path = urlparse(self.path).path
        site_img = re.match(r"/sites/([^/]+)/images/(.+)$", path)
        if site_img:
            return self._serve_dir(PUBLISHED / site_img.group(1) / "images", site_img.group(2))
        if path == "/sky-images":
            folder = LIVE / "images" / "sky"
            layers = {"1": [], "2": [], "3": []}
            if folder.is_dir():
                for p in sorted(folder.iterdir(), key=lambda x: x.name.lower()):
                    if not (p.is_file() and p.suffix.lower() in SKY_EXTS):
                        continue
                    n = p.name.lower()
                    m = (
                        re.search(r"[-_ .]([123])\.[^.]+$", n)
                        or re.search(r"[-_]([123])[-_]", n)
                        or re.match(r"^([123])[-_]", n)
                    )
                    key = m.group(1) if m else "3"
                    layers[key].append("/images/sky/" + p.name)
            flat = layers["1"] + layers["2"] + layers["3"]
            if not flat and (LIVE / "images" / "ew-sky.jpg").exists():
                layers["3"] = ["/images/ew-sky.jpg"]
                flat = layers["3"][:]
            return self._json(200, {"images": flat, "layers": layers})
        if path == "/scriptures":
            q = parse_qs(urlparse(self.path).query)
            ref = (q.get("ref") or [""])[0]
            want = re.sub(r"\s+", " ", ref).strip().lower()
            store = scriptures_path(self)
            try:
                data = json.loads(store.read_text(encoding="utf-8")) if store.exists() else {"verses": []}
            except Exception:
                data = {"verses": []}
            if not want:
                return self._json(200, {"translation": "NKJV", "count": len(data.get("verses") or [])})
            for row in data.get("verses") or []:
                if re.sub(r"\s+", " ", str(row.get("reference") or "")).strip().lower() == want:
                    return self._json(200, {"found": True, "reference": row.get("reference") or ref, "text": row.get("text") or ""})
            return self._json(200, {"found": False, "reference": ref, "text": ""})
        if path == "/bible":
            q = parse_qs(urlparse(self.path).query)
            tr = (q.get("tr") or ["KJV"])[0]
            book = (q.get("book") or [""])[0]
            chapter = (q.get("chapter") or [""])[0]
            if not tr.isalnum() or not book.isdigit() or not chapter.isdigit():
                return self._json(400, {"error": "Bad passage."})
            url = "https://bolls.life/get-text/%s/%s/%s/" % (tr, book, chapter)
            try:
                req = Request(url, headers={"User-Agent": "EternalWellspring/1"})
                with urlopen(req, timeout=12) as res:
                    raw = json.loads(res.read().decode("utf-8"))
                if isinstance(raw, list):
                    for row in raw:
                        if isinstance(row, dict) and "text" in row:
                            row["text"] = re.sub(r"<S\b[^>]*>[\s\S]*?</S>", "", str(row["text"]), flags=re.I)
                            row["text"] = re.sub(r"</?S\b[^>]*>", "", row["text"], flags=re.I)
                            row["text"] = re.sub(r"\{(?:H|G)?\d+\}", "", row["text"], flags=re.I)
                body = json.dumps(raw, ensure_ascii=False).encode("utf-8")
                self.send_response(200)
                self.send_header("Content-Type", "application/json; charset=utf-8")
                self.send_header("Cache-Control", "no-store")
                self.send_header("Content-Length", str(len(body)))
                self.end_headers()
                self.wfile.write(body)
            except Exception:
                return self._json(502, {"error": "Could not open that passage."})
            return
        if path.startswith("/soga/") or path == "/soga":
            return self._serve_dir(SOGA, path[6:])
        if path.startswith("/published/") or path == "/published":
            return self._serve_dir(PUBLISHED, path[11:])
        if path == "/scriptures.json":
            return SimpleHTTPRequestHandler.do_GET(self)
        if path == "/site.js":
            return self._serve_dir(SOGA, "site.js")
        return SimpleHTTPRequestHandler.do_GET(self)


def main():
    PUBLISHED.mkdir(parents=True, exist_ok=True)
    lan = "127.0.0.1"
    try:
        import socket
        s = socket.socket(socket.AF_INET, socket.SOCK_DGRAM)
        s.connect(("8.8.8.8", 80))
        lan = s.getsockname()[0]
        s.close()
    except Exception:
        pass
    print("Eternal Wellspring  http://127.0.0.1:%s/" % PORT)
    print("                    http://%s:%s/" % (lan, PORT))
    ThreadingHTTPServer(("0.0.0.0", PORT), Handler).serve_forever()


if __name__ == "__main__":
    main()
