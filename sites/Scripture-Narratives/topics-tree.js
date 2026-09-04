(function () {
  var topics = [];
  var folded = {};
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
    var out = [];
    for (i = start; i < list.length; i++) {
      if (i > start && (list[i].level || 1) <= rootLv) break;
      out.push(list[i]);
    }
    if (!out.length) out = [list[start]];
    return out;
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
  function paint() {
    var board = document.getElementById("board");
    var st = statusEl();
    if (!board) return;
    var items = visible();
    board.innerHTML = "";
    board.style.position = "static";
    board.style.height = "auto";
    board.style.width = "auto";
    board.style.minHeight = "12rem";
    board.style.padding = "12px 14px 24px";
    if (!items.length) {
      board.textContent = "No topics.";
      if (st) st.textContent = "No topics.";
      return;
    }
    function addNode(i) {
      var t = items[i];
      var lv = t.level || 1;
      var id = sid(t.id);
      var kids = kidsOf(items, i);
      var row = document.createElement("div");
      row.style.margin = "0 0 8px";
      row.style.paddingLeft = Math.max(0, lv - 1) * 22 + "px";
      var box = document.createElement("span");
      box.className = "box";
      box.style.position = "static";
      box.style.display = "inline-block";
      box.style.whiteSpace = "nowrap";
      box.style.border = "1px solid #c5d0d4";
      box.style.background = "#fff";
      box.style.padding = "0.2rem 0.45rem";
      box.style.font = "400 13px/1.2 Arial, Helvetica, sans-serif";
      box.textContent = t.title || "";
      row.appendChild(box);
      if (kids.length && folded[id]) {
        var more = document.createElement("span");
        more.style.marginLeft = "0.4rem";
        more.style.color = "#5a6a72";
        more.style.fontSize = "0.78rem";
        more.textContent = "+" + kids.length;
        row.appendChild(more);
      }
      board.appendChild(row);
      if (!folded[id]) {
        kids.forEach(function (j) { addNode(j); });
      }
    }
    var rootLv = items[0].level || 1;
    items.forEach(function (t, i) {
      if ((t.level || 1) === rootLv) addNode(i);
    });
    if (st) st.textContent = items.length + " topics.";
  }
  window.snPaintTree = paint;
  var foldBtn = document.getElementById("foldall");
  var openBtn = document.getElementById("openall");
  if (foldBtn) {
    foldBtn.onclick = function () {
      visible().forEach(function (t) {
        if ((t.level || 1) <= 2) folded[sid(t.id)] = true;
      });
      paint();
    };
  }
  if (openBtn) {
    openBtn.onclick = function () {
      folded = {};
      paint();
    };
  }
  fetch("data/topics.json", { cache: "no-store" })
    .then(function (r) { return r.json(); })
    .then(function (rows) {
      topics = rows || [];
      paint();
    })
    .catch(function (err) {
      var board = document.getElementById("board");
      if (board) board.textContent = String(err);
      var st = statusEl();
      if (st) st.textContent = String(err);
    });
})();
