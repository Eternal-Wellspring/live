(function () {
  var PAD = 8;
  var GAP_X = 16;
  var GAP_Y = 8;
  var GAP_BTN = 4;
  var VERSE_W = 280;
  var topics = [];
  var topicRefs = [];
  var openL2 = null;
  var openL3 = null;
  var openL4 = null;
  var l2Mode = null;
  var l3Mode = null;
  var l4Mode = null;
  var sel = null;
  var openRef = null;
  var boxH = 8;
  var verseCache = {};
  var descSnap = {};
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
  function refsFor(t) {
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
    return out;
  }
  function refN(t) {
    return refsFor(t).length;
  }
  function rangeFor(t, ref) {
    var i, r, a = 0, b = 0;
    if (!t) return { from: 0, to: 0 };
    for (i = 0; i < topicRefs.length; i++) {
      r = topicRefs[i];
      if (sid(r.topic_id) !== sid(t.id)) continue;
      if (String(r.ref || "").trim() !== ref) continue;
      a = Number(r.from) || a;
      b = Number(r.to) || b;
    }
    return { from: a, to: b };
  }
  function verseLines(text) {
    var lines = String(text || "").split(/\n/);
    var out = [], i, m;
    for (i = 0; i < lines.length; i++) {
      m = String(lines[i] || "").match(/^(\d+)\s+(.*)$/);
      if (!m) continue;
      out.push({ n: Number(m[1]), t: m[2] });
    }
    return out;
  }
  function loadVerses(ref, done) {
    if (verseCache[ref]) {
      done(verseCache[ref]);
      return;
    }
    fetch("/scriptures?ref=" + encodeURIComponent(ref) + "&folder=" + encodeURIComponent(siteFolder()), { cache: "no-store" })
      .then(function (r) { return r.json(); })
      .then(function (d) {
        var lines = verseLines((d && d.text) || "");
        verseCache[ref] = lines;
        done(lines);
      })
      .catch(function () { done([]); });
  }
  function closeBranch(t) {
    if (!t) return;
    var lv = t.level || 1;
    var id = sid(t.id);
    if (lv <= 2 && sid(openL2) === id) {
      openL2 = null; openL3 = null; openL4 = null;
      l2Mode = null; l3Mode = null; l4Mode = null;
      openRef = null;
    } else if (lv === 3 && sid(openL3) === id) {
      openL3 = null; openL4 = null;
      l3Mode = null; l4Mode = null;
      openRef = null;
    } else if (lv >= 4 && sid(openL4) === id) {
      openL4 = null; l4Mode = null; openRef = null;
    }
  }
  function toggleTopics(t) {
    var lv = t.level || 1;
    var id = sid(t.id);
    sel = id;
    openRef = null;
    if (lv === 2) {
      if (sid(openL2) === id && l2Mode === "topics") {
        openL2 = null; openL3 = null; openL4 = null;
        l2Mode = null; l3Mode = null; l4Mode = null;
      } else {
        openL2 = id; openL3 = null; openL4 = null;
        l2Mode = "topics"; l3Mode = null; l4Mode = null;
      }
    } else if (lv === 3) {
      if (sid(openL3) === id && l3Mode === "topics") {
        openL3 = null; openL4 = null; l3Mode = null; l4Mode = null;
      } else {
        openL3 = id; openL4 = null; l3Mode = "topics"; l4Mode = null;
      }
    }
    paint();
  }
  function toggleRefs(t) {
    var lv = t.level || 1;
    var id = sid(t.id);
    var same;
    openRef = null;
    if (lv === 2) {
      same = sid(openL2) === id && l2Mode === "refs";
      if (same) {
        openL2 = null; l2Mode = null;
      } else {
        openL2 = id; openL3 = null; openL4 = null;
        l2Mode = "refs"; l3Mode = null; l4Mode = null;
      }
    } else if (lv === 3) {
      same = sid(openL3) === id && l3Mode === "refs";
      if (same) {
        l3Mode = null; openL4 = null; l4Mode = null;
      } else {
        openL3 = id; openL4 = null; l3Mode = "refs"; l4Mode = null;
      }
    } else {
      same = sid(openL4) === id && l4Mode === "refs";
      if (same) {
        openL4 = null; l4Mode = null;
      } else {
        openL4 = id; l4Mode = "refs";
      }
    }
    sel = id;
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
    var l2s = kids(items, l1);
    var l3s = [];
    var l4s = [];
    var open2 = openL2 ? find(l2s, openL2) : null;
    if (!open2) { openL2 = null; openL3 = null; openL4 = null; l2Mode = null; l3Mode = null; l4Mode = null; }
    if (open2 && l2Mode === "topics") l3s = kids(items, open2);
    var open3 = openL3 ? find(l3s, openL3) : null;
    if (!open3) { openL3 = null; openL4 = null; l3Mode = null; l4Mode = null; }
    if (open3 && l3Mode === "topics") l4s = kids(items, open3);
    var open4 = openL4 ? find(l4s, openL4) : null;
    if (!open4) { openL4 = null; l4Mode = null; }

    var refTopic = null;
    if (l2Mode === "refs") refTopic = open2;
    else if (l3Mode === "refs") refTopic = open3;
    else if (l4Mode === "refs") refTopic = open4;
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
    var w1 = colNameW(l2s);
    var w3 = colNameW(l3s);
    var w4 = colNameW(l4s);
    var wRef = refList.length ? colNameW(refList) : 0;

    function isOn(t) {
      return sid(t.id) === sid(sel);
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
      var tealOpen = (kind === "2" && sid(openL2) === sid(t.id) && l2Mode === "topics") ||
        (kind === "3" && sid(openL3) === sid(t.id) && l3Mode === "topics");
      var greenOpen = (kind === "2" && sid(openL2) === sid(t.id) && l2Mode === "refs") ||
        (kind === "3" && sid(openL3) === sid(t.id) && l3Mode === "refs") ||
        (kind === "4" && sid(openL4) === sid(t.id) && l4Mode === "refs");
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
          if (sid(sel) === sid(t.id)) {
            closeBranch(t);
            sel = null;
          } else {
            var prev = sel ? find(topics, sel) : null;
            if (prev) closeBranch(prev);
            sel = sid(t.id);
          }
          paint();
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
    if (l2Mode === "topics") around(parent2, c3, x3, w3);
    var x4 = x3 + (c3.length ? colSpan(w3) + GAP_X : 0);
    var parent3 = findBox(c3, openL3);
    if (l3Mode === "topics") around(parent3, c4, x4, w4);

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
    if (cRef.length && xRef) around(refParent, cRef, xRef, wRef);

    var versesEl = null;
    var xVs = 0;
    if (openRef && cRef.length && xRef) {
      xVs = xRef + wRef + GAP_X;
      versesEl = document.createElement("div");
      versesEl.className = "tverses";
      board.appendChild(versesEl);
      var refEl = null, ri;
      for (ri = 0; ri < cRef.length; ri++) {
        if (cRef[ri].textContent === openRef) refEl = cRef[ri];
      }
      var vsY = refEl ? refEl._y : band;
      put(versesEl, xVs, vsY, VERSE_W, 0);
      versesEl.style.height = "auto";
      var rng = rangeFor(refTopic, openRef);
      var cached = verseCache[openRef];
      function drawLines(lines) {
        versesEl.innerHTML = "";
        var li, p, vn, n, hit, a = rng.from, b = rng.to || rng.from;
        for (li = 0; li < lines.length; li++) {
          p = document.createElement("p");
          n = lines[li].n;
          hit = a ? (n >= a && n <= b) : true;
          if (hit) p.className = "hit";
          vn = document.createElement("span");
          vn.className = "vn";
          vn.textContent = String(n);
          p.appendChild(vn);
          p.appendChild(document.createTextNode(" " + lines[li].t));
          versesEl.appendChild(p);
        }
        versesEl._h = versesEl.offsetHeight;
      }
      if (cached) drawLines(cached);
      else {
        var wantRef = openRef;
        loadVerses(openRef, function () {
          if (openRef !== wantRef) return;
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
    if (versesEl) all = all.concat([versesEl]);
    var minY = Infinity, maxX = PAD, maxBottom = -Infinity, k;
    for (k = 0; k < all.length; k++) {
      if (all[k]._y < minY) minY = all[k]._y;
      if (all[k]._x + all[k]._w + PAD > maxX) maxX = all[k]._x + all[k]._w + PAD;
      if (all[k]._y + (all[k]._h || BOX_H) > maxBottom) maxBottom = all[k]._y + (all[k]._h || BOX_H);
    }
    if (!all.length) minY = PAD;
    var treeH = maxBottom - minY;
    var dy = 0;
    if (viewH > 0 && all.length) {
      if (treeH + band + PAD <= viewH) dy = Math.round((viewH - band - treeH) / 2) + band - minY;
      else dy = band - minY;
    }
    if (dy) {
      shiftY(all, dy);
      minY += dy;
      maxBottom += dy;
    }
    if (wrap) wrap.scrollTop = 0;
    if (descs) descs.style.width = maxX + "px";
    board.style.width = maxX + "px";
    board.style.height = Math.max(viewH, maxBottom + PAD) + "px";
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
  Promise.all([
    fetch("data/topics.json", { cache: "no-store" }).then(function (r) { return r.json(); }),
    fetch("data/topic-refs.json", { cache: "no-store" }).then(function (r) { return r.ok ? r.json() : []; }).catch(function () { return []; })
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
