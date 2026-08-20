const fs = require("fs");
const path = require("path");

function key(ref) {
  return String(ref || "").replace(/\s+/g, " ").trim().toLowerCase();
}

function load() {
  const file = path.join(process.cwd(), "scriptures.json");
  try {
    return JSON.parse(fs.readFileSync(file, "utf8"));
  } catch (e) {
    return { verses: [] };
  }
}

module.exports = function handler(req, res) {
  res.setHeader("Cache-Control", "no-store");
  res.setHeader("Content-Type", "application/json; charset=utf-8");
  if (req.method !== "GET") {
    res.status(405).json({ error: "GET only." });
    return;
  }
  const data = load();
  const raw = String((req.query && req.query.ref) || "");
  const want = key(raw);
  if (!want) {
    res.status(200).json({ translation: "NKJV", count: (data.verses || []).length });
    return;
  }
  const verses = data.verses || [];
  for (let i = 0; i < verses.length; i++) {
    if (key(verses[i].reference) === want) {
      res.status(200).json({
        found: true,
        reference: verses[i].reference || raw,
        text: verses[i].text || "",
      });
      return;
    }
  }
  res.status(200).json({ found: false, reference: raw, text: "" });
};
