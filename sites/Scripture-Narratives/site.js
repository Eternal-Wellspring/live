(function () {
  var path = String(location.pathname || "");
  var file = path.split("/").pop() || "index.html";
  var isHome = file === "home.html" || file === "index.html" || file === "";
  if (!isHome) return;
  var css = document.createElement("style");
  css.textContent =
    ".ew-l1-list{display:inline-block;width:max-content;max-width:100%;margin:0.2rem 0 0;border:1px solid #888;background:#fff}" +
    ".ew-l1-list a{display:block;padding:0.2rem 0.55rem;font-weight:400!important;color:inherit!important;text-decoration:none!important;line-height:1.45}" +
    ".ew-l1-list a+a{border-top:1px solid #ddd}" +
    ".ew-l1-list a:hover{background:#f4f7f8}" +
    "[data-sec='s-home'] .subsec-frame{display:none}";
  document.head.appendChild(css);
  fetch("data/topics.json", { cache: "no-store" })
    .then(function (r) { return r.json(); })
    .then(function (rows) {
      var ones = (rows || []).filter(function (t) { return (t.level || 1) === 1; })
        .sort(function (a, b) { return (a.seq || 0) - (b.seq || 0); });
      var h = document.querySelector('[data-sec="s-home"] h2');
      if (!h || !h.parentNode) return;
      var old = document.querySelector(".ew-l1-list");
      if (old) old.remove();
      var list = document.createElement("div");
      list.className = "ew-l1-list";
      ones.forEach(function (t) {
        var a = document.createElement("a");
        var base = path.indexOf("/create-preview/") >= 0 ? "/sites/Scripture-Narratives/" : "";
        a.href = base + "narrative.html?id=" + encodeURIComponent(t.id) + "&v=222";
        a.textContent = t.title || "";
        list.appendChild(a);
      });
      h.parentNode.insertBefore(list, h.nextSibling);
    })
    .catch(function () {});
})();
