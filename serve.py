#!/usr/bin/env python3
"""Eternal Wellspring — public site; Web Develop 8778, Test 8779, Live 8780."""

from __future__ import annotations

import json
import sys
import re
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path
from urllib.parse import parse_qs, urlparse
from urllib.request import Request, urlopen

LIVE = Path(__file__).resolve().parent
SKY_EXTS = {".jpg", ".jpeg", ".png", ".webp", ".gif"}
SOGA = LIVE / "soga"
PUBLISHED = LIVE / "sites"
_RESERVED = {"api", "images", "sites", "bible", "scriptures", "published"}
SCRIPTURES = LIVE / "sites" / "scriptures.json"
SCRIPTURES_FALLBACK = LIVE / "scriptures.json"
_REF_SPAN = re.compile(
    r"^(\S+)\s+(\d+)\s*:\s*(\d+)(?:\s*[-–—]\s*(?:(\d+)\s*:)?(\d+))?$"
)


def _web_port():
    if len(sys.argv) > 1 and str(sys.argv[1]).strip().isdigit():
        n = int(sys.argv[1])
        if 1 <= n <= 65535:
            return n
    name = Path(__file__).resolve().parent.name
    return {"Sites 1 Develop": 8778, "Sites 2 Test": 8779, "Sites 3 Live": 8780}.get(name, 8778)

PORT = _web_port()
_PUB_FOLDER = re.compile(r"/(?:published|sites)/([^/]+)/")
SITE_ALIASES = {
    "sons": "sons-of-god-arise",
    "soga": "sons-of-god-arise",
    "sonsofgodarise": "sons-of-god-arise",
    "sons-of-god-arise": "sons-of-god-arise",
}


def scripture_key(ref: str) -> str:
    return re.sub(r"\s+", " ", str(ref or "")).strip().lower()


def scriptures_file() -> Path:
    if SCRIPTURES.is_file():
        return SCRIPTURES
    if SCRIPTURES_FALLBACK.is_file():
        return SCRIPTURES_FALLBACK
    return SCRIPTURES


def load_scriptures() -> dict:
    path = scriptures_file()
    if not path.is_file():
        return {"translation": "NKJV", "verses": []}
    try:
        data = json.loads(path.read_text(encoding="utf-8"))
    except Exception:
        return {"translation": "NKJV", "verses": []}
    if not isinstance(data, dict) or not isinstance(data.get("verses"), list):
        return {"translation": "NKJV", "verses": []}
    return data


def find_in_store(store: dict, ref: str):
    want = scripture_key(ref)
    if not want:
        return None
    for row in (store or {}).get("verses") or []:
        if scripture_key(row.get("reference") or "") == want:
            return row
    return None


def with_ref_line(text: str, ref: str) -> str:
    ref = str(ref or "").strip()
    text = str(text or "")
    if not ref:
        return text
    lines = text.split("\n")
    if not lines:
        return ref
    if scripture_key(lines[0]) == scripture_key(ref):
        lines[0] = ref
        return "\n".join(lines)
    return text


def parse_ref_span(ref: str):
    m = _REF_SPAN.match(scripture_key(ref))
    if not m:
        return None
    book = m.group(1)
    ch1 = int(m.group(2))
    vs1 = int(m.group(3))
    if m.group(4):
        ch2 = int(m.group(4))
        vs2 = int(m.group(5) or vs1)
        if ch2 != ch1:
            return None
    else:
        vs2 = int(m.group(5) or vs1)
    return book, ch1, vs1, vs2


def split_stored_verses(text: str) -> dict:
    raw = str(text or "")
    out = {}
    for m in re.finditer(r"<p>\s*<sup>\s*(\d+)\s*</sup>\s*([\s\S]*?)</p>", raw, re.I):
        out[int(m.group(1))] = m.group(2).strip()
    if out:
        return out
    parts = re.split(r"(?:<br\s*/?>|\n)+", raw)
    if parts and _REF_SPAN.match(scripture_key(parts[0].strip())):
        parts = parts[1:]
    cur = None
    buf = []
    for line in parts:
        m = re.match(r"^\s*(\d+)\s+(.*)$", line)
        if m:
            if cur is not None:
                out[cur] = "\n".join(buf).strip()
            cur = int(m.group(1))
            buf = [m.group(2)]
        elif cur is not None:
            buf.append(line)
    if cur is not None:
        out[cur] = "\n".join(buf).strip()
    return out


