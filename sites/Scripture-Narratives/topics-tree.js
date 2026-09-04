(function () {
  var PAD = 8;
  var GAP_X = 16;
  var GAP_Y = 4;
  var topics = [];
  var openL2 = null;
  var openL3 = null;
  var sel = null;
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
  function textSize(title) {
    var p = document.createElement("span");
    p.style.cssText = "position:absolute;left:0;top:0;visibility:hidden;white-space:nowrap;font:400 13px/1.2 Arial,Helvetica,sans-serif;padding:0.2rem 0.45rem;border:1px solid #c5d0d4;display:inline-block;box-sizing:border-box";
    p.textContent = title || "";
    document.body.appendChild(p);
    var s = { w: Math.ceil(p.offsetWidth), h: Math.ceil(p.offsetHeight) };
    document.body.removeChild(p);
    return s;
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
    if (!open2) { openL2 = null; openL3 = null; }
    else l3s = kids(items, open2);
    var open3 = openL3 ? find(l3s, openL3) : null;
    if (!open3) openL3 = null;
    else l4s = kids(items, open3);

    var boxW = 0, BOX_H = 0;
    items.forEach(function (t) {
      var s = textSize(t.title || "");
      if (s.w > boxW) boxW = s.w;
      if (s.h > BOX_H) BOX_H = s.h;
    });
    if (boxW < 8) boxW = 8;
    if (BOX_H < 8) BOX_H = 8;

    function isOn(t) {
      return sid(t.id) === sid(sel) || sid(t.id) === sid(openL2) || sid(t.id) === sid(openL3);
    }
    function box(t, kind) {
      var b = document.createElement("button");
      var n = kids(items, t).length;
      var on = isOn(t);
      var name = document.createElement("span");
      b.type = "button";
      b.className = "tbox" + (kind === "h" ? " thead" : "") + (on ? " on" : "");
      b.dataset.id = sid(t.id);
      name.className = "tname";
      name.textContent = t.title || "";
      b.appendChild(name);
      if (n > 0) {
        var c = document.createElement("span");
        c.className = "tcount";
        c.textContent = String(n);
        c.style.width = BOX_H + "px";
        c.style.minWidth = BOX_H + "px";
        b.appendChild(c);
      }
      if (kind !== "h") {
        b.addEventListener("click", function (ev) {
          ev.preventDefault();
          ev.stopPropagation();
          var lv = t.level || 1;
          if (lv === 2) {
            if (sid(openL2) === sid(t.id)) { openL2 = null; openL3 = null; sel = null; }
            else { openL2 = sid(t.id); openL3 = null; sel = sid(t.id); }
          } else if (lv === 3) {
            if (sid(openL3) === sid(t.id)) { openL3 = null; sel = sid(t.id); }
            else { openL3 = sid(t.id); sel = sid(t.id); }
          } else {
            sel = sid(sel) === sid(t.id) ? null : sid(t.id);
          }
          paint();
        });
      }
      b._hasCount = n > 0;
      board.appendChild(b);
      return b;
    }
    function put(el, x, y) {
      var w = boxW + (el._hasCount ? BOX_H : 0);
      el.style.position = "absolute";
      el.style.left = Math.round(x) + "px";
      el.style.top = Math.round(y) + "px";
      el.style.width = w + "px";
      el.style.height = BOX_H + "px";
      el.style.margin = "0";
      el._x = x;
      el._y = y;
      el._w = w;
      el._h = BOX_H;
    }
    function stack(els, x, y0) {
      var y = y0, i;
      for (i = 0; i < els.length; i++) {
        put(els[i], x, y);
        y += BOX_H + GAP_Y;
      }
    }
    function around(parent, els, x) {
      if (!parent || !els.length) return;
      var tot = els.length * BOX_H + Math.max(0, els.length - 1) * GAP_Y;
      stack(els, x, parent._y + BOX_H / 2 - tot / 2);
    }

    var h = box(l1, "h");
    var c2 = l2s.map(function (t) { return box(t, "2"); });
    var c3 = l3s.map(function (t) { return box(t, "3"); });
    var c4 = l4s.map(function (t) { return box(t, "4"); });

    put(h, PAD, PAD);
    stack(c2, PAD, PAD + BOX_H + GAP_Y);

    var col = boxW + BOX_H + GAP_X;
    var x3 = PAD + col;
    var parent2 = null, i;
    for (i = 0; i < c2.length; i++) {
      if (sid(c2[i].dataset.id) === sid(openL2)) parent2 = c2[i];
    }
    around(parent2, c3, x3);
    var x4 = x3 + (c3.length ? col : 0);
    var parent3 = null, j;
    for (j = 0; j < c3.length; j++) {
      if (sid(c3[j].dataset.id) === sid(openL3)) parent3 = c3[j];
    }
    around(parent3, c4, x4);

    var all = [h].concat(c2, c3, c4);
    var minY = PAD, maxX = PAD, maxY = PAD, k;
    for (k = 0; k < all.length; k++) {
      if (all[k]._y < minY) minY = all[k]._y;
      if (all[k]._x + all[k]._w + PAD > maxX) maxX = all[k]._x + all[k]._w + PAD;
      if (all[k]._y + all[k]._h + PAD > maxY) maxY = all[k]._y + all[k]._h + PAD;
    }
    board.style.width = maxX + "px";
    board.style.height = maxY + "px";
    if (st) st.textContent = items.length + " topics.";
  }
  window.snPaintTree = paint;
  fetch("data/topics.json", { cache: "no-store" })
    .then(function (r) { return r.json(); })
    .then(function (rows) {
      topics = rows || [];
      paint();
    })
    .catch(function (err) {
      var st = document.getElementById("status");
      if (st) st.textContent = String(err);
    });
})();
