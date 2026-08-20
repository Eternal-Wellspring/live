(function () {
  var _ewFetch = window.fetch;
  window.fetch = function (url, opts) {
    var method = String((opts && opts.method) || "GET").toUpperCase();
    if (method !== "GET") return _ewFetch.apply(this, arguments);
    var u;
    try {
      u = new URL(url, location.href);
    } catch (e) {
      return _ewFetch.apply(this, arguments);
    }
    if (u.pathname !== "/scriptures") return _ewFetch.apply(this, arguments);
    var ref = u.searchParams.get("ref") || "";
    var want = String(ref).replace(/\s+/g, " ").trim().toLowerCase();
    var files = [];
    try {
      files.push(new URL("scriptures.json", location.href).href);
    } catch (e2) {}
    files.push("/scriptures.json");
    function seek(i) {
      if (i >= files.length) return _ewFetch.apply(window, [url, opts]);
      return _ewFetch(files[i])
        .then(function (r) {
          if (!r.ok) throw new Error("no");
          return r.json();
        })
        .then(function (data) {
          var list = (data && data.verses) || [];
          var hit = null;
          for (var n = 0; n < list.length; n++) {
            var key = String(list[n].reference || "")
              .replace(/\s+/g, " ")
              .trim()
              .toLowerCase();
            if (key === want) {
              hit = list[n];
              break;
            }
          }
          var body = JSON.stringify(
            hit
              ? { found: true, reference: hit.reference || ref, text: hit.text || "" }
              : { found: false, reference: ref, text: "" }
          );
          return new Response(body, { status: 200, headers: { "Content-Type": "application/json" } });
        })
        .catch(function () {
          return seek(i + 1);
        });
    }
    return seek(0);
  };
})();
(function () {
  var TRANSLATIONS = [
    { id: "NKJV", label: "NKJV", full: "New King James Version", year: "1982" },
    { id: "ESV", label: "ESV", full: "English Standard Version", year: "2001, 2016" },
    { id: "AV", label: "AV", slug: "KJV", full: "Authorised Version", year: "1769" },
    { id: "KJV", label: "KJV", full: "King James Version", year: "1769" },
    { id: "NIV", label: "NIV", full: "New International Version", year: "1984" },
    { id: "NASB", label: "NASB", full: "New American Standard Bible", year: "1995" },
    { id: "NLT", label: "NLT", full: "New Living Translation", year: "2015" },
    { id: "WEB", label: "WEB", full: "World English Bible" },
    { id: "ASV", label: "ASV", full: "American Standard Version", year: "1901" },
    { id: "NET", label: "NET", full: "New English Translation", year: "2007" },
    { id: "RSV", label: "RSV", full: "Revised Standard Version", year: "1952" },
    { id: "YLT", label: "YLT", full: "Young's Literal Translation", year: "1898" },
    { id: "LSB", label: "LSB", full: "Legacy Standard Bible", year: "2021" },
    { id: "GNT", label: "GNT", full: "Good News Bible", year: "1976" },
  ];
  var STORE = "ew.bible";
  var BOOKS = [
    ["Gen", 1, ["genesis", "gen"]],
    ["Exo", 2, ["exodus", "exo", "ex"]],
    ["Lev", 3, ["leviticus", "lev"]],
    ["Num", 4, ["numbers", "num", "nu"]],
    ["Deu", 5, ["deuteronomy", "deu", "deut", "dt"]],
    ["Jos", 6, ["joshua", "jos", "josh"]],
    ["Jdg", 7, ["judges", "jdg", "judg"]],
    ["Rut", 8, ["ruth", "rut"]],
    ["1Sa", 9, ["1 samuel", "1samuel", "1sa", "1sam", "1 sam"]],
    ["2Sa", 10, ["2 samuel", "2samuel", "2sa", "2sam", "2 sam"]],
    ["1Ki", 11, ["1 kings", "1kings", "1ki", "1kin", "1 kings"]],
    ["2Ki", 12, ["2 kings", "2kings", "2ki", "2kin"]],
    ["1Ch", 13, ["1 chronicles", "1chronicles", "1ch", "1chr"]],
    ["2Ch", 14, ["2 chronicles", "2chronicles", "2ch", "2chr"]],
    ["Ezr", 15, ["ezra", "ezr"]],
    ["Neh", 16, ["nehemiah", "neh"]],
    ["Est", 17, ["esther", "est"]],
    ["Job", 18, ["job"]],
    ["Psa", 19, ["psalms", "psalm", "psa", "ps"]],
    ["Pro", 20, ["proverbs", "pro", "prov"]],
    ["Ecc", 21, ["ecclesiastes", "ecc", "eccl"]],
    ["Sng", 22, ["song of solomon", "song of songs", "sng", "sos", "song"]],
    ["Isa", 23, ["isaiah", "isa"]],
    ["Jer", 24, ["jeremiah", "jer"]],
    ["Lam", 25, ["lamentations", "lam"]],
    ["Ezk", 26, ["ezekiel", "ezk", "ezek", "eze"]],
    ["Dan", 27, ["daniel", "dan"]],
    ["Hos", 28, ["hosea", "hos"]],
    ["Jol", 29, ["joel", "jol", "joe"]],
    ["Amo", 30, ["amos", "amo"]],
    ["Oba", 31, ["obadiah", "oba"]],
    ["Jon", 32, ["jonah", "jon"]],
    ["Mic", 33, ["micah", "mic"]],
    ["Nam", 34, ["nahum", "nam", "nah"]],
    ["Hab", 35, ["habakkuk", "hab"]],
    ["Zep", 36, ["zephaniah", "zep", "zeph"]],
    ["Hag", 37, ["haggai", "hag"]],
    ["Zec", 38, ["zechariah", "zec", "zech"]],
    ["Mal", 39, ["malachi", "mal"]],
    ["Mat", 40, ["matthew", "mat", "matt", "mt"]],
    ["Mrk", 41, ["mark", "mrk", "mk"]],
    ["Luk", 42, ["luke", "luk", "lk"]],
    ["Jhn", 43, ["john", "jhn", "jn"]],
    ["Act", 44, ["acts", "act"]],
    ["Rom", 45, ["romans", "rom"]],
    ["1Co", 46, ["1 corinthians", "1corinthians", "1co", "1cor", "1 cor"]],
    ["2Co", 47, ["2 corinthians", "2corinthians", "2co", "2cor", "2 cor"]],
    ["Gal", 48, ["galatians", "gal"]],
    ["Eph", 49, ["ephesians", "eph"]],
    ["Php", 50, ["philippians", "php", "phil"]],
    ["Col", 51, ["colossians", "col"]],
    ["1Th", 52, ["1 thessalonians", "1thessalonians", "1th", "1thess", "1 thess"]],
    ["2Th", 53, ["2 thessalonians", "2thessalonians", "2th", "2thess", "2 thess"]],
    ["1Ti", 54, ["1 timothy", "1timothy", "1ti", "1tim", "1 tim"]],
    ["2Ti", 55, ["2 timothy", "2timothy", "2ti", "2tim", "2 tim"]],
    ["Tit", 56, ["titus", "tit"]],
    ["Phm", 57, ["philemon", "phm", "phlm"]],
    ["Heb", 58, ["hebrews", "heb"]],
    ["Jas", 59, ["james", "jas"]],
    ["1Pe", 60, ["1 peter", "1peter", "1pe", "1pet", "1 pet"]],
    ["2Pe", 61, ["2 peter", "2peter", "2pe", "2pet", "2 pet"]],
    ["1Jn", 62, ["1 john", "1john", "1jn", "1 jn"]],
    ["2Jn", 63, ["2 john", "2john", "2jn", "2 jn"]],
    ["3Jn", 64, ["3 john", "3john", "3jn", "3 jn"]],
    ["Jud", 65, ["jude", "jud"]],
    ["Rev", 66, ["revelation", "rev"]],
  ];
  var CHAPS = [0, 50, 40, 27, 36, 34, 24, 21, 4, 31, 24, 22, 25, 29, 36, 10, 13, 10, 42, 150, 31, 12, 8, 66, 52, 5, 48, 12, 14, 3, 9, 1, 4, 7, 3, 3, 3, 2, 14, 4, 28, 16, 24, 21, 28, 16, 16, 13, 6, 6, 4, 4, 5, 3, 6, 4, 3, 1, 13, 5, 5, 3, 5, 1, 1, 1, 22];
  var ALIAS = {};
  BOOKS.forEach(function (b) {
    ALIAS[b[0].toLowerCase()] = b;
    b[2].forEach(function (a) {
      ALIAS[a.toLowerCase()] = b;
    });
  });
  var BOOK_RE = BOOKS.map(function (b) {
    return b[2]
      .slice()
      .sort(function (a, c) {
        return c.length - a.length;
      })
      .concat([b[0].toLowerCase()])
      .map(function (a) {
        return a.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
      })
      .join("|");
  }).join("|");
  var REF_RE = new RegExp(
    "\\b(" + BOOK_RE + ")\\.?\\s+(\\d{1,3})\\s*:\\s*(\\d{1,3})(?:\\s*[-–—]\\s*(?:(\\d{1,3})\\s*:\\s*)?(\\d{1,3}))?",
    "gi"
  );

  function chosen() {
    try {
      var v = localStorage.getItem(STORE);
      if (TRANSLATIONS.some(function (t) { return t.id === v; })) return v;
    } catch (e) {}
    return "ESV";
  }
  function prefOn() {
    try {
      return localStorage.getItem(STORE + ".on") === "1";
    } catch (e) {
      return false;
    }
  }
  function setPrefOn(on) {
    try {
      localStorage.setItem(STORE + ".on", on ? "1" : "0");
    } catch (e) {}
  }
  function canEditVerses() {
    return location.port === "8767";
  }
  function hasLocalApi() {
    return location.port === "8766" || location.port === "8767";
  }
  function scriptureKey(ref) {
    return String(ref || "").replace(/\s+/g, " ").trim().toLowerCase();
  }
  var scripturesFile = null;
  function loadScripturesFile() {
    if (scripturesFile) return Promise.resolve(scripturesFile);
    var urls = [];
    try {
      urls.push(new URL("scriptures.json", location.href).href);
    } catch (e) {}
    urls.push("scriptures.json");
    urls.push("/scriptures.json");
    function next(i) {
      if (i >= urls.length) {
        scripturesFile = { verses: [] };
        return Promise.resolve(scripturesFile);
      }
      return fetch(urls[i])
        .then(function (r) {
          if (!r.ok) throw new Error("no file");
          var ct = String(r.headers.get("content-type") || "").toLowerCase();
          if (ct.indexOf("json") === -1) throw new Error("not json");
          return r.json();
        })
        .then(function (data) {
          if (!data || typeof data !== "object" || !Array.isArray(data.verses)) throw new Error("bad");
          scripturesFile = data;
          return scripturesFile;
        })
        .catch(function () {
          return next(i + 1);
        });
    }
    return next(0);
  }
  function findStored(ref) {
    var want = scriptureKey(ref);
    return loadScripturesFile().then(function (data) {
      var list = data.verses || [];
      for (var i = 0; i < list.length; i++) {
        if (scriptureKey(list[i].reference) === want) {
          return {
            found: true,
            reference: list[i].reference || ref,
            text: list[i].text || "",
            missing: [],
          };
        }
      }
      return { found: false, reference: ref, text: "", missing: [] };
    });
  }
  function fetchStored(ref) {
    return findStored(ref).then(function (d) {
      if (d && d.found && d.text) return d;
      if (!hasLocalApi()) return d;
      var q = "/scriptures?ref=" + encodeURIComponent(ref);
      if (window.ewFolder) q += "&folder=" + encodeURIComponent(window.ewFolder);
      return fetch(q)
        .then(function (r) {
          if (!r.ok) throw new Error("no api");
          return r.json();
        })
        .then(function (api) {
          if (api && typeof api === "object" && ("found" in api || "text" in api)) return api;
          return d;
        })
        .catch(function () {
          return d;
        });
    });
  }
  function storedHtml(text) {
    return String(text || "").replace(/\n/g, "<br>");
  }
  function setChosen(id) {
    try {
      localStorage.setItem(STORE, id);
    } catch (e) {}
  }
  function parseRef(raw) {
    REF_RE.lastIndex = 0;
    var m = REF_RE.exec(String(raw || ""));
    if (!m) return null;
    var book = ALIAS[m[1].toLowerCase()];
    if (!book) return null;
    var ch1 = Number(m[2]);
    var vs1 = Number(m[3]);
    var ch2 = m[4] ? Number(m[4]) : ch1;
    var vs2 = m[5] ? Number(m[5]) : vs1;
    return {
      label: book[0] + " " + ch1 + ":" + vs1 + (ch2 !== ch1 || vs2 !== vs1 ? "-" + (ch2 !== ch1 ? ch2 + ":" : "") + vs2 : ""),
      book: book[1],
      name: book[0],
      ch1: ch1,
      vs1: vs1,
      ch2: ch2,
      vs2: vs2,
    };
  }
  function parseChapter(raw) {
    var full = parseRef(raw);
    if (full) return full;
    var re = new RegExp("\\b(" + BOOK_RE + ")\\.?\\s+(\\d{1,3})\\b", "i");
    var m = String(raw || "").match(re);
    if (!m) return null;
    var book = ALIAS[m[1].toLowerCase()];
    if (!book) return null;
    return {
      label: book[0] + " " + m[2],
      book: book[1],
      name: book[0],
      ch1: Number(m[2]),
      vs1: 0,
      ch2: Number(m[2]),
      vs2: 0,
    };
  }
  function cleanVerse(html) {
    return String(html || "")
      .replace(/<S\b[^>]*>[\s\S]*?<\/S>/gi, "")
      .replace(/<\/?S\b[^>]*>/gi, "")
      .replace(/\{(?:H|G)?\d+\}/gi, "")
      .replace(/<[^>]+>/g, "")
      .replace(/&nbsp;/g, " ")
      .replace(/\s+/g, " ")
      .trim();
  }
  function trById(id) {
    return TRANSLATIONS.filter(function (t) { return t.id === id; })[0];
  }
  function trYear(id) {
    var t = trById(id);
    if (!t || !t.year) return "";
    var parts = String(t.year).split(/,\s*/);
    return parts[parts.length - 1];
  }
  function trShort(id) {
    var t = trById(id);
    if (!t) return id;
    var y = trYear(id);
    return y ? t.label + " " + y : t.label;
  }
  function trHover(id) {
    var t = trById(id);
    if (!t || !t.full) return "";
    var y = trYear(id);
    return y ? t.full + ", " + y : t.full;
  }
  function altTranslations() {
    return TRANSLATIONS.filter(function (t) {
      return t.id !== "NKJV";
    }).sort(function (a, b) {
      return a.label.localeCompare(b.label);
    });
  }
  function fillTrList(list) {
    if (!list) return;
    list.innerHTML = "";
    altTranslations().forEach(function (t) {
      var row = document.createElement("div");
      row.setAttribute("role", "option");
      row.setAttribute("data-tr", t.id);
      row.title = trHover(t.id);
      var code = document.createElement("span");
      code.className = "ew-tr-code";
      code.textContent = t.label;
      var year = document.createElement("span");
      year.className = "ew-tr-year";
      year.textContent = trYear(t.id);
      row.appendChild(code);
      row.appendChild(year);
      list.appendChild(row);
    });
  }
  function closeTrLists() {
    if (trList) trList.hidden = true;
    if (trNow) trNow.setAttribute("aria-expanded", "false");
    if (chTrList) chTrList.hidden = true;
    if (chTrNow) chTrNow.setAttribute("aria-expanded", "false");
  }
  function slugOf(id) {
    var hit = trById(id);
    return (hit && hit.slug) || id;
  }
  function setAbbrTitle(el, before, id) {
    if (!el) return;
    el.textContent = "";
    if (before) el.appendChild(document.createTextNode(before + " "));
    var mark = document.createElement("span");
    mark.className = "ew-tr-abbr";
    mark.textContent = id;
    mark.title = trHover(id);
    el.appendChild(mark);
  }
  function fetchChapter(tr, book, chapter) {
    var slug = slugOf(tr);
    var remote = "https://bolls.life/get-text/" + encodeURIComponent(slug) + "/" + book + "/" + chapter + "/";
    function fromRemote() {
      return fetch(remote).then(function (r) {
        if (!r.ok) throw new Error("Could not open that passage.");
        return r.json();
      });
    }
    if (!hasLocalApi()) return fromRemote();
    var local = "/bible?tr=" + encodeURIComponent(slug) + "&book=" + book + "&chapter=" + chapter;
    return fetch(local)
      .then(function (r) {
        if (!r.ok) throw new Error("local");
        return r.json();
      })
      .catch(fromRemote);
  }
  function loadPassage(ref, tr) {
    var jobs = [];
    for (var ch = ref.ch1; ch <= ref.ch2; ch++) jobs.push(fetchChapter(tr, ref.book, ch));
    return Promise.all(jobs).then(function (chapters) {
      var out = [];
      chapters.forEach(function (rows, i) {
        var ch = ref.ch1 + i;
        (rows || []).forEach(function (row) {
          var v = Number(row.verse);
          var from = ch === ref.ch1 ? ref.vs1 : 1;
          var to = ch === ref.ch2 ? ref.vs2 : 999;
          if (v >= from && v <= to) out.push({ ch: ch, vs: v, text: cleanVerse(row.text) });
        });
      });
      return out;
    });
  }
  function refLabel(ref) {
    return ref.name + " " + ref.ch1 + ":" + ref.vs1 + (ref.ch2 !== ref.ch1 || ref.vs2 !== ref.vs1 ? "-" + (ref.ch2 !== ref.ch1 ? ref.ch2 + ":" : "") + vs2Safe(ref) : "");
  }
  function vs2Safe(ref) {
    return ref.vs2;
  }
  function versesToHtml(verses) {
    return verses
      .map(function (v) {
        return "<p><sup>" + v.vs + "</sup> " + v.text.replace(/</g, "&lt;") + "</p>";
      })
      .join("");
  }
  function escTxt(s) {
    return String(s || "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;");
  }
  function splitWords(text) {
    return String(text || "")
      .replace(/\s+/g, " ")
      .trim()
      .split(" ")
      .filter(Boolean);
  }
  function normWord(w) {
    return String(w || "")
      .toLowerCase()
      .replace(/[^a-z0-9]/g, "");
  }
  function nkjvShape(html) {
    var wrap = document.createElement("div");
    wrap.innerHTML = html || "";
    var segs = [];
    function pushWords(str, bold) {
      var words = splitWords(str);
      if (words.length) segs.push({ type: "words", n: words.length, bold: !!bold, sample: words });
    }
    function walk(node, bold) {
      if (!node) return;
      if (node.nodeType === 3) {
        String(node.nodeValue || "")
          .split(/\n/)
          .forEach(function (bit, i) {
            if (i) segs.push({ type: "break" });
            pushWords(bit, bold);
          });
        return;
      }
      if (node.nodeType !== 1) return;
      var tag = node.tagName;
      if (tag === "BR") {
        segs.push({ type: "break" });
        return;
      }
      if (tag === "SUP") return;
      var now = bold || tag === "B" || tag === "STRONG";
      for (var i = 0; i < node.childNodes.length; i++) walk(node.childNodes[i], now);
    }
    walk(wrap, false);
    return segs;
  }
  function overlapScore(a, b) {
    var left = {};
    b.forEach(function (w) {
      if (w) left[w] = (left[w] || 0) + 1;
    });
    var hit = 0;
    a.forEach(function (w) {
      if (left[w]) {
        hit += 1;
        left[w] -= 1;
      }
    });
    return hit / Math.max(a.length, b.length, 1);
  }
  function markBold(prefWords, boldWords) {
    var b = boldWords.map(normWord).filter(Boolean);
    var p = prefWords.map(normWord);
    if (!b.length || !p.length) return null;
    var best = { score: 0, start: 0, end: 0 };
    var maxLen = Math.min(p.length, b.length + 4);
    var minLen = Math.max(1, b.length - 2);
    for (var len = minLen; len <= maxLen; len++) {
      for (var i = 0; i + len <= p.length; i++) {
        var sc = overlapScore(p.slice(i, i + len), b);
        if (sc > best.score) best = { score: sc, start: i, end: i + len };
      }
    }
    return best.score >= 0.34 ? best : null;
  }
  function shapeLike(nkjvInner, plain) {
    var words = splitWords(plain);
    if (!words.length) return "";
    var segs = nkjvShape(nkjvInner);
    var nkjvN = 0;
    segs.forEach(function (s) {
      if (s.type === "words") nkjvN += s.n;
    });
    if (!nkjvN) return escTxt(words.join(" "));
    var boldMarks = [];
    for (var k = 0; k < words.length; k++) boldMarks[k] = false;
    segs.forEach(function (s) {
      if (s.type !== "words" || !s.bold || !s.sample) return;
      var win = markBold(words, s.sample);
      if (!win) return;
      for (var i = win.start; i < win.end; i++) boldMarks[i] = true;
    });
    var breakAt = {};
    var seen = 0;
    segs.forEach(function (s) {
      if (s.type === "words") seen += s.n;
      else if (s.type === "break" && seen) {
        var at = Math.round((seen / nkjvN) * words.length);
        if (at > 0 && at < words.length) breakAt[at] = true;
      }
    });
    var html = "";
    var i = 0;
    while (i < words.length) {
      var bold = !!boldMarks[i];
      var j = i + 1;
      while (j < words.length && !!boldMarks[j] === bold && !breakAt[j]) j++;
      var chunk = escTxt(words.slice(i, j).join(" "));
      if (html) html += breakAt[i] ? "<br>" : " ";
      html += bold ? "<strong>" + chunk + "</strong>" : chunk;
      i = j;
    }
    return html;
  }
  function verseMapFromHtml(html) {
    var map = {};
    var raw = String(html || "");
    raw.replace(/<p>\s*<sup>\s*(\d+)\s*<\/sup>\s*([\s\S]*?)<\/p>/gi, function (_, n, inner) {
      if (String(inner || "").trim()) map[Number(n)] = String(inner).trim();
      return "";
    });
    if (Object.keys(map).length) return map;
    var parts = raw.split(/<br\s*\/?>|\n/);
    if (parts[0] && /\b\d+\s*:\s*\d+/.test(parts[0])) parts = parts.slice(1);
    var cur = 0;
    var buf = [];
    function flush() {
      if (cur && buf.length) map[cur] = buf.join("<br>").replace(/^(<br>)+|(<br>)+$/g, "").trim();
    }
    parts.forEach(function (line) {
      var m = String(line || "").match(/^\s*(\d+)\s+([\s\S]*)$/);
      if (m) {
        flush();
        cur = Number(m[1]);
        buf = [m[2]];
      } else if (cur) buf.push(line);
    });
    flush();
    return map;
  }
  function htmlFromVerseMap(map, from, to) {
    var a = Number(from);
    var b = Number(to || from);
    var bits = [];
    for (var n = a; n <= b; n++) {
      if (!map[n]) continue;
      bits.push("<p><sup>" + n + "</sup> " + map[n] + "</p>");
    }
    return bits.join("");
  }
  function addMissingVerses(map, verses) {
    (verses || []).forEach(function (v) {
      if (v && v.vs && !map[v.vs]) map[v.vs] = String(v.text || "").replace(/</g, "&lt;");
    });
    return map;
  }

  var box, body, title, select, alt, altWrap, saveBtn, saveCloseBtn, revertBtn, cancelBtn, chapterBtn, prefBtn;
  var dirty = false;
  var snapshot = "";
  var savedCopy = "";
  var trNow, trList, chNkjv, chTrPick, chTrNow, chTrList, chView = "NKJV";
  var chBox, chList, chTitle, chHint, chPickBtn, chPrev, chNext, chPick = false, chBrowse;
  var currentRef, nkjvHtml, savedLink, inFile;
  var chStart, chEnd, chRows;

  function setRefRange(start, end) {
    var a = Number(start);
    var b = Number(end || start);
    if (b < a) {
      var t = a;
      a = b;
      b = t;
    }
    currentRef.vs1 = a;
    currentRef.vs2 = b;
    currentRef.ch2 = currentRef.ch1;
    currentRef.label = refLabel(currentRef);
    if (title) setAbbrTitle(title, currentRef.label, "NKJV");
    updateSavedLink();
  }
  function updateSavedLink() {
    if (!savedLink || !currentRef || !currentRef.vs1) return;
    savedLink.setAttribute("data-ref", currentRef.label);
    savedLink.textContent = currentRef.label;
    var host = savedLink.closest && savedLink.closest("[contenteditable='true']");
    if (host) host.dispatchEvent(new Event("input", { bubbles: true }));
  }
  function refFromSelection() {
    var sel = window.getSelection();
    if (!sel || !sel.rangeCount) return null;
    var node = sel.anchorNode;
    var el = node && node.nodeType === 1 ? node : node && node.parentNode;
    if (el && el.closest) return el.closest("a.ref");
    return null;
  }
  function bumpHost(el) {
    var host = el && el.closest && el.closest("[contenteditable='true']");
    if (host) host.dispatchEvent(new Event("input", { bubbles: true }));
  }
  function unwrapRef(a) {
    if (!a || !a.parentNode) return;
    var host = a.closest && a.closest("[contenteditable='true']");
    while (a.firstChild) a.parentNode.insertBefore(a.firstChild, a);
    a.remove();
    if (host) host.dispatchEvent(new Event("input", { bubbles: true }));
  }
  function wrapCurrentSelection(ref) {
    var existing = refFromSelection();
    if (existing) {
      savedLink = existing;
      return existing;
    }
    var sel = window.getSelection();
    if (!sel || !sel.rangeCount || sel.isCollapsed) return savedLink || null;
    var range = sel.getRangeAt(0);
    var a = document.createElement("a");
    a.className = "ref";
    a.href = "#ref";
    a.setAttribute("data-ref", ref.label);
    try {
      range.surroundContents(a);
    } catch (e) {
      a.appendChild(range.extractContents());
      range.insertNode(a);
    }
    savedLink = a;
    bumpHost(a);
    return a;
  }
  function wrapNode(node, ref) {
    if (!node || !node.parentNode || !ref) return null;
    var a = document.createElement("a");
    a.className = "ref";
    a.href = "#ref";
    a.setAttribute("data-ref", ref.label);
    node.parentNode.insertBefore(a, node);
    a.appendChild(node);
    savedLink = a;
    bumpHost(a);
    return a;
  }
  var refMenu;
  function ensureRefStyle() {
    if (document.getElementById("ew-ref-style")) return;
    var s = document.createElement("style");
    s.id = "ew-ref-style";
    s.textContent =
      "a.ref,.col a.ref,.col-text a.ref,.para a.ref{color:var(--title,#005eb8)!important;font-weight:700;text-decoration:underline;text-underline-offset:0.15em;cursor:pointer}" +
      "#ew-ref-menu{position:fixed;z-index:120;min-width:7.2rem;background:#fff;border:1px solid #c5d0d4;box-shadow:0 8px 22px rgba(0,0,0,.16);padding:0.15rem 0 0.2rem}" +
      "#ew-ref-menu[hidden]{display:none!important}" +
      "#ew-ref-menu .ew-ref-title{padding:0.3rem 0.75rem 0.15rem;font:800 0.82rem Arial,Helvetica,sans-serif;color:#1f6f78}" +
      "#ew-ref-menu button{display:block;width:100%;text-align:left;border:0;background:none;padding:0.35rem 0.75rem;font:700 0.88rem Arial,Helvetica,sans-serif;color:#1b3a4b;cursor:pointer}" +
      "#ew-ref-menu button:hover{background:#eef3f4}" +
      ".fn{font-size:.7em;font-weight:700;line-height:0;vertical-align:baseline;position:relative;top:-.45em}" +
      "a.ref .fn{text-decoration:none}";
    document.head.appendChild(s);
  }
  function hideRefMenu() {
    if (refMenu) refMenu.hidden = true;
  }
  function selectedText() {
    var sel = window.getSelection();
    if (!sel || sel.isCollapsed) return "";
    return String(sel.toString() || "").replace(/\s+/g, " ").trim();
  }
  function hitFromEvent(ev) {
    var t = ev.target && ev.target.nodeType === 1 ? ev.target : ev.target && ev.target.parentNode;
    if (!t || !t.closest) return null;
    var a = t.closest("a.ref");
    if (a) return { a: a, text: a.getAttribute("data-ref") || a.textContent, node: null };
    var sel = selectedText();
    if (sel) return { a: refFromSelection(), text: sel, node: null };
    var n = t;
    while (n && n !== document.body) {
      if (n.nodeType === 1) {
        var txt = String(n.innerText || "").replace(/\s+/g, " ").trim();
        if (txt && txt.length < 48 && parseChapter(txt)) return { a: null, text: txt, node: n };
        if (n.classList && n.classList.contains("bit")) break;
      }
      n = n.parentNode;
    }
    return null;
  }
  function ensureRefMenu() {
    ensureRefStyle();
    if (refMenu) return refMenu;
    refMenu = document.createElement("div");
    refMenu.id = "ew-ref-menu";
    refMenu.hidden = true;
    refMenu.innerHTML =
      '<div class="ew-ref-title">Popups</div>' +
      '<button type="button" data-act="new">New</button>' +
      '<button type="button" data-act="edit">Edit</button>' +
      '<button type="button" data-act="remove">Remove</button>' +
      '<button type="button" data-act="footnote">Foot note</button>';
    document.body.appendChild(refMenu);
    refMenu.addEventListener("click", function (ev) {
      var btn = ev.target.closest && ev.target.closest("[data-act]");
      if (!btn) return;
      ev.preventDefault();
      ev.stopPropagation();
      var act = btn.getAttribute("data-act");
      var hit = refMenu._hit;
      hideRefMenu();
      if (!hit) return;
      if (act === "remove" && hit.a) {
        unwrapRef(hit.a);
        return;
      }
      if (act === "edit" && hit.a) {
        var er = parseChapter(hit.a.getAttribute("data-ref") || hit.a.textContent);
        if (!er) return;
        ensureBox();
        currentRef = er;
        currentRef.label = er.vs1 ? refLabel(er) : er.label;
        savedLink = hit.a;
        lookupThenShow();
        return;
      }
      if (act === "new") {
        var nr = parseChapter(hit.text);
        if (!nr) return;
        if (selectedText()) wrapCurrentSelection(nr);
        else if (hit.node) wrapNode(hit.node, nr);
        ensureBox();
        currentRef = nr;
        currentRef.label = nr.vs1 ? refLabel(nr) : nr.label;
        lookupThenShow();
        return;
      }
      if (act === "footnote") applyFootnote(hit);
    });
    document.addEventListener("click", hideRefMenu);
    document.addEventListener("scroll", hideRefMenu, true);
    return refMenu;
  }
  function selectedNumber() {
    var s = selectedText();
    return /^\d{1,4}$/.test(s) ? s : "";
  }
  function nextFootnoteNumber(scope) {
    var max = 0;
    var root = scope || document;
    var list = root.querySelectorAll(".fn, sup");
    for (var i = 0; i < list.length; i++) {
      var n = parseInt(String(list[i].textContent || "").trim(), 10);
      if (n > max) max = n;
    }
    return max + 1;
  }
  function wrapSelectionInSup() {
    var sel = window.getSelection();
    if (!sel || !sel.rangeCount || sel.isCollapsed) return null;
    var range = sel.getRangeAt(0);
    var sup = document.createElement("span");
    sup.className = "fn";
    try {
      range.surroundContents(sup);
    } catch (e) {
      sup.appendChild(range.extractContents());
      range.insertNode(sup);
    }
    bumpHost(sup);
    return sup;
  }
  function prependFootnote(a, num) {
    if (!a) return;
    var host = a.closest && a.closest("[contenteditable='true']");
    var n = String(num || nextFootnoteNumber(host || document));
    var first = a.firstChild;
    while (first && first.nodeType === 3 && !String(first.nodeValue || "").trim()) first = first.nextSibling;
    if (first && first.nodeType === 1 && (first.classList.contains("fn") || first.tagName === "SUP")) {
      first.className = "fn";
      first.textContent = n;
      bumpHost(a);
      return;
    }
    var sup = document.createElement("span");
    sup.className = "fn";
    sup.textContent = n;
    a.insertBefore(sup, a.firstChild);
    bumpHost(a);
  }
  function applyFootnote(hit) {
    var num = selectedNumber();
    if (num) {
      wrapSelectionInSup();
      return;
    }
    if (hit && hit.a) prependFootnote(hit.a);
  }
  function showRefMenu(ev, hit) {
    var menu = ensureRefMenu();
    var hasLink = !!(hit && hit.a);
    var canNew = !hasLink && !!(hit && hit.text && parseChapter(hit.text));
    var num = selectedNumber();
    var canNote = hasLink || !!num;
    menu.querySelector('[data-act="new"]').hidden = !canNew;
    menu.querySelector('[data-act="edit"]').hidden = !hasLink;
    menu.querySelector('[data-act="remove"]').hidden = !hasLink;
    menu.querySelector('[data-act="footnote"]').hidden = !canNote;
    if (!canNew && !hasLink && !num) return false;
    menu._hit = hit;
    menu.hidden = false;
    var x = ev.clientX || 0;
    var y = ev.clientY || 0;
    menu.style.left = Math.min(x, window.innerWidth - 160) + "px";
    menu.style.top = Math.min(y, window.innerHeight - 180) + "px";
    return true;
  }
  function ensureBox() {
    if (box) return box;
    box = document.createElement("div");
    box.id = "ew-verse";
    box.hidden = true;
    box.innerHTML =
      '<div class="ew-verse-card">' +
      '<div class="ew-verse-bar">' +
      '<div class="ew-verse-bar-left">' +
      '<strong class="ew-verse-ref"></strong>' +
      '<button type="button" class="ew-chapter-btn">Show Chapter</button>' +
      "</div>" +
      '<div class="ew-verse-bar-right">' +
      '<button type="button" class="ew-revert" hidden>Revert</button>' +
      '<button type="button" class="ew-save" hidden>Save</button>' +
      '<button type="button" class="ew-save-close" hidden>Save and Close</button>' +
      '<button type="button" class="ew-verse-x">Close</button>' +
      "</div>" +
      "</div>" +
      '<div class="ew-verse-body"></div>' +
      '<div class="ew-verse-tools">' +
      '<button type="button" class="ew-pref-btn">Preferred Version</button>' +
      '<div class="ew-tr-pick" hidden>' +
      '<button type="button" class="ew-tr-now" aria-haspopup="listbox" aria-expanded="false" aria-label="Preferred version"></button>' +
      '<div class="ew-tr-list" role="listbox" hidden></div>' +
      "</div>" +
      "</div>" +
      '<div class="ew-verse-alt-wrap" hidden>' +
      '<div class="ew-verse-alt"></div>' +
      "</div>" +
      "</div>";
    document.body.appendChild(box);
    chBox = document.createElement("div");
    chBox.id = "ew-chapter";
    chBox.hidden = true;
    chBox.innerHTML =
      '<div class="ew-chapter-card">' +
      '<div class="ew-verse-bar">' +
      '<div class="ew-verse-bar-left">' +
      '<button type="button" class="ew-ch-prev">Prev</button>' +
      '<strong class="ew-chapter-title"></strong>' +
      '<button type="button" class="ew-ch-next">Next</button>' +
      "</div>" +
      '<div class="ew-verse-bar-right">' +
      '<button type="button" class="ew-ch-nkjv">NKJV</button>' +
      '<div class="ew-tr-pick ew-ch-tr">' +
      '<button type="button" class="ew-tr-now" aria-haspopup="listbox" aria-expanded="false" aria-label="Chapter version"></button>' +
      '<div class="ew-tr-list" role="listbox" hidden></div>' +
      "</div>" +
      '<button type="button" class="ew-chapter-x">Close</button>' +
      "</div>" +
      "</div>" +
      '<button type="button" class="ew-ch-pick">Change the popup verses</button>' +
      '<div class="ew-chapter-list"></div>' +
      "</div>";
    document.body.appendChild(chBox);
    title = box.querySelector(".ew-verse-ref");
    body = box.querySelector(".ew-verse-body");
    alt = box.querySelector(".ew-verse-alt");
    altWrap = box.querySelector(".ew-verse-alt-wrap");
    saveBtn = box.querySelector(".ew-save");
    saveCloseBtn = box.querySelector(".ew-save-close");
    revertBtn = box.querySelector(".ew-revert");
    cancelBtn = box.querySelector(".ew-verse-x");
    chapterBtn = box.querySelector(".ew-chapter-btn");
    prefBtn = box.querySelector(".ew-pref-btn");
    chList = chBox.querySelector(".ew-chapter-list");
    chTitle = chBox.querySelector(".ew-chapter-title");
    chHint = chBox.querySelector(".ew-chapter-hint");
    chPickBtn = chBox.querySelector(".ew-ch-pick");
    chPrev = chBox.querySelector(".ew-ch-prev");
    chNext = chBox.querySelector(".ew-ch-next");
    select = box.querySelector(".ew-tr-pick");
    trNow = box.querySelector(".ew-tr-now");
    trList = box.querySelector(".ew-tr-list");
    fillTrList(trList);
    trNow.addEventListener("click", function (ev) {
      ev.stopPropagation();
      var open = trList.hidden;
      closeTrLists();
      if (open) {
        trList.hidden = false;
        trNow.setAttribute("aria-expanded", "true");
      }
    });
    trList.addEventListener("click", function (ev) {
      ev.stopPropagation();
      var row = ev.target.closest && ev.target.closest("[data-tr]");
      if (!row) return;
      setChosen(row.getAttribute("data-tr"));
      closeTrLists();
      paintTrPick();
      paintPreferred();
      if (chBox && !chBox.hidden) {
        chView = currentTr();
        loadChapter();
      }
    });
    chNkjv = chBox.querySelector(".ew-ch-nkjv");
    chTrPick = chBox.querySelector(".ew-ch-tr");
    chTrNow = chTrPick.querySelector(".ew-tr-now");
    chTrList = chTrPick.querySelector(".ew-tr-list");
    fillTrList(chTrList);
    chNkjv.addEventListener("click", function () {
      closeTrLists();
      chView = "NKJV";
      loadChapter();
    });
    chTrNow.addEventListener("click", function (ev) {
      ev.stopPropagation();
      var open = chTrList.hidden;
      closeTrLists();
      if (open) {
        chTrList.hidden = false;
        chTrNow.setAttribute("aria-expanded", "true");
      }
    });
    chTrList.addEventListener("click", function (ev) {
      ev.stopPropagation();
      var row = ev.target.closest && ev.target.closest("[data-tr]");
      if (!row) return;
      setChosen(row.getAttribute("data-tr"));
      chView = currentTr();
      closeTrLists();
      paintTrPick();
      loadChapter();
      if (prefOn()) paintPreferred();
    });
    box.addEventListener("click", closeTrLists);
    chBox.addEventListener("click", closeTrLists);
    paintTrPick();
    saveBtn.addEventListener("click", function (ev) {
      ev.stopPropagation();
      saveCurrent();
    });
    if (saveCloseBtn) {
      saveCloseBtn.addEventListener("click", function (ev) {
        ev.stopPropagation();
        saveCurrent(true);
      });
    }
    if (revertBtn) {
      revertBtn.addEventListener("click", function (ev) {
        ev.stopPropagation();
        revertSaved();
      });
    }
    cancelBtn.addEventListener("click", hide);
    chapterBtn.addEventListener("click", function () {
      openChapter();
    });
    prefBtn.addEventListener("click", function () {
      setPrefOn(!prefOn());
      syncPref();
    });
    function noteEdit() {
      if (!canEditVerses()) return;
      if ((body.innerHTML || "") !== snapshot) markDirty();
      else {
        dirty = false;
        syncChrome();
      }
    }
    body.addEventListener("input", noteEdit);
    body.addEventListener("keyup", noteEdit);
    body.addEventListener("paste", function () {
      setTimeout(noteEdit, 0);
    });
    if (chPickBtn) {
      chPickBtn.addEventListener("click", function (ev) {
        ev.stopPropagation();
        if (!canEditVerses()) return;
        chPick = !chPick;
        if (chPick) {
          chStart = 0;
          chEnd = 0;
          paintChapterRows();
        }
        syncPickBtn();
      });
    }
    if (chPrev) chPrev.addEventListener("click", function (ev) {
      ev.stopPropagation();
      shiftChapter(-1);
    });
    if (chNext) chNext.addEventListener("click", function (ev) {
      ev.stopPropagation();
      shiftChapter(1);
    });
    chBox.querySelector(".ew-chapter-x").addEventListener("click", hideChapter);
    document.addEventListener("keydown", function (ev) {
      if (ev.key !== "Escape") return;
      if (dirty) return;
      if (chBox && !chBox.hidden) hideChapter();
      else if (box && !box.hidden) hide();
    });
    document.addEventListener("mousedown", function (ev) {
      if (!box || box.hidden) return;
      if (dirty) return;
      var t = ev.target;
      if (t.closest && t.closest("#ew-verse, #ew-chapter, a.ref, #ew-pick, #ew-ref-menu")) return;
      hide();
    });
    return box;
  }
  function hideChapter() {
    closeTrLists();
    chPick = false;
    syncPickBtn();
    if (chBox) chBox.hidden = true;
  }
  function hide() {
    hideChapter();
    closeTrLists();
    if (box) box.hidden = true;
    currentRef = null;
    nkjvHtml = "";
    savedLink = null;
    inFile = false;
    dirty = false;
    snapshot = "";
    savedCopy = "";
    chStart = 0;
    chEnd = 0;
  }
  function markClean() {
    dirty = false;
    snapshot = body ? body.innerHTML : "";
    syncChrome();
  }
  function markDirty() {
    if (!canEditVerses()) return;
    dirty = true;
    syncChrome();
  }
  function syncChrome() {
    var edit = canEditVerses();
    if (chapterBtn) chapterBtn.hidden = false;
    if (chHint) chHint.hidden = true;
    syncPickBtn();
    if (body) body.contentEditable = edit ? "true" : "false";
    if (!cancelBtn) return;
    if (saveBtn) {
      saveBtn.hidden = !edit;
      saveBtn.disabled = !edit || !dirty;
      saveBtn.textContent = "Save";
    }
    if (saveCloseBtn) {
      saveCloseBtn.hidden = !edit;
      saveCloseBtn.disabled = !edit || !dirty;
    }
    if (revertBtn) {
      revertBtn.hidden = !edit;
      revertBtn.disabled = !edit || !dirty || !savedCopy;
    }
    cancelBtn.hidden = false;
    cancelBtn.textContent = edit && dirty ? "Cancel" : "Close";
    cancelBtn.disabled = false;
    syncPref();
  }
  function syncTools() {
    syncChrome();
  }
  function currentTr() {
    var id = chosen();
    return id === "NKJV" ? "ESV" : id;
  }
  function paintTrPick() {
    var cur = currentTr();
    if (trNow) trNow.textContent = trShort(cur);
    if (trList) {
      Array.prototype.forEach.call(trList.querySelectorAll("[data-tr]"), function (row) {
        row.classList.toggle("on", row.getAttribute("data-tr") === cur);
      });
    }
    if (chTrNow) chTrNow.textContent = trShort(cur);
    if (chTrList) {
      Array.prototype.forEach.call(chTrList.querySelectorAll("[data-tr]"), function (row) {
        row.classList.toggle("on", row.getAttribute("data-tr") === cur && chView !== "NKJV");
      });
    }
    if (chNkjv) chNkjv.classList.toggle("on", chView === "NKJV");
    if (chTrPick) chTrPick.classList.toggle("on", chView !== "NKJV");
  }
  function syncPref() {
    var on = prefOn();
    prefBtn.classList.toggle("on", on);
    prefBtn.setAttribute("aria-pressed", on ? "true" : "false");
    prefBtn.textContent = "Preferred Version";
    if (select) select.hidden = !on;
    altWrap.hidden = !on;
    paintTrPick();
    if (on) paintPreferred();
    else alt.textContent = "";
  }
  function paintPreferred() {
    if (!alt || !currentRef || !currentRef.vs1 || !prefOn()) return;
    var tr = currentTr();
    paintTrPick();
    alt.textContent = "Opening " + tr + "…";
    loadPassage(currentRef, tr)
      .then(function (verses) {
        if (!verses.length) {
          alt.textContent = "That passage was not found in " + tr + ".";
          return;
        }
        var nkjvMap = verseMapFromHtml(nkjvHtml || (body && body.innerHTML) || "");
        alt.innerHTML = verses
          .map(function (v) {
            var inner = shapeLike(nkjvMap[v.vs] || "", v.text);
            return "<p><sup>" + v.vs + "</sup> " + inner + "</p>";
          })
          .join("");
        paintChapterRows();
      })
      .catch(function () {
        alt.textContent = "Could not open " + tr + " just now.";
      });
  }
  function markHitPassages() {
    paintChapterRows();
  }
  function refHitRange() {
    if (!currentRef || !currentRef.vs1) return null;
    var a = Number(currentRef.vs1);
    var b = Number(currentRef.vs2 || currentRef.vs1);
    if (b < a) {
      var t = a;
      a = b;
      b = t;
    }
    return { a: a, b: b };
  }
  function paintChapterRows() {
    if (!chList) return;
    var a = chStart;
    var b = chEnd || chStart;
    if (b && a && b < a) {
      var t = a;
      a = b;
      b = t;
    }
    var hit = refHitRange();
    var same =
      !!(chBrowse && currentRef && currentRef.book === chBrowse.book && Number(currentRef.ch1) === Number(chBrowse.ch));
    Array.prototype.forEach.call(chList.querySelectorAll(".ew-ch-row"), function (row) {
      var n = Number(row.getAttribute("data-vs"));
      row.classList.remove("on", "mid", "hit");
      if (same && hit && n >= hit.a && n <= hit.b) row.classList.add("hit");
      if (n === chStart || n === chEnd) row.classList.add("on");
      else if (a && b && n > a && n < b) row.classList.add("mid");
    });
  }
  function syncPickBtn() {
    if (!chPickBtn) return;
    chPickBtn.hidden = !canEditVerses();
    chPickBtn.classList.toggle("on", chPick);
    if (!chPick) chPickBtn.textContent = "Change the popup verses";
    else if (chStart && !chEnd) chPickBtn.textContent = "Now click the last verse.";
    else chPickBtn.textContent = "Click the first verse, then the last";
  }
  function bookByNum(n) {
    var i;
    for (i = 0; i < BOOKS.length; i++) {
      if (BOOKS[i][1] === n) return BOOKS[i];
    }
    return null;
  }
  function chCount(book) {
    return CHAPS[book] || 1;
  }
  function syncChNav() {
    if (!chBrowse) return;
    if (chPrev) chPrev.hidden = chBrowse.book <= 1 && chBrowse.ch <= 1;
    if (chNext) chNext.hidden = chBrowse.book >= 66 && chBrowse.ch >= chCount(66);
  }
  function shiftChapter(dir) {
    if (!chBrowse) return;
    var book = chBrowse.book;
    var ch = chBrowse.ch + dir;
    var max = chCount(book);
    if (ch < 1) {
      if (book <= 1) return;
      book -= 1;
      ch = chCount(book);
    } else if (ch > max) {
      if (book >= 66) return;
      book += 1;
      ch = 1;
    }
    var b = bookByNum(book);
    if (!b) return;
    chBrowse = { book: book, name: b[0], ch: ch };
    loadChapter();
  }
  function onChapterClick(ev) {
    if (!canEditVerses() || !chPick) return;
    var row = ev.currentTarget;
    var n = Number(row.getAttribute("data-vs"));
    if (!chStart || chEnd) {
      chStart = n;
      chEnd = 0;
      paintChapterRows();
      syncPickBtn();
      return;
    }
    chEnd = n;
    if (chBrowse) {
      currentRef.book = chBrowse.book;
      currentRef.name = chBrowse.name;
      currentRef.ch1 = chBrowse.ch;
      currentRef.ch2 = chBrowse.ch;
    }
    paintChapterRows();
    setRefRange(chStart, chEnd);
    chPick = false;
    syncPickBtn();
    fillFromChapter();
  }
  function openChapter() {
    if (!currentRef) return;
    ensureBox();
    chView = "NKJV";
    chPick = false;
    chBrowse = { book: currentRef.book, name: currentRef.name, ch: currentRef.ch1 };
    chStart = currentRef.vs1 || 0;
    chEnd = currentRef.vs2 || currentRef.vs1 || 0;
    chBox.hidden = false;
    syncPickBtn();
    loadChapter();
  }
  function loadChapter() {
    if (!chBrowse || !chList) return;
    var tr = chView === "NKJV" ? "NKJV" : currentTr();
    setAbbrTitle(chTitle, chBrowse.name + " " + chBrowse.ch, tr);
    syncChNav();
    paintTrPick();
    chList.textContent = "Opening…";
    fetchChapter(tr, chBrowse.book, chBrowse.ch)
      .then(function (rows) {
        chRows = rows || [];
        chList.innerHTML = "";
        if (!chRows.length) {
          chList.textContent = "Could not open that chapter.";
          return;
        }
        chRows.forEach(function (row) {
          var btn = document.createElement("button");
          btn.type = "button";
          btn.className = "ew-ch-row";
          btn.setAttribute("data-vs", String(row.verse));
          btn.innerHTML = "<sup>" + row.verse + "</sup> " + cleanVerse(row.text).replace(/</g, "&lt;");
          btn.addEventListener("click", onChapterClick);
          chList.appendChild(btn);
        });
        paintChapterRows();
        scrollHitToMiddle();
      })
      .catch(function () {
        chList.textContent = "Could not open that chapter.";
      });
  }
  function scrollHitToMiddle() {
    if (!chList) return;
    requestAnimationFrame(function () {
      var hits = chList.querySelectorAll(".ew-ch-row.hit");
      if (!hits.length) return;
      var first = hits[0].getBoundingClientRect();
      var last = hits[hits.length - 1].getBoundingClientRect();
      var list = chList.getBoundingClientRect();
      var mid = (first.top + last.bottom) / 2;
      var centre = list.top + list.height / 2;
      chList.scrollTop += mid - centre;
    });
  }
  function showPopup() {
    ensureBox();
    box.hidden = false;
    setAbbrTitle(
      title,
      currentRef && currentRef.vs1 ? currentRef.label : currentRef.name + " " + currentRef.ch1,
      "NKJV"
    );
    syncTools();
    syncPref();
  }
  function fillFromChapter() {
    if (!currentRef || !currentRef.vs1) return;
    var kept = verseMapFromHtml(body ? body.innerHTML : "");
    showPopup();
    Promise.all([
      fetchStored(currentRef.label).catch(function () {
        return null;
      }),
      loadPassage(currentRef, "NKJV"),
    ])
      .then(function (pair) {
        var stored = pair[0];
        var verses = pair[1] || [];
        if (stored && stored.text) {
          var fromStore = verseMapFromHtml(storedHtml(stored.text));
          Object.keys(fromStore).forEach(function (k) {
            if (!kept[k]) kept[k] = fromStore[k];
          });
        }
        addMissingVerses(kept, verses);
        var html = htmlFromVerseMap(kept, currentRef.vs1, vs2Safe(currentRef));
        if (!html) {
          body.textContent = "Those verses were not found.";
          nkjvHtml = "";
          return;
        }
        nkjvHtml = html;
        inFile = !!(stored && stored.found);
        body.innerHTML = nkjvHtml;
        savedCopy = nkjvHtml;
        markHitPassages();
        markDirty();
      })
      .catch(function () {
        body.textContent = "Could not open the NKJV.";
      });
  }
  function waitForVerses() {
    showPopup();
    body.textContent = "Use Show Chapter to choose the passage.";
    nkjvHtml = "";
    markClean();
  }
  function lookupThenShow() {
    ensureBox();
    if (!currentRef.vs1) {
      waitForVerses();
      return;
    }
    nkjvHtml = "";
    inFile = false;
    fetchStored(currentRef.label)
      .then(function (d) {
        if (d && d.found && d.text) {
          inFile = true;
          var kept = verseMapFromHtml(storedHtml(d.text));
          showPopup();
          if (d.missing && d.missing.length) {
            return loadPassage(currentRef, "NKJV").then(function (verses) {
              addMissingVerses(kept, verses);
              nkjvHtml = htmlFromVerseMap(kept, currentRef.vs1, vs2Safe(currentRef)) || storedHtml(d.text);
              body.innerHTML = nkjvHtml;
              savedCopy = nkjvHtml;
              markHitPassages();
              markClean();
            });
          }
          nkjvHtml = htmlFromVerseMap(kept, currentRef.vs1, vs2Safe(currentRef)) || storedHtml(d.text);
          body.innerHTML = nkjvHtml;
          savedCopy = nkjvHtml;
          markHitPassages();
          markClean();
          return;
        }
        if (canEditVerses()) {
          waitForVerses();
          return;
        }
        showPopup();
        return loadPassage(currentRef, "NKJV").then(function (verses) {
          var kept = {};
          addMissingVerses(kept, verses);
          nkjvHtml = htmlFromVerseMap(kept, currentRef.vs1, vs2Safe(currentRef));
          if (!nkjvHtml) {
            body.textContent = "That passage is not in the scriptures file yet.";
            markClean();
            return;
          }
          body.innerHTML = nkjvHtml;
          savedCopy = nkjvHtml;
          markHitPassages();
          markClean();
        });
      })
      .catch(function () {
        if (canEditVerses()) waitForVerses();
        else {
          showPopup();
          return loadPassage(currentRef, "NKJV")
            .then(function (verses) {
              var kept = {};
              addMissingVerses(kept, verses);
              nkjvHtml = htmlFromVerseMap(kept, currentRef.vs1, vs2Safe(currentRef));
              if (!nkjvHtml) {
                body.textContent = "Could not open the NKJV.";
                markClean();
                return;
              }
              body.innerHTML = nkjvHtml;
              savedCopy = nkjvHtml;
              markHitPassages();
              markClean();
            })
            .catch(function () {
              body.textContent = "Could not open the NKJV.";
              markClean();
            });
        }
      });
  }
  function bodyHtml() {
    return body ? body.innerHTML : "";
  }
  function htmlToSave() {
    var html = bodyHtml();
    var map = verseMapFromHtml(html);
    if (currentRef && currentRef.vs1 && Object.keys(map).length) {
      html = htmlFromVerseMap(map, currentRef.vs1, vs2Safe(currentRef)) || html;
    }
    return html;
  }
  function revertSaved() {
    if (!savedCopy || !body) return;
    body.innerHTML = savedCopy;
    nkjvHtml = savedCopy;
    markClean();
  }
  function saveCurrent(andClose) {
    if (!currentRef || location.port !== "8767") return;
    var html = htmlToSave();
    if (!html) return;
    if (saveBtn) saveBtn.disabled = true;
    if (saveCloseBtn) saveCloseBtn.disabled = true;
    fetch("/scriptures", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ reference: currentRef.label, text: html, folder: window.ewFolder || "" }),
    })
      .then(function (r) {
        return r.json().then(function (d) {
          return { r: r, d: d };
        });
      })
      .then(function (out) {
        if (saveBtn) saveBtn.disabled = false;
        if (saveCloseBtn) saveCloseBtn.disabled = false;
        if (out.r.ok) {
          inFile = true;
          nkjvHtml = html;
          if (body && body.innerHTML !== html) body.innerHTML = html;
          savedCopy = html;
          markClean();
          if (andClose) hide();
        }
      })
      .catch(function () {
        if (saveBtn) saveBtn.disabled = false;
        if (saveCloseBtn) saveCloseBtn.disabled = false;
      });
  }
  function openFromText(raw, wrap) {
    var ref = parseChapter(raw);
    if (!ref) return false;
    ensureBox();
    currentRef = ref;
    currentRef.label = ref.vs1 ? refLabel(ref) : ref.label;
    savedLink = null;
    if (wrap) wrapCurrentSelection(ref);
    lookupThenShow();
    return true;
  }

  ensureRefStyle();
  document.addEventListener("click", function (ev) {
    var a = ev.target.closest && ev.target.closest("a.ref");
    if (!a) return;
    if (a.closest && a.closest("#ew-verse, #ew-chapter, #ew-ref-menu")) return;
    ev.preventDefault();
    ev.stopPropagation();
    var ref = parseChapter(a.getAttribute("data-ref") || a.textContent);
    if (!ref) return;
    ensureBox();
    currentRef = ref;
    currentRef.label = ref.vs1 ? refLabel(ref) : ref.label;
    savedLink = a;
    lookupThenShow();
  });
  document.addEventListener("contextmenu", function (ev) {
    if (!canEditVerses()) return;
    if (ev.target.closest && ev.target.closest("#ew-verse, #ew-chapter, #ew-ref-menu")) return;
    var hit = hitFromEvent(ev);
    if (!hit) return;
    if (showRefMenu(ev, hit)) ev.preventDefault();
  });
  var pressTimer;
  document.addEventListener(
    "touchstart",
    function (ev) {
      if (!canEditVerses()) return;
      var t = ev.touches && ev.touches[0];
      if (!t) return;
      var target = document.elementFromPoint(t.clientX, t.clientY);
      pressTimer = setTimeout(function () {
        var hit = hitFromEvent({ target: target, clientX: t.clientX, clientY: t.clientY });
        if (hit) showRefMenu({ clientX: t.clientX, clientY: t.clientY, target: target }, hit);
      }, 550);
    },
    { passive: true }
  );
  document.addEventListener("touchend", function () {
    clearTimeout(pressTimer);
  });
  document.addEventListener("touchmove", function () {
    clearTimeout(pressTimer);
  });

  window.ewOpenPopup = function (raw) {
    return openFromText(raw, true);
  };
  window.ewTogglePopup = function (raw) {
    var existing = refFromSelection();
    if (existing) {
      unwrapRef(existing);
      return { ok: true, removed: true };
    }
    if (!raw) return { ok: false };
    return { ok: openFromText(raw, true), removed: false };
  };
  window.ewParseRef = parseChapter;
  window.ewPopupAtSelection = function () {
    return !!refFromSelection();
  };
})();
