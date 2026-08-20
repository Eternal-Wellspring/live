module.exports = async function handler(req, res) {
  res.setHeader("Cache-Control", "no-store");
  res.setHeader("Content-Type", "application/json; charset=utf-8");
  if (req.method !== "GET") {
    res.status(405).json({ error: "GET only." });
    return;
  }
  const tr = String((req.query && req.query.tr) || "KJV");
  const book = String((req.query && req.query.book) || "");
  const chapter = String((req.query && req.query.chapter) || "");
  if (!/^[A-Za-z0-9]+$/.test(tr) || !/^\d+$/.test(book) || !/^\d+$/.test(chapter)) {
    res.status(400).json({ error: "Bad passage." });
    return;
  }
  const url = "https://bolls.life/get-text/" + tr + "/" + book + "/" + chapter + "/";
  try {
    const r = await fetch(url, { headers: { "User-Agent": "EternalWellspring/1" } });
    if (!r.ok) throw new Error("bad");
    let raw = await r.json();
    if (Array.isArray(raw)) {
      raw.forEach(function (row) {
        if (row && typeof row.text === "string") {
          row.text = row.text
            .replace(/<S\b[^>]*>[\s\S]*?<\/S>/gi, "")
            .replace(/<\/?S\b[^>]*>/gi, "")
            .replace(/\{(?:H|G)?\d+\}/gi, "");
        }
      });
    }
    res.status(200).json(raw);
  } catch (e) {
    res.status(502).json({ error: "Could not open that passage." });
  }
};
