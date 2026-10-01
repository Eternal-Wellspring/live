const fs = require("fs");
const path = require("path");

const TOPIC_FILE = /^topic-(\d+)\.json$/;
const REF_FILE = /^ref-(\d+)-(\d+)\.json$/;

function dataDir() {
  const names = [
    path.join(process.cwd(), "sites", "Scripture-Narratives", "data"),
    path.join(__dirname, "..", "sites", "Scripture-Narratives", "data"),
  ];
  for (let i = 0; i < names.length; i++) {
    if (fs.existsSync(names[i])) return names[i];
  }
  return names[0];
}

function topicDirs() {
  const root = dataDir();
  if (!fs.existsSync(root)) return [];
  return fs
    .readdirSync(root, { withFileTypes: true })
    .filter(function (d) {
      return d.isDirectory() && d.name.charAt(0) !== "." && d.name !== "BU";
    })
    .map(function (d) {
      return path.join(root, d.name);
    });
}

function readJson(file) {
  try {
    return JSON.parse(fs.readFileSync(file, "utf8"));
  } catch (e) {
    return null;
  }
}

function loadTopics() {
  const rows = [];
  topicDirs().forEach(function (folder) {
    let names = [];
    try {
      names = fs.readdirSync(folder);
    } catch (e) {
      return;
    }
    names.forEach(function (name) {
      if (!TOPIC_FILE.test(name)) return;
      const item = readJson(path.join(folder, name));
      if (!item || typeof item !== "object" || item.id == null) return;
      const row = Object.assign({}, item);
      row.folder = path.basename(folder);
      rows.push(row);
    });
  });
  rows.sort(function (a, b) {
    const seq = (Number(a.seq) || 0) - (Number(b.seq) || 0);
    if (seq) return seq;
    return (Number(a.id) || 0) - (Number(b.id) || 0);
  });
  return rows;
}

function loadRefs() {
  const seq = {};
  loadTopics().forEach(function (topic) {
    const id = Number(topic.id);
    if (!Number.isFinite(id)) return;
    seq[id] = Number(topic.seq) || 0;
  });
  const rows = [];
  topicDirs().forEach(function (folder) {
    let names = [];
    try {
      names = fs.readdirSync(folder);
    } catch (e) {
      return;
    }
    names.forEach(function (name) {
      const match = REF_FILE.exec(name);
      if (!match) return;
      const item = readJson(path.join(folder, name));
      if (!item || typeof item !== "object") return;
      const ref = String(item.ref || "").trim();
      if (item.topic_id == null || !ref) return;
      const row = Object.assign({}, item);
      row._n = Number(match[2]);
      rows.push(row);
    });
  });
  rows.sort(function (a, b) {
    const as = seq[Number(a.topic_id) || 0];
    const bs = seq[Number(b.topic_id) || 0];
    const left = as == null ? 1e9 : as;
    const right = bs == null ? 1e9 : bs;
    if (left !== right) return left - right;
    return (Number(a._n) || 0) - (Number(b._n) || 0);
  });
  rows.forEach(function (row) {
    delete row._n;
  });
  return rows;
}

function loadSections() {
  const file = path.join(dataDir(), "sections.json");
  const data = readJson(file);
  return data && typeof data === "object" && !Array.isArray(data) ? data : {};
}

function partOf(req) {
  const q = (req && req.query) || {};
  if (q.part) return String(q.part);
  const url = String((req && req.url) || "");
  if (url.indexOf("topic-refs") >= 0) return "refs";
  if (url.indexOf("sections") >= 0) return "sections";
  return "topics";
}

module.exports = function handler(req, res) {
  res.setHeader("Cache-Control", "no-store");
  res.setHeader("Content-Type", "application/json; charset=utf-8");
  if (req.method !== "GET") {
    res.status(405).json({ error: "GET only." });
    return;
  }
  const part = partOf(req);
  if (part === "refs" || part === "topic-refs") {
    res.status(200).json(loadRefs());
    return;
  }
  if (part === "sections") {
    res.status(200).json(loadSections());
    return;
  }
  res.status(200).json(loadTopics());
};
