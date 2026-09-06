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
})();
