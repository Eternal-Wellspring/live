(function () {
  function fitEwWords() {
    var img = document.querySelector(".ew-mark img");
    var words = document.querySelector(".ew-words");
    if (!img || !words) return;
    var h = img.getBoundingClientRect().height;
    if (h < 8) {
      var mark = document.querySelector(".ew-mark");
      if (mark) h = mark.getBoundingClientRect().height;
    }
    if (h < 8) return;
    words.style.height = h + "px";
    words.style.fontSize = (h / 2.12) + "px";
    words.style.lineHeight = "1.06";
    words.style.alignSelf = "stretch";
  }
  function onEwWords() {
    fitEwWords();
    var img = document.querySelector(".ew-mark img");
    if (img && !img.complete) img.addEventListener("load", fitEwWords);
  }
  window.addEventListener("resize", fitEwWords);
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", onEwWords);
  else onEwWords();
  setTimeout(fitEwWords, 50);
  setTimeout(fitEwWords, 250);

  var path = String(location.pathname || "");
  var file = path.split("/").pop() || "index.html";
  var isHome = file === "home.html" || file === "index.html" || file === "";
  if (isHome) {
    location.replace("narrative.html" + (location.search || ""));
    return;
  }

  var PAGE_KEY = "ew.page";
  var FONT_KEY = "ew.font";
  var SKY_KEY = "ew.sky";
  var NOTES_KEY = "ew.notes";
  var STEPS = [0.5, 0.6, 0.7, 0.8, 0.9, 1, 1.1, 1.25, 1.4];
  var defaults = window.ewDefaults || { sky: "stars", notes: false };
  function nearest(v) {
    var best = STEPS[0], d = 99, i;
    for (i = 0; i < STEPS.length; i++) {
      var x = Math.abs(STEPS[i] - v);
      if (x < d) { d = x; best = STEPS[i]; }
    }
    return best;
  }
  function read(key, fallback) {
    var v = fallback;
    try { v = parseFloat(localStorage.getItem(key) || "") || fallback; } catch (e) {}
    if (key === PAGE_KEY && (v === fallback)) {
      try { v = parseFloat(localStorage.getItem("ew.screen") || "") || fallback; } catch (e2) {}
    }
    return nearest(v);
  }
  function readSky() {
    try {
      var v = localStorage.getItem(SKY_KEY);
      if (v) return v;
    } catch (e) {}
    return defaults.sky || "stars";
  }
  function readNotes() {
    try {
      var v = localStorage.getItem(NOTES_KEY);
      if (v === "1") return true;
      if (v === "0") return false;
    } catch (e) {}
    return !!defaults.notes;
  }
  var pageZ = read(PAGE_KEY, 1);
  var fontZ = read(FONT_KEY, 1);
  function tellSettings() {
    if (window.parent && window.parent !== window) {
      window.parent.postMessage({ type: "ew-settings", footnotes: readNotes(), sky: readSky() }, "*");
    }
  }
  function apply() {
    var f = document.querySelector(".page-frame");
    var main = document.querySelector("main");
    var tabs = document.querySelector(".tab-dock");
    if (f) {
      f.style.zoom = "";
      if (pageZ < 1) {
        f.style.width = (pageZ * 100) + "%";
        f.style.maxWidth = (pageZ * 100) + "%";
        f.style.marginLeft = "auto";
        f.style.marginRight = "auto";
      } else {
        f.style.width = "auto";
        f.style.maxWidth = "none";
        f.style.marginLeft = "1.25rem";
        f.style.marginRight = "1.25rem";
      }
    }
    document.documentElement.style.setProperty("--ew-font", String(fontZ));
    document.documentElement.classList.toggle("ew-notes-off", !readNotes());
    if (main) main.style.zoom = "";
    if (tabs) tabs.style.zoom = "";
    document.querySelectorAll(".title-bar h1, .page-end-title").forEach(function(el){ el.style.zoom = ""; });
    document.querySelectorAll(".page-minus").forEach(function(b){ b.disabled = pageZ <= STEPS[0]; });
    document.querySelectorAll(".page-plus").forEach(function(b){ b.disabled = pageZ >= 1; });
    document.querySelectorAll(".font-minus").forEach(function(b){ b.disabled = fontZ <= STEPS[0]; });
    document.querySelectorAll(".font-plus").forEach(function(b){ b.disabled = fontZ >= STEPS[STEPS.length - 1]; });
    var sky = readSky();
    var stars = !sky || sky === "stars";
    var canvas = document.getElementById("ew-sky");
    if (stars) {
      document.documentElement.style.background = "#05070c";
      document.body.style.background = "#05070c";
      if (canvas) canvas.style.setProperty("display", "block", "important");
    } else {
      document.documentElement.style.background = sky;
      document.body.style.background = sky;
      if (canvas) canvas.style.setProperty("display", "none", "important");
    }
    var col = document.getElementById("set-sky");
    if (col && !stars && /^#([0-9a-f]{3}|[0-9a-f]{6})$/i.test(sky)) col.value = sky.length === 4 ? sky : sky.slice(0, 7);
    document.querySelectorAll("[data-sky]").forEach(function(b){
      b.classList.toggle("on", stars);
    });
    var notesOn = readNotes();
    document.querySelectorAll(".tab-notes").forEach(function(b){
      b.classList.toggle("on", notesOn);
    });
  }
  function nudge(which, dir) {
    var cur = which === "page" ? pageZ : fontZ;
    var i = STEPS.indexOf(nearest(cur));
    i = Math.max(0, Math.min(STEPS.length - 1, i + dir));
    cur = STEPS[i];
    if (which === "page") pageZ = cur;
    else fontZ = cur;
    try { localStorage.setItem(which === "page" ? PAGE_KEY : FONT_KEY, String(cur)); } catch (e) {}
    apply();
    tellSettings();
  }
  function setNotes(on) {
    try { localStorage.setItem(NOTES_KEY, on ? "1" : "0"); } catch (e) {}
    apply();
    tellSettings();
  }
  function setSky(v) {
    v = String(v || "").trim() || "stars";
    try { localStorage.setItem(SKY_KEY, v); } catch (e) {}
    apply();
    tellSettings();
  }
  document.addEventListener("click", function (ev) {
    if (ev.target.closest(".page-minus")) nudge("page", -1);
    else if (ev.target.closest(".page-plus")) nudge("page", 1);
    else if (ev.target.closest(".font-minus")) nudge("font", -1);
    else if (ev.target.closest(".font-plus")) nudge("font", 1);
    else if (ev.target.closest("[data-notes-toggle]")) {
      ev.preventDefault();
      setNotes(!readNotes());
    } else if (ev.target.closest("[data-settings-open]")) {
      ev.preventDefault();
      var pop = document.getElementById("ew-settings-pop");
      if (pop) {
        pop.hidden = false;
        document.documentElement.classList.add("ew-settings-open");
      }
    } else if (ev.target.closest(".ew-settings-scrim") || ev.target.closest(".ew-settings-x")) {
      ev.preventDefault();
      var pop2 = document.getElementById("ew-settings-pop");
      if (pop2) pop2.hidden = true;
      document.documentElement.classList.remove("ew-settings-open");
    } else if (ev.target.closest("[data-sky]")) setSky("stars");
  });
  function bindSky(){
    var col = document.getElementById("set-sky");
    if (!col || col._ewSky) return;
    col._ewSky = true;
    function paintSky(){ setSky(col.value); }
    col.addEventListener("click", paintSky);
    col.addEventListener("input", paintSky);
    col.addEventListener("change", paintSky);
  }
  document.addEventListener("ew-page-swap", function(){
    apply();
    bindSky();
  });
  bindSky();
  apply();
})();
