(function () {
  var PAD = 8;
  var GAP_X = 16;
  var GAP_Y = 8;
  var GAP_BTN = 4;
  var VERSE_W = 420;
  var topics = [];
  var topicRefs = [];
  var openStack = [];
  var sel = null;
  var openRef = null;
  var boxH = 8;
  var verseCache = {};
  var verseTr = "NKJV";
  var viewChap = null;
  var lastOpenRef = null;
  var hitPick = false;
  var hitStart = 0;
  var hitEnd = 0;
  var descSnap = {};
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
  function textSize(title) {
    var p = document.createElement("span");
    p.style.cssText = "position:absolute;left:0;top:0;visibility:hidden;white-space:nowrap;font:400 13px/1.2 Arial,Helvetica,sans-serif;padding:0.2rem 0.45rem;border:1px solid #c5d0d4;display:inline-block;box-sizing:border-box";
    p.textContent = title || "";
    document.body.appendChild(p);
    var s = { w: Math.ceil(p.offsetWidth), h: Math.ceil(p.offsetHeight) };
    document.body.removeChild(p);
    return s;
  }
  function wrapSize(text, width) {
    var p = document.createElement("div");
    p.style.cssText = "position:absolute;left:0;top:0;visibility:hidden;white-space:pre-wrap;overflow-wrap:break-word;word-wrap:break-word;font:400 13px/1.2 Arial,Helvetica,sans-serif;padding:0.2rem 0.45rem;border:1px solid #c5d0d4;box-sizing:border-box;width:" + Math.max(8, width) + "px";
    p.textContent = text || "";
    document.body.appendChild(p);
    var s = { w: Math.ceil(p.offsetWidth), h: Math.ceil(p.offsetHeight) };
    document.body.removeChild(p);
    return s;
  }
  function descH(text, colW) {
    if (!colW) return boxH;
    var s = wrapSize(text, colW);
    return Math.max(boxH, s.h);
  }
  var CANON = "Gen Exo Lev Num Deu Jos Jdg Rut 1Sa 2Sa 1Ki 2Ki 1Ch 2Ch Ezr Neh Est Job Psa Pro Ecc Sng Isa Jer Lam Ezk Dan Hos Jol Amo Oba Jon Mic Nam Hab Zep Hag Zec Mal Mat Mrk Luk Jhn Act Rom 1Co 2Co Gal Eph Php Col 1Th 2Th 1Ti 2Ti Tit Phm Heb Jas 1Pe 2Pe 1Jn 2Jn 3Jn Jud Rev 1Es Tob Jdt Wis Sir Lje Bar 1Ma 2Ma Man 2Es Sus Bel Aza Jub".split(" ");
  function refSortKey(lab) {
    var m = String(lab || "").trim().match(/^(\S+)\s+(\d+)\s*:\s*(\d+)/);
    if (!m) return [1000, 0, 0, String(lab || "")];
    var i = CANON.indexOf(m[1]);
    if (i < 0) i = 900;
    return [i, Number(m[2]), Number(m[3]), lab];
  }
  function parseRefParts(lab) {
    var m = String(lab || "").trim().match(/^(\S+)\s+(\d+)\s*:\s*(\d+)(?:\s*[-–—]\s*(\d+))?$/);
    if (!m) return null;
    return { book: m[1], ch: Number(m[2]), a: Number(m[3]), b: Number(m[4] || m[3]) };
  }
  function joinRef(p) {
    return p.a === p.b ? (p.book + " " + p.ch + ":" + p.a) : (p.book + " " + p.ch + ":" + p.a + "-" + p.b);
  }
  function combineRefs(list) {
    var parsed = [], rest = [], i, p, acc = null, out = [];
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
    var out = [], seen = {}, i, r, lab, ka, kb, n, ids = {}, br;
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
    out = combineRefs(out);
    out.sort(function (a, b) {
      ka = refSortKey(a);
      kb = refSortKey(b);
      for (n = 0; n < 3; n++) {
        if (ka[n] !== kb[n]) return ka[n] - kb[n];
      }
      if (ka[3] < kb[3]) return -1;
      if (ka[3] > kb[3]) return 1;
      return 0;
    });
    return out;
  }
  function refN(t) {
    return refsFor(t).length;
  }
  function collectRange(ids, ref) {
    var i, r, p, want, lab, a = 0, b = 0, fa, fb;
    want = parseRefParts(ref);
    for (i = 0; i < topicRefs.length; i++) {
      r = topicRefs[i];
      if (!ids[sid(r.topic_id)]) continue;
      lab = String(r.ref || "").trim();
      if (!lab) continue;
      if (lab === ref) {
        fa = Number(r.from) || 0;
        fb = Number(r.to) || fa;
        a = a ? Math.min(a, fa || a) : fa;
        b = Math.max(b, fb);
        continue;
      }
      if (!want) continue;
      p = parseRefParts(lab);
      if (!p || p.book !== want.book || p.ch !== want.ch) continue;
      if (p.b < want.a || p.a > want.b) continue;
      fa = Number(r.from) || p.a;
      fb = Number(r.to) || p.b;
      a = a ? Math.min(a, fa) : fa;
      b = Math.max(b, fb);
    }
    if (!a && want) { a = want.a; b = want.b; }
    return { from: a, to: b };
  }
  function rangeFor(t, ref) {
    var own = {}, br, i, ids = {}, r;
    if (!t) return { from: 0, to: 0 };
    own[sid(t.id)] = 1;
    r = collectRange(own, ref);
    if (r.from) return r;
    br = branchOf(t);
    for (i = 0; i < br.length; i++) ids[sid(br[i].id)] = 1;
    return collectRange(ids, ref);
  }
  function refOwner() {
    var i, o;
    for (i = openStack.length - 1; i >= 0; i--) {
      o = openStack[i];
      if (o && o.mode === "refs") return find(topics, o.id);
    }
    return null;
  }
  function saveTopicRefs(done) {
    fetch("/dotl/topic-refs", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ refs: topicRefs })
    }).then(function (r) { return r.json(); }).then(function (d) {
      if (done) done(d);
    }).catch(function () { if (done) done({ error: "Could not save." }); });
  }
  function applyHighlight(from, to) {
    var t = refOwner();
    var i, r, p, want, lab, idx = -1, a, b;
    if (!t || !openRef) return;
    a = Math.min(from, to);
    b = Math.max(from, to);
    want = parseRefParts(openRef);
    for (i = 0; i < topicRefs.length; i++) {
      r = topicRefs[i];
      if (sid(r.topic_id) !== sid(t.id)) continue;
      lab = String(r.ref || "").trim();
      if (lab === openRef) { idx = i; break; }
      p = parseRefParts(lab);
      if (want && p && p.book === want.book && p.ch === want.ch && p.a === want.a && p.b === want.b) {
        idx = i;
        break;
      }
    }
    if (idx >= 0) {
      topicRefs[idx].from = a;
      topicRefs[idx].to = b;
    } else {
      topicRefs.push({ topic_id: t.id, ref: openRef, from: a, to: b });
    }
    saveTopicRefs();
    paint();
  }
  function pickVerse(n) {
    if (!hitPick) return;
    if (!hitStart || hitEnd) {
      hitStart = n;
      hitEnd = 0;
      paint();
      return;
    }
    hitEnd = n;
    hitPick = false;
    applyHighlight(hitStart, hitEnd);
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
  function verseLines(text) {
    var raw = String(text || "").split(/\n/);
    var out = [], i, m, cur = null, line;
    for (i = 0; i < raw.length; i++) {
      line = raw[i];
      m = String(line || "").match(/^(\d+)\s+(.*)$/);
      if (m) {
        if (cur) out.push(cur);
        cur = { n: Number(m[1]), t: m[2] };
      } else if (cur && String(line || "").trim()) {
        cur.t += "\n" + line;
      }
    }
    if (cur) out.push(cur);
    return out;
  }
  function refSpan(ref) {
    var m = String(ref || "").trim().match(/^(\S+)\s+(\d+)\s*:\s*(\d+)(?:\s*[-–—]\s*(?:(\d+)\s*:)?(\d+))?$/);
    if (!m) return null;
    var ch1 = Number(m[2]);
    var vs1 = Number(m[3]);
    if (m[4] && Number(m[4]) !== ch1) return null;
    return { vs1: vs1, vs2: Number(m[5] || vs1) };
  }
  function bookNum(abbr) {
    var i = CANON.indexOf(abbr);
    if (i < 0) return 0;
    if (i < 66) return i + 1;
    var extra = { "1Es": 67, "Tob": 68, "Jdt": 69, "Wis": 70, "Sir": 71, "Lje": 72, "Bar": 73, "1Ma": 74, "2Ma": 75, "Man": 76, "2Es": 77, "Sus": 78, "Bel": 79, "Aza": 88, "Jub": 90 };
    return extra[abbr] || 0;
  }
  function chapterOf(ref) {
    var m = String(ref || "").trim().match(/^(\S+)\s+(\d+)/);
    if (!m) return null;
    return { abbr: m[1], ch: Number(m[2]), num: bookNum(m[1]) };
  }
  function cacheKey(ref) {
    var ch = viewChap || chapterOf(ref);
    return (ch ? ch.abbr + " " + ch.ch : ref) + "|" + (verseTr || "NKJV");
  }
  function trSlug(id) {
    var i;
    for (i = 0; i < TRANSLATIONS.length; i++) {
      if (TRANSLATIONS[i].id === id) return TRANSLATIONS[i].slug || id;
    }
    return id;
  }
  function trYear(id) {
    var i;
    for (i = 0; i < TRANSLATIONS.length; i++) {
      if (TRANSLATIONS[i].id === id) return TRANSLATIONS[i].year || "";
    }
    return "";
  }
  function chCount(num) {
    if (num <= 66) return CHAPS[num] || 1;
    return EXTRA_CH[num] || 1;
  }
  function shiftChap(dir) {
    if (!viewChap) return;
    var i = CANON.indexOf(viewChap.abbr);
    var ch = viewChap.ch + dir;
    var max = chCount(viewChap.num);
    var abbr;
    if (ch < 1) {
      if (i <= 0) return;
      abbr = CANON[i - 1];
      viewChap = { abbr: abbr, ch: chCount(bookNum(abbr)), num: bookNum(abbr) };
    } else if (ch > max) {
      if (i < 0 || i >= CANON.length - 1) return;
      abbr = CANON[i + 1];
      viewChap = { abbr: abbr, ch: 1, num: bookNum(abbr) };
    } else {
      viewChap = { abbr: viewChap.abbr, ch: ch, num: viewChap.num };
    }
    paint();
  }
  function sameOrigChap() {
    var orig = chapterOf(openRef);
    return !!(orig && viewChap && orig.abbr === viewChap.abbr && orig.ch === viewChap.ch);
  }
  function completeSpan(lines, ref) {
    var sp = refSpan(ref);
    if (!sp) return lines;
    var by = {}, i, n, out = [];
    for (i = 0; i < lines.length; i++) {
      n = lines[i].n;
      if (n) by[n] = lines[i];
    }
    for (n = sp.vs1; n <= sp.vs2; n++) {
      out.push(by[n] || { n: n, t: "..." });
    }
    return out;
  }
  function overlayStored(chapter, stored) {
    var by = {}, i, n, t, out = [];
    for (i = 0; i < stored.length; i++) {
      n = stored[i].n;
      t = String(stored[i].t || "").trim();
      if (n && t && t !== "...") by[n] = stored[i];
    }
    if (!chapter.length) return stored;
    for (i = 0; i < chapter.length; i++) {
      n = chapter[i].n;
      out.push(by[n] || chapter[i]);
    }
    return out;
  }
  function loadVerses(ref, done) {
    var key = cacheKey(ref);
    if (verseCache[key]) {
      done(verseCache[key]);
      return;
    }
    function finish(lines) {
      verseCache[key] = lines;
      done(lines);
    }
    function fromStore(chapter) {
      if (chapter && chapter.length) {
        finish(chapter);
        return;
      }
      fetch("/scriptures?ref=" + encodeURIComponent(ref) + "&folder=" + encodeURIComponent(siteFolder()), { cache: "no-store" })
        .then(function (r) { return r.json(); })
        .then(function (d) {
          finish(completeSpan(verseLines((d && d.text) || ""), ref));
        })
        .catch(function () { finish([]); });
    }
    var ch = viewChap || chapterOf(ref);
    if (!ch || !ch.num) {
      fromStore(null);
      return;
    }
    fetch("/bible?tr=" + encodeURIComponent(trSlug(verseTr || "NKJV")) + "&book=" + ch.num + "&chapter=" + ch.ch, { cache: "no-store" })
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
        fromStore(chapter);
      })
      .catch(function () { fromStore(null); });
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
  function related(a, b) {
    if (!a || !b) return false;
    if (sid(a.id) === sid(b.id)) return true;
    var p = b;
    while (p) {
      if (sid(p.id) === sid(a.id)) return true;
      p = parentTopic(p);
    }
    p = a;
    while (p) {
      if (sid(p.id) === sid(b.id)) return true;
      p = parentTopic(p);
    }
    return false;
  }
  function isSelOrAbove(t) {
    if (!t || !sel) return false;
    var p = find(topics, sel);
    while (p) {
      if (sid(p.id) === sid(t.id)) return true;
      p = parentTopic(p);
    }
    return false;
  }
  function inOpenBranch(t) {
    if (!t || !openStack.length) return false;
    var root = find(topics, openStack[0].id);
    return !!(root && related(root, t));
  }
  function closeOpens() {
    openStack = [];
    openRef = null;
  }
  function pruneToSel() {
    var i, t;
    for (i = 0; i < openStack.length; i++) {
      t = find(topics, openStack[i].id);
      if (!isSelOrAbove(t)) {
        openStack.length = i;
        openRef = null;
        return;
      }
    }
  }
  function leaveOther(t) {
    if (!sel || sid(sel) === sid(t.id)) return false;
    if (inOpenBranch(t)) return false;
    sel = null;
    closeOpens();
    return true;
  }
  function closeBranch(t) {
    if (!t) return;
    var depth = (t.level || 1) - 2;
    var id = sid(t.id);
    if (depth < 0) return;
    if (openStack[depth] && openStack[depth].id === id) {
      openStack.length = depth;
      openRef = null;
    }
  }
  function parentSel(t) {
    var p = parentTopic(t);
    if (p && (p.level || 1) > 1) return sid(p.id);
    return null;
  }
  var pickGuard = 0;
  function guardPick() {
    var now = Date.now();
    if (now < pickGuard) return false;
    pickGuard = now + 400;
    return true;
  }
  function pickTopic(t) {
    if (!guardPick()) return;
    if (sid(sel) === sid(t.id)) {
      closeBranch(t);
      sel = parentSel(t);
    } else {
      sel = sid(t.id);
    }
    paint();
  }
  function toggleTopics(t) {
    if (!guardPick()) return;
    var lv = t.level || 1;
    var id = sid(t.id);
    var depth = lv - 2;
    sel = id;
    openRef = null;
    if (depth < 0) { paint(); return; }
    if (openStack[depth] && openStack[depth].id === id && openStack[depth].mode === "topics") {
      openStack.length = depth;
    } else {
      openStack.length = depth;
      openStack[depth] = { id: id, mode: "topics" };
    }
    paint();
  }
  function toggleRefs(t) {
    if (!guardPick()) return;
    var lv = t.level || 1;
    var id = sid(t.id);
    var depth = lv - 2;
    var same;
    sel = id;
    openRef = null;
    if (depth < 0) { paint(); return; }
    same = openStack[depth] && openStack[depth].id === id && openStack[depth].mode === "refs";
    if (same) {
      openStack.length = depth;
    } else {
      openStack.length = depth;
      openStack[depth] = { id: id, mode: "refs" };
      openRef = refsFor(t)[0] || null;
    }
    paint();
  }
  function shiftY(els, dy) {
    var i;
    for (i = 0; i < els.length; i++) {
      if (!els[i]) continue;
      els[i]._y = (els[i]._y || 0) + dy;
      els[i].style.top = Math.round(els[i]._y) + "px";
    }
  }
  function fitBand() {
    var descs = document.getElementById("descs");
    if (!descs) return;
    var nodes = descs.querySelectorAll(".tdesc");
    var maxH = boxH;
    var i, d, ta, w, h;
    for (i = 0; i < nodes.length; i++) {
      d = nodes[i];
      ta = d.querySelector("textarea");
      w = parseInt(d.style.width, 10) || d.offsetWidth;
      h = descH(ta ? ta.value : "", w);
      if (h > maxH) maxH = h;
    }
    for (i = 0; i < nodes.length; i++) nodes[i].style.height = maxH + "px";
  }
  function descBusy() {
    var el = document.activeElement;
    return !!(el && el.closest && el.closest(".tdesc"));
  }
  function showColDesc(col, topic) {
    if (descBusy()) return;
    var descs = document.getElementById("descs");
    if (!descs) return;
    var d = descs.querySelector('.tdesc[data-col="' + col + '"]');
    if (!d) return;
    var ta = d.querySelector("textarea");
    if (!ta) return;
    ta.value = descText(topic);
    fitBand();
  }
  function paint() {
    var board = document.getElementById("board");
    var st = document.getElementById("status");
    if (!board) return;
    var items = visible();
    board.innerHTML = "";
    board.style.position = "relative";
    board.style.display = "block";
    if (!items.length) {
      if (st) st.textContent = "0 topics.";
      return;
    }
    var l1 = items[0];
    pruneToSel();
    var colLists = [{ list: kids(items, l1), parent: null }];
    var iOpen, o, par, nxt;
    for (iOpen = 0; iOpen < openStack.length; iOpen++) {
      o = openStack[iOpen];
      par = find(items, o.id);
      if (!par) {
        openStack.length = iOpen;
        break;
      }
      if (o.mode !== "topics") break;
      nxt = kids(items, par);
      colLists.push({ list: nxt, parent: par });
    }
    var refTopic = null;
    if (openStack.length && openStack[openStack.length - 1].mode === "refs") {
      refTopic = find(items, openStack[openStack.length - 1].id);
    }
    var refList = refsFor(refTopic);
    if (openRef && refList.indexOf(openRef) < 0) openRef = null;

    function colNameW(list) {
      var w = 0;
      list.forEach(function (t) {
        var s = textSize(typeof t === "string" ? t : (t.title || ""));
        if (s.w > w) w = s.w;
      });
      return w < 8 ? 8 : w;
    }
    var BOX_H = 0;
    items.forEach(function (t) {
      var s = textSize(t.title || "");
      if (s.h > BOX_H) BOX_H = s.h;
    });
    if (BOX_H < 8) BOX_H = 8;
    boxH = BOX_H;
    function colSpan(nameW) {
      return nameW + GAP_BTN + BOX_H + GAP_BTN + BOX_H;
    }
    var wRef = refList.length ? colNameW(refList) : 0;

    function isOn(t) {
      return isSelOrAbove(t);
    }
    function mkBtn(kind, label, open, onClick) {
      var c = document.createElement("button");
      c.type = "button";
      c.className = "tbtn tbtn-" + kind + (open ? " open" : "");
      c.textContent = String(label);
      c.addEventListener("dblclick", function (ev) { ev.preventDefault(); ev.stopPropagation(); });
      c.addEventListener("click", function (ev) {
        ev.preventDefault();
        ev.stopPropagation();
        if (onClick) onClick();
      });
      return c;
    }
    function box(t, kind) {
      if ((t.level || 1) <= 1) return null;
      var b = document.createElement("button");
      var n = kids(items, t).length;
      var vn = refN(t);
      var on = isOn(t);
      var name = document.createElement("span");
      var tealOpen = false, greenOpen = false, oi, oo;
      for (oi = 0; oi < openStack.length; oi++) {
        oo = openStack[oi];
        if (oo && oo.id === sid(t.id)) {
          tealOpen = oo.mode === "topics";
          greenOpen = oo.mode === "refs";
        }
      }
      b.type = "button";
      b.className = "tbox" + (kind === "h" ? " thead" : "") + (on ? " on" : "");
      b.dataset.id = sid(t.id);
      name.className = "tname";
      name.textContent = t.title || "";
      b.appendChild(name);
      var teal = mkBtn("teal", n, tealOpen, function () { toggleTopics(t); });
      var green = mkBtn("green", vn, greenOpen, function () { toggleRefs(t); });
      b._teal = teal;
      b._green = green;
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
          saveTopics("Saved.");
        }
        inp.addEventListener("keydown", function (kev) {
          if (kev.key === "Enter") { kev.preventDefault(); commit(); }
          if (kev.key === "Escape") { kev.preventDefault(); paint(); }
        });
        inp.addEventListener("blur", commit);
        inp.addEventListener("click", function (cev) { cev.stopPropagation(); });
      }
      b.addEventListener("dblclick", startEdit);
      b.addEventListener("mouseenter", function () {
        showColDesc(kind, t);
        if (leaveOther(t)) paint();
      });
      b.addEventListener("mouseleave", function () {
        var box = document.querySelector('#descs .tdesc[data-col="' + kind + '"]');
        var rest = box && box.dataset.rest ? find(topics, box.dataset.rest) : null;
        showColDesc(kind, rest);
      });
      if (kind !== "h") {
        b.addEventListener("click", function (ev) {
          ev.preventDefault();
          ev.stopPropagation();
          if (ev.detail > 1) return;
          if (name.querySelector("input")) return;
          pickTopic(t);
        });
      }
      board.appendChild(b);
      board.appendChild(teal);
      board.appendChild(green);
      return b;
    }
    function refBox(label) {
      var b = document.createElement("button");
      var name = document.createElement("span");
      b.type = "button";
      b.className = "tbox" + (openRef === label ? " on" : "");
      name.className = "tname";
      name.textContent = label;
      b.appendChild(name);
      b.addEventListener("click", function (ev) {
        ev.preventDefault();
        ev.stopPropagation();
        openRef = openRef === label ? null : label;
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
      if (el._teal) {
        put(el._teal, x + colW + GAP_BTN, y, BOX_H, BOX_H);
        put(el._green, x + colW + GAP_BTN + BOX_H + GAP_BTN, y, BOX_H, BOX_H);
      }
    }
    function stack(els, x, y0, colW) {
      var y = y0, i;
      for (i = 0; i < els.length; i++) {
        put(els[i], x, y, colW, BOX_H);
        y += BOX_H + GAP_Y;
      }
    }
    function around(parent, els, x, colW) {
      if (!parent || !els.length) return;
      var tot = els.length * BOX_H + Math.max(0, els.length - 1) * GAP_Y;
      stack(els, x, parent._y + BOX_H / 2 - tot / 2, colW);
    }
    function revealBox(el) {
      var wrapEl = document.getElementById("wrap");
      if (!wrapEl || !el) return;
      var wr = wrapEl.getBoundingClientRect();
      var er = el.getBoundingClientRect();
      var dx = 0, dy = 0;
      if (er.right > wr.right - PAD) dx += er.right - (wr.right - PAD);
      if (er.left - dx < wr.left + PAD) dx -= (wr.left + PAD) - (er.left - dx);
      if (er.bottom > wr.bottom - PAD) dy += er.bottom - (wr.bottom - PAD);
      if (er.top - dy < wr.top + PAD) dy -= (wr.top + PAD) - (er.top - dy);
      if (dx) wrapEl.scrollLeft += dx;
      if (dy) wrapEl.scrollTop += dy;
    }
    function keepOnScreen(els) {
      if (!els || !els.length || viewH <= 0) return;
      var minTop = PAD;
      var viewBottom = viewH - PAD;
      var minY = Infinity, maxB = -Infinity, i;
      for (i = 0; i < els.length; i++) {
        if (els[i]._y < minY) minY = els[i]._y;
        if (els[i]._y + (els[i]._h || BOX_H) > maxB) maxB = els[i]._y + (els[i]._h || BOX_H);
      }
      var dy = 0;
      if (maxB - minY > viewBottom - minTop) dy = minTop - minY;
      else if (minY < minTop) dy = minTop - minY;
      else if (maxB > viewBottom) dy = viewBottom - maxB;
      if (!dy) return;
      var pack = [], el;
      for (i = 0; i < els.length; i++) {
        el = els[i];
        pack.push(el);
        if (el._teal) pack.push(el._teal);
        if (el._green) pack.push(el._green);
      }
      shiftY(pack, dy);
    }
    function centerHits(box) {
      var hits = box.querySelectorAll(".hit");
      if (!hits.length) return;
      var first = hits[0];
      var last = hits[hits.length - 1];
      var mid = (first.offsetTop + last.offsetTop + last.offsetHeight) / 2;
      box.scrollTop = Math.max(0, Math.round(mid - box.clientHeight / 2));
    }

    var c2 = l2s.filter(function (t) { return (t.level || 1) === 2; }).map(function (t) { return box(t, "2"); }).filter(Boolean);
    var c3 = l3s.filter(function (t) { return (t.level || 1) === 3; }).map(function (t) { return box(t, "3"); }).filter(Boolean);
    var c4 = l4s.filter(function (t) { return (t.level || 1) === 4; }).map(function (t) { return box(t, "4"); }).filter(Boolean);
    var cRef = refList.map(refBox);

    var sel2 = sel ? find(l2s, sel) : null;
    var sel3 = sel ? find(l3s, sel) : null;
    var sel4 = sel ? find(l4s, sel) : null;
    var d2h = descH(descText(sel2 || open2), w1);
    var d3h = c3.length ? descH(descText(sel3 || open3), w3) : 0;
    var d4h = c4.length ? descH(descText(sel4 || open4), w4) : 0;
    var descMax = Math.max(BOX_H, d2h, d3h, d4h);
    var band = PAD + BOX_H + GAP_Y;

    var col1n = c2.length;
    var col1H = col1n * BOX_H + Math.max(0, col1n - 1) * GAP_Y;
    var wrap = document.getElementById("wrap");
    var viewH = wrap ? wrap.clientHeight : 0;
    var treeView = Math.max(0, viewH - band);
    var y1 = band;
    if (treeView > col1H + PAD * 2) y1 = band + Math.round((treeView - col1H) / 2);
    stack(c2, PAD, y1, w1);

    var x3 = PAD + colSpan(w1) + GAP_X;
    var parent2 = findBox(c2, openL2);
    if (l2Mode === "topics") {
      around(parent2, c3, x3, w3);
      keepOnScreen(c3);
    }
    var x4 = x3 + (c3.length ? colSpan(w3) + GAP_X : 0);
    var parent3 = findBox(c3, openL3);
    if (l3Mode === "topics") {
      around(parent3, c4, x4, w4);
      keepOnScreen(c4);
    }

    var xRef = PAD + colSpan(w1) + GAP_X;
    var refParent = parent2;
    if (l3Mode === "refs") {
      xRef = x4;
      refParent = parent3;
    } else if (l4Mode === "refs") {
      xRef = x4 + (c4.length ? colSpan(w4) + GAP_X : 0);
      refParent = findBox(c4, openL4);
    } else if (l2Mode !== "refs") {
      xRef = 0;
    }
    if (cRef.length && xRef) {
      around(refParent, cRef, xRef, wRef);
      keepOnScreen(cRef);
    }

    var versesEl = null;
    var versesWrap = null;
    var xVs = 0;
    if (!openRef) {
      lastOpenRef = null;
      hitPick = false;
      hitStart = 0;
      hitEnd = 0;
    }
    if (openRef && cRef.length && xRef) {
      if (openRef !== lastOpenRef) {
        lastOpenRef = openRef;
        viewChap = chapterOf(openRef);
        hitPick = false;
        hitStart = 0;
        hitEnd = 0;
      }
      if (!viewChap) viewChap = chapterOf(openRef);
      xVs = xRef + wRef + GAP_X;
      versesWrap = document.createElement("div");
      versesWrap.className = "tverse-wrap";
      board.appendChild(versesWrap);
      var vsW = Math.max(280, (wrap ? wrap.clientWidth : 800) - xVs - PAD);
      var vsH = Math.max(160, viewH - PAD);
      put(versesWrap, xVs, PAD, vsW, vsH);
      versesWrap.style.height = vsH + "px";

      var bar = document.createElement("div");
      bar.className = "tverse-bar";
      bar.addEventListener("click", function (ev) { ev.stopPropagation(); });
      var left = document.createElement("div");
      left.className = "tverse-bar-left";
      var prevBtn = document.createElement("button");
      prevBtn.type = "button";
      prevBtn.className = "ew-ch-prev";
      prevBtn.textContent = "Prev";
      var iCan = viewChap ? CANON.indexOf(viewChap.abbr) : 0;
      prevBtn.disabled = !viewChap || (iCan <= 0 && viewChap.ch <= 1);
      prevBtn.addEventListener("click", function (ev) {
        ev.preventDefault();
        ev.stopPropagation();
        shiftChap(-1);
      });
      var refLab = document.createElement("strong");
      refLab.className = "tverse-ref";
      refLab.textContent = sameOrigChap() ? openRef : (viewChap ? viewChap.abbr + " " + viewChap.ch : openRef);
      var nextBtn = document.createElement("button");
      nextBtn.type = "button";
      nextBtn.className = "ew-ch-next";
      nextBtn.textContent = "Next";
      nextBtn.disabled = !viewChap || (iCan >= CANON.length - 1 && viewChap.ch >= chCount(viewChap.num));
      nextBtn.addEventListener("click", function (ev) {
        ev.preventDefault();
        ev.stopPropagation();
        shiftChap(1);
      });
      left.appendChild(prevBtn);
      left.appendChild(refLab);
      left.appendChild(nextBtn);
      if (sameOrigChap()) {
        var pickBtn = document.createElement("button");
        pickBtn.type = "button";
        pickBtn.className = "tverse-pick" + (hitPick ? " on" : "");
        if (!hitPick) pickBtn.textContent = "Modify Highlights";
        else if (hitStart && !hitEnd) pickBtn.textContent = "Now click the last verse.";
        else pickBtn.textContent = "Click the first verse, then the last";
        pickBtn.addEventListener("click", function (ev) {
          ev.preventDefault();
          ev.stopPropagation();
          hitPick = !hitPick;
          if (hitPick) { hitStart = 0; hitEnd = 0; }
          paint();
        });
        left.appendChild(pickBtn);
      }
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
      var ti, trow, tcode, tyear, tr, trs;
      trs = TRANSLATIONS.slice().sort(function (a, b) {
        return String(a.label || a.id).localeCompare(String(b.label || b.id));
      });
      for (ti = 0; ti < trs.length; ti++) {
        tr = trs[ti];
        trow = document.createElement("div");
        trow.setAttribute("role", "option");
        trow.setAttribute("data-tr", tr.id);
        trow.className = verseTr === tr.id ? "on" : "";
        tcode = document.createElement("span");
        tcode.className = "ew-tr-code";
        tcode.textContent = tr.label;
        tyear = document.createElement("span");
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
      }
      trNow.addEventListener("click", function (ev) {
        ev.preventDefault();
        ev.stopPropagation();
        var open = trList.hidden;
        trList.hidden = !open;
        trNow.setAttribute("aria-expanded", open ? "true" : "false");
        if (open) {
          trList.style.maxHeight = "none";
          trList.style.overflowY = "visible";
          var need = trList.scrollHeight;
          var box = (versesWrap || document.getElementById("wrap") || document.documentElement).getBoundingClientRect();
          var room = Math.floor(box.bottom - trList.getBoundingClientRect().top - 4);
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

      versesEl = document.createElement("div");
      versesEl.className = "tverses" + (hitPick ? " picking" : "");
      versesWrap.appendChild(versesEl);
      var rng = sameOrigChap() ? rangeFor(refTopic, openRef) : { from: 0, to: 0 };
      var cached = verseCache[cacheKey(openRef)];
      function drawLines(lines) {
        versesEl.innerHTML = "";
        var li, p, vn, n, hit, a = rng.from, b = rng.to || rng.from, sp;
        if (hitPick) {
          if (hitStart && hitEnd) {
            a = Math.min(hitStart, hitEnd);
            b = Math.max(hitStart, hitEnd);
          } else if (hitStart) {
            a = b = hitStart;
          } else {
            a = 0;
            b = 0;
          }
        } else if (!a) {
          sp = refSpan(openRef);
          if (sp && sameOrigChap()) { a = sp.vs1; b = sp.vs2; }
        }
        for (li = 0; li < lines.length; li++) {
          p = document.createElement("p");
          n = lines[li].n;
          hit = a ? (n >= a && n <= b) : false;
          if (hit) p.className = "hit";
          p.setAttribute("data-vs", String(n));
          vn = document.createElement("span");
          vn.className = "vn";
          vn.textContent = String(n);
          p.appendChild(vn);
          p.appendChild(document.createTextNode(" "));
          var body = document.createElement("span");
          body.innerHTML = verseHtml(lines[li].t);
          p.appendChild(body);
          if (hitPick) {
            p.addEventListener("click", function (ev) {
              ev.preventDefault();
              ev.stopPropagation();
              pickVerse(Number(this.getAttribute("data-vs")));
            });
          }
          versesEl.appendChild(p);
        }
        versesEl._h = versesEl.clientHeight;
        requestAnimationFrame(function () { centerHits(versesEl); });
      }
      if (cached) drawLines(cached);
      else {
        var wantRef = openRef;
        var wantChap = viewChap ? viewChap.abbr + " " + viewChap.ch : "";
        var wantTr = verseTr;
        loadVerses(openRef, function () {
          if (openRef !== wantRef) return;
          if (verseTr !== wantTr) return;
          if (!viewChap || viewChap.abbr + " " + viewChap.ch !== wantChap) return;
          paint();
        });
      }
    }

    var descs = document.getElementById("descs");
    if (descs) {
      descs.innerHTML = "";
      descs.style.height = "0px";
      function descBox(topic, x, colW, col) {
        if (!colW) return;
        var d = document.createElement("div");
        d.className = "tdesc";
        d.dataset.col = col;
        d.dataset.rest = topic ? sid(topic.id) : "";
        d.style.left = Math.round(x) + "px";
        d.style.top = PAD + "px";
        d.style.width = colW + "px";
        d.style.height = descMax + "px";
        var ta = document.createElement("textarea");
        ta.rows = 1;
        ta.value = descText(topic);
        ta.title = "Description";
        ta.addEventListener("click", function (ev) { ev.stopPropagation(); });
        ta.addEventListener("focus", function () {
          if (topic) descSnap[sid(topic.id)] = ta.value;
        });
        ta.addEventListener("keydown", function (ev) {
          if (ev.key === "Escape") {
            ev.preventDefault();
            if (topic && descSnap[sid(topic.id)] != null) topic.description = descSnap[sid(topic.id)];
            paint();
          }
        });
        ta.addEventListener("input", function () {
          if (topic) topic.description = ta.value;
          fitBand();
        });
        ta.addEventListener("blur", function () {
          if (!topic) return;
          topic.description = ta.value;
          saveTopics();
        });
        d.appendChild(ta);
        descs.appendChild(d);
      }
      descBox(sel2 || open2, PAD, w1, "2");
      if (c3.length) descBox(sel3 || open3, x3, w3, "3");
      if (c4.length) descBox(sel4 || open4, x4, w4, "4");
    }

    function withBtns(els) {
      var out = [], i;
      for (i = 0; i < els.length; i++) {
        out.push(els[i]);
        if (els[i]._teal) out.push(els[i]._teal);
        if (els[i]._green) out.push(els[i]._green);
      }
      return out;
    }
    var all = withBtns(c2.concat(c3, c4)).concat(cRef);
    if (versesWrap) all = all.concat([versesWrap]);
    var minY = Infinity, maxX = PAD, maxBottom = -Infinity, k;
    for (k = 0; k < all.length; k++) {
      if (all[k]._y < minY) minY = all[k]._y;
      if (all[k]._x + all[k]._w + PAD > maxX) maxX = all[k]._x + all[k]._w + PAD;
      if (all[k]._y + (all[k]._h || BOX_H) > maxBottom) maxBottom = all[k]._y + (all[k]._h || BOX_H);
    }
    if (!all.length) minY = PAD;
    if (descs) descs.style.width = maxX + "px";
    board.style.width = maxX + "px";
    board.style.height = Math.max(viewH, maxBottom + PAD) + "px";
    if (versesWrap) {
      requestAnimationFrame(function () { revealBox(versesWrap); });
    }
    if (st) st.textContent = items.length + " topics.";
  }
  function saveTopics(msg) {
    fetch("/dotl/topics", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ topics: bySeq() })
    }).then(function (r) { return r.json(); }).then(function (d) {
      var el = document.getElementById("status");
      if (el) el.textContent = d.error || msg || (visible().length + " topics.");
    }).catch(function (err) {
      var el = document.getElementById("status");
      if (el) el.textContent = String(err);
    });
  }
  window.snPaintTree = paint;
  window.snSaveTopics = saveTopics;
  window.addEventListener("resize", function () { paint(); });
  document.addEventListener("click", function () {
    var list = document.querySelector(".tverse-bar .ew-tr-list");
    var now = document.querySelector(".tverse-bar .ew-tr-now");
    if (list) list.hidden = true;
    if (now) now.setAttribute("aria-expanded", "false");
  });
  Promise.all([
    fetch("data/topics.json?v=258", { cache: "no-store" }).then(function (r) { return r.json(); }),
    fetch("data/topic-refs.json?v=258", { cache: "no-store" }).then(function (r) { return r.ok ? r.json() : []; }).catch(function () { return []; })
  ]).then(function (pair) {
    topics = pair[0] || [];
    if (Array.isArray(pair[1])) topicRefs = pair[1];
    else if (pair[1] && Array.isArray(pair[1].rows)) topicRefs = pair[1].rows;
    else topicRefs = [];
    paint();
  }).catch(function (err) {
    var st = document.getElementById("status");
    if (st) st.textContent = String(err);
  });
})();
