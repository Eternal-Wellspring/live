const fs = require("fs");
const path = require("path");

const REF_SPAN = /^(\S+)\s+(\d+)\s*:\s*(\d+)(?:\s*[-–—]\s*(?:(\d+)\s*:)?(\d+))?$/;

function scriptureKey(ref) {
  return String(ref || "")
    .replace(/\s+/g, " ")
    .trim()
    .toLowerCase();
}

function scripturesFile() {
  const names = [
    path.join(process.cwd(), "sites", "scriptures.json"),
    path.join(__dirname, "..", "sites", "scriptures.json"),
    path.join(process.cwd(), "scriptures.json"),
    path.join(__dirname, "..", "scriptures.json"),
  ];
  for (let i = 0; i < names.length; i++) {
    if (fs.existsSync(names[i])) return names[i];
  }
  return names[0];
}

function loadScriptures() {
  try {
    const data = JSON.parse(fs.readFileSync(scripturesFile(), "utf8"));
    if (!data || typeof data !== "object" || !Array.isArray(data.verses)) {
      return { translation: "NKJV", verses: [] };
    }
    return data;
  } catch (e) {
    return { translation: "NKJV", verses: [] };
  }
}

function findInStore(store, ref) {
  const want = scriptureKey(ref);
  if (!want) return null;
  const verses = (store && store.verses) || [];
  for (let i = 0; i < verses.length; i++) {
    if (scriptureKey(verses[i].reference) === want) return verses[i];
  }
  return null;
}

function withRefLine(text, ref) {
  ref = String(ref || "").trim();
  text = String(text || "");
  if (!ref) return text;
  const lines = text.split("\n");
  if (!lines.length) return ref;
  if (scriptureKey(lines[0]) === scriptureKey(ref)) {
    lines[0] = ref;
    return lines.join("\n");
  }
  return text;
}

function parseRefSpan(ref) {
  const m = scriptureKey(ref).match(REF_SPAN);
  if (!m) return null;
  const book = m[1];
  const ch1 = Number(m[2]);
  const vs1 = Number(m[3]);
  let vs2 = vs1;
  if (m[4]) {
    if (Number(m[4]) !== ch1) return null;
    vs2 = Number(m[5] || vs1);
  } else if (m[5]) {
    vs2 = Number(m[5]);
  }
  return { book: book, ch: ch1, vs1: vs1, vs2: vs2 };
}

function splitStoredVerses(text) {
  const raw = String(text || "");
  const out = {};
  const pRe = /<p>\s*<sup>\s*(\d+)\s*<\/sup>\s*([\s\S]*?)<\/p>/gi;
  let m;
  while ((m = pRe.exec(raw))) {
    out[Number(m[1])] = String(m[2] || "").trim();
  }
  if (Object.keys(out).length) return out;
  let parts = raw.split(/(?:<br\s*\/?>|\n)+/);
  if (parts.length && REF_SPAN.test(scriptureKey(parts[0].trim()))) parts = parts.slice(1);
  let cur = null;
  let buf = [];
  for (let i = 0; i < parts.length; i++) {
    const line = parts[i];
    const vm = String(line || "").match(/^\s*(\d+)\s+(.*)$/);
    if (vm) {
      if (cur != null) out[cur] = buf.join("\n").trim();
      cur = Number(vm[1]);
      buf = [vm[2]];
    } else if (cur != null) {
      buf.push(line);
    }
  }
  if (cur != null) out[cur] = buf.join("\n").trim();
  return out;
}

function rowSpan(row) {
  let sp = parseRefSpan((row && row.reference) || "");
  if (sp) return sp;
  const text = String((row && row.text) || "");
  let first = text.split("\n", 1)[0].trim();
  sp = parseRefSpan(first);
  if (sp) return sp;
  first = first.replace(/\s+[-–—].*$/, "").trim();
  return parseRefSpan(first);
}

function absorbVerses(store, book, ch, vs1, vs2, byVs) {
  const scored = [];
  const verses = (store && store.verses) || [];
  for (let i = 0; i < verses.length; i++) {
    const sp = rowSpan(verses[i]);
    if (!sp || sp.book !== book || sp.ch !== ch) continue;
    if (sp.vs2 < vs1 || sp.vs1 > vs2) continue;
    scored.push({ w: sp.vs2 - sp.vs1, row: verses[i] });
  }
  scored.sort(function (a, b) {
    return a.w - b.w;
  });
  for (let s = 0; s < scored.length; s++) {
    const bits = splitStoredVerses(scored[s].row.text || "");
    Object.keys(bits).forEach(function (k) {
      const vs = Number(k);
      const html = bits[k];
      if (vs1 <= vs && vs <= vs2 && !byVs[vs] && html) byVs[vs] = html;
    });
  }
}

function assembleScripture(ref) {
  const store = loadScriptures();
  const exact = findInStore(store, ref);
  if (exact) return exact;
  const span = parseRefSpan(ref);
  if (!span) return null;
  const byVs = {};
  absorbVerses(store, span.book, span.ch, span.vs1, span.vs2, byVs);
  if (!Object.keys(byVs).length) return null;
  const bits = [ref];
  const missing = [];
  for (let vs = span.vs1; vs <= span.vs2; vs++) {
    if (byVs[vs]) bits.push(vs + " " + byVs[vs]);
    else {
      missing.push(vs);
      bits.push(vs + " ...");
    }
  }
  return { reference: ref, text: bits.join("\n"), missing: missing };
}

module.exports = function handler(req, res) {
  res.setHeader("Cache-Control", "no-store");
  res.setHeader("Content-Type", "application/json; charset=utf-8");
  if (req.method !== "GET") {
    res.status(405).json({ error: "GET only." });
    return;
  }
  const data = loadScriptures();
  const raw = String((req.query && req.query.ref) || "");
  const want = scriptureKey(raw);
  if (!want) {
    res.status(200).json({ translation: "NKJV", count: (data.verses || []).length });
    return;
  }
  const row = assembleScripture(raw);
  if (!row) {
    res.status(200).json({ found: false, reference: raw, text: "" });
    return;
  }
  const shownRef = row.reference || raw;
  res.status(200).json({
    found: true,
    reference: shownRef,
    text: withRefLine(row.text || "", shownRef),
    missing: row.missing || [],
  });
};
