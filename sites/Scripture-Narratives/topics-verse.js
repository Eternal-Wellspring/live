(function () {
  var PAD = 8;
  var GAP_X = 16;
  var GAP_COL = 16;
  var GAP_Y = 8;
  var GAP_BTN = 4;
  var DESC_H = 26;
  var descPlace = { left: 0, right: 0, cap: 0 };
  var VERSE_W = 520;
  var topics = [];
  var topicRefs = [];
  var sel = null;
  var hoverId = null;
  var selVs = 0;
  var boxH = 8;
  var verseCache = {};
  var verseTr = "NKJV";
  var viewChap = null;
  var descOpen = false;
  var descHold = false;
  var descHoldTimer = 0;
  var descSnap = {};
  var bookOpen = false;
  var chapOpen = false;
  var chapFilter = true;
  var pendingEdit = null;
  var rhmLock = 0;
  var PATH_COLORS = ["#15803d", "#b91c1c", "#005eb8", "#c45c26", "#6d28d9"];
  var JOIN_COLOR = "#f6efc8";
  var TRANSLATIONS = [
    { id: "NKJV", label: "NKJV", year: "1982" },
    { id: "ESV", label: "ESV", year: "2016" },
    { id: "AV", label: "AV", slug: "KJV", year: "1769" },
    { id: "KJV", label: "KJV", year: "1769" },
    { id: "NIV", label: "NIV", year: "1984" },
    { id: "NASB", label: "NASB", year: "1995" },
    { id: "NLT", label: "NLT", year: "2015" },
    { id: "WEB", label: "WEB", year: "" },
    { id: "ASV", label: "ASV", year: "1901" },
    { id: "NET", label: "NET", year: "2007" },
    { id: "RSV", label: "RSV", year: "1952" },
    { id: "YLT", label: "YLT", year: "1898" },
    { id: "LSB", label: "LSB", year: "2021" },
    { id: "GNT", label: "GNT", year: "1976" }
  ];
  var CHAPS = [0, 50, 40, 27, 36, 34, 24, 21, 4, 31, 24, 22, 25, 29, 36, 10, 13, 10, 42, 150, 31, 12, 8, 66, 52, 5, 48, 12, 14, 3, 9, 1, 4, 7, 3, 3, 3, 2, 14, 4, 28, 16, 24, 21, 28, 16, 16, 13, 6, 6, 4, 4, 5, 3, 6, 4, 3, 1, 13, 5, 5, 3, 5, 1, 1, 1, 22];
  var EXTRA_CH = { 67: 9, 68: 14, 69: 16, 70: 19, 71: 51, 72: 1, 73: 5, 74: 16, 75: 15, 76: 1, 77: 16, 78: 1, 79: 1, 88: 1, 90: 50 };
  var CANON = "Gen Exo Lev Num Deu Jos Jdg Rut 1Sa 2Sa 1Ki 2Ki 1Ch 2Ch Ezr Neh Est Job Psa Pro Ecc Sng Isa Jer Lam Ezk Dan Hos Jol Amo Oba Jon Mic Nam Hab Zep Hag Zec Mal Mat Mrk Luk Jhn Act Rom 1Co 2Co Gal Eph Php Col 1Th 2Th 1Ti 2Ti Tit Phm Heb Jas 1Pe 2Pe 1Jn 2Jn 3Jn Jud Rev 1Es Tob Jdt Wis Sir Lje Bar 1Ma 2Ma Man 2Es Sus Bel Aza Jub".split(" ");
  var NT_AT = CANON.indexOf("Mat");
  var rootId = (function () {
    var q = location.search.replace(/^\?/, "").split("&");
    var i, p;
    for (i = 0; i < q.length; i++) {
      p = q[i].split("=");
      if (p[0] === "id") return decodeURIComponent(p[1] || "");
    }
    return "";
  })();
  function sid(v) { return String(v); }
  function siteFolder() {
    var m = location.pathname.match(/\/sites\/([^/]+)\//);
    if (m) return decodeURIComponent(m[1]);
    return "Scripture-Narratives";
  }
  function bySeq() {
    return topics.slice().sort(function (a, b) { return (a.seq || 0) - (b.seq || 0); });
  }
  function visible() {
    var list = bySeq();
    if (!rootId) return list;
    var start = -1, rootLv = 1, i;
    for (i = 0; i < list.length; i++) {
      if (sid(list[i].id) === sid(rootId)) {
        start = i;
        rootLv = list[i].level || 1;
        break;
      }
    }
    if (start < 0) return list;
    var out = [list[start]];
    for (i = start + 1; i < list.length; i++) {
      if ((list[i].level || 1) <= rootLv) break;
      out.push(list[i]);
    }
    return out;
  }
  function branchOf(t) {
    var list = bySeq();
    var i, start = -1, lv, out = [];
    if (!t) return out;
    for (i = 0; i < list.length; i++) {
      if (sid(list[i].id) === sid(t.id)) {
        start = i;
        lv = list[i].level || 1;
        break;
      }
    }
    if (start < 0) return out;
    out.push(list[start]);
    for (i = start + 1; i < list.length; i++) {
      if ((list[i].level || 1) <= lv) break;
      out.push(list[i]);
    }
    return out;
  }
  function kids(items, parent) {
    var i, start = -1, lv = parent.level || 1, out = [];
    for (i = 0; i < items.length; i++) {
      if (sid(items[i].id) === sid(parent.id)) { start = i; break; }
    }
    if (start < 0) return out;
    for (i = start + 1; i < items.length; i++) {
      var k = items[i].level || 1;
      if (k <= lv) break;
      if (k === lv + 1) out.push(items[i]);
    }
    return out;
  }
  function find(items, id) {
    var i;
    for (i = 0; i < items.length; i++) {
      if (sid(items[i].id) === sid(id)) return items[i];
    }
    return null;
  }
  function findBox(els, id) {
    var i;
    for (i = 0; i < els.length; i++) {
      if (sid(els[i].dataset.id) === sid(id)) return els[i];
    }
    return null;
  }
  function descText(topic) {
    return topic ? String(topic.description || topic.notes || "") : "";
  }
  function refLabelW(text) {
    var p = document.createElement("span");
    p.style.cssText = "position:absolute;left:0;top:0;visibility:hidden;white-space:nowrap;font:700 16px/1.2 Arial,Helvetica,sans-serif;padding:0 0.15rem";
    p.textContent = text || "";
    document.body.appendChild(p);
    var w = Math.ceil(p.offsetWidth);
    document.body.removeChild(p);
    return w;
  }
  function textSize(title) {
    var p = document.createElement("span");
    p.style.cssText = "position:absolute;left:0;top:0;visibility:hidden;white-space:nowrap;font:400 13px/1.2 Arial,Helvetica,sans-serif;padding:0.2rem 0.45rem;border:1px solid #c5d0d4;display:inline-block;box-sizing:border-box";
    p.textContent = title || "";
    document.body.appendChild(p);
    var s = { w: Math.ceil(p.offsetWidth), h: Math.ceil(p.offsetHeight) };
    document.body.removeChild(p);
    return s;
  }
  function descCap() {
    return descPlace.cap ? Math.max(DESC_H, descPlace.cap - PAD - GAP_Y) : DESC_H;
  }
  function descWidth() {
    var left = descPlace.left || PAD;
    return Math.max(120, (descPlace.right || (left + 240)) - left);
  }
  function descH(text, colW) {
    var box, ta, h;
    if (!colW) return boxH;
    box = document.createElement("div");
    ta = document.createElement("textarea");
    box.style.cssText = "position:absolute;left:0;top:0;visibility:hidden;box-sizing:border-box;border:1px solid #c5d0d4;width:" + Math.max(8, colW) + "px";
    ta.style.cssText = "display:block;width:100%;height:auto;margin:0;padding:0.2rem 0.45rem;border:0;font:400 13px/1.2 Arial,Helvetica,sans-serif;white-space:pre-wrap;overflow-wrap:break-word;word-wrap:break-word;overflow:hidden;resize:none;box-sizing:border-box";
    ta.value = text || "";
    box.appendChild(ta);
    document.body.appendChild(box);
    h = Math.max(DESC_H, ta.scrollHeight + 2);
    document.body.removeChild(box);
    return h;
  }
  function parseRefParts(lab) {
    var m = String(lab || "").trim().match(/^(\S+)\s+(\d+)\s*:\s*(\d+)(?:\s*[-–—]\s*(\d+))?$/);
    if (!m) return null;
    return { book: m[1], ch: Number(m[2]), a: Number(m[3]), b: Number(m[4] || m[3]) };
  }
  function combineRefs(list) {
    var parsed = [], rest = [], i, p, acc = null, out = [];
    function joinRef(p) {
      return p.a === p.b ? (p.book + " " + p.ch + ":" + p.a) : (p.book + " " + p.ch + ":" + p.a + "-" + p.b);
    }
    for (i = 0; i < list.length; i++) {
      p = parseRefParts(list[i]);
      if (p) parsed.push(p);
      else rest.push(list[i]);
    }
    parsed.sort(function (a, b) {
      var ia = CANON.indexOf(a.book), ib = CANON.indexOf(b.book);
      if (ia !== ib) return ia - ib;
      if (a.ch !== b.ch) return a.ch - b.ch;
      return a.a - b.a;
    });
    for (i = 0; i < parsed.length; i++) {
      p = parsed[i];
      if (acc && acc.book === p.book && acc.ch === p.ch && acc.b + 1 >= p.a) {
        acc.b = Math.max(acc.b, p.b);
      } else {
        if (acc) out.push(joinRef(acc));
        acc = { book: p.book, ch: p.ch, a: p.a, b: p.b };
      }
    }
    if (acc) out.push(joinRef(acc));
    return out.concat(rest);
  }
  function refsFor(t) {
    var out = [], seen = {}, i, r, lab, ids = {}, br;
    if (!t) return out;
    br = branchOf(t);
    for (i = 0; i < br.length; i++) ids[sid(br[i].id)] = 1;
    for (i = 0; i < topicRefs.length; i++) {
      r = topicRefs[i];
      if (!ids[sid(r.topic_id)]) continue;
      lab = String(r.ref || "").trim();
      if (!lab || seen[lab]) continue;
      seen[lab] = 1;
      out.push(lab);
    }
    return combineRefs(out);
  }
  function ownRefs(t) {
    var out = [], seen = {}, i, r, lab;
    if (!t) return out;
    for (i = 0; i < topicRefs.length; i++) {
      r = topicRefs[i];
      if (sid(r.topic_id) !== sid(t.id)) continue;
      lab = String(r.ref || "").trim();
      if (!lab || seen[lab]) continue;
      seen[lab] = 1;
      out.push(lab);
    }
    return combineRefs(out);
  }
  function refIsChap(lab) {
    var p = parseRefParts(lab);
    return !!(p && viewChap && p.book === viewChap.abbr && p.ch === viewChap.ch);
  }
  function refN(t) {
    return refsFor(t).length;
  }
  function isLeaf(t) {
    return !!(t && kids(bySeq(), t).length === 0);
  }
  function parentTopic(t) {
    var list = bySeq();
    var i, lv = t.level || 1, idx = -1;
    for (i = 0; i < list.length; i++) {
      if (sid(list[i].id) === sid(t.id)) { idx = i; break; }
    }
    if (idx < 0) return null;
    for (i = idx - 1; i >= 0; i--) {
      if ((list[i].level || 1) < lv) return list[i];
    }
    return null;
  }
  function visIds() {
    var items = visible();
    var ids = {}, i;
    for (i = 0; i < items.length; i++) ids[sid(items[i].id)] = 1;
    return ids;
  }
  function ownHits(t, book, ch, vs) {
    var i, r, p, fa, fb;
    if (!t) return false;
    for (i = 0; i < topicRefs.length; i++) {
      r = topicRefs[i];
      if (sid(r.topic_id) !== sid(t.id)) continue;
      p = parseRefParts(r.ref);
      if (!p || p.book !== book || p.ch !== ch) continue;
      fa = Number(r.from) || p.a;
      fb = Number(r.to) || p.b;
      if (vs >= fa && vs <= fb) return true;
    }
    return false;
  }
  function hitsInChapter() {
    var set = {}, ids = visIds(), i, r, p, fa, fb, n;
    if (!viewChap) return set;
    for (i = 0; i < topicRefs.length; i++) {
      r = topicRefs[i];
      if (!ids[sid(r.topic_id)]) continue;
      p = parseRefParts(r.ref);
      if (!p || p.book !== viewChap.abbr || p.ch !== viewChap.ch) continue;
      fa = Number(r.from) || p.a;
      fb = Number(r.to) || p.b;
      for (n = fa; n <= fb; n++) set[n] = 1;
    }
    return set;
  }
  function ownHitsChap(t) {
    var i, r, p;
    if (!t || !viewChap) return false;
    for (i = 0; i < topicRefs.length; i++) {
      r = topicRefs[i];
      if (sid(r.topic_id) !== sid(t.id)) continue;
      p = parseRefParts(r.ref);
      if (p && p.book === viewChap.abbr && p.ch === viewChap.ch) return true;
    }
    return false;
  }
  function bottomsForChapter() {
    var items = visible();
    var hit = [], i, t, desc, d, keep;
    if (!viewChap) return hit;
    for (i = 0; i < items.length; i++) {
      t = items[i];
      if (ownHitsChap(t)) hit.push(t);
    }
    keep = [];
    for (i = 0; i < hit.length; i++) {
      t = hit[i];
      desc = branchOf(t);
      var hasDeeper = false;
      for (d = 1; d < desc.length; d++) {
        if (ownHitsChap(desc[d])) { hasDeeper = true; break; }
      }
      if (!hasDeeper && (t.level || 1) > 1) keep.push(t);
    }
    keep.sort(function (a, b) { return (a.seq || 0) - (b.seq || 0); });
    return keep;
  }
  function uniqSeq(list) {
    var seen = {}, out = [], i, t;
    for (i = 0; i < list.length; i++) {
      t = list[i];
      if (!t || seen[sid(t.id)]) continue;
      seen[sid(t.id)] = 1;
      out.push(t);
    }
    out.sort(function (a, b) { return (a.seq || 0) - (b.seq || 0); });
    return out;
  }
  function reverseCols() {
    var bottoms = bottomsForChapter();
    var vis = visible();
    var byLv = {}, t, lv, i, p, maxLv = 0, cols = [], nodes, sisters;
    if (!bottoms.length) return cols;
    for (i = 0; i < bottoms.length; i++) {
      t = bottoms[i];
      while (t && (t.level || 1) > 1) {
        lv = t.level || 1;
        if (lv > maxLv) maxLv = lv;
        if (!byLv[lv]) byLv[lv] = [];
        byLv[lv].push(t);
        t = parentTopic(t);
      }
    }
    for (lv = maxLv; lv >= 2; lv--) {
      nodes = uniqSeq(byLv[lv] || []);
      if (!nodes.length) continue;
      sisters = [];
      for (i = 0; i < nodes.length; i++) {
        p = parentTopic(nodes[i]);
        if (p) sisters = sisters.concat(kids(vis, p));
        else sisters.push(nodes[i]);
      }
      cols.push(uniqSeq(sisters));
    }
    return cols;
  }
  function pathIds() {
    var ids = {}, seeds = [], i, p, book, ch;
    book = viewChap && viewChap.abbr;
    ch = viewChap && viewChap.ch;
    seeds = bottomsForChapter();
    if (selVs && book) {
      seeds = seeds.filter(function (row) { return ownHits(row, book, ch, selVs); });
      if (!seeds.length) seeds = bottomsForChapter();
    }
    for (i = 0; i < seeds.length; i++) {
      p = seeds[i];
      while (p) {
        ids[sid(p.id)] = 1;
        p = parentTopic(p);
      }
    }
    return ids;
  }
  function colorsThrough(t) {
    var bottoms = bottomsForChapter();
    var out = [], i, p;
    if (!t) return out;
    for (i = 0; i < bottoms.length; i++) {
      p = bottoms[i];
      while (p) {
        if (sid(p.id) === sid(t.id)) {
          out.push(i);
          break;
        }
        p = parentTopic(p);
      }
    }
    return out;
  }
  function pathBorder(t) {
    var c = colorsThrough(t);
    if (c.length === 1) return PATH_COLORS[c[0] % PATH_COLORS.length];
    if (c.length >= 2) return JOIN_COLOR;
    return "";
  }
  function tint(el, col) {
    if (!el) return;
    el.style.borderWidth = "1px";
    el.style.borderStyle = "solid";
    el.style.borderColor = col || "#c5d0d4";
    el.style.outline = "";
  }
  function ancestorChain(t) {
    var out = [], p = t;
    while (p && (p.level || 1) > 1) {
      out.push(p);
      p = parentTopic(p);
    }
    return out;
  }
  function mappedChapters() {
    var ids = visIds();
    var by = {}, i, r, p;
    for (i = 0; i < topicRefs.length; i++) {
      r = topicRefs[i];
      if (!ids[sid(r.topic_id)]) continue;
      p = parseRefParts(r.ref);
      if (!p) continue;
      if (!by[p.book]) by[p.book] = {};
      by[p.book][p.ch] = 1;
    }
    return by;
  }
  function mappedBooks() {
    return bookCols(false);
  }
  function bookCols(all) {
    var by = mappedChapters();
    var ot = [], nt = [], i, b, seen = {};
    for (i = 0; i < CANON.length; i++) {
      b = CANON[i];
      if (!all && !by[b]) continue;
      seen[b] = 1;
      if (i >= NT_AT && i < 66) nt.push(b);
      else ot.push(b);
    }
    if (!all) {
      for (b in by) {
        if (by.hasOwnProperty(b) && !seen[b]) ot.push(b);
      }
    }
    return { ot: ot, nt: nt, by: by };
  }
  function mappedChapList() {
    var by = mappedChapters();
    var out = [], i, b, chs, c, n;
    for (i = 0; i < CANON.length; i++) {
      b = CANON[i];
      if (!by[b]) continue;
      chs = Object.keys(by[b]).map(Number).sort(function (a, d) { return a - d; });
      n = bookNum(b);
      for (c = 0; c < chs.length; c++) out.push({ abbr: b, ch: chs[c], num: n });
    }
    return out;
  }
  function chapIndex(list) {
    var i;
    if (!viewChap) return -1;
    for (i = 0; i < list.length; i++) {
      if (list[i].abbr === viewChap.abbr && list[i].ch === viewChap.ch) return i;
    }
    return -1;
  }
  function firstMappedChap() {
    var maps = mappedBooks();
    var list = maps.ot.concat(maps.nt);
    var b, chs, n;
    if (!list.length) return { abbr: "Gen", ch: 1, num: 1 };
    b = list[0];
    chs = Object.keys(maps.by[b]).map(Number).sort(function (a, c) { return a - c; });
    n = bookNum(b);
    return { abbr: b, ch: chs[0] || 1, num: n };
  }
  function bookNum(abbr) {
    var i = CANON.indexOf(abbr);
    if (i < 0) return 0;
    if (i < 66) return i + 1;
    var extra = { "1Es": 67, "Tob": 68, "Jdt": 69, "Wis": 70, "Sir": 71, "Lje": 72, "Bar": 73, "1Ma": 74, "2Ma": 75, "Man": 76, "2Es": 77, "Sus": 78, "Bel": 79, "Aza": 88, "Jub": 90 };
    return extra[abbr] || 0;
  }
  function chCount(num) {
    if (num <= 66) return CHAPS[num] || 1;
    return EXTRA_CH[num] || 1;
  }
  function cacheKey() {
    return (viewChap ? viewChap.abbr + " " + viewChap.ch : "") + "|" + (verseTr || "NKJV");
  }
  function trSlug(id) {
    var i;
    for (i = 0; i < TRANSLATIONS.length; i++) {
      if (TRANSLATIONS[i].id === id) return TRANSLATIONS[i].slug || id;
    }
    return id;
  }
  function setChap(abbr, ch) {
    viewChap = { abbr: abbr, ch: ch, num: bookNum(abbr) };
    selVs = 0;
    sel = null;
    hoverId = null;
    bookOpen = false;
    chapOpen = false;
    paint();
  }
  function shiftChap(dir) {
    if (!viewChap) return;
    var list, at, next, i, ch, max, abbr;
    if (chapFilter) {
      list = mappedChapList();
      if (!list.length) return;
      at = chapIndex(list);
      if (at < 0) {
        at = dir > 0 ? -1 : list.length;
      }
      next = list[at + dir];
      if (!next) return;
      setChap(next.abbr, next.ch);
      return;
    }
    i = CANON.indexOf(viewChap.abbr);
    ch = viewChap.ch + dir;
    max = chCount(viewChap.num);
    if (ch < 1) {
      if (i <= 0) return;
      abbr = CANON[i - 1];
      setChap(abbr, chCount(bookNum(abbr)));
    } else if (ch > max) {
      if (i < 0 || i >= CANON.length - 1) return;
      abbr = CANON[i + 1];
      setChap(abbr, 1);
    } else {
      setChap(viewChap.abbr, ch);
    }
  }
  function setFilter(on) {
    chapFilter = !!on;
    if (chapFilter) {
      var list = mappedChapList();
      var at = chapIndex(list);
      if (at < 0 && list.length) {
        setChap(list[0].abbr, list[0].ch);
        return;
      }
    }
    paint();
  }
  function verseHtml(raw) {
    var s = String(raw || "");
    s = s.replace(/\n/g, "<br>");
    s = s.replace(/<\/?(strong|b|i|em|br)\b[^>]*>/gi, function (m) {
      var close = m.charAt(1) === "/";
      var tag = (m.match(/\/?([a-z]+)/i) || [null, ""])[1].toLowerCase();
      if (tag === "br") return "<br>";
      if (!tag) return "";
      return close ? "</" + tag + ">" : "<" + tag + ">";
    });
    s = s.replace(/<[^>]+>/g, function (m) {
      return /^<\/?(?:strong|b|i|em|br)>$/i.test(m) ? m : "";
    });
    return s;
  }
  function loadVerses(done) {
    var key = cacheKey();
    if (verseCache[key]) {
      done(verseCache[key]);
      return;
    }
    function finish(lines) {
      verseCache[key] = lines;
      done(lines);
    }
    if (!viewChap || !viewChap.num) {
      finish([]);
      return;
    }
    fetch("/bible?tr=" + encodeURIComponent(trSlug(verseTr || "NKJV")) + "&book=" + viewChap.num + "&chapter=" + viewChap.ch, { cache: "no-store" })
      .then(function (r) { return r.ok ? r.json() : []; })
      .then(function (rows) {
        var chapter = [], i, row, n, t;
        if (!Array.isArray(rows)) rows = [];
        for (i = 0; i < rows.length; i++) {
          row = rows[i] || {};
          n = Number(row.verse);
          t = String(row.text || "").replace(/<[^>]+>/g, "").replace(/&nbsp;/g, " ").trim();
          if (n) chapter.push({ n: n, t: t });
        }
        finish(chapter);
      })
      .catch(function () { finish([]); });
  }
  function pickTopic(t) {
    var id = sid(t.id);
    sel = sid(sel) === id ? null : id;
    paint();
  }
  function saveTopics() {
    fetch("/dotl/topics", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ topics: bySeq() })
    }).catch(function () {});
  }
  function sameRef(a, b) {
    var pa, pb;
    a = String(a || "").trim();
    b = String(b || "").trim();
    if (!a || !b) return false;
    if (a === b) return true;
    pa = parseRefParts(a);
    pb = parseRefParts(b);
    return !!(pa && pb && pa.book === pb.book && pa.ch === pb.ch && pa.a === pb.a && pa.b === pb.b);
  }
  function saveTopicRefs() {
    fetch("/dotl/topic-refs", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ refs: topicRefs })
    }).catch(function () {});
  }
  function editOwnRef(topicId, oldLabel, newLabel) {
    var i, r, p;
    newLabel = String(newLabel || "").trim();
    if (!newLabel || newLabel === oldLabel) {
      paint();
      return;
    }
    p = parseRefParts(newLabel);
    for (i = 0; i < topicRefs.length; i++) {
      r = topicRefs[i];
      if (sid(r.topic_id) !== sid(topicId)) continue;
      if (!sameRef(r.ref, oldLabel) && String(r.ref || "").trim() !== oldLabel) continue;
      r.ref = newLabel;
      if (p) {
        r.from = p.a;
        r.to = p.b;
      }
      saveTopicRefs();
      paint();
      return;
    }
    topicRefs.push({
      topic_id: topicId,
      ref: newLabel,
      from: p ? p.a : 0,
      to: p ? p.b : 0
    });
    saveTopicRefs();
    paint();
  }
  function hideRhm() {
    var m = document.getElementById("sn-ref-menu");
    if (m) m.hidden = true;
    pendingEdit = null;
  }
  function showRhm(ev, title, onEdit) {
    var m = document.getElementById("sn-ref-menu");
    var r, x, y, tit;
    if (!m) return;
    if (ev) {
      ev.preventDefault();
      ev.stopPropagation();
    }
    pendingEdit = onEdit;
    tit = m.querySelector(".sn-rhm-title");
    if (tit) tit.textContent = title || "Topic";
    rhmLock = Date.now() + 500;
    m.hidden = false;
    x = ev.clientX;
    y = ev.clientY;
    m.style.left = x + "px";
    m.style.top = y + "px";
    r = m.getBoundingClientRect();
    if (r.right > window.innerWidth - 8) m.style.left = Math.max(8, window.innerWidth - r.width - 8) + "px";
    if (r.bottom > window.innerHeight - 8) m.style.top = Math.max(8, window.innerHeight - r.height - 8) + "px";
  }

  function paint() {
    var board = document.getElementById("board");
    var st = document.getElementById("status");
    if (!board) return;
    if (!viewChap) viewChap = firstMappedChap();
    board.innerHTML = "";
    board.style.position = "relative";
    board.style.display = "block";
    bookOpen = false;
    chapOpen = false;
    var items = visible();
    var BOX_H = 0;
    items.forEach(function (t) {
      var s = textSize(t.title || "");
      if (s.h > BOX_H) BOX_H = s.h;
    });
    if (BOX_H < 8) BOX_H = 8;
    boxH = BOX_H;
    function colNameW(list) {
      var w = 0;
      list.forEach(function (t) {
        var s = textSize(typeof t === "string" ? t : (t.title || ""));
        if (s.w > w) w = s.w;
      });
      return w < 8 ? 8 : w;
    }
    function colSpan(nameW) {
      return nameW;
    }
    var onPath = pathIds();
    function box(t) {
      var b = document.createElement("button");
      var on = !!onPath[sid(t.id)];
      var name = document.createElement("span");
      b.type = "button";
      b.className = "tbox" + (on ? " on" : "");
      b.dataset.id = sid(t.id);
      name.className = "tname";
      name.textContent = t.title || "";
      b.appendChild(name);
      var col = pathBorder(t);
      if (col) tint(b, col);
      else if (on) tint(b, "#c5d0d4");
      if (on && col === JOIN_COLOR) b.style.background = JOIN_COLOR;
      function startEdit(ev) {
        if (ev) { ev.preventDefault(); ev.stopPropagation(); }
        if (name.querySelector("input")) return;
        var inp = document.createElement("input");
        inp.type = "text";
        inp.value = t.title || "";
        inp.style.cssText = "font:inherit;color:inherit;border:0;outline:1px solid #c5d0d4;padding:0;margin:0;width:100%;background:#fff;box-sizing:border-box";
        name.textContent = "";
        name.appendChild(inp);
        inp.focus();
        inp.select();
        function commit() {
          if (!inp.parentNode) return;
          t.title = inp.value;
          paint();
          saveTopics();
        }
        inp.addEventListener("keydown", function (kev) {
          if (kev.key === "Enter") { kev.preventDefault(); commit(); }
          if (kev.key === "Escape") { kev.preventDefault(); paint(); }
        });
        inp.addEventListener("blur", commit);
        inp.addEventListener("click", function (cev) { cev.stopPropagation(); });
      }
      name.addEventListener("mouseenter", function () {
        hoverId = sid(t.id);
        showDesc();
      });
      name.addEventListener("mouseleave", function () {
        if (hoverId === sid(t.id)) hoverId = null;
        showDesc();
      });
      b.addEventListener("contextmenu", function (ev) {
        showRhm(ev, "Topic", function () { startEdit(); });
      });
      b.addEventListener("click", function (ev) {
        ev.preventDefault();
        ev.stopPropagation();
        if (descOpen) return;
        if (name.querySelector("input")) return;
        pickTopic(t);
      });
      board.appendChild(b);
      return b;
    }
    function refBox(label, col, topic) {
      var b = document.createElement("button");
      var name = document.createElement("span");
      var ownerId = topic ? sid(topic.id) : "";
      b.type = "button";
      b.className = "tbox" + (refIsChap(label) ? " on" : "");
      b.dataset.ref = label;
      name.className = "tname";
      name.textContent = label;
      b.appendChild(name);
      tint(b, col);
      function startRefEdit(ev) {
        if (ev) { ev.preventDefault(); ev.stopPropagation(); }
        if (name.querySelector("input")) return;
        var inp = document.createElement("input");
        inp.type = "text";
        inp.value = label;
        inp.style.cssText = "font:inherit;color:inherit;border:0;outline:1px solid #c5d0d4;padding:0;margin:0;width:100%;background:#fff;box-sizing:border-box";
        name.textContent = "";
        name.appendChild(inp);
        inp.focus();
        inp.select();
        function commit() {
          if (!inp.parentNode) return;
          editOwnRef(ownerId, label, inp.value);
        }
        inp.addEventListener("keydown", function (kev) {
          if (kev.key === "Enter") { kev.preventDefault(); commit(); }
          if (kev.key === "Escape") { kev.preventDefault(); paint(); }
        });
        inp.addEventListener("blur", commit);
        inp.addEventListener("click", function (cev) { cev.stopPropagation(); });
        inp.addEventListener("mousedown", function (mev) { mev.stopPropagation(); });
      }
      b.addEventListener("contextmenu", function (ev) {
        showRhm(ev, "Ref", function () { startRefEdit(); });
      });
      b.addEventListener("click", function (ev) {
        var p;
        ev.preventDefault();
        ev.stopPropagation();
        if (name.querySelector("input")) return;
        p = parseRefParts(label);
        if (!p) return;
        viewChap = { abbr: p.book, ch: p.ch, num: bookNum(p.book) };
        selVs = p.a;
        sel = topic ? sid(topic.id) : null;
        hoverId = null;
        bookOpen = false;
        chapOpen = false;
        paint();
      });
      board.appendChild(b);
      return b;
    }
    function put(el, x, y, colW, h) {
      el.style.position = "absolute";
      el.style.left = Math.round(x) + "px";
      el.style.top = Math.round(y) + "px";
      el.style.width = colW + "px";
      if (h) el.style.height = h + "px";
      el.style.margin = "0";
      el._x = x;
      el._y = y;
      el._w = colW;
      el._h = h || BOX_H;
    }
    function boardY(el) {
      if (!el) return 0;
      var pane = el.parentNode;
      if (!pane || String(pane.className || "").indexOf("tcol") < 0) return el._y || 0;
      return (pane._top || 0) + (el._y || 0) - (pane.scrollTop || 0);
    }
    function boardX(el) {
      if (!el) return 0;
      var pane = el.parentNode;
      if (!pane || String(pane.className || "").indexOf("tcol") < 0) return el._x || 0;
      return (pane._x || 0) + (el._x || 0);
    }
    function layoutCol(els, x, nameW, parent, minTop) {
      if (!els || !els.length) return null;
      var paneW = colSpan(nameW);
      if (minTop == null) minTop = band;
      var maxBot = viewH - PAD;
      var availH = Math.max(80, maxBot - minTop);
      var innerH = els.length * BOX_H + Math.max(0, els.length - 1) * GAP_Y;
      var y0;
      if (parent) {
        y0 = boardY(parent) + BOX_H / 2 - innerH / 2;
      } else {
        y0 = minTop + (availH - innerH) / 2;
      }
      if (y0 < minTop) y0 = minTop;
      y0 = Math.round(y0);
      var paneH = innerH;
      if (y0 + paneH > maxBot) paneH = Math.max(80, maxBot - y0);
      var pane = document.createElement("div");
      pane.className = "tcol";
      board.appendChild(pane);
      pane.style.left = Math.round(x) + "px";
      pane.style.top = y0 + "px";
      pane.style.width = paneW + "px";
      pane.style.height = paneH + "px";
      pane._top = y0;
      pane._h = paneH;
      pane._x = x;
      pane._w = paneW;
      pane._y = y0;
      var y = 0, i;
      for (i = 0; i < els.length; i++) {
        pane.appendChild(els[i]);
        put(els[i], 0, y, nameW, BOX_H);
        y += BOX_H + GAP_Y;
      }
      return pane;
    }
    function layoutLevelColumn(list, x, paneW, parentBoxes, minTop) {
      if (!list || !list.length) return null;
      var botIds = {}, i, j, t, p, pid, map = {}, byParent = [], g, h, y0, parentEl, maxBot, availH, pane, paneTop, paneH, minY, maxY, topicEl, refs, refsH, ry, k, re, wRef, wTop, gapG, isBotCol;
      bottomsForChapter().forEach(function (b) { botIds[sid(b.id)] = 1; });
      wTop = colNameW(list);
      wRef = 0;
      isBotCol = false;
      for (i = 0; i < list.length; i++) {
        if (!botIds[sid(list[i].id)]) continue;
        isBotCol = true;
        refs = ownRefs(list[i]);
        if (!refs.length) refs = refsFor(list[i]);
        if (refs.length) wRef = Math.max(wRef, colNameW(refs));
      }
      if (!paneW) paneW = wRef ? wRef + GAP_X + wTop : wTop;
      for (i = 0; i < list.length; i++) {
        t = list[i];
        p = parentTopic(t);
        pid = p ? sid(p.id) : "_";
        if (!map[pid]) {
          map[pid] = { p: p, items: [] };
          byParent.push(map[pid]);
        }
        map[pid].items.push(t);
      }
      byParent.sort(function (a, b) {
        return (a.items[0].seq || 0) - (b.items[0].seq || 0);
      });
      maxBot = viewH - PAD;
      if (minTop == null) minTop = band;
      availH = Math.max(80, maxBot - minTop);
      gapG = GAP_Y * 2;
      function itemRefs(row) {
        var rf;
        if (!botIds[sid(row.id)]) return [];
        rf = ownRefs(row);
        if (!rf.length) rf = refsFor(row);
        return rf;
      }
      function itemRefsH(row) {
        var rf = itemRefs(row);
        if (!rf.length) return 0;
        return rf.length * BOX_H + Math.max(0, rf.length - 1) * GAP_Y;
      }
      function refSpan(grp) {
        var top = Infinity, bot = -Infinity, ty, rh, jj, row;
        for (jj = 0; jj < grp.items.length; jj++) {
          row = grp.items[jj];
          ty = grp.y + jj * (BOX_H + GAP_Y);
          rh = itemRefsH(row);
          if (!rh) continue;
          if (ty < top) top = ty;
          if (ty + rh > bot) bot = ty + rh;
        }
        return { top: top, bot: bot };
      }
      g = [];
      for (i = 0; i < byParent.length; i++) {
        h = byParent[i].items.length * BOX_H + Math.max(0, byParent[i].items.length - 1) * GAP_Y;
        parentEl = (byParent[i].p && parentBoxes) ? findBox(parentBoxes, byParent[i].p.id) : null;
        if (parentEl) y0 = boardY(parentEl) + BOX_H / 2 - h / 2;
        else y0 = minTop + (availH - h) / 2;
        y0 = Math.round(y0);
        g.push({ items: byParent[i].items, h: h, y: y0, p: byParent[i].p });
      }
      if (isBotCol && g.length) {
        g[0].y = minTop;
        for (i = 1; i < g.length; i++) {
          var botItem = null, botJ = 0;
          for (j = 0; j < g[i].items.length; j++) {
            if (botIds[sid(g[i].items[j].id)]) {
              botItem = g[i].items[j];
              botJ = j;
              break;
            }
          }
          parentEl = (g[i].p && parentBoxes) ? findBox(parentBoxes, g[i].p.id) : null;
          if (parentEl && botItem) {
            g[i].y = Math.round(boardY(parentEl) - botJ * (BOX_H + GAP_Y));
          }
        }
      }
      for (i = 1; i < g.length; i++) {
        if (g[i].y < g[i - 1].y + g[i - 1].h + gapG) g[i].y = g[i - 1].y + g[i - 1].h + gapG;
      }
      for (i = 1; i < g.length; i++) {
        var spanA = refSpan(g[i - 1]);
        var spanB = refSpan(g[i]);
        if (spanA.bot > -Infinity && spanB.top < Infinity && spanB.top < spanA.bot + GAP_Y) {
          g[i].y += Math.round(spanA.bot + GAP_Y - spanB.top);
        }
      }
      minY = g.length ? g[0].y : minTop;
      maxY = minY;
      for (i = 0; i < g.length; i++) {
        maxY = Math.max(maxY, g[i].y + g[i].h);
        spanA = refSpan(g[i]);
        if (spanA.bot > -Infinity) maxY = Math.max(maxY, spanA.bot);
      }
      paneTop = Math.min(minTop, minY);
      paneH = Math.max(maxBot, maxY) - paneTop;
      pane = document.createElement("div");
      pane.className = "tcol";
      board.appendChild(pane);
      pane.style.left = Math.round(x) + "px";
      pane.style.top = paneTop + "px";
      pane.style.width = paneW + "px";
      pane.style.height = paneH + "px";
      pane._top = paneTop;
      pane._h = paneH;
      pane._x = x;
      pane._w = paneW;
      pane._y = paneTop;
      pane._boxes = [];
      for (i = 0; i < g.length; i++) {
        y0 = g[i].y;
        for (j = 0; j < g[i].items.length; j++) {
          t = g[i].items[j];
          refs = itemRefs(t);
          topicEl = box(t);
          pane.appendChild(topicEl);
          put(topicEl, wRef ? wRef + GAP_X : 0, y0 - paneTop, wTop, BOX_H);
          pane._boxes.push(topicEl);
          for (k = 0; k < refs.length; k++) {
            re = refBox(refs[k], pathBorder(t), t);
            pane.appendChild(re);
            put(re, 0, y0 - paneTop + k * (BOX_H + GAP_Y), wRef, BOX_H);
          }
          y0 += BOX_H + GAP_Y;
        }
      }
      return pane;
    }
    function drawPathLines() {
      var old = board.querySelector("svg.tpath");
      var svg, ns, i, a, b, t, p, c, col, lane, x1, y1, x2, y2, xBus, d, path, seen, key, nBot;
      if (old && old.parentNode) old.parentNode.removeChild(old);
      ns = "http://www.w3.org/2000/svg";
      svg = document.createElementNS(ns, "svg");
      svg.setAttribute("class", "tpath");
      svg.style.width = board.style.width || "100%";
      svg.style.height = board.style.height || "100%";
      svg.setAttribute("width", board.offsetWidth || 0);
      svg.setAttribute("height", board.offsetHeight || 0);
      seen = {};
      var byDest = {}, pid, dest, grey, colr, ei, e, nDest, dkeys;
      function addPath(x1, y1, xBus, x2, y2, col, thick) {
        var d = "M " + Math.round(x1) + " " + Math.round(y1) +
          " L " + xBus + " " + Math.round(y1) +
          " L " + xBus + " " + Math.round(y2) +
          " L " + Math.round(x2) + " " + Math.round(y2);
        var path = document.createElementNS(ns, "path");
        path.setAttribute("d", d);
        path.style.stroke = col;
        path.style.strokeWidth = thick;
        svg.appendChild(path);
      }
      for (i = 0; i < topicEls.length; i++) {
        a = topicEls[i];
        t = find(topics, a.dataset.id);
        if (!t) continue;
        c = colorsThrough(t);
        p = parentTopic(t);
        if (!p || (p.level || 1) <= 1) continue;
        b = findBox(topicEls, p.id);
        if (!b) continue;
        key = sid(t.id) + ">" + sid(p.id);
        if (seen[key]) continue;
        seen[key] = 1;
        pid = sid(p.id);
        if (!byDest[pid]) byDest[pid] = { b: b, edges: [] };
        byDest[pid].edges.push({
          a: a,
          x1: boardX(a) + (a._w || 0),
          y1: boardY(a) + BOX_H / 2,
          col: (c.length === 1) ? PATH_COLORS[c[0] % PATH_COLORS.length] : (c.length >= 2 ? JOIN_COLOR : ""),
          colored: c.length === 1,
          joined: c.length >= 2
        });
      }
      dkeys = Object.keys(byDest);
      dkeys.sort(function (id1, id2) {
        return boardY(byDest[id1].b) - boardY(byDest[id2].b);
      });
      var pairs = {}, pk, plist, pi, coloredIds, greyIds, nC;
      for (i = 0; i < dkeys.length; i++) {
        dest = byDest[dkeys[i]];
        pk = Math.round(dest.edges[0].x1) + ">" + Math.round(boardX(dest.b));
        if (!pairs[pk]) pairs[pk] = [];
        pairs[pk].push(dkeys[i]);
      }
      for (pk in pairs) {
        if (!pairs.hasOwnProperty(pk)) continue;
        plist = pairs[pk];
        coloredIds = [];
        greyIds = [];
        for (pi = 0; pi < plist.length; pi++) {
          dest = byDest[plist[pi]];
          var hasC = false;
          for (ei = 0; ei < dest.edges.length; ei++) {
            if (dest.edges[ei].colored || dest.edges[ei].joined) hasC = true;
          }
          if (hasC) coloredIds.push(plist[pi]);
          else greyIds.push(plist[pi]);
        }
        nC = coloredIds.length;
        function busX(dest, slot, slots) {
          var x1 = dest.edges[0].x1;
          var x2 = boardX(dest.b);
          var span = Math.max(8, x2 - x1);
          var xBus = Math.round(x1 + span * slot / (slots + 1));
          if (xBus < x1 + 3) xBus = x1 + 3;
          if (xBus > x2 - 3) xBus = x2 - 3;
          return xBus;
        }
        function paintDest(dest, xBus) {
          var y2 = boardY(dest.b) + BOX_H / 2;
          var x2 = boardX(dest.b);
          var yMin, yMax, seg;
          grey = [];
          colr = [];
          var joinE = [];
          for (ei = 0; ei < dest.edges.length; ei++) {
            e = dest.edges[ei];
            if (e.colored) colr.push(e);
            else if (e.joined) joinE.push(e);
            else grey.push(e);
          }
          function hOnly(e, col, thick) {
            var d = "M " + Math.round(e.x1) + " " + Math.round(e.y1) +
              " L " + xBus + " " + Math.round(e.y1);
            var path = document.createElementNS(ns, "path");
            path.setAttribute("d", d);
            path.style.stroke = col;
            path.style.strokeWidth = thick;
            svg.appendChild(path);
          }
          var nJoin = colr.length + joinE.length;
          if (nJoin >= 2) {
            for (ei = 0; ei < grey.length; ei++) {
              e = grey[ei];
              addPath(e.x1, e.y1, xBus, x2, y2, "#c5d0d4", "1px");
            }
            for (ei = 0; ei < joinE.length; ei++) hOnly(joinE[ei], JOIN_COLOR, "2px");
            for (ei = 0; ei < colr.length; ei++) hOnly(colr[ei], colr[ei].col, "2px");
            yMin = y2;
            yMax = y2;
            for (ei = 0; ei < colr.length; ei++) {
              if (colr[ei].y1 < yMin) yMin = colr[ei].y1;
              if (colr[ei].y1 > yMax) yMax = colr[ei].y1;
            }
            for (ei = 0; ei < joinE.length; ei++) {
              if (joinE[ei].y1 < yMin) yMin = joinE[ei].y1;
              if (joinE[ei].y1 > yMax) yMax = joinE[ei].y1;
            }
            seg = "M " + xBus + " " + Math.round(yMin) +
              " L " + xBus + " " + Math.round(yMax) +
              " M " + xBus + " " + Math.round(y2) +
              " L " + Math.round(x2) + " " + Math.round(y2);
            path = document.createElementNS(ns, "path");
            path.setAttribute("d", seg);
            path.style.stroke = JOIN_COLOR;
            path.style.strokeWidth = "2px";
            svg.appendChild(path);
          } else {
            for (ei = 0; ei < grey.length; ei++) {
              e = grey[ei];
              addPath(e.x1, e.y1, xBus, x2, y2, "#c5d0d4", "1px");
            }
            for (ei = 0; ei < joinE.length; ei++) {
              e = joinE[ei];
              addPath(e.x1, e.y1, xBus, x2, y2, JOIN_COLOR, "2px");
            }
            for (ei = 0; ei < colr.length; ei++) {
              e = colr[ei];
              addPath(e.x1, e.y1, xBus, x2, y2, e.col, "2px");
            }
          }
        }
        for (pi = 0; pi < coloredIds.length; pi++) {
          dest = byDest[coloredIds[pi]];
          paintDest(dest, busX(dest, pi + 1, nC));
        }
        for (pi = 0; pi < greyIds.length; pi++) {
          dest = byDest[greyIds[pi]];
          paintDest(dest, busX(dest, nC ? 0.5 : 1, nC ? nC : 1));
        }
      }
      board.appendChild(svg);
    }
    function centerHits(boxEl, prefer) {
      var hits = boxEl.querySelectorAll(prefer ? "p.on" : "p.hit");
      if (!hits.length) hits = boxEl.querySelectorAll("p.hit");
      if (!hits.length) return;
      var first = hits[0];
      var last = hits[hits.length - 1];
      var mid = (first.offsetTop + last.offsetTop + last.offsetHeight) / 2;
      boxEl.scrollTop = Math.max(0, Math.round(mid - boxEl.clientHeight / 2));
    }
    function closePickers() {
      var bl = board.querySelector(".ew-book-list");
      var cg = board.querySelector(".ew-ch-grid");
      var tr = board.querySelector(".ew-tr-list");
      var now = board.querySelector(".ew-tr-now");
      if (bl) bl.hidden = true;
      if (cg) cg.hidden = true;
      if (tr) tr.hidden = true;
      if (now) now.setAttribute("aria-expanded", "false");
      bookOpen = false;
      chapOpen = false;
    }

    var wrap = document.getElementById("wrap");
    var viewH = wrap ? wrap.clientHeight : 0;
    var viewW = wrap ? wrap.clientWidth : 800;
    var band = PAD + DESC_H + GAP_Y;
    var vsW = Math.max(400, Math.min(VERSE_W, Math.floor(viewW * 0.48)));
    var vsH = Math.max(160, viewH - PAD * 2);
    var versesWrap = document.createElement("div");
    versesWrap.className = "tverse-wrap";
    board.appendChild(versesWrap);
    put(versesWrap, PAD, PAD, vsW, vsH);
    versesWrap.style.height = vsH + "px";

    var bar = document.createElement("div");
    bar.className = "tverse-bar";
    bar.addEventListener("click", function (ev) { ev.stopPropagation(); });
    var left = document.createElement("div");
    left.className = "tverse-bar-left";
    var maps = bookCols(!chapFilter);
    var bookPick = document.createElement("div");
    bookPick.className = "ew-book-pick";
    var bookBtn = document.createElement("button");
    bookBtn.type = "button";
    bookBtn.className = "ew-tr-now";
    bookBtn.textContent = viewChap.abbr;
    var bookList = document.createElement("div");
    bookList.className = "ew-book-list";
    bookList.hidden = true;
    function fillBookCol(title, list) {
      var col = document.createElement("div");
      col.className = "ew-book-col";
      var head = document.createElement("div");
      head.className = "ew-book-head";
      head.textContent = title;
      col.appendChild(head);
      list.forEach(function (b) {
        var row = document.createElement("div");
        var cls = [];
        row.setAttribute("data-book", b);
        if (viewChap.abbr === b) cls.push("on");
        if (!chapFilter && maps.by[b]) cls.push("has-topic");
        row.className = cls.join(" ");
        row.textContent = b;
        row.addEventListener("click", function (ev) {
          ev.preventDefault();
          ev.stopPropagation();
          var chs = Object.keys(maps.by[b] || {}).map(Number).sort(function (a, c) { return a - c; });
          setChap(b, chapFilter ? (chs[0] || 1) : 1);
        });
        col.appendChild(row);
      });
      return col;
    }
    bookList.appendChild(fillBookCol("OT", maps.ot));
    bookList.appendChild(fillBookCol("NT", maps.nt));
    bookBtn.addEventListener("click", function (ev) {
      ev.preventDefault();
      ev.stopPropagation();
      var open = bookList.hidden;
      closePickers();
      bookList.hidden = !open;
      bookOpen = !open;
    });
    bookPick.appendChild(bookBtn);
    bookPick.appendChild(bookList);

    var chPick = document.createElement("div");
    chPick.className = "ew-ch-pick";
    var chBtn = document.createElement("button");
    chBtn.type = "button";
    chBtn.className = "ew-tr-now";
    chBtn.textContent = String(viewChap.ch);
    var chGrid = document.createElement("div");
    chGrid.className = "ew-ch-grid";
    chGrid.hidden = true;
    var chs, n, maxCh;
    if (chapFilter) {
      chs = Object.keys(maps.by[viewChap.abbr] || {}).map(Number).sort(function (a, c) { return a - c; });
    } else {
      maxCh = chCount(viewChap.num);
      chs = [];
      for (n = 1; n <= maxCh; n++) chs.push(n);
    }
    chs.forEach(function (n) {
      var cell = document.createElement("div");
      var cls = [];
      cell.setAttribute("data-ch", String(n));
      if (n === viewChap.ch) cls.push("on");
      if (!chapFilter && maps.by[viewChap.abbr] && maps.by[viewChap.abbr][n]) cls.push("has-topic");
      cell.className = cls.join(" ");
      cell.textContent = String(n);
      cell.addEventListener("click", function (ev) {
        ev.preventDefault();
        ev.stopPropagation();
        setChap(viewChap.abbr, n);
      });
      chGrid.appendChild(cell);
    });
    chBtn.addEventListener("click", function (ev) {
      ev.preventDefault();
      ev.stopPropagation();
      var open = chGrid.hidden;
      closePickers();
      chGrid.hidden = !open;
      chapOpen = !open;
    });
    chPick.appendChild(chBtn);
    chPick.appendChild(chGrid);

    var mode = document.createElement("div");
    mode.className = "ew-chap-mode";
    var allBtn = document.createElement("button");
    allBtn.type = "button";
    allBtn.className = "tverse-pick" + (chapFilter ? "" : " on");
    allBtn.textContent = "All";
    allBtn.addEventListener("click", function (ev) {
      ev.preventDefault();
      ev.stopPropagation();
      setFilter(false);
    });
    var filterBtn = document.createElement("button");
    filterBtn.type = "button";
    filterBtn.className = "tverse-pick" + (chapFilter ? " on" : "");
    filterBtn.textContent = "Filter";
    filterBtn.addEventListener("click", function (ev) {
      ev.preventDefault();
      ev.stopPropagation();
      setFilter(true);
    });
    mode.appendChild(allBtn);
    mode.appendChild(filterBtn);

    var nav = document.createElement("div");
    nav.className = "tverse-nav";
    var prevBtn = document.createElement("button");
    prevBtn.type = "button";
    prevBtn.className = "ew-ch-prev";
    prevBtn.textContent = "Prev";
    var mapped = mappedChapList();
    var atMap = chapIndex(mapped);
    var iCan = CANON.indexOf(viewChap.abbr);
    if (chapFilter) prevBtn.disabled = !mapped.length || atMap <= 0;
    else prevBtn.disabled = iCan <= 0 && viewChap.ch <= 1;
    prevBtn.addEventListener("click", function (ev) {
      ev.preventDefault();
      ev.stopPropagation();
      shiftChap(-1);
    });
    var nextBtn = document.createElement("button");
    nextBtn.type = "button";
    nextBtn.className = "ew-ch-next";
    nextBtn.textContent = "Next";
    if (chapFilter) nextBtn.disabled = !mapped.length || atMap < 0 || atMap >= mapped.length - 1;
    else nextBtn.disabled = iCan >= CANON.length - 1 && viewChap.ch >= chCount(viewChap.num);
    nextBtn.addEventListener("click", function (ev) {
      ev.preventDefault();
      ev.stopPropagation();
      shiftChap(1);
    });
    nav.appendChild(mode);
    nav.appendChild(prevBtn);
    nav.appendChild(bookPick);
    nav.appendChild(chPick);
    nav.appendChild(nextBtn);
    left.appendChild(nav);

    var right = document.createElement("div");
    right.className = "tverse-bar-right";
    var pick = document.createElement("div");
    pick.className = "ew-tr-pick ew-ch-tr";
    var trNow = document.createElement("button");
    trNow.type = "button";
    trNow.className = "ew-tr-now";
    trNow.setAttribute("aria-haspopup", "listbox");
    trNow.setAttribute("aria-expanded", "false");
    trNow.textContent = verseTr || "NKJV";
    var trList = document.createElement("div");
    trList.className = "ew-tr-list";
    trList.setAttribute("role", "listbox");
    trList.hidden = true;
    var trs = TRANSLATIONS.slice().sort(function (a, b) {
      return String(a.label || a.id).localeCompare(String(b.label || b.id));
    });
    trs.forEach(function (tr) {
      var trow = document.createElement("div");
      trow.setAttribute("role", "option");
      trow.setAttribute("data-tr", tr.id);
      trow.className = verseTr === tr.id ? "on" : "";
      var tcode = document.createElement("span");
      tcode.className = "ew-tr-code";
      tcode.textContent = tr.label;
      var tyear = document.createElement("span");
      tyear.className = "ew-tr-year";
      tyear.textContent = tr.year || "";
      trow.appendChild(tcode);
      trow.appendChild(tyear);
      trow.addEventListener("click", function (ev) {
        ev.preventDefault();
        ev.stopPropagation();
        verseTr = this.getAttribute("data-tr");
        paint();
      });
      trList.appendChild(trow);
    });
    trNow.addEventListener("click", function (ev) {
      ev.preventDefault();
      ev.stopPropagation();
      var open = trList.hidden;
      closePickers();
      trList.hidden = !open;
      trNow.setAttribute("aria-expanded", open ? "true" : "false");
      if (open) {
        trList.style.maxHeight = "none";
        trList.style.overflowY = "visible";
        var need = trList.scrollHeight;
        var boxR = versesWrap.getBoundingClientRect();
        var room = Math.floor(boxR.bottom - trList.getBoundingClientRect().top - 4);
        if (need > room && room > 40) {
          trList.style.maxHeight = room + "px";
          trList.style.overflowY = "auto";
        }
      }
    });
    pick.appendChild(trNow);
    pick.appendChild(trList);
    right.appendChild(pick);
    bar.appendChild(left);
    bar.appendChild(right);
    versesWrap.appendChild(bar);

    var versesEl = document.createElement("div");
    versesEl.className = "tverses";
    versesWrap.appendChild(versesEl);
    var hitSet = hitsInChapter();
    function drawLines(lines) {
      versesEl.innerHTML = "";
      var li, p, vn, n;
      for (li = 0; li < lines.length; li++) {
        p = document.createElement("p");
        n = lines[li].n;
        if (hitSet[n]) p.className = "hit" + (selVs === n ? " on" : "");
        p.setAttribute("data-vs", String(n));
        vn = document.createElement("span");
        vn.className = "vn";
        vn.textContent = String(n);
        p.appendChild(vn);
        p.appendChild(document.createTextNode(" "));
        var body = document.createElement("span");
        body.innerHTML = verseHtml(lines[li].t);
        p.appendChild(body);
        if (hitSet[n]) {
          p.addEventListener("click", function (ev) {
            ev.preventDefault();
            ev.stopPropagation();
            var v = Number(this.getAttribute("data-vs"));
            if (selVs === v) selVs = 0;
            else selVs = v;
            hoverId = null;
            paint();
          });
        }
        versesEl.appendChild(p);
      }
      requestAnimationFrame(function () { centerHits(versesEl, !!selVs); });
    }
    var cached = verseCache[cacheKey()];
    if (cached) drawLines(cached);
    else {
      var wantChap = viewChap.abbr + " " + viewChap.ch;
      var wantTr = verseTr;
      loadVerses(function () {
        if (!viewChap || viewChap.abbr + " " + viewChap.ch !== wantChap) return;
        if (verseTr !== wantTr) return;
        paint();
      });
    }

    var x = PAD + vsW + GAP_X;
    var colBuilt = [];
    var topicEls = [];
    var colLists = reverseCols();
    var ci, pane, bottoms, widths = [], xs = [], parentBoxes = null, panes = [];
    bottoms = bottomsForChapter();
    function levelColWidth(list) {
      var ids = {}, wr = 0, wt = colNameW(list), ii, rf;
      bottoms.forEach(function (b) { ids[sid(b.id)] = 1; });
      for (ii = 0; ii < list.length; ii++) {
        if (!ids[sid(list[ii].id)]) continue;
        rf = ownRefs(list[ii]);
        if (!rf.length) rf = refsFor(list[ii]);
        if (rf.length) wr = Math.max(wr, colNameW(rf));
      }
      return wr ? wr + GAP_X + wt : wt;
    }
    for (ci = 0; ci < colLists.length; ci++) widths.push(levelColWidth(colLists[ci]));
    for (ci = 0; ci < widths.length; ci++) {
      xs.push(x);
      x += widths[ci] + GAP_COL;
    }
    for (ci = colLists.length - 1; ci >= 0; ci--) {
      pane = layoutLevelColumn(colLists[ci], xs[ci], widths[ci], parentBoxes, band);
      panes[ci] = pane;
      if (pane) {
        topicEls = topicEls.concat(pane._boxes || []);
        colBuilt.unshift({ boxes: pane._boxes || [], pane: pane, w: pane._w, x: xs[ci] });
        parentBoxes = pane._boxes;
      } else parentBoxes = null;
    }
    colBuilt.forEach(function (cb) {
      if (cb.pane) cb.pane.addEventListener("scroll", drawPathLines);
    });

    function shiftPane(pane, dy) {
      if (!pane || !dy) return;
      pane._top += dy;
      pane._y += dy;
      pane.style.top = Math.round(pane._top) + "px";
    }
    var lowBots = bottomsForChapter();
    if (lowBots.length) {
      var low = lowBots[lowBots.length - 1];
      var lowEl = findBox(topicEls, low.id);
      var par = parentTopic(low);
      var parEl = par ? findBox(topicEls, par.id) : null;
      if (lowEl && parEl && lowEl.parentNode !== parEl.parentNode) {
        shiftPane(parEl.parentNode, boardY(lowEl) - boardY(parEl));
      }
    }
    if (colBuilt.length) {
      var lastCol = colBuilt[colBuilt.length - 1];
      var tMin = Infinity, tMax = -Infinity, bi, by;
      for (bi = 0; bi < topicEls.length; bi++) {
        if (lastCol.pane && topicEls[bi].parentNode === lastCol.pane) continue;
        by = boardY(topicEls[bi]);
        if (by < tMin) tMin = by;
        if (by > tMax) tMax = by;
      }
      if (tMin < Infinity && lastCol.pane && lastCol.boxes && lastCol.boxes.length) {
        var firstY = boardY(lastCol.boxes[0]);
        var lastY = boardY(lastCol.boxes[lastCol.boxes.length - 1]);
        var colH = lastY + BOX_H - firstY;
        var spanH = tMax + BOX_H - tMin;
        var want = tMin + (spanH - colH) / 2;
        shiftPane(lastCol.pane, Math.round(want - firstY));
      }
    }

    var topBox = Infinity, pi, colRight = x;
    for (pi = 0; pi < colBuilt.length; pi++) {
      if (!colBuilt[pi].pane) continue;
      colRight = Math.max(colRight, colBuilt[pi].pane._x + colBuilt[pi].pane._w);
      if (colBuilt[pi].pane._y < topBox) topBox = colBuilt[pi].pane._y;
    }
    descPlace.left = PAD + vsW + GAP_X;
    placeDesc(colRight, topBox < Infinity ? topBox : band);
    showDesc();

    var maxX = Math.max(PAD + vsW + PAD, colRight + PAD);
    board.style.width = maxX + "px";
    board.style.height = Math.max(viewH, vsH + PAD * 2) + "px";
    drawPathLines();
    if (st) st.textContent = bottoms.length ? (bottoms.length + " topics.") : (items.length + " topics.");
  }

  function showDesc() {
    var ta = document.getElementById("tdesc-ta");
    var topic = hoverId ? find(topics, hoverId) : (sel ? find(topics, sel) : null);
    if (!ta) return;
    if (document.activeElement === ta) return;
    ta.value = descText(topic);
    ta.dataset.topic = topic ? sid(topic.id) : "";
  }
  function placeDesc(right, capY) {
    var d = document.getElementById("tdesc");
    var ta = document.getElementById("tdesc-ta");
    var wrap = document.getElementById("wrap");
    var topic = hoverId ? find(topics, hoverId) : (sel ? find(topics, sel) : null);
    var w, need, cap, h, open, pop, more, board, left;
    if (!d) return;
    if (right) descPlace.right = right;
    if (capY) descPlace.cap = capY;
    left = descPlace.left || PAD;
    w = descWidth();
    cap = descCap();
    need = descH(ta && document.activeElement === ta ? ta.value : descText(topic), w);
    open = descOpen || (ta && document.activeElement === ta);
    h = open ? Math.max(need, DESC_H) : Math.min(Math.max(need, DESC_H), cap);
    d.style.left = left + "px";
    d.style.top = PAD + "px";
    d.style.width = w + "px";
    d.style.height = h + "px";
    d.style.zIndex = open ? "40" : "6";
    if (ta) ta.style.overflowY = open ? "hidden" : "auto";
    if (wrap) wrap.style.overflowY = open && need > cap ? "visible" : "hidden";
    board = document.getElementById("board");
    if (board) board.style.pointerEvents = open ? "none" : "";
    pop = document.getElementById("tdesc-full");
    if (pop) pop.hidden = true;
    more = document.getElementById("tdesc-more");
    if (more) more.hidden = !(!open && need > cap);
  }
  function openDesc() {
    descOpen = true;
    placeDesc();
  }
  function closeDesc() {
    var ta = document.getElementById("tdesc-ta");
    if (ta && document.activeElement === ta) return;
    descOpen = false;
    placeDesc();
  }

  window.snPaintVerse = paint;
  (function () {
    var ta = document.getElementById("tdesc-ta");
    if (!ta) return;
    ta.addEventListener("click", function (ev) { ev.stopPropagation(); });
    ta.addEventListener("focus", function () {
      var id = ta.dataset.topic;
      if (id) descSnap[id] = ta.value;
      openDesc();
    });
    (function () {
      var d = document.getElementById("tdesc");
      if (!d) return;
      d.addEventListener("pointerenter", function (ev) {
        if (ev.pointerType === "mouse") openDesc();
      });
      d.addEventListener("pointerleave", function (ev) {
        if (ev.pointerType === "mouse") closeDesc();
      });
    })();
    ta.addEventListener("keydown", function (ev) {
      var id, topic;
      if (ev.key !== "Escape") return;
      ev.preventDefault();
      id = ta.dataset.topic;
      topic = id ? find(topics, id) : null;
      if (topic && descSnap[id] != null) topic.description = descSnap[id];
      paint();
    });
    ta.addEventListener("input", function () {
      var id = ta.dataset.topic;
      var topic = id ? find(topics, id) : null;
      if (topic) topic.description = ta.value;
      placeDesc();
    });
    ta.addEventListener("blur", function () {
      var id = ta.dataset.topic;
      var topic = id ? find(topics, id) : null;
      if (!topic) return;
      topic.description = ta.value;
      saveTopics();
    });
  })();
  window.addEventListener("resize", function () { paint(); });
  document.addEventListener("pointerdown", function (ev) {
    var list = document.querySelector(".tverse-bar .ew-tr-list");
    var now = document.querySelector(".tverse-bar .ew-tr-now");
    var bl = document.querySelector(".ew-book-list");
    var cg = document.querySelector(".ew-ch-grid");
    var menu = document.getElementById("sn-ref-menu");
    var inBar = ev.target && ev.target.closest && ev.target.closest(".tverse-bar");
    if (!inBar) {
      if (list) list.hidden = true;
      if (now) now.setAttribute("aria-expanded", "false");
      if (bl) bl.hidden = true;
      if (cg) cg.hidden = true;
      bookOpen = false;
      chapOpen = false;
    }
    if (Date.now() < rhmLock) return;
    if (menu && !menu.hidden && !(ev.target && ev.target.closest && ev.target.closest("#sn-ref-menu"))) hideRhm();
  });
  (function () {
    var menu = document.getElementById("sn-ref-menu");
    if (!menu) return;
    menu.addEventListener("click", function (ev) {
      var btn = ev.target.closest && ev.target.closest("button");
      var fn = pendingEdit;
      ev.preventDefault();
      ev.stopPropagation();
      hideRhm();
      if (btn && btn.getAttribute("data-edit") === "1" && fn) fn();
    });
  })();
  Promise.all([
    fetch("data/topics.json?v=291", { cache: "no-store" }).then(function (r) { return r.json(); }),
    fetch("data/topic-refs.json?v=291", { cache: "no-store" }).then(function (r) { return r.ok ? r.json() : []; }).catch(function () { return []; })
  ]).then(function (pair) {
    topics = pair[0] || [];
    if (Array.isArray(pair[1])) topicRefs = pair[1];
    else if (pair[1] && Array.isArray(pair[1].rows)) topicRefs = pair[1].rows;
    else topicRefs = [];
    viewChap = firstMappedChap();
    paint();
  }).catch(function (err) {
    var st = document.getElementById("status");
    if (st) st.textContent = String(err);
  });
})();
