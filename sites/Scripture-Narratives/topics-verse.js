(function () {
  var PAD = 8;
  var GAP_X = 16;
  var GAP_COL = 16;
  var GAP_Y = 8;
  var GAP_BTN = 4;
  var DESC_H = 26;
  var VERSE_W = 520;
  var topics = [];
  var topicRefs = [];
  var sel = null;
  var descOpen = false;
  var descId = "";
  var descLock = 0;
  var selChapRef = "";
  var selVs = 0;
  var boxH = 8;
  var verseCache = {};
  var verseTr = "NKJV";
  var viewChap = null;
  var descSnap = {};
  var bookOpen = false;
  var chapOpen = false;
  var wantChapOpen = false;
  var chapFilter = true;
  var verseOpen = [];
  var verseChapKey = "";
  var verseAuto = true;
  var expandByRef = false;
  var pendingEdit = null;
  var rhmLock = 0;
  var PATH_COLORS = ["#15803d", "#b91c1c", "#005eb8", "#c45c26", "#6d28d9"];
  var JOIN_FILL = "#f6efc8";
  var JOIN_LINE = "#000";
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
  var CANON_N = 66;
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
  function topicInChap(t) {
    var i, k;
    if (!t || !viewChap) return false;
    if (ownHitsChap(t)) return true;
    k = kids(visible(), t);
    for (i = 0; i < k.length; i++) {
      if (topicInChap(k[i])) return true;
    }
    return false;
  }
  function topicRelated(t) {
    var i, k;
    if (!t) return false;
    if (selChapRef) {
      if (topicHasRef(t, selChapRef)) return true;
      k = kids(visible(), t);
      for (i = 0; i < k.length; i++) {
        if (topicRelated(k[i])) return true;
      }
      return false;
    }
    return topicInChap(t);
  }
  function fitKids(t) {
    var k = kids(visible(), t), out = [], i;
    for (i = 0; i < k.length; i++) {
      if (topicInChap(k[i])) out.push(k[i]);
    }
    return out;
  }
  function firstInChap(list) {
    var i;
    for (i = 0; i < (list || []).length; i++) {
      if (topicInChap(list[i])) return list[i];
    }
    return null;
  }
  function firstRelated(list) {
    var i;
    for (i = 0; i < (list || []).length; i++) {
      if (topicRelated(list[i])) return list[i];
    }
    return null;
  }
  function firstForExpand(list) {
    return expandByRef ? firstRelated(list) : firstInChap(list);
  }
  function idOpen(id) {
    var i;
    for (i = 0; i < verseOpen.length; i++) {
      if (sid(verseOpen[i]) === sid(id)) return true;
    }
    return false;
  }
  function liveIn(list) {
    var i, t;
    for (i = 0; i < (list || []).length; i++) {
      t = list[i];
      if (idOpen(t.id)) return t;
    }
    if (sel) {
      for (i = 0; i < (list || []).length; i++) {
        if (sid(list[i].id) === sid(sel)) return list[i];
      }
    }
    return firstForExpand(list);
  }
  function autoExpandIds(list, items) {
    var ids = [], cur = list, first, ch;
    while (cur && cur.length) {
      first = firstForExpand(cur);
      if (!first) break;
      ch = kids(items, first);
      if (!ch.length) break;
      ids.push(sid(first.id));
      cur = ch;
    }
    return ids;
  }
  function chapKey() {
    return (viewChap ? viewChap.abbr + " " + viewChap.ch : "") + "|" + (selChapRef || "");
  }
  function toggleVerseTopics(t) {
    var items = visible();
    var chain = [];
    var p = t;
    var extra;
    while (p && (p.level || 1) > 1) {
      chain.unshift(sid(p.id));
      p = parentTopic(p);
    }
    verseAuto = false;
    var at = -1, i;
    for (i = 0; i < verseOpen.length; i++) {
      if (sid(verseOpen[i]) === sid(t.id)) { at = i; break; }
    }
    if (at >= 0) {
      verseOpen = chain.slice(0, -1);
      p = parentTopic(t);
      sel = p && (p.level || 1) > 1 ? sid(p.id) : null;
    } else {
      sel = sid(t.id);
      extra = autoExpandIds(kids(items, t), items);
      verseOpen = chain.concat(extra);
    }
    paint();
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
  function chapterRefs() {
    var seen = {}, labs = [], i, r, p, lab;
    if (!viewChap) return [];
    for (i = 0; i < topicRefs.length; i++) {
      r = topicRefs[i];
      lab = String(r.ref || "").trim();
      p = parseRefParts(lab);
      if (!p || p.book !== viewChap.abbr || p.ch !== viewChap.ch) continue;
      if (seen[lab]) continue;
      seen[lab] = 1;
      labs.push(lab);
    }
    return combineRefs(labs);
  }
  function topicHasRef(t, lab) {
    var i, r;
    if (!t || !lab) return false;
    for (i = 0; i < topicRefs.length; i++) {
      r = topicRefs[i];
      if (sid(r.topic_id) !== sid(t.id)) continue;
      if (sameRef(r.ref, lab)) return true;
    }
    return false;
  }
  function bottomsForSelRef() {
    var items = visible();
    var hit = [], i, t, desc, d, keep;
    if (!viewChap || !selChapRef) return [];
    for (i = 0; i < items.length; i++) {
      t = items[i];
      if (topicHasRef(t, selChapRef)) hit.push(t);
    }
    keep = [];
    for (i = 0; i < hit.length; i++) {
      t = hit[i];
      desc = branchOf(t);
      var hasDeeper = false;
      for (d = 1; d < desc.length; d++) {
        if (topicHasRef(desc[d], selChapRef)) { hasDeeper = true; break; }
      }
      if (!hasDeeper && (t.level || 1) > 1) keep.push(t);
    }
    keep.sort(function (a, b) { return (a.seq || 0) - (b.seq || 0); });
    return keep;
  }
  function ensureSelRef() {
    var refs = chapterRefs(), i;
    if (!refs.length) {
      selChapRef = "";
      return refs;
    }
    for (i = 0; i < refs.length; i++) {
      if (sameRef(refs[i], selChapRef)) return refs;
    }
    selChapRef = refs[0];
    return refs;
  }
  function refIsSelected(lab) {
    var rel, i;
    if (!lab) return false;
    if (sameRef(lab, selChapRef)) return true;
    rel = bottomsForSelRef();
    for (i = 0; i < rel.length; i++) {
      if (topicHasRef(rel[i], lab)) return true;
    }
    return false;
  }
  function refForVerse(vs) {
    var refs = chapterRefs(), i, p;
    for (i = 0; i < refs.length; i++) {
      p = parseRefParts(refs[i]);
      if (p && vs >= p.a && vs <= p.b) return refs[i];
    }
    return "";
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
    var bottoms = bottomsForSelRef();
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
    var ids = {}, seeds = bottomsForSelRef(), i, p;
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
    var bottoms = bottomsForSelRef();
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
    if (c.length >= 2) return JOIN_LINE;
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
  function shownBook(abbr) {
    var i = CANON.indexOf(abbr);
    return i >= 0 && i < CANON_N;
  }
  function bookCols(all) {
    var by = mappedChapters();
    var ot = [], nt = [], i, b;
    for (i = 0; i < CANON_N; i++) {
      b = CANON[i];
      if (!all && !by[b]) continue;
      if (i >= NT_AT) nt.push(b);
      else ot.push(b);
    }
    return { ot: ot, nt: nt, by: by };
  }
  function mappedChapList() {
    var by = mappedChapters();
    var out = [], i, b, chs, c, n;
    for (i = 0; i < CANON_N; i++) {
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
  function validChap(abbr, ch) {
    var num = bookNum(abbr);
    ch = Number(ch);
    if (!shownBook(abbr) || !num || !ch || ch < 1) return null;
    if (ch > chCount(num)) return null;
    return { abbr: abbr, ch: ch, num: num };
  }
  function applySection(row) {
    var chap;
    if (!row || typeof row !== "object") return false;
    chap = validChap(row.book, row.chapter);
    if (!chap) return false;
    viewChap = chap;
    if (typeof row.filter === "boolean") chapFilter = row.filter;
    if (row.tr) verseTr = String(row.tr);
    if (row.ref) selChapRef = String(row.ref);
    return true;
  }
  function saveSection() {
    if (!rootId || !viewChap) return;
    fetch("/dotl/sections", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        id: rootId,
        book: viewChap.abbr,
        chapter: viewChap.ch,
        ref: selChapRef || "",
        filter: chapFilter,
        tr: verseTr || "NKJV"
      })
    }).catch(function () {});
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
    selChapRef = "";
    bookOpen = false;
    if (!wantChapOpen) chapOpen = false;
    saveSection();
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
    if (i < 0 || i >= CANON_N) {
      if (dir < 0) setChap(CANON[CANON_N - 1], chCount(bookNum(CANON[CANON_N - 1])));
      return;
    }
    ch = viewChap.ch + dir;
    max = chCount(viewChap.num);
    if (ch < 1) {
      if (i <= 0) return;
      abbr = CANON[i - 1];
      setChap(abbr, chCount(bookNum(abbr)));
    } else if (ch > max) {
      if (i >= CANON_N - 1) return;
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
    saveSection();
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
  function isSelOrAbove(t) {
    var p;
    if (!sel || !t) return false;
    if (sid(t.id) === sid(sel)) return true;
    p = find(visible(), sel) || find(topics, sel);
    while (p) {
      if (sid(p.id) === sid(t.id)) return true;
      p = parentTopic(p);
    }
    return false;
  }
  function pickTopic(t) {
    var id = sid(t.id);
    sel = sid(sel) === id ? null : id;
    if (sid(sel) !== id) hideDesc();
    paint();
  }
  function saveTopics() {
    fetch("/dotl/topics", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ topics: bySeq() })
    }).catch(function () {});
  }
  function loadTopics(done) {
    Promise.all([
      fetch("data/topics.json?t=" + Date.now(), { cache: "no-store" }).then(function (r) { return r.json(); }),
      fetch("data/topic-refs.json?t=" + Date.now(), { cache: "no-store" }).then(function (r) { return r.ok ? r.json() : []; }).catch(function () { return []; }),
      fetch("data/sections.json?t=" + Date.now(), { cache: "no-store" }).then(function (r) { return r.ok ? r.json() : {}; }).catch(function () { return {}; })
    ]).then(function (pair) {
      var sections = pair[2];
      topics = pair[0] || [];
      if (Array.isArray(pair[1])) topicRefs = pair[1];
      else if (pair[1] && Array.isArray(pair[1].rows)) topicRefs = pair[1].rows;
      else topicRefs = [];
      if (!viewChap) {
        if (!sections || typeof sections !== "object" || Array.isArray(sections) || !applySection(sections[sid(rootId)])) {
          viewChap = firstMappedChap();
        }
      }
      if (typeof done === "function") done();
      else paint();
    }).catch(function (err) {
      var st = document.getElementById("status");
      if (st) st.textContent = String(err);
    });
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
      return nameW + GAP_BTN + BOX_H;
    }
    function mkBtn(kind, label, open, onClick) {
      var c = document.createElement("button");
      c.type = "button";
      c.className = "tbtn tbtn-" + kind + (open ? " open" : "");
      c.textContent = String(label);
      c.addEventListener("click", function (ev) {
        ev.preventDefault();
        ev.stopPropagation();
        if (onClick) onClick();
      });
      return c;
    }
    function box(t, live) {
      var b = document.createElement("button");
      var nFit = fitKids(t).length;
      var on = topicInChap(t) || isSelOrAbove(t);
      var name = document.createElement("span");
      var tealOpen = idOpen(t.id);
      var isLive = !!(live && sid(live.id) === sid(t.id));
      var dim = on && !isLive && !!(live && idOpen(live.id));
      b.type = "button";
      b.className = "tbox" + (on ? " on" : "") + (dim ? " dim" : "");
      b.dataset.id = sid(t.id);
      name.className = "tname";
      name.textContent = t.title || "";
      b.appendChild(name);
      var teal = mkBtn("teal", nFit, tealOpen, function () { toggleVerseTopics(t); });
      teal.dataset.id = sid(t.id);
      b._teal = teal;
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
      b.addEventListener("contextmenu", function (ev) {
        showRhm(ev, "Topic", function () { startEdit(); });
      });
      b.addEventListener("click", function (ev) {
        ev.preventDefault();
        ev.stopPropagation();
        if (name.querySelector("input")) return;
        pickTopic(t);
        if (sid(sel) === sid(t.id)) openDesc(t);
        else hideDesc();
      });
      board.appendChild(b);
      board.appendChild(teal);
      return b;
    }
    function refBox(label, col, topic) {
      var b = document.createElement("button");
      var name = document.createElement("span");
      var ownerId = topic ? sid(topic.id) : "";
      b.type = "button";
      b.className = "tbox" + (refIsSelected(label) ? " on" : "");
      b.dataset.ref = label;
      name.className = "tname";
      name.textContent = label;
      b.appendChild(name);
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
        selChapRef = label;
        selVs = p.a;
        sel = null;
        expandByRef = true;
        bookOpen = false;
        chapOpen = false;
        saveSection();
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
      }
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
      var visH = (chart && chart.clientHeight) ? chart.clientHeight : viewH;
      var innerH = els.length * BOX_H + Math.max(0, els.length - 1) * GAP_Y;
      var y0;
      if (parent) {
        y0 = boardY(parent) + BOX_H / 2 - innerH / 2;
      } else {
        y0 = Math.round((visH - innerH) / 2);
      }
      if (y0 < 0) y0 = 0;
      y0 = Math.round(y0);
      var paneH = Math.max(80, innerH);
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
        if (els[i]._teal) pane.appendChild(els[i]._teal);
        put(els[i], 0, y, nameW, BOX_H);
        y += BOX_H + GAP_Y;
      }
      pane._boxes = els;
      return pane;
    }
    function pathChildEl(item, prevBoxes) {
      var i, t, p;
      if (!item || !prevBoxes) return null;
      for (i = 0; i < prevBoxes.length; i++) {
        t = find(topics, prevBoxes[i].dataset.id);
        p = t ? parentTopic(t) : null;
        if (p && sid(p.id) === sid(item.id)) return prevBoxes[i];
      }
      return null;
    }
    function layoutLevelColumn(list, x, paneW, prevBoxes, minTop, clamp, asBlock) {
      if (!list || !list.length) return null;
      var botIds = {}, i, j, t, p, pid, map = {}, byParent = [], g, h, y0, parentEl, maxBot, availH, pane, paneTop, paneH, minY, maxY, topicEl, refs, refsH, ry, k, re, wRef, wTop, gapG, isBotCol;
      bottomsForSelRef().forEach(function (b) { botIds[sid(b.id)] = 1; });
      wTop = colNameW(list);
      wRef = 0;
      isBotCol = false;
      for (i = 0; i < list.length; i++) {
        if (!botIds[sid(list[i].id)]) continue;
        isBotCol = true;
      }
      if (!paneW) paneW = wTop;
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
        return [];
      }
      function itemRefsH(row) {
        var rf = itemRefs(row);
        if (!rf.length) return 0;
        return rf.length * BOX_H + Math.max(0, rf.length - 1) * GAP_Y;
      }
      function anchorRefIndex(refs) {
        var k, p;
        if (!refs || !refs.length) return 0;
        if (selVs && viewChap) {
          for (k = 0; k < refs.length; k++) {
            p = parseRefParts(refs[k]);
            if (p && p.book === viewChap.abbr && p.ch === viewChap.ch && selVs >= p.a && selVs <= p.b) return k;
          }
        }
        for (k = 0; k < refs.length; k++) {
          if (refIsChap(refs[k])) return k;
        }
        return 0;
      }
      function itemY(grp, jj) {
        if (grp.ys && grp.ys[jj] != null) return grp.ys[jj];
        return grp.y + jj * (BOX_H + GAP_Y);
      }
      function refSpan(grp) {
        var top = Infinity, bot = -Infinity, ty, rh, jj, row, rf, anc, stepY;
        stepY = BOX_H + GAP_Y;
        for (jj = 0; jj < grp.items.length; jj++) {
          row = grp.items[jj];
          rf = itemRefs(row);
          if (!rf.length) continue;
          ty = itemY(grp, jj);
          anc = anchorRefIndex(rf);
          rh = itemRefsH(row);
          if (ty - anc * stepY < top) top = ty - anc * stepY;
          if (ty - anc * stepY + rh > bot) bot = ty - anc * stepY + rh;
        }
        return { top: top, bot: bot };
      }
      g = [{ items: list, h: 0, y: minTop, p: null }];
      (function () {
        var stepY = BOX_H + GAP_Y;
        var onP = pathIds();
        var ys = [], onIdx = [], j2, shift, midI;
        for (j2 = 0; j2 < list.length; j2++) {
          ys.push(j2 * stepY);
          if (onP[sid(list[j2].id)]) onIdx.push(j2);
        }
        if (onIdx.length) {
          midI = onIdx[Math.floor((onIdx.length - 1) / 2)];
          shift = minTop - ys[midI];
          for (j2 = 0; j2 < ys.length; j2++) ys[j2] = Math.round(ys[j2] + shift);
        } else {
          for (j2 = 0; j2 < ys.length; j2++) ys[j2] = Math.round(minTop + j2 * stepY);
        }
        g[0].ys = ys;
        g[0].y = ys[0];
        g[0].h = ys[ys.length - 1] + BOX_H - ys[0];
      })();
      minY = g.length ? g[0].y : minTop;
      maxY = minY;
      for (i = 0; i < g.length; i++) {
        maxY = Math.max(maxY, g[i].y + g[i].h);
        if (g[i].ys) {
          for (j = 0; j < g[i].ys.length; j++) {
            if (g[i].ys[j] < minY) minY = g[i].ys[j];
            if (g[i].ys[j] + BOX_H > maxY) maxY = g[i].ys[j] + BOX_H;
          }
        }
        var spanR = refSpan(g[i]);
        if (spanR.top < Infinity && spanR.top < minY) minY = spanR.top;
        if (spanR.bot > -Infinity) maxY = Math.max(maxY, spanR.bot);
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
          y0 = itemY(g[i], j);
          topicEl = box(t);
          pane.appendChild(topicEl);
          put(topicEl, wRef ? wRef + GAP_X : 0, y0 - paneTop, wTop, BOX_H);
          pane._boxes.push(topicEl);
          topicEl._refs = [];
          var anc = anchorRefIndex(refs);
          for (k = 0; k < refs.length; k++) {
            re = refBox(refs[k], pathBorder(t), t);
            pane.appendChild(re);
            put(re, 0, y0 - paneTop + (k - anc) * (BOX_H + GAP_Y), wRef, BOX_H);
            topicEl._refs.push(re);
          }
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
      if (selRefEl) {
        var rel = bottomsForSelRef();
        for (i = 0; i < rel.length; i++) {
          b = findBox(topicEls, rel[i].id);
          if (!b) continue;
          c = colorsThrough(rel[i]);
          col = (c.length === 1) ? PATH_COLORS[c[0] % PATH_COLORS.length] : PATH_COLORS[i % PATH_COLORS.length];
          addPath(
            boardX(selRefEl) + (selRefEl._w || 0),
            boardY(selRefEl) + BOX_H / 2,
            Math.round((boardX(selRefEl) + (selRefEl._w || 0) + boardX(b)) / 2),
            boardX(b),
            boardY(b) + BOX_H / 2,
            col,
            "2px"
          );
        }
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
          col: (c.length === 1) ? PATH_COLORS[c[0] % PATH_COLORS.length] : (c.length >= 2 ? JOIN_LINE : ""),
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
          grey = [];
          colr = [];
          var joinE = [];
          for (ei = 0; ei < dest.edges.length; ei++) {
            e = dest.edges[ei];
            if (e.colored) colr.push(e);
            else if (e.joined) joinE.push(e);
            else grey.push(e);
          }
          function stroke(d, col, thick) {
            var path = document.createElementNS(ns, "path");
            path.setAttribute("d", d);
            path.style.stroke = col;
            path.style.strokeWidth = thick;
            svg.appendChild(path);
          }
          function hSeg(x1, y, x2, col, thick) {
            stroke("M " + Math.round(x1) + " " + Math.round(y) + " L " + Math.round(x2) + " " + Math.round(y), col, thick);
          }
          function vSeg(x, y1, y2b, col, thick) {
            if (Math.round(y1) === Math.round(y2b)) return;
            stroke("M " + Math.round(x) + " " + Math.round(y1) + " L " + Math.round(x) + " " + Math.round(y2b), col, thick);
          }
          function between(a, b, m) {
            return (m - a) * (m - b) <= 0;
          }
          function firstMeet(y1, yDest, ys) {
            var i, y, d, best = null, bestD;
            for (i = 0; i < ys.length; i++) {
              y = ys[i];
              if (Math.round(y) === Math.round(y1)) continue;
              if (!between(y1, yDest, y)) continue;
              d = Math.abs(y - y1);
              if (best == null || d < bestD) {
                best = y;
                bestD = d;
              }
            }
            return best;
          }
          for (ei = 0; ei < grey.length; ei++) {
            e = grey[ei];
            addPath(e.x1, e.y1, xBus, x2, y2, "#c5d0d4", "1px");
          }
          for (ei = 0; ei < joinE.length; ei++) {
            e = joinE[ei];
            addPath(e.x1, e.y1, xBus, x2, y2, JOIN_LINE, "2px");
          }
          var meetYs = [];
          for (ei = 0; ei < colr.length; ei++) meetYs.push(colr[ei].y1);
          for (ei = 0; ei < joinE.length; ei++) meetYs.push(joinE[ei].y1);
          for (ei = 0; ei < colr.length; ei++) {
            e = colr[ei];
            var meet = firstMeet(e.y1, y2, meetYs);
            hSeg(e.x1, e.y1, xBus, e.col, "2px");
            if (meet == null) {
              vSeg(xBus, e.y1, y2, e.col, "2px");
              hSeg(xBus, y2, x2, e.col, "2px");
            } else {
              vSeg(xBus, e.y1, meet, e.col, "2px");
              vSeg(xBus, meet, y2, JOIN_LINE, "2px");
              hSeg(xBus, y2, x2, JOIN_LINE, "2px");
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
    var chart = document.getElementById("chart");
    var viewH = wrap ? wrap.clientHeight : 0;
    var viewW = wrap ? wrap.clientWidth : 800;
    var chartTop = PAD;
    var band = PAD;
    var vsW = Math.max(400, Math.min(VERSE_W, Math.floor(viewW * 0.48)));
    var vsH = Math.max(160, viewH - PAD * 2);
    var versesWrap = document.createElement("div");
    versesWrap.className = "tverse-wrap";
    var oldVs = wrap ? wrap.querySelector(".tverse-wrap") : null;
    if (oldVs && oldVs.parentNode) oldVs.parentNode.removeChild(oldVs);
    if (wrap) wrap.appendChild(versesWrap);
    else board.appendChild(versesWrap);
    put(versesWrap, PAD, PAD, vsW, vsH);
    versesWrap.style.height = vsH + "px";
    versesWrap.style.zIndex = "5";
    if (chart) {
      chart.style.left = (PAD + vsW + GAP_X) + "px";
      chart.style.top = chartTop + "px";
      chart.style.right = "0";
      chart.style.bottom = "0";
    }

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
    bookBtn.className = "ew-tr-now ew-chap-btn";
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
          wantChapOpen = true;
          chapOpen = true;
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
    chBtn.className = "ew-tr-now ew-chap-btn";
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
        wantChapOpen = false;
        chapOpen = false;
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
    if (wantChapOpen) {
      wantChapOpen = false;
      chapOpen = true;
    }
    chGrid.hidden = !chapOpen;
    if (chapOpen) {
      bookList.hidden = true;
      bookOpen = false;
    }

    var mode = document.createElement("button");
    mode.type = "button";
    mode.className = "ew-chap-mode" + (chapFilter ? " filter-on" : " all-on");
    var allLab = document.createElement("span");
    allLab.className = "ew-mode-all";
    allLab.textContent = "All";
    var slash = document.createElement("span");
    slash.className = "ew-mode-slash";
    slash.textContent = "/";
    var filterLab = document.createElement("span");
    filterLab.className = "ew-mode-filter";
    filterLab.textContent = "Filter";
    mode.appendChild(allLab);
    mode.appendChild(slash);
    mode.appendChild(filterLab);
    mode.addEventListener("click", function (ev) {
      ev.preventDefault();
      ev.stopPropagation();
      setFilter(!chapFilter);
    });

    var nav = document.createElement("div");
    nav.className = "tverse-nav";
    var prevBtn = document.createElement("button");
    prevBtn.type = "button";
    prevBtn.className = "ew-ch-prev";
    prevBtn.innerHTML = '<span class="ew-ch-arrow">&lt;</span><span class="ew-ch-lab">Prev</span>';
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
    nextBtn.innerHTML = '<span class="ew-ch-lab">Next</span><span class="ew-ch-arrow">&gt;</span>';
    if (chapFilter) nextBtn.disabled = !mapped.length || atMap < 0 || atMap >= mapped.length - 1;
    else nextBtn.disabled = (iCan < 0 || iCan >= CANON_N - 1) && viewChap.ch >= chCount(viewChap.num);
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
        saveSection();
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
            sel = null;
            if (selVs) {
              var hitRef = refForVerse(selVs);
              if (hitRef) selChapRef = hitRef;
            }
            saveSection();
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

    var chapRefs = ensureSelRef();
    var x = 0;
    var colBuilt = [];
    var topicEls = [];
    var refEls = [];
    var ci, pane, panes = [];
    var selRefEl = null;
    function layoutRefsColumn(refs, x0, minTop) {
      if (!refs || !refs.length) return null;
      var w = colNameW(refs);
      var innerH = refs.length * BOX_H + Math.max(0, refs.length - 1) * GAP_Y;
      var visH = (chart && chart.clientHeight) ? chart.clientHeight : viewH;
      var y0 = Math.max(0, Math.round((visH - innerH) / 2));
      var paneH = Math.max(80, innerH);
      var paneEl = document.createElement("div");
      var ii, re, y;
      paneEl.className = "tcol";
      board.appendChild(paneEl);
      paneEl.style.left = Math.round(x0) + "px";
      paneEl.style.top = y0 + "px";
      paneEl.style.width = w + "px";
      paneEl.style.height = paneH + "px";
      paneEl._top = y0;
      paneEl._h = paneH;
      paneEl._x = x0;
      paneEl._w = w;
      paneEl._y = y0;
      paneEl._boxes = [];
      y = 0;
      for (ii = 0; ii < refs.length; ii++) {
        re = refBox(refs[ii], "", null);
        paneEl.appendChild(re);
        put(re, 0, y, w, BOX_H);
        paneEl._boxes.push(re);
        if (sameRef(refs[ii], selChapRef)) selRefEl = re;
        y += BOX_H + GAP_Y;
      }
      return paneEl;
    }
    pane = layoutRefsColumn(chapRefs, x, band);
    if (pane) {
      refEls = pane._boxes || [];
      x += pane._w + GAP_COL;
      panes.push(pane);
    }
    var l1 = items[0];
    var l2 = (l1 && (l1.level || 1) === 1) ? kids(items, l1) : [];
    var key = chapKey();
    var colLists, curList, found, iOpen, j, nxt, boxes, parentBox, cw;
    var keyChanged = key !== verseChapKey;
    if (keyChanged) {
      verseChapKey = key;
      verseOpen = [];
      verseAuto = true;
      sel = null;
    }
    if (verseAuto) {
      verseOpen = autoExpandIds(l2, items);
      if (keyChanged) {
        found = firstForExpand(l2);
        if (found) sel = sid(found.id);
      }
    }
    colLists = [{ list: l2, parent: null }];
    curList = l2;
    for (iOpen = 0; iOpen < verseOpen.length; iOpen++) {
      found = null;
      for (j = 0; j < curList.length; j++) {
        if (sid(curList[j].id) === sid(verseOpen[iOpen])) { found = curList[j]; break; }
      }
      if (!found) break;
      nxt = kids(items, found);
      if (!nxt.length) break;
      colLists.push({ list: nxt, parent: found });
      curList = nxt;
    }
    for (ci = 0; ci < colLists.length; ci++) {
      if (!colLists[ci].list.length) continue;
      cw = colNameW(colLists[ci].list);
      boxes = colLists[ci].list.map(function (t) { return box(t, liveIn(colLists[ci].list)); });
      parentBox = null;
      if (colLists[ci].parent && colBuilt.length) {
        parentBox = findBox(colBuilt[colBuilt.length - 1].boxes, colLists[ci].parent.id);
      }
      pane = layoutCol(boxes, x, cw, parentBox);
      if (pane) {
        topicEls = topicEls.concat(boxes);
        colBuilt.push({ boxes: boxes, pane: pane, w: cw, x: x });
        panes.push(pane);
        x += colSpan(cw) + GAP_COL;
      }
    }
    expandByRef = false;


    var pi, colRight = x;
    for (pi = 0; pi < colBuilt.length; pi++) {
      if (!colBuilt[pi].pane) continue;
      colRight = Math.max(colRight, colBuilt[pi].pane._x + colBuilt[pi].pane._w);
    }
    for (pi = 0; pi < panes.length; pi++) {
      if (!panes[pi]) continue;
      colRight = Math.max(colRight, (panes[pi]._x || 0) + (panes[pi]._w || 0));
    }
    placePop();

    var maxX = Math.max(PAD + vsW + PAD, colRight + PAD);
    var contentBot = vsH + PAD * 2;
    for (pi = 0; pi < colBuilt.length; pi++) {
      if (!colBuilt[pi].pane) continue;
      contentBot = Math.max(contentBot, (colBuilt[pi].pane._top || 0) + (colBuilt[pi].pane._h || 0));
    }
    for (pi = 0; pi < panes.length; pi++) {
      if (!panes[pi]) continue;
      contentBot = Math.max(contentBot, (panes[pi]._top || 0) + (panes[pi]._h || 0));
    }
    for (pi = 0; pi < topicEls.length; pi++) {
      contentBot = Math.max(contentBot, boardY(topicEls[pi]) + BOX_H);
      var rfs = topicEls[pi]._refs || [];
      for (var ri = 0; ri < rfs.length; ri++) {
        contentBot = Math.max(contentBot, boardY(rfs[ri]) + BOX_H);
      }
    }
    board.style.width = maxX + "px";
    board.style.height = Math.max(viewH, contentBot + PAD) + "px";
    if (st) st.textContent = chapRefs.length ? (chapRefs.length + " refs.") : (items.length + " topics.");
  }

  function topicBoxEl(id) {
    var nodes = document.querySelectorAll(".tbox[data-id]");
    var i;
    id = sid(id);
    for (i = 0; i < nodes.length; i++) {
      if (nodes[i].dataset.ref) continue;
      if (sid(nodes[i].dataset.id) === id) return nodes[i];
    }
    return null;
  }
  function descKeep(el) {
    var box;
    while (el && el !== document.documentElement) {
      if (el.id === "tdesc") return true;
      if (el.classList && el.classList.contains("tbox") && !el.dataset.ref && sid(el.dataset.id) === sid(descId)) return true;
      if (el.classList && String(el.className || "").indexOf("tcol") >= 0) {
        box = topicBoxEl(descId);
        if (box && box.parentNode === el) return true;
      }
      el = el.parentNode;
    }
    return false;
  }
  function hideDesc() {
    var d = document.getElementById("tdesc");
    var ta = document.getElementById("tdesc-ta");
    var topic;
    if (descOpen && ta) {
      topic = find(topics, ta.dataset.topic);
      if (topic) {
        topic.description = ta.value;
        saveTopics();
      }
    }
    descOpen = false;
    descId = "";
    if (d) d.hidden = true;
  }
  function openDesc(t) {
    if (!t) {
      hideDesc();
      return;
    }
    descOpen = true;
    descId = sid(t.id);
    descLock = Date.now() + 400;
    placePop();
  }
  function placePop() {
    var d = document.getElementById("tdesc");
    var ta = document.getElementById("tdesc-ta");
    var vsEl = document.querySelector(".tverse-wrap");
    var topic = descOpen ? find(topics, descId) : null;
    var box, pane, br, pr, w, left, top, need, maxH, h, vw, vh;
    if (!d) return;
    if (!topic) {
      d.hidden = true;
      return;
    }
    box = topicBoxEl(topic.id);
    w = vsEl && vsEl.offsetWidth ? vsEl.offsetWidth : VERSE_W;
    d.hidden = false;
    if (ta && document.activeElement !== ta) {
      ta.value = descText(topic);
      ta.dataset.topic = sid(topic.id);
    }
    need = descH(ta ? ta.value : descText(topic), w);
    vw = window.innerWidth;
    vh = window.innerHeight;
    maxH = Math.max(80, Math.floor(vh * 0.45));
    h = Math.min(Math.max(need, DESC_H), maxH);
    if (box) {
      pane = box.parentNode && String(box.parentNode.className || "").indexOf("tcol") >= 0 ? box.parentNode : box;
      pr = pane.getBoundingClientRect();
      left = pr.left + (pr.width - w) / 2;
      top = PAD;
      if (left + w > vw - 8) left = vw - 8 - w;
      if (left < 8) left = 8;
    } else {
      left = 8;
      top = PAD;
    }
    d.style.left = Math.round(left) + "px";
    d.style.top = Math.round(top) + "px";
    d.style.width = w + "px";
    d.style.height = h + "px";
    if (ta) ta.style.overflowY = need > maxH ? "auto" : "hidden";
  }

  window.snPaintVerse = paint;
  window.snReloadVerse = function () { loadTopics(paint); };
  (function () {
    var ta = document.getElementById("tdesc-ta");
    var d = document.getElementById("tdesc");
    if (!ta) return;
    if (d) d.addEventListener("click", function (ev) { ev.stopPropagation(); });
    ta.addEventListener("click", function (ev) { ev.stopPropagation(); });
    ta.addEventListener("focus", function () {
      var id = ta.dataset.topic;
      if (id) descSnap[id] = ta.value;
    });
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
      placePop();
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
  document.addEventListener("mousemove", function (ev) {
    if (!descOpen || Date.now() < descLock) return;
    if (!descKeep(document.elementFromPoint(ev.clientX, ev.clientY))) hideDesc();
  });
  document.addEventListener("pointerdown", function (ev) {
    var list = document.querySelector(".tverse-bar .ew-tr-list");
    var now = document.querySelector(".tverse-bar .ew-tr-now");
    var bl = document.querySelector(".ew-book-list");
    var menu = document.getElementById("sn-ref-menu");
    var inBar = ev.target && ev.target.closest && ev.target.closest(".tverse-bar");
    if (descOpen && !descKeep(ev.target)) hideDesc();
    if (!inBar) {
      if (list) list.hidden = true;
      if (now) now.setAttribute("aria-expanded", "false");
      if (bl) bl.hidden = true;
      bookOpen = false;
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
  loadTopics(paint);
})();
