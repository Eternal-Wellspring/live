(function () {
  var topics = [];
  var closed = {};
  var extra = {};
  var maxLevel = 2;
  var byId = {};
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
  function statusEl() {
    return document.getElementById("tree-status") || document.getElementById("status");
  }
  function bySeq() {
    return topics.slice().sort(function (a, b) { return (a.seq || 0) - (b.seq || 0); });
  }
  function pageName() {
    var el = document.getElementById("page-title");
    var n = el ? String(el.textContent || "").trim() : "";
    return n || "The Day of Yahweh";
  }
  function pageRoot() {
    var list = bySeq();
    var i;
    if (rootId) {
      for (i = 0; i < list.length; i++) {
        if (sid(list[i].id) === sid(rootId)) return list[i];
      }
    }
    var name = pageName().toLowerCase();
    for (i = 0; i < list.length; i++) {
      if ((list[i].level || 1) !== 1) continue;
      if (String(list[i].title || "").trim().toLowerCase() === name) return list[i];
    }
    for (i = 0; i < list.length; i++) {
      if ((list[i].level || 1) === 1) return list[i];
    }
    return null;
  }
  function visible() {
    var list = bySeq();
    var root = pageRoot();
    if (!root) return [{ id: "page-root", level: 1, seq: 0, title: pageName() }];
    var rootLv = root.level || 1;
    var start = -1, i;
    for (i = 0; i < list.length; i++) {
      if (sid(list[i].id) === sid(root.id)) { start = i; break; }
    }
    if (start < 0) return [root];
    var out = [root];
    for (i = start + 1; i < list.length; i++) {
      if ((list[i].level || 1) <= rootLv) break;
      out.push(list[i]);
    }
    return out;
  }
  function idsOf(s) {
    return String(s || "").split("|").map(function (x) { return x.trim(); }).filter(Boolean);
  }
  function kidsOf(items, i) {
    var lv = items[i].level || 1;
    var out = [], j;
    for (j = i + 1; j < items.length; j++) {
      var k = items[j].level || 1;
      if (k <= lv) break;
      if (k === lv + 1) out.push(j);
    }
    return out;
  }
  function descCount(items, i) {
    var lv = items[i].level || 1, n = 0, j;
    for (j = i + 1; j < items.length; j++) {
      if ((items[j].level || 1) <= lv) break;
      n += 1;
    }
    return n;
  }
  function capOf(t) {
    var id = sid(t.id);
    var cap = maxLevel;
    if ((extra[id] || 0) > cap) cap = extra[id];
    return cap;
  }
  function kidsShown(items, i) {
    var t = items[i];
    var id = sid(t.id);
    if (closed[id]) return [];
    var cap = capOf(t);
    return kidsOf(items, i).filter(function (j) {
      return (items[j].level || 1) <= cap;
    });
  }
  function hiddenCount(items, i) {
    var total = descCount(items, i);
    if (!total) return 0;
    var shown = 0;
    function walk(k) {
      var ks = kidsShown(items, k);
      shown += ks.length;
      ks.forEach(walk);
    }
    walk(i);
    return total - shown;
  }
  function markDepth() {
    document.querySelectorAll("[data-depth]").forEach(function (b) {
      b.classList.toggle("on", Number(b.getAttribute("data-depth")) === maxLevel);
    });
  }
  function drawAfterArrows(row) {
    var nodes = [].slice.call(row.querySelectorAll(":scope > .tn"));
    if (nodes.length < 2) return;
    var links = [];
    nodes.forEach(function (n) {
      var id = n.getAttribute("data-id");
      var t = byId[id];
      if (!t) return;
      idsOf(t.pre).forEach(function (p) {
        var src = row.querySelector(':scope > .tn[data-id="' + p + '"]');
        if (src && src !== n) links.push([src, n]);
      });
    });
    if (!links.length) return;
    var rr = row.getBoundingClientRect();
    var w = Math.max(row.scrollWidth, row.clientWidth, 1);
    var h = Math.max(row.clientHeight, 32);
    var svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
    svg.setAttribute("class", "tarr");
    svg.setAttribute("width", String(w));
    svg.setAttribute("height", String(h));
    var defs = document.createElementNS("http://www.w3.org/2000/svg", "defs");
    var mark = document.createElementNS("http://www.w3.org/2000/svg", "marker");
    mark.setAttribute("id", "arr-" + Math.random().toString(36).slice(2, 8));
    mark.setAttribute("viewBox", "0 0 8 8");
    mark.setAttribute("refX", "7");
    mark.setAttribute("refY", "4");
    mark.setAttribute("markerWidth", "7");
    mark.setAttribute("markerHeight", "7");
    mark.setAttribute("orient", "auto");
    var head = document.createElementNS("http://www.w3.org/2000/svg", "path");
    head.setAttribute("d", "M0,1 L8,4 L0,7 Z");
    head.setAttribute("fill", "#888");
    mark.appendChild(head);
    defs.appendChild(mark);
    svg.appendChild(defs);
    var midY = 0, nY = 0;
    function boxRect(tn) {
      var box = tn.querySelector(".tbox") || tn;
      var a = box.getBoundingClientRect();
      return {
        left: a.left - rr.left + row.scrollLeft,
        right: a.right - rr.left + row.scrollLeft,
        mid: a.left - rr.left + row.scrollLeft + a.width / 2,
        top: a.top - rr.top,
        bot: a.bottom - rr.top,
        cy: a.top - rr.top + a.height / 2
      };
    }
    links.forEach(function (pair) {
      var a = boxRect(pair[0]);
      var b = boxRect(pair[1]);
      midY += a.cy;
      nY += 1;
      var y = Math.round((a.cy + b.cy) / 2);
      var x1 = a.right;
      var x2 = b.left;
      var p = document.createElementNS("http://www.w3.org/2000/svg", "path");
      var d;
      if (x2 >= x1 + 4) {
        d = "M" + x1 + " " + y + " H" + x2;
      } else if (x1 >= x2 + 4) {
        var dip = Math.max(a.bot, b.bot) + 8;
        d = "M" + a.mid + " " + a.bot + " V" + dip + " H" + b.mid + " V" + b.bot;
      } else {
        d = "M" + a.mid + " " + a.bot + " V" + (a.bot + 8) + " H" + b.mid + " V" + b.bot;
      }
      p.setAttribute("d", d);
      p.setAttribute("fill", "none");
      p.setAttribute("stroke", "#888");
      p.setAttribute("stroke-width", "1");
      p.setAttribute("marker-end", "url(#" + mark.getAttribute("id") + ")");
      svg.appendChild(p);
    });
    row.insertBefore(svg, row.firstChild);
  }
  function paint() {
    var board = document.getElementById("board");
    var st = statusEl();
    if (!board) return;
    var items = visible();
    board.innerHTML = "";
    board.className = "board tree-board";
    if (!items.length) {
      board.textContent = pageName();
      if (st) st.textContent = "1 topic.";
      return;
    }
    function addNode(i) {
      var t = items[i];
      var id = sid(t.id);
      var shown = kidsShown(items, i);
      var hideN = hiddenCount(items, i);
      var node = document.createElement("div");
      node.className = "tn";
      node.setAttribute("data-id", id);
      var box = document.createElement("button");
      box.type = "button";
      box.className = "tbox";
      var name = document.createElement("span");
      name.className = "name";
      name.textContent = t.title || "";
      box.appendChild(name);
      if (hideN > 0) {
        var num = document.createElement("span");
        num.className = "tcount";
        num.textContent = String(hideN);
        box.appendChild(num);
      }
      box.addEventListener("click", function (ev) {
        ev.stopPropagation();
        var has = kidsOf(items, i);
        if (!has.length) return;
        if (shown.length) {
          closed[id] = true;
        } else {
          delete closed[id];
          var need = (t.level || 1) + 1;
          if (need > capOf(t)) extra[id] = need;
        }
        paint();
      });
      node.appendChild(box);
      if (shown.length) {
        var stem = document.createElement("div");
        stem.className = "tstem";
        node.appendChild(stem);
        var row = document.createElement("div");
        var kidLv = items[shown[0]].level || 1;
        row.className = kidLv >= 4 ? "tkids tkids-l4" : "tkids";
        shown.forEach(function (j) { row.appendChild(addNode(j)); });
        node.appendChild(row);
        if (kidLv >= 4) {
          requestAnimationFrame(function () { drawAfterArrows(row); });
        }
      }
      return node;
    }
    byId = {};
    items.forEach(function (t) { byId[sid(t.id)] = t; });
    var rootLv = items[0].level || 1;
    items.forEach(function (t, i) {
      if ((t.level || 1) === rootLv) board.appendChild(addNode(i));
    });
    markDepth();
    if (st) st.textContent = items.length + " topics.";
  }
  window.snPaintTree = paint;
  var foldBtn = document.getElementById("foldall");
  var openBtn = document.getElementById("openall");
  if (foldBtn) {
    foldBtn.onclick = function () {
      visible().forEach(function (t, i, arr) {
        if (descCount(arr, i)) closed[sid(t.id)] = true;
      });
      extra = {};
      paint();
    };
  }
  if (openBtn) {
    openBtn.onclick = function () {
      closed = {};
      extra = {};
      paint();
    };
  }
  document.querySelectorAll("[data-depth]").forEach(function (b) {
    b.onclick = function () {
      maxLevel = Number(b.getAttribute("data-depth")) || 2;
      closed = {};
      extra = {};
      paint();
    };
  });
  fetch("data/topics.json", { cache: "no-store" })
    .then(function (r) { return r.json(); })
    .then(function (rows) {
      topics = rows || [];
      paint();
    })
    .catch(function (err) {
      var board = document.getElementById("board");
      if (board) {
        board.innerHTML = "";
        var box = document.createElement("button");
        box.type = "button";
        box.className = "tbox";
        box.textContent = pageName();
        board.appendChild(box);
      }
      var st = statusEl();
      if (st) st.textContent = String(err);
    });
})();