def _row_span(row):
    sp = parse_ref_span(row.get("reference") or "")
    if sp:
        return sp
    text = str(row.get("text") or "")
    first = text.split("\n", 1)[0].strip()
    sp = parse_ref_span(first)
    if sp:
        return sp
    first = re.sub(r"\s+[-–—].*$", "", first).strip()
    return parse_ref_span(first)


def _absorb_verses(store: dict, book, ch, vs1, vs2, by_vs: dict):
    scored = []
    for row in (store or {}).get("verses") or []:
        sp = _row_span(row)
        if not sp or sp[0] != book or sp[1] != ch:
            continue
        if sp[3] < vs1 or sp[2] > vs2:
            continue
        scored.append((sp[3] - sp[2], row))
    scored.sort(key=lambda x: x[0])
    added = 0
    for _, row in scored:
        for vs, html in split_stored_verses(row.get("text") or "").items():
            if vs1 <= vs <= vs2 and vs not in by_vs and html:
                by_vs[vs] = html
                added += 1
    return added


def assemble_scripture(ref: str):
    store = load_scriptures()
    exact = find_in_store(store, ref)
    if exact:
        return exact
    span = parse_ref_span(ref)
    if not span:
        return None
    book, ch, vs1, vs2 = span
    by_vs = {}
    _absorb_verses(store, book, ch, vs1, vs2, by_vs)
    if not by_vs:
        return None
    bits = [ref]
    missing = []
    for vs in range(vs1, vs2 + 1):
        if vs in by_vs:
            bits.append("%s %s" % (vs, by_vs[vs]))
        else:
            missing.append(vs)
            bits.append("%s ..." % vs)
    return {"reference": ref, "text": "\n".join(bits), "missing": missing}


def site_folder_key(name: str) -> str:
    k = str(name or "").strip().lower()
    return SITE_ALIASES.get(k, k)


def resolve_site_dir(folder: str):
    raw = str(folder or "").strip()
    if not raw:
        return None
    direct = PUBLISHED / raw
    if direct.is_dir():
        return direct
    want = raw.lower()
    if PUBLISHED.is_dir():
        for path in PUBLISHED.iterdir():
            if path.is_dir() and path.name.lower() == want:
                return path
    return None


def folder_from_host(host: str) -> str:
    name = (host or "").split(":")[0].strip().lower()
    if not name or name in ("localhost", "127.0.0.1"):
        return ""
    label = name.split(".")[0]
    return SITE_ALIASES.get(label, "")


def pretty_site_target(path: str, host: str = ""):
    parts = [p for p in path.strip("/").split("/") if p]
    folder = folder_from_host(host)
    rest = parts
    if not folder:
        if not parts or "." in parts[0] or parts[0] in _RESERVED:
            return None
        folder = site_folder_key(parts[0])
        rest = parts[1:]
    site = resolve_site_dir(folder)
    if not site:
        return None
    if not rest:
        if (site / "index.html").is_file():
            page = "index.html"
        elif (site / "home.html").is_file():
            page = "home.html"
        else:
            ones = sorted(site.glob("1-*.html"))
            page = ones[0].name if ones else "index.html"
        return site, page
    return site, "/".join(rest)


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
                    if not n.startswith("sky"):
                        continue
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
            want = scripture_key(ref)
            data = load_scriptures()
            if not want:
                return self._json(200, {"translation": "NKJV", "count": len(data.get("verses") or [])})
            row = assemble_scripture(ref)
            if not row:
                return self._json(200, {"found": False, "reference": ref, "text": ""})
            shown_ref = row.get("reference") or ref
            shown_text = with_ref_line(row.get("text") or "", shown_ref)
            return self._json(
                200,
                {
                    "found": True,
                    "reference": shown_ref,
                    "text": shown_text,
                    "missing": row.get("missing") or [],
                },
            )
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
        if path.startswith("/published/") or path == "/published":
            return self._serve_dir(PUBLISHED, path[11:])
        if path == "/scriptures.json":
            if SCRIPTURES.is_file():
                return self._serve_dir(PUBLISHED, "scriptures.json")
            return SimpleHTTPRequestHandler.do_GET(self)
        if path == "/site.js":
            return self._serve_dir(SOGA, "site.js")
        host = self.headers.get("Host") or ""
        mapped = pretty_site_target(path, host)
        if mapped:
            segs = [p for p in path.strip("/").split("/") if p]
            if len(segs) == 1 and not path.endswith("/") and not folder_from_host(host):
                self.send_response(302)
                self.send_header("Location", path + "/")
                self.end_headers()
                return
            return self._serve_dir(mapped[0], mapped[1])
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
