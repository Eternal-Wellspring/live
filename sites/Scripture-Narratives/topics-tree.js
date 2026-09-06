(function () {
  var PAD = 8;
  var GAP_X = 16;
  var GAP_Y = 8;
  var GAP_BTN = 4;
  var DESC_H = 26;
  var descPlace = { right: 0, cap: 0 };
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
  var drag = null;
  var skipRefClick = false;
  var pendingRefEdit = null;
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
  function isLeaf(t) {
    return !!(t && kids(bySeq(), t).length === 0);
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
  function rowsMatchingRef(ids, label) {
    var want = parseRefParts(label);
    var out = [], i, r, lab, p;
    for (i = 0; i < topicRefs.length; i++) {
      r = topicRefs[i];
      if (!ids[sid(r.topic_id)]) continue;
      lab = String(r.ref || "").trim();
      if (!lab) continue;
      if (lab === label || sameRef(lab, label)) {
        out.push(i);
        continue;
      }
      if (!want) continue;
      p = parseRefParts(lab);
      if (p && p.book === want.book && p.ch === want.ch && p.b >= want.a && p.a <= want.b) out.push(i);
    }
    return out;
  }
  function editRefLabel(oldLabel, newLabel) {
    var owner = refOwner();
    var ids = {}, idxs, p, del, i;
    newLabel = String(newLabel || "").trim();
    if (!owner) return;
    if (!newLabel || newLabel === oldLabel) {
      paint();
      return;
    }
    ids[sid(owner.id)] = 1;
    idxs = rowsMatchingRef(ids, oldLabel);
    p = parseRefParts(newLabel);
    if (idxs.length === 1) {
      topicRefs[idxs[0]].ref = newLabel;
      if (p) {
        topicRefs[idxs[0]].from = p.a;
        topicRefs[idxs[0]].to = p.b;
      }
    } else {
      del = {};
      for (i = 0; i < idxs.length; i++) del[idxs[i]] = 1;
      if (idxs.length) topicRefs = topicRefs.filter(function (r, n) { return !del[n]; });
      topicRefs.push({
        topic_id: owner.id,
        ref: newLabel,
        from: p ? p.a : 0,
        to: p ? p.b : 0
      });
    }
    if (openRef === oldLabel) openRef = newLabel;
    saveTopicRefs();
    paint();
  }
  function moveRefToTopic(label, fromId, dest) {
    var src = find(topics, fromId);
    var ids = {}, br, i, idxs, j, idx, r, destIdx, fa, fb, del, rng;
    if (!src || !dest || sid(src.id) === sid(dest.id)) return;
    br = branchOf(src);
    for (i = 0; i < br.length; i++) ids[sid(br[i].id)] = 1;
    idxs = rowsMatchingRef(ids, label);
    if (!idxs.length) {
      rng = rangeFor(src, label);
      setTopicRange(dest.id, label, rng.from || 0, rng.to || rng.from || 0);
      saveTopicRefs();
      paint();
      return;
    }
    destIdx = refRowIndex(dest.id, label);
    del = {};
    for (j = 0; j < idxs.length; j++) {
      idx = idxs[j];
      r = topicRefs[idx];
      if (sid(r.topic_id) === sid(dest.id)) continue;
      if (destIdx >= 0 && destIdx !== idx) {
        fa = Number(topicRefs[destIdx].from) || 0;
        fb = Number(topicRefs[destIdx].to) || fa;
        if (Number(r.from)) fa = fa ? Math.min(fa, Number(r.from)) : Number(r.from);
        if (Number(r.to)) fb = Math.max(fb, Number(r.to));
        topicRefs[destIdx].from = fa;
        topicRefs[destIdx].to = fb;
        del[idx] = 1;
      } else {
        r.topic_id = dest.id;
        destIdx = idx;
      }
    }
    if (Object.keys(del).length) topicRefs = topicRefs.filter(function (row, n) { return !del[n]; });
    saveTopicRefs();
    paint();
  }
  function topicUnderPoint(x, y) {
    var el = document.elementFromPoint(x, y);
    var node = el && el.closest && el.closest("[data-id]");
    if (!node || node.getAttribute("data-ref")) return null;
    return find(topics, node.getAttribute("data-id"));
  }
  function openForDrag(id) {
    var t, n, depth;
    if (!drag || !drag.moved) return;
    t = find(topics, id);
    if (!t) return;
    n = kids(bySeq(), t).length;
    if (!n) return;
    depth = (t.level || 1) - 2;
    if (depth < 0) return;
    if (openStack[depth] && openStack[depth].id === sid(t.id) && openStack[depth].mode === "topics") return;
    sel = sid(t.id);
    openStack.length = depth;
    openStack[depth] = { id: sid(t.id), mode: "topics" };
    paint();
  }
  function beginRefDrag(label, ev) {
    var owner = refOwner();
    drag = {
      label: label,
      fromId: owner ? owner.id : null,
      sx: ev.clientX,
      sy: ev.clientY,
      moved: false,
      ghost: null,
      hoverTimer: null,
      hoverId: null
    };
  }
  function endRefDrag(ev) {
    var moved = drag && drag.moved;
    var label = drag && drag.label;
    var fromId = drag && drag.fromId;
    var drop = null;
    if (drag && drag.hoverTimer) clearTimeout(drag.hoverTimer);
    if (drag && drag.ghost && drag.ghost.parentNode) drag.ghost.parentNode.removeChild(drag.ghost);
    if (moved && ev) drop = topicUnderPoint(ev.clientX, ev.clientY);
    drag = null;
    document.body.style.cursor = "";
    if (moved) skipRefClick = true;
    if (moved && drop && fromId && sid(drop.id) !== sid(fromId)) moveRefToTopic(label, fromId, drop);
  }
  function hideRefMenu() {
    var m = document.getElementById("sn-ref-menu");
    if (m) m.hidden = true;
    pendingRefEdit = null;
  }
  function showRefMenu(ev, startEdit) {
    var m = document.getElementById("sn-ref-menu");
    var r, x, y;
    if (!m) return;
    pendingRefEdit = startEdit;
    m.hidden = false;
    x = ev.clientX;
    y = ev.clientY;
    m.style.left = x + "px";
    m.style.top = y + "px";
    r = m.getBoundingClientRect();
    if (r.right > window.innerWidth - 8) m.style.left = Math.max(8, window.innerWidth - r.width - 8) + "px";
    if (r.bottom > window.innerHeight - 8) m.style.top = Math.max(8, window.innerHeight - r.height - 8) + "px";
  }
  function refRowIndex(topicId, ref) {
    var i, r;
    for (i = 0; i < topicRefs.length; i++) {
      r = topicRefs[i];
      if (sid(r.topic_id) !== sid(topicId)) continue;
      if (sameRef(r.ref, ref)) return i;
    }
    return -1;
  }
  function refRowIndexByChap(topicId, book, ch) {
    var i, r, p;
    for (i = 0; i < topicRefs.length; i++) {
      r = topicRefs[i];
      if (sid(r.topic_id) !== sid(topicId)) continue;
      p = parseRefParts(r.ref);
      if (p && p.book === book && p.ch === ch) return i;
    }
    return -1;
  }
  function unionKidsChapter(t, book, ch) {
    var br = branchOf(t);
    var ids = {}, i, r, p, a = 0, b = 0, fa, fb, found = false;
    for (i = 1; i < br.length; i++) ids[sid(br[i].id)] = 1;
    for (i = 0; i < topicRefs.length; i++) {
      r = topicRefs[i];
      if (!ids[sid(r.topic_id)]) continue;
      p = parseRefParts(r.ref);
      if (!p || p.book !== book || p.ch !== ch) continue;
      found = true;
      fa = Number(r.from) || p.a;
      fb = Number(r.to) || p.b;
      a = a ? Math.min(a, fa) : fa;
      b = Math.max(b, fb);
    }
    if (!found) return null;
    return { from: a, to: b };
  }
  function setTopicRange(topicId, ref, from, to) {
    var i = refRowIndex(topicId, ref);
    if (i >= 0) {
      topicRefs[i].from = from;
      topicRefs[i].to = to;
      if (!topicRefs[i].ref) topicRefs[i].ref = ref;
    } else {
      topicRefs.push({ topic_id: topicId, ref: ref, from: from, to: to });
    }
  }
  function clipTopicRange(topicId, ref, from, to) {
    var i = refRowIndex(topicId, ref);
    var fa, fb, a, b;
    if (i < 0) return;
    fa = Number(topicRefs[i].from) || from;
    fb = Number(topicRefs[i].to) || to;
    a = Math.max(from, Math.min(fa, to));
    b = Math.min(to, Math.max(fb, from));
    if (a > b) { a = from; b = to; }
    topicRefs[i].from = a;
    topicRefs[i].to = b;
  }
  function unionKidsRange(t, ref) {
    var br = branchOf(t);
    var ids = {}, i, found = false, r;
    for (i = 1; i < br.length; i++) ids[sid(br[i].id)] = 1;
    for (i = 0; i < topicRefs.length; i++) {
      r = topicRefs[i];
      if (!ids[sid(r.topic_id)]) continue;
      if (sameRef(r.ref, ref)) { found = true; break; }
    }
    if (!found) return null;
    return collectRange(ids, ref);
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
    var a, b, parts, newLab, idx, p, u, br, i, lab;
    if (!t || !openRef || !isLeaf(t)) return;
    a = Math.min(from, to);
    b = Math.max(from, to);
    parts = parseRefParts(openRef);
    if (!parts && viewChap) parts = { book: viewChap.abbr, ch: viewChap.ch, a: a, b: b };
    if (!parts) return;
    parts.a = a;
    parts.b = b;
    newLab = joinRef(parts);
    idx = refRowIndex(t.id, openRef);
    if (idx < 0) idx = refRowIndexByChap(t.id, parts.book, parts.ch);
    if (idx >= 0) {
      topicRefs[idx].ref = newLab;
      topicRefs[idx].from = a;
      topicRefs[idx].to = b;
    } else {
      topicRefs.push({ topic_id: t.id, ref: newLab, from: a, to: b });
    }
    p = parentTopic(t);
    while (p && (p.level || 1) > 1) {
      u = unionKidsChapter(p, parts.book, parts.ch);
      if (u && u.from) {
        lab = joinRef({ book: parts.book, ch: parts.ch, a: u.from, b: u.to });
        idx = refRowIndexByChap(p.id, parts.book, parts.ch);
        if (idx < 0) idx = refRowIndex(p.id, openRef);
        if (idx >= 0) {
          topicRefs[idx].ref = lab;
          topicRefs[idx].from = u.from;
          topicRefs[idx].to = u.to;
        } else {
          topicRefs.push({ topic_id: p.id, ref: lab, from: u.from, to: u.to });
        }
      }
      p = parentTopic(p);
    }
    br = branchOf(t);
    for (i = 1; i < br.length; i++) clipTopicRange(br[i].id, newLab, a, b);
    openRef = newLab;
    lastOpenRef = newLab;
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
    var id = sid(t.id);
    if (sid(sel) === id) {
      if (!guardPick()) return;
      closeBranch(t);
      sel = parentSel(t);
    } else {
      sel = id;
      pickGuard = Date.now() + 400;
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
      showDesc();
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
      teal.dataset.id = sid(t.id);
      green.dataset.id = sid(t.id);
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
          saveTopics();
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
        if (drag && drag.moved) return;
        if (leaveOther(t)) paint();
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
          editRefLabel(label, inp.value);
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
        ev.preventDefault();
        ev.stopPropagation();
        if (drag) endRefDrag(null);
        showRefMenu(ev, function () { startRefEdit(); });
      });
      b.addEventListener("mousedown", function (ev) {
        if (ev.button !== 0) return;
        if (name.querySelector("input")) return;
        ev.preventDefault();
        beginRefDrag(label, ev);
      });
      b.addEventListener("click", function (ev) {
        ev.preventDefault();
        ev.stopPropagation();
        if (skipRefClick) { skipRefClick = false; return; }
        if (name.querySelector("input")) return;
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
    function boardY(el) {
      if (!el) return 0;
      var pane = el.parentNode;
      if (!pane || String(pane.className || "").indexOf("tcol") < 0) return el._y || 0;
      return (pane._top || 0) + (el._y || 0) - (pane.scrollTop || 0);
    }
    function layoutCol(els, x, nameW, parent, minTop, plain) {
      if (!els || !els.length) return null;
      var paneW = plain ? nameW : colSpan(nameW);
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
        if (els[i]._teal) pane.appendChild(els[i]._teal);
        if (els[i]._green) pane.appendChild(els[i]._green);
        put(els[i], 0, y, nameW, BOX_H);
        y += BOX_H + GAP_Y;
      }
      return pane;
    }
    function centerHits(box) {
      var hits = box.querySelectorAll(".hit");
      if (!hits.length) return;
      var first = hits[0];
      var last = hits[hits.length - 1];
      var mid = (first.offsetTop + last.offsetTop + last.offsetHeight) / 2;
      box.scrollTop = Math.max(0, Math.round(mid - box.clientHeight / 2));
    }

    var wrap = document.getElementById("wrap");
    var viewH = wrap ? wrap.clientHeight : 0;
    var band = PAD + DESC_H + GAP_Y;
    var x = PAD;
    var colBuilt = [];
    var ci, cl, cw, boxes, parentBox, pane;
    for (ci = 0; ci < colLists.length; ci++) {
      cl = colLists[ci];
      cw = colNameW(cl.list);
      boxes = cl.list.map(function (t) { return box(t, String(t.level || 1)); }).filter(Boolean);
      parentBox = (cl.parent && colBuilt.length) ? findBox(colBuilt[colBuilt.length - 1].boxes, cl.parent.id) : null;
      pane = layoutCol(boxes, x, cw, parentBox);
      colBuilt.push({ boxes: boxes, pane: pane, w: cw, x: x });
      x += colSpan(cw) + GAP_X;
    }
    var cRef = [];
    var xRef = 0;
    var xVs = 0;
    if (refTopic && refList.length) {
      xRef = x;
      cRef = refList.map(refBox);
      wRef = colNameW(refList);
      parentBox = colBuilt.length ? findBox(colBuilt[colBuilt.length - 1].boxes, refTopic.id) : null;
      pane = layoutCol(cRef, x, wRef, parentBox, null, true);
      colBuilt.push({ boxes: cRef, pane: pane, w: wRef, x: x });
      xVs = x + wRef + PAD;
    }

    var versesEl = null;
    var versesWrap = null;
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
      if (refTopic && !isLeaf(refTopic)) {
        hitPick = false;
        hitStart = 0;
        hitEnd = 0;
      }
      if (!viewChap) viewChap = chapterOf(openRef);
      if (!xVs) xVs = xRef + (wRef || 0) + PAD;
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
      var nav = document.createElement("div");
      nav.className = "tverse-nav";
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
      var slot = Math.max(
        refLabelW(openRef),
        refLabelW(viewChap ? viewChap.abbr + " " + viewChap.ch : ""),
        refLabelW("1Th 00:00-00")
      );
      refLab.style.width = slot + "px";
      refLab.style.minWidth = slot + "px";
      nav.appendChild(prevBtn);
      nav.appendChild(refLab);
      nav.appendChild(nextBtn);
      left.appendChild(nav);
      if (sameOrigChap() && isLeaf(refTopic)) {
        var pickBtn = document.createElement("button");
        pickBtn.type = "button";
        pickBtn.className = "tverse-pick" + (hitPick ? " on" : "");
        if (!hitPick) pickBtn.textContent = "Modify";
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

    showDesc();
    var colRight = PAD, topBox = Infinity, pi, nTopic = colLists.length;
    for (pi = 0; pi < colBuilt.length; pi++) {
      if (!colBuilt[pi].pane) continue;
      colRight = Math.max(colRight, colBuilt[pi].pane._x + colBuilt[pi].pane._w);
      if (pi < nTopic && colBuilt[pi].pane._y < topBox) topBox = colBuilt[pi].pane._y;
    }
    placeDesc(versesWrap ? (versesWrap._x - PAD) : colRight, topBox);

    var all = colBuilt.map(function (cb) { return cb.pane; }).filter(Boolean);
    if (versesWrap) all = all.concat([versesWrap]);
    var minY = Infinity, maxX = PAD, maxBottom = -Infinity, k;
    for (k = 0; k < all.length; k++) {
      if (all[k]._y < minY) minY = all[k]._y;
      if (all[k]._x + all[k]._w + PAD > maxX) maxX = all[k]._x + all[k]._w + PAD;
      if (all[k]._y + (all[k]._h || BOX_H) > maxBottom) maxBottom = all[k]._y + (all[k]._h || BOX_H);
    }
    if (!all.length) minY = PAD;
    board.style.width = maxX + "px";
    board.style.height = Math.max(viewH, maxBottom + PAD) + "px";
    if (versesWrap) {
      requestAnimationFrame(function () { revealBox(versesWrap); });
    }
    if (st) st.textContent = items.length + " topics.";
  }
  function showDesc() {
    var ta = document.getElementById("tdesc-ta");
    var topic = sel ? find(topics, sel) : null;
    if (!ta) return;
    if (document.activeElement === ta) return;
    ta.value = descText(topic);
    ta.dataset.topic = topic ? sid(topic.id) : "";
  }
  function placeDesc(right, capY) {
    var d = document.getElementById("tdesc");
    var ta = document.getElementById("tdesc-ta");
    var topic = sel ? find(topics, sel) : null;
    var w, need, cap, h;
    if (!d) return;
    if (right) descPlace.right = right;
    if (capY) descPlace.cap = capY;
    right = descPlace.right || (PAD + 240);
    w = Math.max(120, right - PAD);
    need = descH(ta && document.activeElement === ta ? ta.value : descText(topic), w);
    cap = descPlace.cap ? Math.max(DESC_H, descPlace.cap - PAD - GAP_Y) : DESC_H;
    h = Math.min(Math.max(need, DESC_H), cap);
    d.style.left = PAD + "px";
    d.style.top = PAD + "px";
    d.style.width = w + "px";
    d.style.height = h + "px";
    hideDescFull();
  }
  function hideDescFull() {
    var pop = document.getElementById("tdesc-full");
    if (pop) pop.hidden = true;
  }
  function showDescFull() {
    var d = document.getElementById("tdesc");
    var ta = document.getElementById("tdesc-ta");
    var pop = document.getElementById("tdesc-full");
    var t;
    if (!d || !ta || !pop) return;
    if (document.activeElement === ta) return;
    t = ta.value || "";
    if (!String(t).trim()) { pop.hidden = true; return; }
    pop.textContent = t;
    pop.style.left = d.style.left;
    pop.style.top = d.style.top;
    pop.style.width = d.style.width;
    pop.hidden = false;
  }
  function saveTopics(msg) {
    fetch("/dotl/topics", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ topics: bySeq() })
    }).then(function (r) { return r.json(); }).then(function (d) {
      var el = document.getElementById("status");
      if (el) el.textContent = (d && d.error) || msg || (visible().length + " topics.");
    }).catch(function (err) {
      var el = document.getElementById("status");
      if (el) el.textContent = String(err);
    });
  }
  window.snPaintTree = paint;
  window.snSaveTopics = saveTopics;
  (function () {
    var ta = document.getElementById("tdesc-ta");
    if (!ta) return;
    ta.addEventListener("click", function (ev) { ev.stopPropagation(); });
    ta.addEventListener("focus", function () {
      var id = ta.dataset.topic;
      if (id) descSnap[id] = ta.value;
      hideDescFull();
    });
    (function () {
      var d = document.getElementById("tdesc");
      if (!d) return;
      d.addEventListener("mouseenter", showDescFull);
      d.addEventListener("mouseleave", hideDescFull);
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
  document.addEventListener("mousemove", function (ev) {
    var g, t;
    if (!drag) return;
    if (!drag.moved) {
      if (Math.abs(ev.clientX - drag.sx) + Math.abs(ev.clientY - drag.sy) < 6) return;
      drag.moved = true;
      g = document.createElement("div");
      g.className = "ref-ghost";
      g.textContent = drag.label;
      document.body.appendChild(g);
      drag.ghost = g;
      document.body.style.cursor = "grabbing";
    }
    if (drag.ghost) {
      drag.ghost.style.left = (ev.clientX + 8) + "px";
      drag.ghost.style.top = (ev.clientY + 8) + "px";
    }
    t = topicUnderPoint(ev.clientX, ev.clientY);
    if (t && sid(t.id) !== drag.hoverId) {
      drag.hoverId = sid(t.id);
      if (drag.hoverTimer) clearTimeout(drag.hoverTimer);
      drag.hoverTimer = setTimeout(function () { openForDrag(sid(t.id)); }, 280);
    } else if (!t) {
      drag.hoverId = null;
      if (drag.hoverTimer) clearTimeout(drag.hoverTimer);
    }
  });
  document.addEventListener("mouseup", function (ev) {
    if (drag) endRefDrag(ev);
  });
  document.addEventListener("click", function (ev) {
    var list = document.querySelector(".tverse-bar .ew-tr-list");
    var now = document.querySelector(".tverse-bar .ew-tr-now");
    var menu = document.getElementById("sn-ref-menu");
    if (list) list.hidden = true;
    if (now) now.setAttribute("aria-expanded", "false");
    if (menu && !menu.hidden && !(ev.target && ev.target.closest && ev.target.closest("#sn-ref-menu"))) hideRefMenu();
  });
  (function () {
    var menu = document.getElementById("sn-ref-menu");
    if (!menu) return;
    menu.addEventListener("click", function (ev) {
      var btn = ev.target.closest && ev.target.closest("button");
      var fn = pendingRefEdit;
      ev.preventDefault();
      ev.stopPropagation();
      hideRefMenu();
      if (btn && btn.getAttribute("data-edit") === "1" && fn) fn();
    });
  })();
  Promise.all([
    fetch("data/topics.json?v=275", { cache: "no-store" }).then(function (r) { return r.json(); }),
    fetch("data/topic-refs.json?v=275", { cache: "no-store" }).then(function (r) { return r.ok ? r.json() : []; }).catch(function () { return []; })
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
