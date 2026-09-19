/* By Topic: one program for every Level 1. Root is ?id=. On open: first topic selected; if it has a ref, that ref is opened and the verses shown. */
(function () {
  var PAD = 8;
  var GAP_X = 16;
  var GAP_Y = 8;
  var GAP_BTN = 4;
  var JOIN = 1;
  var DESC_H = 26;
  var VERSE_W = 420;
  var topics = [];
  var topicRefs = [];
  var openStack = [];
  var sel = null;
  var descOpen = false;
  var descId = "";
  var descLock = 0;
  var openRef = null;
  var lastRefTopic = null;
  var boxH = 8;
  var verseCache = {};
  var verseTr = "NKJV";
  var viewChap = null;
  var lastOpenRef = null;
  var hitPick = false;
  var hitStart = 0;
  var hitEnd = 0;
  var descSnap = {};
  var noteSnap = "";
  var noteSnapRef = "";
  var noteEditing = false;
  var verseDirty = false;
  var verseDraft = "";
  var verseEditRef = "";
  var verseBoxEl = null;
  var colScroll = {};
  var drag = null;
  var topicDrag = null;
  var skipTopicClick = false;
  var skipRefClick = false;
  var pendingRefEdit = null;
  var pendingActs = null;
  var pendingMove = null;
  var extraSibs = 0;
  var rhmLock = 0;
  var rhm = {
    topic: { title: "Topic", items: ["Edit", "Add Topic", "Out a level", "In a level"] },
    addTopic: { title: "Add Topic", items: ["Same level", "One below"] },
    ref: { title: "Ref", items: ["Edit", "Delete", "Move"] },
    description: { title: "Description", items: ["Edit"] },
    twoMore: { title: "Two more?", items: ["Yes", "No"] },
    refsBox: { title: "Refs", items: ["Add a ref"] }
  };
  var RHM_ITEM = {
    "Edit": "[data-edit]",
    "Add Topic": "[data-add]",
    "Same level": "[data-add-same]",
    "One below": "[data-add-below]",
    "Delete": "[data-delete]",
    "Move": "[data-move]",
    "Yes": "[data-yes]",
    "No": "[data-no]",
    "Add a ref": "[data-add-ref]",
    "Out a level": "[data-out]",
    "In a level": "[data-in]"
  };
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
  var SIB_CAP = 10;
  var editAfterPaint = "";
  var editAfterPaintRef = "";
  function addRefToTopic(t) {
    var lab = "New", n = 2, depth;
    if (!t) return;
    while (ownRefs(t).indexOf(lab) >= 0) {
      lab = "New " + n;
      n += 1;
    }
    topicRefs.push({
      topic_id: t.id,
      ref: lab,
      from: 0,
      to: 0,
      description: ""
    });
    depth = (t.level || 1) - 2;
    if (depth < 0) return;
    openStack.length = depth;
    openStack[depth] = { id: sid(t.id), mode: "refs" };
    lastRefTopic = sid(t.id);
    openRef = lab;
    sel = sid(t.id);
    editAfterPaintRef = lab;
    saveTopicRefs();
    paint();
  }
  function parentOf(t) {
    var list = bySeq();
    var i, lv, j;
    if (!t) return null;
    lv = t.level || 1;
    for (i = 0; i < list.length; i++) {
      if (sid(list[i].id) === sid(t.id)) {
        for (j = i - 1; j >= 0; j--) {
          if ((list[j].level || 1) < lv) return list[j];
        }
        return null;
      }
    }
    return null;
  }
  function sameTopic(a, b) {
    return !!(a && b && sid(a.id) === sid(b.id));
  }
  function siblingCount(parent, lv, exceptId) {
    var n = 0;
    bySeq().forEach(function (x) {
      if ((x.level || 1) !== lv) return;
      if (exceptId && sid(x.id) === sid(exceptId)) return;
      if (sameTopic(parentOf(x), parent)) n += 1;
    });
    return n;
  }
  function nextTopicId() {
    var maxId = 0;
    topics.forEach(function (x) {
      var n = Number(x.id);
      if (n > maxId) maxId = n;
    });
    maxId += 1;
    while (maxId === 3 || maxId === 54 || find(topics, maxId)) maxId += 1;
    return maxId;
  }
  function askTwoMore(then) {
    showRefMenu(null, "twoMore", {
      yes: function () {
        extraSibs = 2;
        if (typeof then === "function") then();
      },
      no: function () {}
    });
  }
  function insertRelative(from, below) {
    var lv, parent, gate, full, i, at, row, st;
    if (!from) return;
    lv = (from.level || 1) + (below ? 1 : 0);
    if (lv < 2) lv = 2;
    parent = below ? from : parentOf(from);
    if (siblingCount(parent, lv) >= SIB_CAP + extraSibs) {
      if (extraSibs >= 2) {
        st = document.getElementById("status");
        if (st) st.textContent = "That's the limit.";
        return;
      }
      askTwoMore(function () {
        extraSibs = 2;
        insertRelative(from, below);
      });
      return;
    }
    full = bySeq();
    at = -1;
    for (i = 0; i < full.length; i++) {
      if (sid(full[i].id) === sid(from.id)) { at = i; break; }
    }
    if (at < 0) return;
    at += 1;
    if (!below) {
      while (at < full.length && (full[at].level || 1) > (from.level || 1)) at += 1;
    }
    row = {
      id: nextTopicId(),
      lecture_id: from.lecture_id,
      level: lv,
      seq: 0,
      kind: "period",
      title: "New",
      notes: "",
      description: "",
      duration: ""
    };
    full.splice(at, 0, row);
    full.forEach(function (x, n) { x.seq = n + 1; });
    topics = full;
    sel = sid(row.id);
    if (below) {
      openStack.length = Math.max(0, (from.level || 1) - 2);
      openStack[(from.level || 1) - 2] = { id: sid(from.id), mode: "topics" };
    }
    editAfterPaint = sid(row.id);
    saveTopics();
    paint();
  }
  function takeBranch(list, i) {
    var t = list[i];
    var lv = t.level || 1;
    var n = 1;
    while (i + n < list.length && (list[i + n].level || 1) > lv) n += 1;
    return list.splice(i, n);
  }
  function bumpLevel(from, d) {
    var n, list, i, parent, dest, branch, st, j, after, oldParent;
    if (!from) return;
    n = (from.level || 1) + d;
    if (n < 2) return;
    if (n === (from.level || 1)) return;
    list = bySeq();
    i = -1;
    for (j = 0; j < list.length; j++) {
      if (sid(list[j].id) === sid(from.id)) { i = j; break; }
    }
    if (i < 0) return;
    oldParent = parentOf(from);
    if (d < 0) parent = parentOf(oldParent);
    else {
      dest = null;
      for (j = i - 1; j >= 0; j--) {
        if ((list[j].level || 1) === (from.level || 1)) { dest = list[j]; break; }
        if ((list[j].level || 1) < (from.level || 1)) break;
      }
      if (!dest) {
        st = document.getElementById("status");
        if (st) st.textContent = "Nothing to go under.";
        return;
      }
      parent = dest;
    }
    if (siblingCount(parent, n, from.id) >= SIB_CAP + extraSibs) {
      if (extraSibs >= 2) {
        st = document.getElementById("status");
        if (st) st.textContent = "That's the limit.";
        return;
      }
      askTwoMore(function () {
        extraSibs = 2;
        bumpLevel(from, d);
      });
      return;
    }
    branch = takeBranch(list, i);
    branch[0].level = n;
    after = list.length;
    if (d < 0) {
      for (j = 0; j < list.length; j++) {
        if (oldParent && sid(list[j].id) === sid(oldParent.id)) {
          after = j + 1;
          while (after < list.length && (list[after].level || 1) > (oldParent.level || 1)) after += 1;
          break;
        }
      }
    } else {
      for (j = 0; j < list.length; j++) {
        if (sid(list[j].id) === sid(parent.id)) {
          after = j + 1;
          break;
        }
      }
    }
    list.splice.apply(list, [after, 0].concat(branch));
    list.forEach(function (x, k) { x.seq = k + 1; });
    topics = list;
    sel = sid(from.id);
    saveTopics();
    paint();
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
    for (i = 0; i < (els || []).length; i++) {
      if (els[i].dataset.ref) continue;
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
  var CANON = "Gen Exo Lev Num Deu Jos Jdg Rut 1Sa 2Sa 1Ki 2Ki 1Ch 2Ch Ezr Neh Est Job Psa Pro Ecc Sng Isa Jer Lam Ezk Dan Hos Jol Amo Oba Jon Mic Nam Hab Zep Hag Zec Mal Mat Mrk Luk Jhn Act Rom 1Co 2Co Gal Eph Php Col 1Th 2Th 1Ti 2Ti Tit Phm Heb Jas 1Pe 2Pe 1Jn 2Jn 3Jn Jud Rev 1Es Tob Jdt Wis Sir Lje Bar 1Ma 2Ma Man 2Es Sus Bel Aza Jub".split(" ");
  var CANON_N = 66;
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
  function sortRefLabs(out) {
    // Canonical order: book, then chapter, then verse. Standing SN. Do not drop. Do not use file order.
    out.sort(function (a, b) {
      var ka = refSortKey(a), kb = refSortKey(b), n;
      for (n = 0; n < 3; n++) {
        if (ka[n] !== kb[n]) return ka[n] - kb[n];
      }
      if (ka[3] < kb[3]) return -1;
      if (ka[3] > kb[3]) return 1;
      return 0;
    });
    return out;
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
    return sortRefLabs(combineRefs(out));
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
    out = combineRefs(out);
    return sortRefLabs(out);
  }
  function lowerRefs(t) {
    var out = [], seen = {}, i, r, lab, ids = {}, br;
    if (!t) return out;
    br = branchOf(t);
    for (i = 0; i < br.length; i++) {
      if (sid(br[i].id) === sid(t.id)) continue;
      ids[sid(br[i].id)] = 1;
    }
    for (i = 0; i < topicRefs.length; i++) {
      r = topicRefs[i];
      if (!ids[sid(r.topic_id)]) continue;
      lab = String(r.ref || "").trim();
      if (!lab || seen[lab]) continue;
      seen[lab] = 1;
      out.push(lab);
    }
    return sortRefLabs(out);
  }
  function ownN(t) {
    return ownRefs(t).length;
  }
  function lowerN(t) {
    return lowerRefs(t).length;
  }
  function homeRef(t) {
    var list = ownRefs(t);
    return list.length ? list[0] : "";
  }
  function topicForOpenRef(refTopic) {
    if (refTopic) return refTopic;
    if (lastRefTopic) return find(topics, lastRefTopic);
    return null;
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
  function refDescIndex(topic) {
    var i, r, p, want, best = -1, bestSpan = -1, span;
    if (!topic || !openRef) return -1;
    want = parseRefParts(openRef);
    for (i = 0; i < topicRefs.length; i++) {
      r = topicRefs[i];
      if (sid(r.topic_id) !== sid(topic.id)) continue;
      if (sameRef(r.ref, openRef) || String(r.ref || "").trim() === String(openRef).trim()) return i;
      p = parseRefParts(r.ref);
      if (!want || !p || p.book !== want.book || p.ch !== want.ch) continue;
      if (p.b < want.a || p.a > want.b) continue;
      span = Math.min(p.b, want.b) - Math.max(p.a, want.a) + 1;
      if (span > bestSpan) {
        bestSpan = span;
        best = i;
      }
    }
    return best;
  }
  function descriptionForOpen(topic) {
    var i = refDescIndex(topic);
    if (i < 0) return "";
    return String(topicRefs[i].description || "");
  }
  function saveOpenDescription(topic, text) {
    var i, p, row;
    if (!topic || !openRef) return;
    text = String(text || "").replace(/\n+$/, "");
    i = refDescIndex(topic);
    if (i >= 0) {
      topicRefs[i].description = text;
    } else if (text.trim()) {
      p = parseRefParts(openRef);
      row = {
        topic_id: topic.id,
        ref: openRef,
        from: p ? p.a : 0,
        to: p ? p.b : 0,
        description: text
      };
      topicRefs.push(row);
    }
    saveTopicRefs();
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
      var keepDesc = idxs.length ? String(topicRefs[idxs[0]].description || "") : "";
      for (i = 0; i < idxs.length; i++) del[idxs[i]] = 1;
      if (idxs.length) topicRefs = topicRefs.filter(function (r, n) { return !del[n]; });
      topicRefs.push({
        topic_id: owner.id,
        ref: newLabel,
        from: p ? p.a : 0,
        to: p ? p.b : 0,
        description: keepDesc
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
        if (!String(topicRefs[destIdx].description || "").trim() && String(r.description || "").trim()) {
          topicRefs[destIdx].description = r.description;
        }
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
  function deleteRefFromTopic(label, topicId) {
    if (!label || topicId == null || topicId === "") return;
    topicRefs = topicRefs.filter(function (r) {
      if (sid(r.topic_id) !== sid(topicId)) return true;
      if (sameRef(r.ref, label) || String(r.ref || "").trim() === label) return false;
      return true;
    });
    if (openRef && (sameRef(openRef, label) || openRef === label)) openRef = null;
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
  function sameParent(a, b) {
    var pa = parentOf(a), pb = parentOf(b);
    if (!pa && !pb) return true;
    return !!(pa && pb && sid(pa.id) === sid(pb.id));
  }
  function dropLine() {
    var el = document.getElementById("topic-drop-line");
    if (!el) {
      el = document.createElement("div");
      el.id = "topic-drop-line";
      el.className = "topic-drop-line";
      document.body.appendChild(el);
    }
    return el;
  }
  function hideDropLine() {
    var el = document.getElementById("topic-drop-line");
    if (el && el.parentNode) el.parentNode.removeChild(el);
  }
  function topicDropAt(ev) {
    var t, box, after, r;
    if (!ev || !topicDrag || !topicDrag.from) return null;
    t = topicUnderPoint(ev.clientX, ev.clientY);
    if (!t) return null;
    if (sid(t.id) === sid(topicDrag.from.id)) return null;
    if ((t.level || 1) !== (topicDrag.from.level || 1)) return null;
    if (!sameParent(t, topicDrag.from)) return null;
    box = document.querySelector('.tbox[data-id="' + sid(t.id) + '"]:not([data-ref])');
    after = false;
    if (box) {
      r = box.getBoundingClientRect();
      after = ev.clientY > (r.top + r.height / 2);
      var line = dropLine();
      line.style.left = r.left + "px";
      line.style.width = r.width + "px";
      line.style.top = (after ? r.bottom : r.top) - 1 + "px";
    }
    return { dest: t, after: after };
  }
  function moveTopicInLevel(from, dest, after) {
    var list, i, k, destI, at, branch;
    if (!from || !dest) return;
    if (sid(from.id) === sid(dest.id)) return;
    if ((from.level || 1) !== (dest.level || 1)) return;
    if (!sameParent(from, dest)) return;
    list = bySeq();
    i = -1;
    for (k = 0; k < list.length; k++) {
      if (sid(list[k].id) === sid(from.id)) { i = k; break; }
    }
    if (i < 0) return;
    branch = takeBranch(list, i);
    destI = -1;
    for (k = 0; k < list.length; k++) {
      if (sid(list[k].id) === sid(dest.id)) { destI = k; break; }
    }
    if (destI < 0) return;
    at = destI;
    if (after) {
      at = destI + 1;
      while (at < list.length && (list[at].level || 1) > (dest.level || 1)) at += 1;
    }
    list.splice.apply(list, [at, 0].concat(branch));
    list.forEach(function (x, n) { x.seq = n + 1; });
    topics = list;
    sel = sid(from.id);
    (function showMoved() {
      var depth = (from.level || 1) - 2;
      var anc = [];
      var p = parentOf(from);
      while (p && (p.level || 1) >= 2) {
        anc.unshift(p);
        p = parentOf(p);
      }
      openStack = anc.map(function (x) { return { id: sid(x.id), mode: "topics" }; });
      if (depth >= 0) {
        openStack[depth] = { id: sid(from.id), mode: "topics" };
        openStack.length = depth + 1;
      }
    })();
    saveTopics();
    paint();
  }
  function beginTopicDrag(from, ev) {
    if (!canEditChapter() || !from) return;
    topicDrag = {
      from: from,
      sx: ev.clientX,
      sy: ev.clientY,
      moved: false,
      ghost: null
    };
  }
  function endTopicDrag(ev) {
    var moved = topicDrag && topicDrag.moved;
    var from = topicDrag && topicDrag.from;
    var hit = (moved && ev && from) ? topicDropAt(ev) : null;
    hideDropLine();
    if (topicDrag && topicDrag.ghost && topicDrag.ghost.parentNode) topicDrag.ghost.parentNode.removeChild(topicDrag.ghost);
    topicDrag = null;
    document.body.style.cursor = "";
    if (moved) skipTopicClick = true;
    if (hit) moveTopicInLevel(from, hit.dest, hit.after);
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
    pendingActs = null;
  }
  function showRefMenu(ev, part, acts) {
    var m = document.getElementById("sn-ref-menu");
    var r, x, y, tit, spec, items, i, sel, b, btns;
    if (!m) return;
    if (ev) {
      ev.preventDefault();
      ev.stopPropagation();
    }
    acts = acts || {};
    pendingActs = acts;
    pendingRefEdit = acts.edit || null;
    spec = rhm[part] || { title: part || "Menu", items: [] };
    items = spec.items ? spec.items.slice() : [];
    if (part === "topic" && acts.move && items.indexOf("Move") < 0) items.push("Move");
    tit = m.querySelector(".sn-rhm-title");
    if (tit) tit.textContent = spec.title || part || "Menu";
    btns = m.querySelectorAll("button");
    for (i = 0; i < btns.length; i++) btns[i].hidden = true;
    for (i = 0; i < items.length; i++) {
      sel = RHM_ITEM[items[i]];
      b = sel ? m.querySelector(sel) : null;
      if (b) b.hidden = false;
    }
    rhmLock = Date.now() + 500;
    m.hidden = false;
    if (ev && ev.clientX != null) {
      x = ev.clientX;
      y = ev.clientY;
      m.style.left = x + "px";
      m.style.top = y + "px";
      r = m.getBoundingClientRect();
      if (r.right > window.innerWidth - 8) m.style.left = Math.max(8, window.innerWidth - r.width - 8) + "px";
      if (r.bottom > window.innerHeight - 8) m.style.top = Math.max(8, window.innerHeight - r.height - 8) + "px";
    }
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
      topicRefs.push({ topic_id: topicId, ref: ref, from: from, to: to, description: "" });
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
    var payload = topicRefs.map(function (r) {
      var row = {
        topic_id: r.topic_id,
        ref: r.ref,
        from: r.from,
        to: r.to
      };
      if (r.description != null) row.description = String(r.description);
      return row;
    });
    fetch("/dotl/topic-refs", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ refs: payload })
    }).then(function (r) { return r.json(); }).then(function (d) {
      if (done) done(d);
    }).catch(function () { if (done) done({ error: "Could not save." }); });
  }
  function applyHighlight(from, to) {
    var t = refOwner();
    var a, b, parts, newLab, idx, p, u, br, i, lab;
    if (!t && lastRefTopic) t = find(topics, lastRefTopic);
    if (!t || !openRef) return;
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
    var keepDesc = idx >= 0 ? String(topicRefs[idx].description || "") : "";
    if (idx >= 0) {
      topicRefs[idx].ref = newLab;
      topicRefs[idx].from = a;
      topicRefs[idx].to = b;
    } else {
      topicRefs.push({ topic_id: t.id, ref: newLab, from: a, to: b, description: keepDesc });
    }
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
  function canEditChapter() {
    var p = String(location.port || "");
    return p === "8775" || p === "8776" || p === "8778" || p === "8779";
  }
  function storedToLines(html) {
    var map = {};
    String(html || "").replace(/<p[^>]*>\s*<sup>\s*(\d+)\s*<\/sup>\s*([\s\S]*?)<\/p>/gi, function (_, n, inner) {
      map[Number(n)] = String(inner || "").replace(/^\s+|\s+$/g, "");
      return "";
    });
    var keys = Object.keys(map).map(Number).sort(function (a, b) { return a - b; });
    if (keys.length) {
      return keys.map(function (n) { return { n: n, t: map[n] }; });
    }
    return verseLines(html);
  }
  function chapterStoreRef(lines) {
    if (!viewChap) return openRef || "";
    var first = lines && lines[0] && lines[0].n;
    var last = lines && lines.length && lines[lines.length - 1].n;
    if (!first) return viewChap.abbr + " " + viewChap.ch;
    if (first === last) return viewChap.abbr + " " + viewChap.ch + ":" + first;
    return viewChap.abbr + " " + viewChap.ch + ":" + first + "-" + last;
  }
  function htmlFromVerseBox() {
    if (!verseBoxEl) return "";
    var bits = [];
    verseBoxEl.querySelectorAll("p[data-vs]").forEach(function (p) {
      var n = p.getAttribute("data-vs");
      var body = p.querySelector(".vt");
      bits.push("<p><sup>" + n + "</sup> " + (body ? body.innerHTML : "") + "</p>");
    });
    return bits.join("");
  }
  function linesFromVerseBox() {
    var lines = [];
    if (!verseBoxEl) return lines;
    verseBoxEl.querySelectorAll("p[data-vs]").forEach(function (p) {
      var n = Number(p.getAttribute("data-vs"));
      var body = p.querySelector(".vt");
      lines.push({ n: n, t: body ? body.innerHTML : "" });
    });
    return lines;
  }
  function saveChapterText() {
    if (!canEditChapter() || (verseTr || "NKJV") !== "NKJV" || !openRef) return Promise.resolve(false);
    var html = htmlFromVerseBox();
    if (!html) return Promise.resolve(false);
    var lines = linesFromVerseBox();
    var ref = chapterStoreRef(lines) || openRef;
    return fetch("/scriptures", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ reference: ref, text: html, folder: siteFolder() })
    })
      .then(function (r) { return r.ok; })
      .then(function (ok) {
        if (ok) {
          verseCache[cacheKey(openRef)] = lines;
          verseDirty = false;
          verseDraft = "";
          verseEditRef = "";
        }
        return ok;
      })
      .catch(function () { return false; });
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
    if (i < 0 || i >= CANON_N) {
      if (dir < 0) {
        abbr = CANON[CANON_N - 1];
        viewChap = { abbr: abbr, ch: chCount(bookNum(abbr)), num: bookNum(abbr) };
        paint();
      }
      return;
    }
    if (ch < 1) {
      if (i <= 0) return;
      abbr = CANON[i - 1];
      viewChap = { abbr: abbr, ch: chCount(bookNum(abbr)), num: bookNum(abbr) };
    } else if (ch > max) {
      if (i >= CANON_N - 1) return;
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
      var chRef = "";
      if (viewChap && chapter && chapter.length) {
        chRef = viewChap.abbr + " " + viewChap.ch + ":" + chapter[0].n + "-" + chapter[chapter.length - 1].n;
      }
      var jobs = [
        fetch("/scriptures?ref=" + encodeURIComponent(ref) + "&folder=" + encodeURIComponent(siteFolder()), { cache: "no-store" })
          .then(function (r) { return r.ok ? r.json() : {}; })
          .catch(function () { return {}; })
      ];
      if (chRef && chRef !== ref) {
        jobs.push(
          fetch("/scriptures?ref=" + encodeURIComponent(chRef) + "&folder=" + encodeURIComponent(siteFolder()), { cache: "no-store" })
            .then(function (r) { return r.ok ? r.json() : {}; })
            .catch(function () { return {}; })
        );
      }
      Promise.all(jobs).then(function (pair) {
        var refStored = storedToLines((pair[0] && pair[0].text) || "");
        var chapStored = pair[1] && pair[1].text ? storedToLines(pair[1].text) : [];
        var merged = overlayStored(chapter || [], chapStored);
        merged = overlayStored(merged, refStored);
        if (!merged.length) merged = chapter && chapter.length ? chapter : refStored;
        if (!merged.length && ref) finish(completeSpan([], ref));
        else finish(merged);
      });
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
    return false;
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
  function openLowestRef(t) {
    var list, lv, depth;
    if (!t || !isLeaf(t)) return;
    list = ownRefs(t);
    lv = t.level || 1;
    depth = lv - 2;
    if (depth < 0) return;
    openStack.length = depth;
    openStack[depth] = { id: sid(t.id), mode: "refs" };
    lastRefTopic = sid(t.id);
    openRef = list.length ? list[0] : null;
  }
  function openFirstTopic() {
    var vis, first, list;
    vis = visible();
    if (!vis.length) return;
    first = kids(vis, vis[0])[0];
    if (!first) return;
    sel = sid(first.id);
    lastRefTopic = sel;
    openStack = [];
    list = ownRefs(first);
    openRef = list.length ? list[0] : null;
    openDesc(first);
  }
  function pickTopic(t) {
    var id = sid(t.id);
    var list;
    if (sid(sel) === id) {
      if (!guardPick()) return;
      closeBranch(t);
      sel = parentSel(t);
      hideDesc();
    } else {
      sel = id;
      pickGuard = Date.now() + 400;
    }
    list = sel ? ownRefs(find(topics, sel)) : [];
    lastRefTopic = sel;
    openRef = list.length ? list[0] : null;
    loadTopics(paint);
  }
  function toggleTopics(t) {
    var list, kidsList, first;
    if (!guardPick()) return;
    hideDesc();
    var lv = t.level || 1;
    var id = sid(t.id);
    var depth = lv - 2;
    if (depth < 0) { loadTopics(paint); return; }
    if (openStack[depth] && openStack[depth].id === id && openStack[depth].mode === "topics") {
      openStack.length = depth;
      sel = id;
      lastRefTopic = id;
      list = ownRefs(t);
      openRef = list.length ? list[0] : null;
    } else {
      openStack.length = depth;
      openStack[depth] = { id: id, mode: "topics" };
      kidsList = kids(bySeq(), t);
      first = kidsList[0];
      if (first) {
        sel = sid(first.id);
        lastRefTopic = sel;
        list = ownRefs(first);
        openRef = list.length ? list[0] : null;
      } else {
        sel = id;
        lastRefTopic = id;
        list = ownRefs(t);
        openRef = list.length ? list[0] : null;
      }
    }
    loadTopics(paint);
  }
  function toggleLowerRefs(t) {
    var lv, id, depth, kidsList, i, first, list, same;
    if (!guardPick()) return;
    hideDesc();
    lv = t.level || 1;
    id = sid(t.id);
    depth = lv - 2;
    sel = id;
    if (depth < 0) { loadTopics(paint); return; }
    same = openStack[depth] && openStack[depth].id === id && openStack[depth].mode === "topics"
      && openStack[depth + 1] && openStack[depth + 1].mode === "refs";
    if (same) {
      openStack.length = depth;
      openRef = null;
      loadTopics(paint);
      return;
    }
    openStack.length = depth;
    openStack[depth] = { id: id, mode: "topics" };
    kidsList = kids(bySeq(), t);
    first = null;
    for (i = 0; i < kidsList.length; i++) {
      if (ownRefs(kidsList[i]).length) {
        first = kidsList[i];
        break;
      }
    }
    if (first) {
      openStack[depth + 1] = { id: sid(first.id), mode: "refs" };
      lastRefTopic = sid(first.id);
      list = ownRefs(first);
      openRef = list.length ? list[0] : null;
      sel = sid(first.id);
    }
    loadTopics(paint);
  }
  function toggleRefs(t) {
    var list;
    if (!guardPick()) return;
    hideDesc();
    sel = sid(t.id);
    lastRefTopic = sel;
    list = ownRefs(t);
    openRef = list.length ? list[0] : null;
    loadTopics(paint);
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
    var oldNote = document.querySelector(".tverse-note textarea");
    var oldCols, oi, oc, ok;
    if (oldNote) {
      noteSnap = oldNote.value;
      noteSnapRef = openRef || "";
      if (document.activeElement === oldNote) noteEditing = true;
    }
    oldCols = document.querySelectorAll(".tcol");
    for (oi = 0; oi < oldCols.length; oi++) {
      oc = oldCols[oi];
      ok = oc.getAttribute("data-col");
      if (ok) colScroll[ok] = oc._y;
    }
    if (!board) return;
    var items = visible();
    board.innerHTML = "";
    board.style.position = "relative";
    board.style.display = "block";
    if (!items.length) {
      if (st) st.textContent = "0 topics.";
      placePop();
      return;
    }
    var l1 = items[0];
    if (!sel) openFirstTopic();
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
    var refTopic = sel ? find(items, sel) : null;
    var refList = sortRefLabs(ownRefs(refTopic));
    if (refTopic && openRef && refList.indexOf(openRef) < 0) openRef = null;
    if (refTopic && !openRef && refList.length) openRef = refList[0];

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
    function numWFor(list, nfn) {
      var w = BOX_H, i, s, lab;
      for (i = 0; i < (list || []).length; i++) {
        lab = String(nfn(list[i]));
        s = textSize(lab);
        if (s.w + 10 > w) w = s.w + 10;
      }
      return w;
    }
    var OWN_W = BOX_H;
    var GREEN_W = BOX_H;
    var HAS_KIDS = true;
    function colSpan(nameW) {
      var w = nameW + OWN_W - JOIN;
      if (HAS_KIDS) w += GAP_BTN + BOX_H;
      return w;
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
      var on = isOn(t);
      var name = document.createElement("span");
      var tealOpen = false, greenOpen = false, lowerOpen = false, oi, oo;
      for (oi = 0; oi < openStack.length; oi++) {
        oo = openStack[oi];
        if (oo && oo.id === sid(t.id)) {
          tealOpen = oo.mode === "topics";
          greenOpen = oo.mode === "refs";
          if (tealOpen && openStack[oi + 1] && openStack[oi + 1].mode === "refs") lowerOpen = true;
        }
      }
      b.type = "button";
      b.className = "tbox" + (kind === "h" ? " thead" : "") + (on ? " on" : "");
      b.dataset.id = sid(t.id);
      name.className = "tname";
      name.textContent = t.title || "";
      b.appendChild(name);
      var own = mkBtn("green", ownN(t), greenOpen, function () { toggleRefs(t); });
      var teal;
      own.dataset.id = sid(t.id);
      if (ownN(t) === 0) own.classList.add("zero");
      own.addEventListener("contextmenu", function (ev) {
        ev.preventDefault();
        ev.stopPropagation();
        showRefMenu(ev, "refsBox", {
          addRef: function () { addRefToTopic(t); }
        });
      });
      b._own = own;
      if (n > 0) {
        teal = mkBtn("teal", n, tealOpen, function () { toggleTopics(t); });
        teal.dataset.id = sid(t.id);
        b._teal = teal;
      }
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
      if (sid(t.id) === sid(editAfterPaint)) {
        editAfterPaint = "";
        requestAnimationFrame(function () { startEdit(); });
      }
      b.addEventListener("dblclick", startEdit);
      b.addEventListener("contextmenu", function (ev) {
        var acts = {
          edit: function () { startEdit(); },
          add: function () {
            showRefMenu(null, "addTopic", {
              addSame: function () { insertRelative(t, false); },
              addBelow: function () { insertRelative(t, true); }
            });
          },
          out: function () { bumpLevel(t, -1); },
          inn: function () { bumpLevel(t, 1); }
        };
        if (pendingMove && sid(pendingMove.fromId) !== sid(t.id)) {
          acts.move = function () {
            moveRefToTopic(pendingMove.label, pendingMove.fromId, t);
            pendingMove = null;
          };
        }
        showRefMenu(ev, "topic", acts);
      });
      b.addEventListener("mouseenter", function () {
        if (drag && drag.moved) return;
        if (leaveOther(t)) paint();
      });
      if (kind !== "h") {
        b.addEventListener("mousedown", function (ev) {
          if (ev.button !== 0) return;
          if (name.querySelector("input")) return;
          ev.preventDefault();
          beginTopicDrag(t, ev);
        });
        b.addEventListener("click", function (ev) {
          ev.preventDefault();
          ev.stopPropagation();
          if (skipTopicClick) { skipTopicClick = false; return; }
          if (ev.detail > 1) return;
          if (name.querySelector("input")) return;
          pickTopic(t);
          if (sid(sel) === sid(t.id)) openDesc(t);
          else hideDesc();
        });
      }
      board.appendChild(b);
      board.appendChild(own);
      if (teal) board.appendChild(teal);
      return b;
    }
    function refBox(label, topicId) {
      var b = document.createElement("button");
      var name = document.createElement("span");
      b.type = "button";
      b.className = "tbox" + (openRef === label ? " on" : "");
      b.dataset.ref = label;
      if (topicId) b.dataset.id = sid(topicId);
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
      if (label === editAfterPaintRef) {
        editAfterPaintRef = "";
        requestAnimationFrame(function () { startRefEdit(); });
      }
      b.addEventListener("contextmenu", function (ev) {
        if (drag) endRefDrag(null);
        showRefMenu(ev, "ref", {
          edit: function () { startRefEdit(); },
          del: function () { deleteRefFromTopic(label, topicId); },
          move: function () {
            pendingMove = { label: label, fromId: topicId };
          }
        });
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
        if (topicId) lastRefTopic = sid(topicId);
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
      if (el._own) {
        put(el._own, x + colW - JOIN, y, OWN_W, BOX_H);
        if (el._teal) put(el._teal, x + colW - JOIN + OWN_W + GAP_BTN, y, BOX_H, BOX_H);
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
    function clampColTop(top, innerH) {
      var mid = (viewH || window.innerHeight) / 2;
      var maxTop = mid - BOX_H / 2;
      var minTop = maxTop - Math.max(0, innerH - BOX_H);
      if (top > maxTop) top = maxTop;
      if (top < minTop) top = minTop;
      return Math.round(top);
    }
    function layoutCol(els, x, nameW, parent, minTop, plain, colKey) {
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
      if (colKey && String(colKey).indexOf("r:") !== 0 && colScroll[colKey] != null) {
        y0 = clampColTop(colScroll[colKey], innerH);
      } else if (!parent) y0 = clampColTop(y0, innerH);
      var pane = document.createElement("div");
      pane.className = "tcol";
      if (colKey) pane.setAttribute("data-col", colKey);
      board.appendChild(pane);
      pane.style.left = Math.round(x) + "px";
      pane.style.top = y0 + "px";
      pane.style.width = paneW + "px";
      pane.style.height = innerH + "px";
      pane.style.overflow = "visible";
      pane._top = y0;
      pane._h = innerH;
      pane._x = x;
      pane._w = paneW;
      pane._y = y0;
      pane._innerH = innerH;
      var y = 0, i;
      for (i = 0; i < els.length; i++) {
        pane.appendChild(els[i]);
        if (els[i]._own) pane.appendChild(els[i]._own);
        if (els[i]._teal) pane.appendChild(els[i]._teal);
        if (els[i]._green) pane.appendChild(els[i]._green);
        put(els[i], 0, y, nameW, BOX_H);
        y += BOX_H + GAP_Y;
      }
      return pane;
    }
    function yInBox(el, box) {
      var er = el.getBoundingClientRect();
      var br = box.getBoundingClientRect();
      return er.top - br.top + box.scrollTop;
    }
    function showFirstHit(box) {
      var hits = box.querySelectorAll(".hit");
      if (!hits.length) return;
      var first = hits[0];
      var pad = 4;
      var top = first.offsetTop;
      var bot = top + first.offsetHeight;
      var viewTop = box.scrollTop;
      var viewH = box.clientHeight;
      if (!viewH) return;
      if (top >= viewTop + pad && bot <= viewTop + viewH - pad) return;
      box.scrollTop = Math.max(0, Math.round(top - pad));
    }

    var wrap = document.getElementById("wrap");
    var viewH = wrap ? wrap.clientHeight : 0;
    var band = PAD;
    var x = PAD;
    var colBuilt = [];
    var ci, cl, cw, boxes, parentBox, pane;
    for (ci = 0; ci < colLists.length; ci++) {
      cl = colLists[ci];
      cw = colNameW(cl.list);
      boxes = cl.list.map(function (t) { return box(t, String(t.level || 1)); }).filter(Boolean);
      parentBox = (cl.parent && colBuilt.length) ? findBox(colBuilt[colBuilt.length - 1].boxes, cl.parent.id) : null;
      HAS_KIDS = cl.list.some(function (t) { return kids(items, t).length > 0; });
      OWN_W = BOX_H;
      GREEN_W = HAS_KIDS ? BOX_H : 0;
      pane = layoutCol(boxes, x, cw, parentBox, null, false, cl.parent ? "t:" + sid(cl.parent.id) : "t:root");
      colBuilt.push({ boxes: boxes, pane: pane, w: cw, x: x });
      x += colSpan(cw) + GAP_X;
    }
    var topBox = Infinity, ti;
    for (ti = 0; ti < colBuilt.length; ti++) {
      if (colBuilt[ti].pane && colBuilt[ti].pane._y < topBox) topBox = colBuilt[ti].pane._y;
    }
    function placeHomeRefs(col) {
      var pane = col.pane;
      var boxes = col.boxes;
      var homes = [];
      var i, t, hr, maxW = 0, homeX, b;
      if (!pane || !boxes || !boxes.length) return;
      for (i = 0; i < boxes.length; i++) {
        if (boxes[i].dataset.ref) continue;
        t = find(topics, boxes[i].dataset.id);
        if (refTopic && t && sid(t.id) === sid(refTopic.id)) continue;
        hr = homeRef(t);
        if (!hr) continue;
        maxW = Math.max(maxW, textSize(hr).w);
        homes.push({ el: boxes[i], t: t, hr: hr });
      }
      if (!homes.length) return;
      homeX = (pane._w || 0) + GAP_X;
      pane.style.width = (homeX + maxW) + "px";
      pane._w = homeX + maxW;
      for (i = 0; i < homes.length; i++) {
        b = refBox(homes[i].hr, homes[i].t.id);
        pane.appendChild(b);
        put(b, homeX, homes[i].el._y, maxW, BOX_H);
      }
      col.homeW = maxW;
    }
    if (!sel && colLists.length && colBuilt[colLists.length - 1]) {
      placeHomeRefs(colBuilt[colLists.length - 1]);
    }

    var cRef = [];
    var xRef = 0;
    var xVs = 0;
    if (refTopic && refList.length) {
      xRef = x;
      cRef = refList.map(function (lab) { return refBox(lab, refTopic.id); });
      wRef = colNameW(refList);
      parentBox = null;
      for (ci = 0; ci < colBuilt.length; ci++) {
        parentBox = findBox(colBuilt[ci].boxes, refTopic.id);
        if (parentBox) break;
      }
      xVs = x + wRef + PAD;
      pane = layoutCol(cRef, x, wRef, parentBox, band, true, "r:" + sid(refTopic.id));
      colBuilt.push({ boxes: cRef, pane: pane, w: wRef, x: x });
    }

    var versesEl = null;
    var versesWrap = null;
    var verseTopic = topicForOpenRef(refTopic);
    var showChap = false;
    var yVs = PAD;
    var homeTop = Infinity;
    var hi, hEl, ht;
    if (!openRef) {
      lastOpenRef = null;
      hitPick = false;
      hitStart = 0;
      hitEnd = 0;
    }
    for (ci = 0; ci < colBuilt.length; ci++) {
      if (!colBuilt[ci].homeW || !colBuilt[ci].boxes) continue;
      for (hi = 0; hi < colBuilt[ci].boxes.length; hi++) {
        hEl = colBuilt[ci].boxes[hi];
        ht = find(topics, hEl.dataset.id);
        if (ht && homeRef(ht) && boardY(hEl) < homeTop) homeTop = boardY(hEl);
      }
    }
    if (homeTop < Infinity) {
      showChap = true;
    }
    if (refTopic && refList.length && pane) {
      showChap = true;
    }
    if (showChap) {
      if (openRef && openRef !== lastOpenRef) {
        lastOpenRef = openRef;
        viewChap = chapterOf(openRef);
        hitPick = false;
        hitStart = 0;
        hitEnd = 0;
      }
      if (openRef && !viewChap) viewChap = chapterOf(openRef);
      colRight = PAD;
      for (pi = 0; pi < colBuilt.length; pi++) {
        if (!colBuilt[pi].pane) continue;
        colRight = Math.max(colRight, colBuilt[pi].pane._x + colBuilt[pi].pane._w);
      }
      xVs = colRight + GAP_X;
      yVs = PAD;
      versesWrap = document.createElement("div");
      versesWrap.className = "tverse-wrap" + (openRef ? "" : " empty");
      board.appendChild(versesWrap);
      var vsW = Math.max(280, (wrap ? wrap.clientWidth : 800) - xVs - PAD);
      var vsH = Math.max(160, viewH - PAD * 2);
      put(versesWrap, xVs, yVs, vsW, vsH);
      versesWrap.style.height = vsH + "px";

      if (!openRef) {
        /* empty chapter box */
      } else {
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
      prevBtn.setAttribute("aria-label", "Previous chapter");
      prevBtn.innerHTML = '<span class="ew-ch-arrow">&lt;</span><span class="page-nav-tip">Previous chapter</span>';
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
      nextBtn.setAttribute("aria-label", "Next chapter");
      nextBtn.innerHTML = '<span class="ew-ch-arrow">&gt;</span><span class="page-nav-tip">Next chapter</span>';
      nextBtn.disabled = !viewChap || ((iCan < 0 || iCan >= CANON_N - 1) && viewChap.ch >= chCount(viewChap.num));
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
      if (sameOrigChap()) {
        var pickBtn = document.createElement("button");
        pickBtn.type = "button";
        pickBtn.className = "tverse-pick" + (hitPick ? " on" : "");
        if (!hitPick) pickBtn.textContent = "Modify";
        else if (hitStart && !hitEnd) pickBtn.textContent = "select 2nd verse";
        else pickBtn.textContent = "select 1st verse";
        pickBtn.addEventListener("click", function (ev) {
          ev.preventDefault();
          ev.stopPropagation();
          hitPick = !hitPick;
          if (hitPick) { hitStart = 0; hitEnd = 0; }
          paint();
        });
        left.appendChild(pickBtn);
      }
      if (canEditChapter() && (verseTr || "NKJV") === "NKJV" && !hitPick) {
        var saveBtn = document.createElement("button");
        saveBtn.type = "button";
        saveBtn.className = "tverse-pick";
        saveBtn.textContent = "Save";
        saveBtn.hidden = !verseDirty;
        saveBtn.disabled = !verseDirty;
        saveBtn.addEventListener("click", function (ev) {
          ev.preventDefault();
          ev.stopPropagation();
          saveBtn.disabled = true;
          saveChapterText().then(function (ok) {
            saveBtn.disabled = !ok ? false : true;
            saveBtn.hidden = !!ok;
            if (ok) paint();
            else saveBtn.textContent = "Could not save.";
          });
        });
        var cancelBtn = document.createElement("button");
        cancelBtn.type = "button";
        cancelBtn.className = "tverse-pick";
        cancelBtn.textContent = "Cancel";
        cancelBtn.hidden = !verseDirty;
        cancelBtn.addEventListener("click", function (ev) {
          ev.preventDefault();
          ev.stopPropagation();
          verseDirty = false;
          verseDraft = "";
          verseEditRef = "";
          if (openRef) delete verseCache[cacheKey(openRef)];
          paint();
        });
        left.appendChild(saveBtn);
        left.appendChild(cancelBtn);
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

      var noteBox = document.createElement("div");
      noteBox.className = "tverse-note";
      function startDescEdit() {
        if (noteBox.querySelector("textarea")) return;
        var ta = document.createElement("textarea");
        ta.setAttribute("title", "Description");
        ta.value = String(descriptionForOpen(verseTopic) || "").replace(/\n+$/, "");
        noteBox.textContent = "";
        noteBox.appendChild(ta);
        noteEditing = true;
        function fitTa() {
          ta.style.height = "auto";
          ta.style.height = Math.max(ta.scrollHeight, 18) + "px";
        }
        fitTa();
        ta.addEventListener("input", fitTa);
        ta.addEventListener("click", function (ev) { ev.stopPropagation(); });
        ta.addEventListener("mousedown", function (ev) { ev.stopPropagation(); });
        ta.addEventListener("keydown", function (kev) {
          if (kev.key === "Escape") { kev.preventDefault(); noteEditing = false; paint(); }
        });
        ta.addEventListener("blur", function () {
          saveOpenDescription(verseTopic, ta.value);
          noteSnap = ta.value;
          noteSnapRef = openRef || "";
          noteEditing = false;
          paint();
        });
        ta.focus();
      }
      if (noteEditing && noteSnapRef === openRef) {
        var keepTa = document.createElement("textarea");
        keepTa.setAttribute("title", "Description");
        keepTa.value = String(noteSnap || "").replace(/\n+$/, "");
        keepTa.style.height = "auto";
        keepTa.style.height = Math.max(keepTa.scrollHeight, 18) + "px";
        keepTa.addEventListener("input", function () {
          keepTa.style.height = "auto";
          keepTa.style.height = Math.max(keepTa.scrollHeight, 18) + "px";
        });
        keepTa.addEventListener("click", function (ev) { ev.stopPropagation(); });
        keepTa.addEventListener("mousedown", function (ev) { ev.stopPropagation(); });
        keepTa.addEventListener("blur", function () {
          saveOpenDescription(verseTopic, keepTa.value);
          noteSnap = keepTa.value;
          noteSnapRef = openRef || "";
          noteEditing = false;
          paint();
        });
        noteBox.appendChild(keepTa);
        requestAnimationFrame(function () { keepTa.focus(); keepTa.setSelectionRange(keepTa.value.length, keepTa.value.length); });
      } else {
        noteBox.textContent = String(descriptionForOpen(verseTopic) || "").replace(/\n+$/, "");
      }
      noteBox.addEventListener("click", function (ev) { ev.stopPropagation(); });
      noteBox.addEventListener("contextmenu", function (ev) {
        showRefMenu(ev, "description", { edit: startDescEdit });
      });
      versesWrap.appendChild(noteBox);

      versesEl = document.createElement("div");
      versesEl.className = "tverses" + (hitPick ? " picking" : "");
      verseBoxEl = versesEl;
      versesWrap.appendChild(versesEl);
      var rng = sameOrigChap() ? rangeFor(verseTopic, openRef) : { from: 0, to: 0 };
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
          body.className = "vt";
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
        if (verseDirty && verseEditRef === openRef && verseDraft) {
          versesEl.innerHTML = verseDraft;
        }
        if (canEditChapter() && (verseTr || "NKJV") === "NKJV" && !hitPick) {
          versesEl.querySelectorAll(".vt").forEach(function (el) {
            el.contentEditable = "true";
            el.addEventListener("input", function () {
              verseDirty = true;
              verseEditRef = openRef;
              verseDraft = versesEl.innerHTML;
              versesWrap.querySelectorAll(".tverse-pick").forEach(function (btn) {
                var lab = btn.textContent;
                if (lab === "Save" || lab === "Cancel" || lab === "Could not save.") {
                  btn.hidden = false;
                  if (lab === "Could not save.") btn.textContent = "Save";
                  if (btn.textContent === "Save") btn.disabled = false;
                }
              });
            });
            el.addEventListener("keydown", function (ev) {
              if (ev.key === "Enter") {
                ev.preventDefault();
                document.execCommand(ev.shiftKey ? "insertLineBreak" : "insertParagraph");
              }
              if ((ev.metaKey || ev.ctrlKey) && !ev.altKey) {
                var k = (ev.key || "").toLowerCase();
                if (k === "b" || k === "i" || k === "u") {
                  ev.preventDefault();
                  document.execCommand(k === "b" ? "bold" : k === "i" ? "italic" : "underline");
                }
              }
            });
            el.addEventListener("click", function (ev) { ev.stopPropagation(); });
          });
        }
        versesEl._h = versesEl.clientHeight;
        requestAnimationFrame(function () {
          showFirstHit(versesEl);
          requestAnimationFrame(function () { showFirstHit(versesEl); });
        });
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
    }

    var colRight = PAD, pi, nTopic = colLists.length;
    for (pi = 0; pi < colBuilt.length; pi++) {
      if (!colBuilt[pi].pane) continue;
      colRight = Math.max(colRight, colBuilt[pi].pane._x + colBuilt[pi].pane._w);
    }
    placePop();

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
  function loadTopics(done) {
    Promise.all([
      fetch("data/topics.json?t=" + Date.now(), { cache: "no-store" }).then(function (r) { return r.json(); }),
      fetch("data/topic-refs.json?t=" + Date.now(), { cache: "no-store" }).then(function (r) { return r.ok ? r.json() : []; }).catch(function () { return []; }),
      fetch("data/rhm.json?t=" + Date.now(), { cache: "no-store" }).then(function (r) { return r.ok ? r.json() : null; }).catch(function () { return null; })
    ]).then(function (pair) {
      if (pair[2] && typeof pair[2] === "object") rhm = pair[2];
      topics = pair[0] || [];
      var incoming;
      var keep = {};
      var ki, kr, key, row;
      if (Array.isArray(pair[1])) incoming = pair[1];
      else if (pair[1] && Array.isArray(pair[1].rows)) incoming = pair[1].rows;
      else incoming = [];
      for (ki = 0; ki < topicRefs.length; ki++) {
        kr = topicRefs[ki];
        if (String(kr.description || "").trim()) keep[sid(kr.topic_id) + "|" + String(kr.ref || "")] = kr.description;
      }
      for (ki = 0; ki < incoming.length; ki++) {
        row = incoming[ki];
        key = sid(row.topic_id) + "|" + String(row.ref || "");
        if (!String(row.description || "").trim() && keep[key]) row.description = keep[key];
      }
      topicRefs = incoming;
      if (typeof done === "function") done();
      else paint();
    }).catch(function (err) {
      var st = document.getElementById("status");
      if (st) st.textContent = String(err);
    });
  }
  window.snPaintTree = paint;
  window.snOpenFirst = function () {
    openFirstTopic();
    paint();
  };
  window.snReloadTree = function () {
    loadTopics(function () {
      openFirstTopic();
      paint();
    });
  };
  window.snSaveTopics = saveTopics;
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
  (function () {
    var wrap = document.getElementById("wrap");
    if (!wrap) return;
    wrap.addEventListener(
      "wheel",
      function (ev) {
        var n = ev.target;
        var col = null;
        while (n && n !== wrap) {
          if (n.classList && String(n.className || "").indexOf("tcol") >= 0) {
            col = n;
            break;
          }
          n = n.parentNode;
        }
        if (!col) {
          n = document.elementFromPoint(ev.clientX, ev.clientY);
          while (n && n !== wrap) {
            if (n.classList && String(n.className || "").indexOf("tcol") >= 0) {
              col = n;
              break;
            }
            n = n.parentNode;
          }
        }
        if (!col) return;
        var innerH = col._innerH || col.offsetHeight;
        var box = boxH || 22;
        var mid = (wrap.clientHeight || window.innerHeight) / 2;
        var maxTop = mid - box / 2;
        var minTop = maxTop - Math.max(0, innerH - box);
        var next = (col._y || 0) - ev.deltaY;
        if (next > maxTop) next = maxTop;
        if (next < minTop) next = minTop;
        next = Math.round(next);
        if (next === col._y) return;
        ev.preventDefault();
        col._y = next;
        col._top = next;
        col.style.top = next + "px";
        var key = col.getAttribute("data-col");
        if (key) colScroll[key] = next;
      },
      { passive: false }
    );
  })();
  document.addEventListener("mousemove", function (ev) {
    var g, t, hit;
    if (topicDrag) {
      if (!topicDrag.moved) {
        if (Math.abs(ev.clientX - topicDrag.sx) + Math.abs(ev.clientY - topicDrag.sy) < 6) return;
        topicDrag.moved = true;
        g = document.createElement("div");
        g.className = "ref-ghost";
        g.textContent = topicDrag.from.title || "";
        document.body.appendChild(g);
        topicDrag.ghost = g;
        document.body.style.cursor = "grabbing";
      }
      if (topicDrag.ghost) {
        topicDrag.ghost.style.left = (ev.clientX + 8) + "px";
        topicDrag.ghost.style.top = (ev.clientY + 8) + "px";
      }
      hit = topicDropAt(ev);
      if (!hit) hideDropLine();
      return;
    }
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
    if (topicDrag) endTopicDrag(ev);
    if (drag) endRefDrag(ev);
  });
  document.addEventListener("pointerdown", function (ev) {
    var list = document.querySelector(".tverse-bar .ew-tr-list");
    var now = document.querySelector(".tverse-bar .ew-tr-now");
    var menu = document.getElementById("sn-ref-menu");
    if (descOpen && !descKeep(ev.target)) hideDesc();
    if (list && !ev.target.closest(".tverse-bar")) list.hidden = true;
    if (now && !ev.target.closest(".tverse-bar")) now.setAttribute("aria-expanded", "false");
    if (Date.now() < rhmLock) return;
    if (menu && !menu.hidden && !(ev.target && ev.target.closest && ev.target.closest("#sn-ref-menu"))) hideRefMenu();
  });
  (function () {
    var menu = document.getElementById("sn-ref-menu");
    if (!menu) return;
    menu.addEventListener("click", function (ev) {
      var btn = ev.target.closest && ev.target.closest("button");
      var acts = pendingActs || {};
      ev.preventDefault();
      ev.stopPropagation();
      hideRefMenu();
      if (!btn) return;
      if (btn.getAttribute("data-edit") === "1" && acts.edit) acts.edit();
      if (btn.getAttribute("data-add") === "1" && acts.add) acts.add();
      if (btn.getAttribute("data-add-ref") === "1" && acts.addRef) acts.addRef();
      if (btn.getAttribute("data-out") === "1" && acts.out) acts.out();
      if (btn.getAttribute("data-in") === "1" && acts.inn) acts.inn();
      if (btn.getAttribute("data-add-same") === "1" && acts.addSame) acts.addSame();
      if (btn.getAttribute("data-add-below") === "1" && acts.addBelow) acts.addBelow();
      if (btn.getAttribute("data-delete") === "1" && acts.del) acts.del();
      if (btn.getAttribute("data-move") === "1" && acts.move) acts.move();
      if (btn.getAttribute("data-yes") === "1" && acts.yes) acts.yes();
      if (btn.getAttribute("data-no") === "1" && acts.no) acts.no();
    });
  })();
  loadTopics(function () {
    openFirstTopic();
    paint();
  });
})();
