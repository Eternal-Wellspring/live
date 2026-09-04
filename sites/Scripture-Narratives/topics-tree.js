(function () {
  var PAD = 16;
  var GAP_X = 48;
  var GAP_Y = 28;
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
  function addPath(svg, d, arrowId) {
    var p = document.createElementNS("http://www.w3.org/2000/svg", "path");
    p.setAttribute("d", d);
    p.setAttribute("fill", "none");
    p.setAttribute("stroke", "#888");
    p.setAttribute("stroke-width", "1");
    if (arrowId) p.setAttribute("marker-end", "url(#" + arrowId + ")");
    svg.appendChild(p);
  }
  function paint() {
    var board = document.getElementById("board");
    var st = document.getElementById("status");
    var items = visible();
    board.innerHTML = "";
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

    function box(t, kind) {
      var b = document.createElement("button");
      b.type = "button";
      b.className = "tbox" + (kind === "h" ? " thead" : "") + (sid(t.id) === sid(sel) ? " on" : "");
      b.dataset.id = sid(t.id);
      b.textContent = t.title || "";
      if (kind !== "h") {
        b.addEventListener("click", function (ev) {
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
      board.appendChild(b);
      return b;
    }
    var h = box(l1, "h");
    var c2 = l2s.map(function (t) { return box(t, "2"); });
    var c3 = l3s.map(function (t) { return box(t, "3"); });
    var c4 = l4s.map(function (t) { return box(t, "4"); });

    function stack(els, x, y0) {
      var y = y0, i, tot = 0;
      for (i = 0; i < els.length; i++) {
        els[i].style.left = x + "px";
        els[i].style.top = y + "px";
        els[i]._x = x;
        els[i]._y = y;
        els[i]._w = els[i].offsetWidth;
        els[i]._h = els[i].offsetHeight;
        y += els[i]._h + GAP_Y;
        tot += els[i]._h;
        if (i < els.length - 1) tot += GAP_Y;
      }
      return tot;
    }
    function colW(els) {
      var w = 0, i;
      for (i = 0; i < els.length; i++) {
        if (els[i].offsetWidth > w) w = els[i].offsetWidth;
      }
      return w;
    }

    h.style.left = PAD + "px";
    h.style.top = PAD + "px";
    h._x = PAD;
    h._y = PAD;
    h._w = h.offsetWidth;
    h._h = h.offsetHeight;
    var y2 = PAD + h._h + GAP_Y;
    stack(c2, PAD, y2);
    var w2 = Math.max(h._w, colW(c2));
    var x3 = PAD + w2 + GAP_X;
    if (c3.length && c2.length) {
      var parent2 = null, i;
      for (i = 0; i < c2.length; i++) {
        if (sid(c2[i].dataset.id) === sid(openL2)) parent2 = c2[i];
      }
      var tot3 = 0;
      for (i = 0; i < c3.length; i++) {
        tot3 += c3[i].offsetHeight;
        if (i < c3.length - 1) tot3 += GAP_Y;
      }
      var cy2 = parent2 ? parent2._y + parent2._h / 2 : y2;
      var y3 = cy2 - tot3 / 2;
      if (y3 < PAD) y3 = PAD;
      stack(c3, x3, y3);
    }
    var w3 = colW(c3);
    var x4 = x3 + (w3 ? w3 + GAP_X : 0);
    if (c4.length && c3.length) {
      var parent3 = null, j;
      for (j = 0; j < c3.length; j++) {
        if (sid(c3[j].dataset.id) === sid(openL3)) parent3 = c3[j];
      }
      var tot4 = 0;
      for (j = 0; j < c4.length; j++) {
        tot4 += c4[j].offsetHeight;
        if (j < c4.length - 1) tot4 += GAP_Y;
      }
      var cy3 = parent3 ? parent3._y + parent3._h / 2 : PAD;
      var y4 = cy3 - tot4 / 2;
      if (y4 < PAD) y4 = PAD;
      stack(c4, x4, y4);
    }

    var maxX = PAD, maxY = PAD;
    function bump(el) {
      if (el._x + el._w + PAD > maxX) maxX = el._x + el._w + PAD;
      if (el._y + el._h + PAD > maxY) maxY = el._y + el._h + PAD;
    }
    bump(h);
    c2.forEach(bump);
    c3.forEach(bump);
    c4.forEach(bump);

    var svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
    svg.setAttribute("width", String(maxX));
    svg.setAttribute("height", String(maxY));
    var defs = document.createElementNS("http://www.w3.org/2000/svg", "defs");
    var mark = document.createElementNS("http://www.w3.org/2000/svg", "marker");
    mark.setAttribute("id", "dn");
    mark.setAttribute("viewBox", "0 0 8 8");
    mark.setAttribute("refX", "4");
    mark.setAttribute("refY", "7");
    mark.setAttribute("markerWidth", "7");
    mark.setAttribute("markerHeight", "7");
    mark.setAttribute("orient", "auto");
    var head = document.createElementNS("http://www.w3.org/2000/svg", "path");
    head.setAttribute("d", "M1,0 L4,8 L7,0 Z");
    head.setAttribute("fill", "#888");
    mark.appendChild(head);
    var markR = document.createElementNS("http://www.w3.org/2000/svg", "marker");
    markR.setAttribute("id", "rt");
    markR.setAttribute("viewBox", "0 0 8 8");
    markR.setAttribute("refX", "7");
    markR.setAttribute("refY", "4");
    markR.setAttribute("markerWidth", "7");
    markR.setAttribute("markerHeight", "7");
    markR.setAttribute("orient", "auto");
    var headR = document.createElementNS("http://www.w3.org/2000/svg", "path");
    headR.setAttribute("d", "M0,1 L8,4 L0,7 Z");
    headR.setAttribute("fill", "#888");
    markR.appendChild(headR);
    defs.appendChild(mark);
    defs.appendChild(markR);
    svg.appendChild(defs);

    function down(a, b) {
      var x1 = a._x + a._w / 2;
      var y1 = a._y + a._h;
      var x2 = b._x + b._w / 2;
      var y2 = b._y;
      var d = x1 === x2
        ? "M" + x1 + " " + y1 + " V" + y2
        : "M" + x1 + " " + y1 + " V" + Math.round((y1 + y2) / 2) + " H" + x2 + " V" + y2;
      addPath(svg, d, "dn");
    }
    function across(parent, col) {
      if (!parent || !col.length) return;
      var x1 = parent._x + parent._w;
      var y1 = parent._y + parent._h / 2;
      var mid = col[Math.floor(col.length / 2)];
      var x2 = mid._x;
      var y2 = y1;
      if (y2 < mid._y) y2 = mid._y + mid._h / 2;
      if (y2 > col[col.length - 1]._y + col[col.length - 1]._h) {
        y2 = col[col.length - 1]._y + col[col.length - 1]._h / 2;
      }
      if (y2 < col[0]._y) y2 = col[0]._y + col[0]._h / 2;
      addPath(svg, "M" + x1 + " " + y1 + " H" + x2, "rt");
    }
    var i;
    if (c2.length) down(h, c2[0]);
    for (i = 0; i < c2.length - 1; i++) down(c2[i], c2[i + 1]);
    for (i = 0; i < c3.length - 1; i++) down(c3[i], c3[i + 1]);
    for (i = 0; i < c4.length - 1; i++) down(c4[i], c4[i + 1]);
    var p2 = null, p3 = null;
    for (i = 0; i < c2.length; i++) {
      if (sid(c2[i].dataset.id) === sid(openL2)) p2 = c2[i];
    }
    for (i = 0; i < c3.length; i++) {
      if (sid(c3[i].dataset.id) === sid(openL3)) p3 = c3[i];
    }
    across(p2, c3);
    across(p3, c4);

    board.insertBefore(svg, board.firstChild);
    board.style.width = maxX + "px";
    board.style.height = maxY + "px";
    if (st) st.textContent = items.length + " topics.";
  }
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
