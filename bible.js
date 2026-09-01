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
    if (location.port === "8766" || location.port === "8767") {
      return _ewFetch.apply(this, arguments);
    }
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
    ["1Es", 67, ["1 esdras", "1esdras", "1esd", "1 esd", "1 es"], 9],
    ["Tob", 68, ["tobit", "tob"], 14],
    ["Jdt", 69, ["judith", "jdt"], 16],
    ["Wis", 70, ["wisdom of solomon", "wisdom", "wis", "wisd"], 19],
    ["Sir", 71, ["ecclesiasticus", "sirach", "ecclus", "sir"], 51],
    ["Lje", 72, ["letter of jeremiah", "epistle of jeremiah", "lje", "epjer"], 1],
    ["Bar", 73, ["baruch", "bar"], 5],
    ["1Ma", 74, ["1 maccabees", "1maccabees", "1 macc", "1macc", "1 mac", "1mac", "1ma"], 16],
    ["2Ma", 75, ["2 maccabees", "2maccabees", "2 macc", "2macc", "2 mac", "2mac", "2ma"], 15],
    ["Man", 76, ["prayer of manasseh", "pr manasseh", "manasseh", "prman"], 1],
    ["2Es", 77, ["2 esdras", "2esdras", "2esd", "2 esd", "2 es", "4 ezra"], 16],
    ["Sus", 78, ["susanna", "sus"], 1],
    ["Bel", 79, ["bel and the dragon", "bel and dragon", "bel"], 1],
    ["Aza", 88, ["prayer of azariah", "song of the three", "azariah", "aza"], 1],
    ["Jub", 90, ["jubilees", "jubilee", "jub"], 50],
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
    if (window.ewFolder) {
      urls.push("/sites/" + encodeURIComponent(window.ewFolder) + "/scriptures.json");
    }
    try {
      urls.push(new URL("scriptures.json", location.href).href);
    } catch (e) {}
    urls.push("scriptures.json");
    if (!window.ewFolder) urls.push("/scriptures.json");
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
  function rememberSaved(ref, html) {
    if (!scripturesFile || !Array.isArray(scripturesFile.verses)) {
      scripturesFile = { verses: [] };
    }
    var want = scriptureKey(ref);
    var list = scripturesFile.verses;
    var i;
    for (i = 0; i < list.length; i++) {
      if (scriptureKey(list[i].reference) === want) {
        list[i].reference = ref;
        list[i].text = html;
        list[i].source = "edited";
        return;
      }
    }
    list.push({ reference: ref, text: html, source: "edited" });
  }
  function fetchStored(ref) {
    if (hasLocalApi()) {
      var q = "/scriptures?ref=" + encodeURIComponent(ref);
      if (window.ewFolder) q += "&folder=" + encodeURIComponent(window.ewFolder);
      return fetch(q)
        .then(function (r) {
          if (!r.ok) throw new Error("no api");
          return r.json();
        })
        .then(function (api) {
          if (api && api.found && api.text) {
            rememberSaved(api.reference || ref, api.text);
            return api;
          }
          return findStored(ref);
        })
        .catch(function () {
          return findStored(ref);
        });
    }
    return findStored(ref);
  }
  function sanitizeVerseInner(html) {
    var s = String(html || "");
    var n = 0;
    while (n < 3 && /&lt;\s*\/?\s*(div|span)\b/i.test(s)) {
      s = s.replace(/&lt;/gi, "<").replace(/&gt;/gi, ">");
      n++;
    }
    s = s.replace(/<\s*\/?\s*div\b[^>]*>/gi, " ");
    s = s.replace(/<\s*span\b(?![^>]*\bfn\b)[^>]*>/gi, "");
    s = s.replace(/<\s*\/\s*span\s*>/gi, function () {
      return "";
    });
    s = s.replace(/\s*style\s*=\s*("[^"]*"|'[^']*')/gi, "");
    s = s.replace(/font-size\s*:\s*calc\([^)]*\)/gi, "");
    return s.replace(/[ \t]+/g, " ").replace(/\s*<br>\s*/gi, "<br>").trim();
  }
  function storedHtml(text) {
    return sanitizeVerseInner(
      String(text || "")
        .replace(/&amp;nbsp;/gi, " ")
        .replace(/&nbsp;/gi, " ")
        .replace(/&#160;|&#x0*a0;/gi, " ")
        .replace(/\u00a0/g, " ")
        .replace(/\n/g, "<br>")
    );
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
  function nkjvYahweh(text) {
    var s = String(text || "");
    s = s.replace(/[Tt]he\s+LORD(?:'S|'s|\u2019s)\b/g, "Yahweh's");
    s = s.replace(/[Tt]he\s+GOD(?:'S|'s|\u2019s)\b/g, "Yahweh's");
    s = s.replace(/[Tt]he\s+LORD\b/g, "Yahweh");
    s = s.replace(/[Tt]he\s+GOD\b/g, "Yahweh");
    s = s.replace(/LORD(?:'S|'s|\u2019s)\b/g, "Yahweh's");
    s = s.replace(/GOD(?:'S|'s|\u2019s)\b/g, "Yahweh's");
    s = s.replace(/\bLORD\b/g, "Yahweh");
    s = s.replace(/\bGOD\b/g, "Yahweh");
    s = s.replace(/\b[Tt]he Yahweh's\b/g, "Yahweh's");
    s = s.replace(/\b[Tt]he Yahweh\b/g, "Yahweh");
    return s;
  }
  function cleanVerse(html, tr) {
    var t = String(html || "")
      .replace(/<S\b[^>]*>[\s\S]*?<\/S>/gi, "")
      .replace(/<\/?S\b[^>]*>/gi, "")
      .replace(/\{(?:H|G)?\d+\}/gi, "")
      .replace(/<[^>]+>/g, "")
      .replace(/&nbsp;/g, " ")
      .replace(/\s+/g, " ")
      .trim();
    if (tr === "NKJV") t = nkjvYahweh(t);
    return t;
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
    if (before) el.appendChild(document.createTextNode(before));
    if (!id) return;
    el.appendChild(document.createTextNode(" "));
    var mark = document.createElement("span");
    mark.className = "ew-tr-abbr";
    mark.textContent = id;
    mark.title = trHover(id);
    el.appendChild(mark);
  }
  function fetchChapter(tr, book, chapter) {
    function get(slug) {
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
    var slug = slugOf(tr);
    return get(slug).then(function (rows) {
      if (rows && rows.length) return rows;
      if (Number(book) <= 66) return rows || [];
      if (slug !== "KJV") {
        return get("KJV").then(function (rows2) {
          if (rows2 && rows2.length) return rows2;
          return extraBookChapter(book, chapter);
        });
      }
      return extraBookChapter(book, chapter);
    });
  }
  var EXTRA_BOOK_FILES = { 90: "/extra-books/jubilees.json" };
  function extraBookChapter(book, chapter) {
    var href = EXTRA_BOOK_FILES[Number(book)];
    if (!href) return Promise.resolve([]);
    return fetch(href)
      .then(function (r) {
        if (!r.ok) throw new Error("no extra");
        return r.json();
      })
      .then(function (data) {
        var verses = (data && data.chapters && data.chapters[String(chapter)]) || [];
        return verses.map(function (t, i) {
          return { verse: i + 1, text: t };
        });
      })
      .catch(function () {
        return [];
      });
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
          if (v >= from && v <= to) out.push({ ch: ch, vs: v, text: cleanVerse(row.text, tr) });
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
    var leftover = raw.replace(/<p>\s*<sup>\s*(\d+)\s*<\/sup>\s*([\s\S]*?)<\/p>/gi, function (_, n, inner) {
      inner = sanitizeVerseInner(inner);
      if (inner) map[Number(n)] = inner;
      return "";
    });
    leftover = sanitizeVerseInner(leftover);
    if (leftover && Object.keys(map).length) {
      var last = Math.max.apply(null, Object.keys(map).map(Number));
      map[last] = (map[last] ? map[last] + " " : "") + leftover;
    }
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
  function extraBookName(ref) {
    var b = ref && bookByNum(ref.book);
    if (!b) return "";
    var names = {
      "1Es": "1 Esdras",
      Tob: "Tobit",
      Jdt: "Judith",
      Wis: "Wisdom",
      Sir: "Sirach",
      Lje: "the Letter of Jeremiah",
      Bar: "Baruch",
      "1Ma": "1 Maccabees",
      "2Ma": "2 Maccabees",
      Man: "the Prayer of Manasseh",
      "2Es": "2 Esdras",
      Sus: "Susanna",
      Bel: "Bel and the Dragon",
      Aza: "the Prayer of Azariah",
      Jub: "Jubilees",
    };
    return names[b[0]] || b[0];
  }
  function extraWarningHtml(ref) {
    var name = extraBookName(ref);
    return (
      '<p class="ew-extra-note">This book of ' +
      name +
      " is not inspired scripture but shows what people of that time might of believed.</p>"
    );
  }
  function withExtraWarning(html, ref) {
    html = String(html || "");
    html = html.replace(/<p[^>]*class="[^"]*ew-extra-note[^"]*"[^>]*>[\s\S]*?<\/p>/gi, "");
    html = html.replace(/<p>\s*<sup>\s*This book of [\s\S]*?<\/sup>\s*<\/p>/gi, "");
    html = html.replace(/<p[^>]*>This book of [\s\S]*?is not (?:authorised|inspired) scripture[\s\S]*?<\/p>/gi, "");
    if (!html || !ref || !isExtraBook(ref.book)) return html;
    return extraWarningHtml(ref) + html;
  }
  function setPopupHtml(html) {
    html = withExtraWarning(html, currentRef);
    nkjvHtml = html;
    if (body) body.innerHTML = html;
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
  function inFootnotesCol(el) {
    var col = el && el.closest && el.closest(".col");
    return !!(col && col.classList.contains("col-footnotes"));
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
    if (!node || !ref) return null;
    if (node.nodeType === 1) {
      if (node.closest) {
        var inside = node.closest("a.ref");
        if (inside) return inside;
      }
      var had = node.querySelector && node.querySelector("a.ref");
      if (had) return had;
    }
    if (!node.parentNode) return null;
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
      "a.ref,.col a.ref,.col-text a.ref,.para a.ref{color:var(--title,#005eb8)!important;font-weight:400!important;font-size:calc(1em - 2px)!important;text-decoration:underline;text-underline-offset:0.15em;cursor:pointer}" +
      "#ew-ref-menu{position:fixed;z-index:120;min-width:10.5rem;background:#fff;border:1px solid #c5d0d4;box-shadow:0 8px 22px rgba(0,0,0,.16);padding:0.15rem 0 0.35rem}" +
      "#ew-ref-menu[hidden]{display:none!important}" +
      "#ew-ref-menu .ew-ref-title{padding:0.3rem 0.75rem 0.15rem;font:800 0.82rem Arial,Helvetica,sans-serif;color:#1f6f78}" +
      "#ew-ref-menu .ew-ref-title.ew-rhm-font{border-top:2px solid var(--title,#004d97);margin-top:0.08rem;padding-top:0.22rem}" +
      "#ew-ref-menu button{display:block;width:100%;text-align:left;border:0;background:none;padding:0.35rem 0.75rem;font:700 0.88rem Arial,Helvetica,sans-serif;color:#1b3a4b;cursor:pointer}" +
      "#ew-ref-menu button:hover{background:#eef3f4}" +
      "#ew-ref-menu .ew-rhm-size-row{display:flex;align-items:stretch;margin:0.08rem 0.75rem 0.3rem;width:4.7rem;height:1.55rem;border:1px solid #c5d0d4;background:#fff;box-sizing:border-box}" +
      "#ew-ref-menu .ew-rhm-size-row input{width:3.2rem;border:0;margin:0;padding:0 0.3rem;font:400 0.82rem Arial,Helvetica,sans-serif;background:#fff;box-sizing:border-box}" +
      "#ew-ref-menu .ew-rhm-spin{display:flex;flex-direction:column;width:1.15rem;border-left:1px solid #c5d0d4}" +
      "#ew-ref-menu .ew-rhm-spin button{display:flex;align-items:center;justify-content:center;flex:1;width:100%;height:auto;padding:0;margin:0;border:0;border-radius:0;font:700 7px/1 Arial,Helvetica,sans-serif;color:#1b3a4b;background:#f4f7f8;text-align:center;cursor:pointer}" +
      "#ew-ref-menu .ew-rhm-spin button+button{border-top:1px solid #c5d0d4}" +
      "#ew-ref-menu .ew-rhm-spin button:hover{background:#e4eaec}" +
      "#ew-ref-menu .ew-rhm-spin button:active{background:#d5dde0}" +
      "#ew-ref-menu .ew-rhm-color-row{display:flex;align-items:center;gap:0.22rem;margin:0.08rem 0.75rem 0.3rem}" +
      "#ew-ref-menu .ew-rhm-color-row input[type='color']{-webkit-appearance:none;appearance:none;width:1.1rem;height:1.1rem;padding:0;border:1px solid #c5d0d4;border-radius:2px;background:none;cursor:pointer;flex:0 0 1.1rem}" +
      "#ew-ref-menu .ew-rhm-color-row input[type='text']{width:5.2rem;height:1.55rem;margin:0;padding:0 0.35rem;font:400 0.82rem Arial,Helvetica,sans-serif;border:1px solid #c5d0d4;background:#fff;box-sizing:border-box}" +
      "#ew-ref-menu .ew-rhm-color-clear{display:inline-flex;align-items:center;justify-content:center;width:1.35rem;height:1.35rem;padding:0;margin:0;border:1px solid #c5d0d4;border-radius:2px;background:#f4f7f8;color:#1b3a4b;font:700 0.85rem Arial,Helvetica,sans-serif;line-height:1;text-align:center;cursor:pointer;box-sizing:border-box}" +
      "#ew-ref-menu .ew-rhm-color-clear:hover{background:#e4eaec;border-color:#9aa8ae}" +
      "#ew-ref-menu .ew-rhm-color-clear:active{background:#d5dde0}" +
      "#ew-ref-menu .ew-rhm-indent{display:flex;gap:0.25rem;padding:0.1rem 0.75rem 0.3rem}" +
      "#ew-ref-menu .ew-rhm-indent button{display:inline-flex;align-items:center;justify-content:center;width:1.6rem;height:1.6rem;padding:0;margin:0;border:1px solid #c5d0d4;border-radius:2px;background:#f4f7f8;color:#1b3a4b;font:700 1rem Arial,Helvetica,sans-serif;line-height:1;text-align:center;cursor:pointer;box-sizing:border-box}" +
      "#ew-ref-menu .ew-rhm-indent button:hover{background:#e4eaec;border-color:#9aa8ae}" +
      "#ew-ref-menu .ew-rhm-indent button:active{background:#d5dde0}" +
      "#ew-ref-menu .ew-rhm-list{display:flex;align-items:center;gap:0.25rem;padding:0.1rem 0.75rem 0.3rem}" +
      "#ew-ref-menu .ew-rhm-list button{display:inline-flex;align-items:center;justify-content:center;width:1.6rem;height:1.6rem;padding:0;margin:0;border:1px solid #c5d0d4;border-radius:2px;background:#f4f7f8;color:#1b3a4b;font:700 1rem Arial,Helvetica,sans-serif;line-height:1;text-align:center;cursor:pointer;box-sizing:border-box}" +
      "#ew-ref-menu .ew-rhm-list button:hover{background:#e4eaec;border-color:#9aa8ae}" +
      "#ew-ref-menu .ew-rhm-list button:active{background:#d5dde0}" +
      "#ew-ref-menu .ew-rhm-list input{width:2.4rem;height:1.6rem;margin:0;padding:0 0.2rem;border:1px solid #c5d0d4;background:#fff;font:400 0.82rem Arial,Helvetica,sans-serif;box-sizing:border-box}" +
      "#ew-ref-menu button[data-rhm='details']{display:block;width:auto;max-width:calc(100% - 1.5rem);margin:0.1rem 0.75rem 0.3rem;padding:0.28rem 0.55rem;border:1px solid #c5d0d4;border-radius:2px;background:#e4eaec;color:#5a6d75;font:400 0.82rem Arial,Helvetica,sans-serif;text-align:left;cursor:pointer;box-sizing:border-box}" +
      "#ew-ref-menu button[data-rhm='details']:hover{background:#d5dde0;color:#1b3a4b}" +
      ".bit.ew-details{display:block;width:max-content;max-width:100%;margin:0.25rem 0 var(--para-gap,0px);padding:0.22rem 0.55rem;border:1px solid #c5d0d4;border-radius:2px;background:#e4eaec;color:#5a6d75;font:400 0.88em Arial,Helvetica,sans-serif;line-height:1.25;cursor:pointer;user-select:none;-webkit-user-select:none;box-sizing:border-box}" +
      ".bit.ew-details.open{background:#1f6f78;color:#f6f7eb;border-color:#1f6f78}" +
      ".col-text .bit.ew-details:not(.open)~.bit{display:none!important}" +
      ".fn-keep{white-space:nowrap}" +
      ".fn{font-size:1em;font-weight:700;line-height:inherit;vertical-align:baseline;cursor:pointer;color:var(--title,#005eb8);text-decoration:none!important;display:inline-block;position:relative;padding:0;white-space:pre}" +
      ".fn-mark{font-size:.7em;font-weight:700;line-height:1;vertical-align:super}" +
      ".fn-tip{display:none;position:absolute;left:0;bottom:calc(100% + .28rem);z-index:80;padding:.15rem .45rem;border:1px solid var(--line,#c5d0d4);background:#fff;color:var(--title,#005eb8);font:400 .85em Arial,Helvetica,sans-serif;white-space:nowrap;pointer-events:none}" +
      ".fn:hover .fn-tip,.fn:focus .fn-tip{display:block}" +
      "a.ref .fn,.col-footnotes .fn{text-decoration:none!important;display:inline-block;position:relative;white-space:pre}" +
      "a.ref.ew-extra,.fn.ew-extra,.fn.ew-extra .fn-mark,.fn.ew-extra .fn-tip,#ew-verse.ew-extra .ew-verse-ref,#ew-verse.ew-extra .ew-extra-note{color:#0a7a22!important}" +
      "#ew-verse.ew-extra .ew-verse-body{font-size:1.22em;line-height:1.28}" +
      "#ew-verse.ew-extra .ew-verse-body p{margin:0 0 .18em;line-height:inherit}" +
      "#ew-verse.ew-extra .ew-extra-note{font-size:.92em;line-height:1.3;margin:0 0 .45em}" +
      ".col.col-footnotes{flex:0 0 auto!important;width:max-content!important;max-width:42%!important;min-width:0!important;box-sizing:border-box;padding:.15rem .4rem!important;text-align:left!important}" +
      ".col.col-footnotes,.col.col-footnotes .col-text,.col.col-footnotes .bit,.col.col-footnotes .fn{white-space:nowrap!important}" +
      ".col.col-footnotes a.ref{white-space:nowrap!important}";
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
    var fn = t.closest(".fn");
    if (fn) {
      var near = fn.nextElementSibling;
      if (!(near && near.classList && near.classList.contains("ref"))) {
        var bit = fn.closest ? fn.closest(".bit") || fn.parentNode : fn.parentNode;
        near = bit && bit.querySelector ? bit.querySelector("a.ref") : null;
      }
      if (near && near.classList && near.classList.contains("ref")) {
        return { a: near, fn: fn, text: near.getAttribute("data-ref") || near.textContent, node: null };
      }
      return { a: null, fn: fn, text: selectedText() || "", node: fn };
    }
    var sel = selectedText();
    if (sel) {
      var fromSel = refFromSelection();
      if (fromSel) return { a: fromSel, text: fromSel.getAttribute("data-ref") || sel, node: null };
      if (parseChapter(sel)) return { a: null, text: sel, node: null };
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
      '<button type="button" data-act="footnote">Foot note</button>' +
      '<div class="ew-ref-title ew-rhm-font">Font Size</div>' +
      '<div class="ew-rhm-size-row">' +
      '<input id="ew-rhm-size" type="text" inputmode="numeric" value="20" />' +
      '<span class="ew-rhm-spin">' +
      '<button type="button" data-size="up" tabindex="-1" title="Larger" aria-label="Larger">▲</button>' +
      '<button type="button" data-size="down" tabindex="-1" title="Smaller" aria-label="Smaller">▼</button>' +
      "</span></div>" +
      '<div class="ew-ref-title">Colour</div>' +
      '<span class="ew-rhm-color-row">' +
      '<input type="color" id="ew-rhm-color" value="#1b3a4b" title="Colour" />' +
      '<input type="text" id="ew-rhm-color-text" value="#1b3a4b" spellcheck="false" />' +
      '<button type="button" class="ew-rhm-color-clear" id="ew-rhm-color-clear" title="Remove colour" aria-label="Remove colour">×</button>' +
      "</span>" +
      '<div class="ew-ref-title">Indent</div>' +
      '<div class="ew-rhm-indent">' +
      '<button type="button" data-rhm="indent" data-on="1" title="Indent" aria-label="Indent">+</button>' +
      '<button type="button" data-rhm="indent" data-on="0" title="Remove indent" aria-label="Remove indent">-</button>' +
      "</div>" +
      '<div class="ew-ref-title">List</div>' +
      '<div class="ew-rhm-list">' +
      '<button type="button" data-rhm="list" data-kind="bullet" title="Bullet list" aria-label="Bullet list">•</button>' +
      '<button type="button" data-rhm="list" data-kind="number" title="Numbered list" aria-label="Numbered list">1.</button>' +
      '<input id="ew-rhm-list-start" type="number" min="1" step="1" value="1" title="Start number" aria-label="Start number" />' +
      '<button type="button" data-rhm="list" data-kind="none" title="Remove list" aria-label="Remove list">−</button>' +
      "</div>" +
      '<button type="button" data-rhm="details">Additional Details</button>';
    document.body.appendChild(refMenu);
    refMenu.addEventListener("mousedown", function (ev) {
      ev.stopPropagation();
      if (ev.target.closest && ev.target.closest("[data-size]")) ev.preventDefault();
    });
    refMenu.addEventListener("click", function (ev) {
      if (ev.target.closest && ev.target.closest("input, .ew-rhm-size-box, .ew-rhm-color-row")) {
        if (ev.target.id === "ew-rhm-color-clear" || (ev.target.closest && ev.target.closest("#ew-rhm-color-clear"))) {
          ev.preventDefault();
          ev.stopPropagation();
          restoreRhmRange();
          applyRhmColor("#1b3a4b");
          var t = refMenu.querySelector("#ew-rhm-color-text");
          if (t) t.value = "";
        }
        return;
      }
      var sizeBtn = ev.target.closest && ev.target.closest("[data-size]");
      if (sizeBtn) {
        ev.preventDefault();
        ev.stopPropagation();
        nudgeRhmSize(sizeBtn.getAttribute("data-size") === "up" ? 1 : -1);
        return;
      }
      var indentBtn = ev.target.closest && ev.target.closest("[data-rhm='indent']");
      if (indentBtn) {
        ev.preventDefault();
        ev.stopPropagation();
        applyRhmIndent(indentBtn.getAttribute("data-on") !== "0");
        return;
      }
      var listBtn = ev.target.closest && ev.target.closest("[data-rhm='list']");
      if (listBtn) {
        ev.preventDefault();
        ev.stopPropagation();
        var startEl = refMenu.querySelector("#ew-rhm-list-start");
        var start = parseInt((startEl && startEl.value) || "1", 10);
        applyRhmList(listBtn.getAttribute("data-kind") || "none", start);
        return;
      }
      var detailsBtn = ev.target.closest && ev.target.closest("[data-rhm='details']");
      if (detailsBtn) {
        ev.preventDefault();
        ev.stopPropagation();
        insertRhmDetails((refMenu && refMenu._bits) || []);
        hideRefMenu();
        return;
      }
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
        var a = null;
        if (hit.a) a = hit.a;
        else if (selectedText()) a = wrapCurrentSelection(nr);
        else if (hit.node) a = wrapNode(hit.node, nr);
        if (a && inFootnotesCol(a)) {
          var key = String(a.getAttribute("data-ref") || "").replace(/\s+/g, " ").trim().toLowerCase();
          var col = a.closest(".col");
          var copies = 0;
          if (col && key) {
            var links = col.querySelectorAll("a.ref");
            for (var i = 0; i < links.length; i++) {
              var k = String(links[i].getAttribute("data-ref") || "").replace(/\s+/g, " ").trim().toLowerCase();
              if (k === key) copies += 1;
            }
          }
          if (copies <= 1) prependFootnote(a);
          renumberRow(a.closest(".para"));
        }
        ensureBox();
        currentRef = nr;
        currentRef.label = nr.vs1 ? refLabel(nr) : nr.label;
        lookupThenShow();
        return;
      }
      if (act === "footnote") applyFootnote(hit);
    });
    var sizeInp = refMenu.querySelector("#ew-rhm-size");
    if (sizeInp) {
      sizeInp.addEventListener("change", function () {
        applyRhmSize(sizeInp.value);
      });
    }
    var color = refMenu.querySelector("#ew-rhm-color");
    var colorText = refMenu.querySelector("#ew-rhm-color-text");
    if (color) {
      color.addEventListener("input", function () {
        if (colorText) colorText.value = color.value;
        applyRhmColor(color.value);
      });
    }
    if (colorText) {
      colorText.addEventListener("change", function () {
        var hex = String(colorText.value || "").trim();
        if (!/^#([0-9a-f]{3}|[0-9a-f]{6})$/i.test(hex)) return;
        if (color) color.value = hex.length === 4 ? hex : hex.slice(0, 7);
        applyRhmColor(hex);
      });
    }
    document.addEventListener("click", function (ev) {
      if (ev.target.closest && ev.target.closest("#ew-ref-menu")) return;
      hideRefMenu();
    });
    document.addEventListener("scroll", hideRefMenu, true);
    return refMenu;
  }
  function rgbToHex(c) {
    var m = String(c || "").match(/rgba?\((\d+),\s*(\d+),\s*(\d+)/i);
    if (!m) {
      var s = String(c || "").trim();
      return /^#([0-9a-f]{3}|[0-9a-f]{6})$/i.test(s) ? s : "#1b3a4b";
    }
    function h(n) {
      n = Number(n);
      return (n < 16 ? "0" : "") + n.toString(16);
    }
    return "#" + h(m[1]) + h(m[2]) + h(m[3]);
  }
  function rangeHost() {
    var node = null;
    if (refMenu && refMenu._range) node = refMenu._range.startContainer;
    else {
      var sel = window.getSelection();
      if (sel && sel.rangeCount) node = sel.anchorNode;
    }
    if (!node) return null;
    var el = node.nodeType === 1 ? node : node.parentElement;
    while (el && el.classList && el.classList.contains("fn")) el = el.parentElement;
    return el;
  }
  function storyPx(el) {
    var host = el || rangeHost();
    if (!host || !host.closest) return 20;
    var bit = host.closest(".bit") || host.closest(".col-text") || host.closest(".col");
    if (!bit) return 20;
    var px = parseFloat(window.getComputedStyle(bit).fontSize);
    return px > 0 ? Math.round(px) : 20;
  }
  function selectionPx() {
    var host = rangeHost();
    var base = storyPx(host);
    var el = host;
    while (el && el.classList && !el.classList.contains("bit") && !el.classList.contains("col-text") && !el.classList.contains("col")) {
      if (el.style && el.style.fontSize) {
        var n = parseInt(el.style.fontSize, 10);
        if (n > 0 && Math.abs(n - base) <= 8) return n;
        break;
      }
      el = el.parentElement;
    }
    return base;
  }
  function nudgeRhmSize(delta) {
    restoreRhmRange();
    var n = selectionPx() + delta;
    if (n < 4) n = 4;
    if (n > 120) n = 120;
    var sizeInp = refMenu && refMenu.querySelector("#ew-rhm-size");
    if (sizeInp) sizeInp.value = String(n);
    applyRhmSize(n);
  }
  function fillRhmFields(el) {
    var host = rangeHost() || (el && (el.nodeType === 1 ? el : el.parentElement));
    var cs = host && window.getComputedStyle(host);
    var size = refMenu && refMenu.querySelector("#ew-rhm-size");
    var pick = refMenu && refMenu.querySelector("#ew-rhm-color");
    var text = refMenu && refMenu.querySelector("#ew-rhm-color-text");
    if (size) size.value = String(selectionPx());
    var hex = cs ? rgbToHex(cs.color) : "#1b3a4b";
    if (pick) pick.value = hex;
    if (text) text.value = hex;
  }
  function keepRhmRange() {
    var sel = window.getSelection();
    if (!sel || !sel.rangeCount || !refMenu) return;
    try {
      refMenu._range = sel.getRangeAt(0).cloneRange();
    } catch (e) {}
  }
  function applyRhmColor(hex) {
    restoreRhmRange();
    if (!hex) return;
    try {
      document.execCommand("styleWithCSS", false, true);
    } catch (e2) {}
    document.execCommand("foreColor", false, hex);
    keepRhmRange();
    bumpHost(document.activeElement);
  }
  function restoreRhmRange() {
    var sel = window.getSelection();
    if (!sel || !refMenu || !refMenu._range) return;
    sel.removeAllRanges();
    try {
      sel.addRange(refMenu._range);
    } catch (e) {}
  }
  function applyRhmSize(px) {
    px = parseInt(px, 10);
    if (!(px > 0)) return;
    restoreRhmRange();
    var sel = window.getSelection();
    if (!sel || !sel.rangeCount || sel.isCollapsed) return;
    var range = sel.getRangeAt(0);
    var node = range.commonAncestorContainer;
    var el = node && node.nodeType === 1 ? node : node && node.parentElement;
    var span = null;
    if (el && el.style && el.style.fontSize && el.classList && !el.classList.contains("bit") && !el.classList.contains("col-text") && el.textContent === range.toString()) {
      span = el;
    }
    if (span) {
      span.style.fontSize = px + "px";
    } else {
      span = document.createElement("span");
      span.style.fontSize = px + "px";
      try {
        range.surroundContents(span);
      } catch (e) {
        span.appendChild(range.extractContents());
        range.insertNode(span);
      }
    }
    try {
      var nr = document.createRange();
      nr.selectNodeContents(span);
      sel.removeAllRanges();
      sel.addRange(nr);
    } catch (e2) {}
    keepRhmRange();
    bumpHost(span);
  }
  function rhmBits(ev) {
    var bits = [];
    var root = ev && ev.target && ev.target.closest && ev.target.closest(".col-text");
    if (!root) return bits;
    var sel = window.getSelection();
    var list = root.querySelectorAll(".bit");
    if (sel && sel.rangeCount) {
      var range = sel.getRangeAt(0);
      for (var i = 0; i < list.length; i++) {
        var b = list[i];
        try {
          var br = document.createRange();
          br.selectNodeContents(b);
          if (range.compareBoundaryPoints(Range.END_TO_START, br) < 0 && range.compareBoundaryPoints(Range.START_TO_END, br) > 0) bits.push(b);
        } catch (e) {}
      }
    }
    if (!bits.length) {
      var cur = ev && ev.target;
      if (cur && cur.nodeType === 3) cur = cur.parentNode;
      while (cur && cur !== root && !(cur.classList && cur.classList.contains("bit"))) cur = cur.parentNode;
      if (cur && cur.classList && cur.classList.contains("bit")) bits.push(cur);
    }
    return bits;
  }
  function applyRhmIndent(on) {
    var bits = (refMenu && refMenu._bits) || [];
    bits.forEach(function (b) {
      b.classList.toggle("indent", !!on);
    });
    if (bits[0]) bumpHost(bits[0]);
  }
  function applyRhmList(kind, start) {
    var bits = (refMenu && refMenu._bits) || [];
    var n = parseInt(start, 10);
    if (!(n > 0)) n = 1;
    bits.forEach(function (b) {
      if (!b || !b.classList) return;
      b.classList.remove("bullet", "numbered");
      b.removeAttribute("data-n");
      if (kind === "bullet") b.classList.add("bullet");
      else if (kind === "number") {
        b.classList.add("numbered");
        b.setAttribute("data-n", String(n));
        n += 1;
      }
    });
    if (kind === "number" && bits.length) {
      var last = bits[bits.length - 1];
      var m = parseInt(last.getAttribute("data-n") || "1", 10);
      var cur = last.nextElementSibling;
      while (cur && cur.classList && cur.classList.contains("bit") && cur.classList.contains("numbered")) {
        m += 1;
        cur.setAttribute("data-n", String(m));
        cur = cur.nextElementSibling;
      }
    }
    if (bits[0]) bumpHost(bits[0]);
  }
  function fillRhmListStart(bits) {
    var inp = refMenu && refMenu.querySelector("#ew-rhm-list-start");
    if (!inp) return;
    var n = 1;
    for (var i = 0; i < (bits || []).length; i++) {
      var b = bits[i];
      if (b && b.classList && b.classList.contains("numbered")) {
        var sn = parseInt(b.getAttribute("data-n") || "1", 10);
        if (sn > 0) {
          n = sn;
          break;
        }
      }
    }
    inp.value = String(n);
  }
  function makeDetailsBit(doc) {
    var btn = (doc || document).createElement("span");
    btn.className = "bit ew-details";
    btn.setAttribute("contenteditable", "false");
    btn.setAttribute("role", "button");
    btn.setAttribute("tabindex", "0");
    btn.setAttribute("aria-expanded", "false");
    btn.textContent = "Additional Details";
    return btn;
  }
  function setDetailsOpen(btn, on) {
    if (!btn || !btn.classList) return;
    btn.classList.toggle("open", !!on);
    btn.setAttribute("aria-expanded", on ? "true" : "false");
    btn.textContent = on ? "Hide Details" : "Additional Details";
  }
  function toggleDetails(btn) {
    setDetailsOpen(btn, !(btn && btn.classList && btn.classList.contains("open")));
  }
  function insertRhmDetails(bits) {
    var bit = bits && bits[0];
    if (!bit || !bit.parentNode) return;
    var host = bit.parentNode;
    var old = host.querySelector && host.querySelector(".bit.ew-details");
    if (old) old.remove();
    if (bit.classList && bit.classList.contains("ew-details")) {
      bumpHost(host);
      return;
    }
    host.insertBefore(makeDetailsBit(bit.ownerDocument), bit);
    bumpHost(host);
  }
  function selectedNumber() {
    var s = selectedText();
    return /^\d{1,4}$/.test(s) ? s : "";
  }
  function footnotePage(el) {
    return (el && el.closest && (el.closest(".page-frame") || el.closest("main"))) || document;
  }
  function footnoteRow(el) {
    return (el && el.closest && el.closest(".para")) || footnotePage(el);
  }
  var renumbering = false;
  function fnValue(el) {
    var raw = String((el && el.textContent) || "").trim();
    return /^\d+$/.test(raw) ? parseInt(raw, 10) : 0;
  }
  function fnLabel(n) {
    return String(n || "").replace(/\s+/g, "");
  }
  function fnDigits(fn) {
    if (!fn) return "";
    var mark = fn.querySelector && fn.querySelector(".fn-mark");
    var raw = mark ? mark.textContent : fn.textContent;
    var n = String(raw || "").replace(/\D/g, "");
    return /^\d+$/.test(n) ? n : "";
  }
  function ensureFnPad(fn) {
    paintFnHit(fn);
  }
  function paintFnHit(fn) {
    if (!fn) return;
    var n = fnDigits(fn);
    if (!n) return;
    if (!fn.parentNode) {
      fn.textContent = n;
      return;
    }
    var inNotes = !!(fn.closest && fn.closest(".col-footnotes"));
    var extra = !inNotes && startsNewSentenceAfter(fn);
    var prev = fn.previousSibling;
    if (prev && prev.nodeType === 3) {
      prev.nodeValue = String(prev.nodeValue || "").replace(/\s+$/, "");
      if (!prev.nodeValue) prev.parentNode.removeChild(prev);
    }
    var next = fn.nextSibling;
    if (next && next.nodeType === 3) {
      next.nodeValue = String(next.nodeValue || "").replace(/^\s+/, "");
      if (!next.nodeValue) next.parentNode.removeChild(next);
    }
    var sp = "\u00a0";
    var before = inNotes ? "" : sp;
    var after = extra ? sp + sp : sp;
    fn.innerHTML = before + '<span class="fn-mark">' + n + "</span>" + after;
    glueFnToPrevWord(fn);
  }
  function glueFnToPrevWord(fn) {
    if (!fn || !fn.parentNode) return;
    if (fn.closest && fn.closest(".col-footnotes")) return;
    if (fn.parentNode.classList && fn.parentNode.classList.contains("fn-keep")) return;
    var prev = fn.previousSibling;
    var wrap = document.createElement("span");
    wrap.className = "fn-keep";
    if (prev && prev.nodeType === 3) {
      var t = String(prev.nodeValue || "").replace(/\s+$/, "");
      var m = t.match(/^(.*?)(\S+)$/);
      if (m && m[2]) {
        prev.nodeValue = m[1];
        if (!prev.nodeValue) prev.parentNode.removeChild(prev);
        wrap.appendChild(document.createTextNode(m[2]));
      }
    }
    fn.parentNode.insertBefore(wrap, fn);
    wrap.appendChild(fn);
  }
  function fnNodeForRef(a) {
    if (!a) return null;
    var inner = a.querySelector && a.querySelector(".fn");
    if (inner) return inner;
    var prev = a.previousElementSibling;
    if (prev && prev.classList && prev.classList.contains("fn")) return prev;
    return null;
  }
  function renumberRow(row) {
    if (!row || renumbering) return;
    var fnCol = row.querySelector(".col-footnotes");
    if (!fnCol) return;
    var refs = fnCol.querySelectorAll("a.ref");
    if (!refs.length) return;
    renumbering = true;
    try {
      var items = [];
      for (var i = 0; i < refs.length; i++) {
        var a = refs[i];
        var fn = fnNodeForRef(a);
        items.push({ a: a, fn: fn, old: fnValue(fn) });
      }
      var oldToNew = {};
      items.forEach(function (item, idx) {
        item.next = idx + 1;
        if (item.old) oldToNew[item.old] = item.next;
      });
      var story = [];
      var cols = row.querySelectorAll(".col");
      for (var c = 0; c < cols.length; c++) {
        if (cols[c] === fnCol) continue;
        var list = cols[c].querySelectorAll(".fn");
        for (var j = 0; j < list.length; j++) {
          var n = fnValue(list[j]);
          if (n) story.push({ el: list[j], old: n });
        }
      }
      var tok = "\uE000";
      items.forEach(function (item) {
        if (!item.fn) {
          prependFootnote(item.a, item.next);
          return;
        }
        item.fn.textContent = tok + fnLabel(item.next);
      });
      story.forEach(function (s) {
        var nxt = oldToNew[s.old];
        if (nxt) s.el.textContent = tok + fnLabel(nxt);
      });
      row.querySelectorAll(".fn").forEach(function (fn) {
        var t = String(fn.textContent || "");
        if (t.charAt(0) === tok) {
          fn.textContent = t.slice(1);
          spaceAfterFn(fn);
        } else spaceAfterFn(fn);
      });
    } finally {
      setTimeout(function () {
        renumbering = false;
      }, 0);
    }
  }
  function watchFootnoteOrder() {
    document.querySelectorAll(".col-footnotes").forEach(function (col) {
      if (col._ewMo) return;
      col._ewMo = new MutationObserver(function () {
        if (renumbering) return;
        var row = col.closest(".para");
        clearTimeout(col._ewRn);
        col._ewRn = setTimeout(function () {
          renumberRow(row);
        }, 160);
      });
      col._ewMo.observe(col, { childList: true, subtree: true, characterData: true });
    });
  }
  function nextFootnoteNumber(scope) {
    var max = 0;
    var root = scope || document;
    var list = root.querySelectorAll(".fn, sup");
    for (var i = 0; i < list.length; i++) {
      var raw = String(list[i].textContent || "").trim();
      if (!/^\d+$/.test(raw)) continue;
      var n = parseInt(raw, 10);
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
    spaceAfterFn(sup);
    return sup;
  }
  function textAfterFnSkipRef(fn) {
    var n = fn && fn.nextSibling;
    var text = "";
    while (n) {
      if (n.nodeType === 3) text += n.nodeValue || "";
      else if (n.nodeType === 1) {
        if (n.classList && (n.classList.contains("ref") || n.classList.contains("fn"))) {
          n = n.nextSibling;
          continue;
        }
        text += n.textContent || "";
      }
      if (String(text).replace(/\s+/g, "").length) break;
      n = n.nextSibling;
    }
    return String(text || "").replace(/^\s+/, "");
  }
  function startsNewSentenceAfter(fn) {
    return /^["'“‘]?[A-Z]/.test(textAfterFnSkipRef(fn));
  }
  function spaceAfterFn(fn) {
    paintFnHit(fn);
    paintFnTitle(fn);
  }
  function fnTitleText(fn) {
    var hit = noteRefForFn(fn);
    if (!hit) return "";
    if (hit.a) {
      var dr = String(hit.a.getAttribute("data-ref") || "").replace(/\s+/g, " ").trim();
      if (dr) return dr;
    }
    return (hit.ref && hit.ref.label) || "";
  }
  function paintFnTitle(fn) {
    if (!fn) return;
    var lab = fnTitleText(fn);
    fn.removeAttribute("title");
    var tip = fn.querySelector(".fn-tip");
    if (lab) {
      if (!tip) {
        tip = document.createElement("span");
        tip.className = "fn-tip";
        fn.appendChild(tip);
      }
      tip.textContent = lab;
    } else if (tip) tip.parentNode.removeChild(tip);
    var hit = noteRefForFn(fn);
    fn.classList.toggle("ew-extra", !!(hit && hit.ref && Number(hit.ref.book) > 66));
  }
  function liftFnOutOfRef(a) {
    if (!a || !a.parentNode) return null;
    var inner = a.querySelector && a.querySelector(".fn");
    if (!inner) return fnNodeForRef(a);
    a.parentNode.insertBefore(inner, a);
    spaceAfterFn(inner);
    return inner;
  }
  function prependFootnote(a, num) {
    if (!a) return;
    var n = String(num || nextFootnoteNumber(footnoteRow(a)));
    var existing = liftFnOutOfRef(a) || fnNodeForRef(a);
    if (existing) {
      existing.className = "fn";
      existing.textContent = fnLabel(n);
      if (existing.parentNode === a && a.parentNode) a.parentNode.insertBefore(existing, a);
      spaceAfterFn(existing);
      bumpHost(a);
      return;
    }
    var sup = document.createElement("span");
    sup.className = "fn";
    sup.textContent = fnLabel(n);
    if (a.parentNode) a.parentNode.insertBefore(sup, a);
    else a.insertBefore(sup, a.firstChild);
    spaceAfterFn(sup);
    bumpHost(a);
  }
  function applyFootnote(hit) {
    var num = selectedNumber();
    if (num) {
      wrapSelectionInSup();
      return;
    }
    if (hit && hit.a && inFootnotesCol(hit.a)) prependFootnote(hit.a);
  }
  function showRefMenu(ev, hit) {
    var menu = ensureRefMenu();
    menu._hit = hit || { text: selectedText(), a: null };
    menu._bits = rhmBits(ev);
    menu._range = null;
    var sel = window.getSelection();
    if (sel && sel.rangeCount) {
      try {
        menu._range = sel.getRangeAt(0).cloneRange();
      } catch (e) {}
    }
    menu.hidden = false;
    menu.style.visibility = "hidden";
    menu.style.left = "0px";
    menu.style.top = "0px";
    var w = menu.offsetWidth || 220;
    var h = menu.offsetHeight || 360;
    var x = ev.clientX || 0;
    var y = ev.clientY || 0;
    menu.style.left = Math.max(8, Math.min(x, window.innerWidth - w - 8)) + "px";
    menu.style.top = Math.max(8, Math.min(y, window.innerHeight - h - 8)) + "px";
    menu.style.visibility = "";
    fillRhmFields(ev && ev.target);
    fillRhmListStart(menu._bits);
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
    body.addEventListener("keydown", function (ev) {
      if (!canEditVerses()) return;
      if (ev.isComposing) return;
      if (ev.key === "Enter") {
        ev.preventDefault();
        document.execCommand(ev.shiftKey ? "insertLineBreak" : "insertParagraph");
        noteEdit();
        return;
      }
      if (!(ev.metaKey || ev.ctrlKey) || ev.altKey) return;
      var key = (ev.key || "").toLowerCase();
      if (key !== "b" && key !== "i" && key !== "u") return;
      ev.preventDefault();
      document.execCommand(key === "b" ? "bold" : key === "i" ? "italic" : "underline");
      noteEdit();
    });
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
      saveBtn.hidden = !edit || !dirty;
      saveBtn.disabled = !edit || !dirty;
      saveBtn.textContent = "Save";
    }
    if (saveCloseBtn) {
      saveCloseBtn.hidden = !edit || !dirty;
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
    var extra = !!(currentRef && isExtraBook(currentRef.book));
    if (prefBtn) prefBtn.hidden = extra;
    if (extra) {
      if (altWrap) altWrap.hidden = true;
      return;
    }
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
    var b = bookByNum(book);
    if (b && b[3]) return b[3];
    return CHAPS[book] || 1;
  }
  function bookIndex(n) {
    var i;
    for (i = 0; i < BOOKS.length; i++) {
      if (BOOKS[i][1] === n) return i;
    }
    return -1;
  }
  function syncChNav() {
    if (!chBrowse) return;
    var i = bookIndex(chBrowse.book);
    if (chPrev) chPrev.hidden = i <= 0 && chBrowse.ch <= 1;
    if (chNext) chNext.hidden = i >= BOOKS.length - 1 && chBrowse.ch >= chCount(chBrowse.book);
  }
  function shiftChapter(dir) {
    if (!chBrowse) return;
    var book = chBrowse.book;
    var ch = chBrowse.ch + dir;
    var max = chCount(book);
    var i = bookIndex(book);
    if (ch < 1) {
      if (i <= 0) return;
      book = BOOKS[i - 1][1];
      ch = chCount(book);
    } else if (ch > max) {
      if (i < 0 || i >= BOOKS.length - 1) return;
      book = BOOKS[i + 1][1];
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
    markExtraChrome();
    syncPickBtn();
    loadChapter();
  }
  function loadChapter() {
    if (!chBrowse || !chList) return;
    var tr = chView === "NKJV" ? "NKJV" : currentTr();
    setAbbrTitle(chTitle, chBrowse.name + " " + chBrowse.ch, isExtraBook(chBrowse.book) ? "" : tr);
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
          btn.innerHTML = "<sup>" + row.verse + "</sup> " + cleanVerse(row.text, tr).replace(/</g, "&lt;");
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
  function isExtraBook(n) {
    return Number(n) > 66;
  }
  function markExtraChrome() {
    var extra = !!(currentRef && isExtraBook(currentRef.book));
    if (box) box.classList.toggle("ew-extra", extra);
    if (chBox) chBox.classList.toggle("ew-extra", extra);
    var tools = box && box.querySelector(".ew-verse-tools");
    if (tools) tools.hidden = extra;
    if (prefBtn) prefBtn.hidden = extra;
    if (altWrap) altWrap.hidden = extra || !prefOn();
    if (chNkjv) chNkjv.hidden = extra;
    if (chTrPick) chTrPick.hidden = extra;
  }
  function markExtraRefs() {
    document.querySelectorAll("a.ref").forEach(function (a) {
      var r = parseChapter(a.getAttribute("data-ref") || a.textContent);
      a.classList.toggle("ew-extra", !!(r && isExtraBook(r.book)));
    });
    document.querySelectorAll(".fn").forEach(function (fn) {
      var hit = noteRefForFn(fn);
      fn.classList.toggle("ew-extra", !!(hit && hit.ref && isExtraBook(hit.ref.book)));
    });
  }
  function showPopup() {
    ensureBox();
    box.hidden = false;
    markExtraChrome();
    setAbbrTitle(
      title,
      currentRef && currentRef.vs1 ? currentRef.label : currentRef.name + " " + currentRef.ch1,
      currentRef && isExtraBook(currentRef.book) ? "" : "NKJV"
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
        inFile = !!(stored && stored.found);
        setPopupHtml(html);
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
          showPopup();
          setPopupHtml(storedHtml(d.text));
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
          var htmlLive = htmlFromVerseMap(kept, currentRef.vs1, vs2Safe(currentRef));
          if (!htmlLive) {
            body.textContent = "That passage is not in the scriptures file yet.";
            markClean();
            return;
          }
          setPopupHtml(htmlLive);
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
              var htmlCatch = htmlFromVerseMap(kept, currentRef.vs1, vs2Safe(currentRef));
              if (!htmlCatch) {
                body.textContent = "Could not open the NKJV.";
                markClean();
                return;
              }
              setPopupHtml(htmlCatch);
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
    return bodyHtml();
  }
  function revertSaved() {
    if (!savedCopy || !body) return;
    body.innerHTML = savedCopy;
    nkjvHtml = savedCopy;
    markClean();
  }
  function saveFolder() {
    if (window.ewFolder) return String(window.ewFolder);
    try {
      var q = new URLSearchParams(parent.location.search || "");
      if (q.get("folder")) return q.get("folder");
    } catch (e) {}
    var m = String(location.pathname || "").match(/\/(?:sites|published)\/([^/]+)\//);
    return m ? m[1] : "";
  }
  function saveCurrent(andClose) {
    if (!currentRef || location.port !== "8767") return;
    var html = htmlToSave();
    if (!html) return;
    var folder = saveFolder();
    if (!folder) {
      if (saveBtn) saveBtn.textContent = "Need a site.";
      return;
    }
    if (saveBtn) saveBtn.disabled = true;
    if (saveCloseBtn) saveCloseBtn.disabled = true;
    fetch("/scriptures?folder=" + encodeURIComponent(folder), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ reference: currentRef.label, text: html, folder: folder }),
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
          rememberSaved(currentRef.label, html);
          scripturesFile = null;
          markClean();
          if (andClose) hide();
        } else if (saveBtn) {
          saveBtn.textContent = (out.d && out.d.error) || "Could not save.";
        }
      })
      .catch(function () {
        if (saveBtn) {
          saveBtn.disabled = false;
          saveBtn.textContent = "Could not save.";
        }
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

  function fnNumber(el) {
    var n = parseInt(String((el && el.textContent) || "").trim(), 10);
    return n > 0 ? n : 0;
  }
  function parseRefNode(a) {
    if (!a) return null;
    return parseChapter(a.getAttribute("data-ref") || a.textContent);
  }
  function textAfterFn(fn) {
    var t = "";
    var n = fn && fn.nextSibling;
    while (n) {
      if (n.nodeType === 3) t += n.nodeValue || "";
      else if (n.nodeType === 1) {
        if ((n.className || "").indexOf("ref") >= 0) {
          var dr = n.getAttribute("data-ref");
          if (dr) return String(dr).trim();
        }
        t += n.innerText || n.textContent || "";
      }
      n = n.nextSibling;
    }
    return String(t || "")
      .replace(/\s+/g, " ")
      .trim();
  }
  function refFromAroundFn(fn) {
    if (!fn) return null;
    var a = fn.closest && fn.closest("a.ref");
    var r = parseRefNode(a);
    if (r) return { ref: r, a: a };
    var after = textAfterFn(fn);
    r = parseChapter(after);
    if (r) {
      a = fn.parentNode && fn.parentNode.querySelector ? fn.parentNode.querySelector("a.ref") : null;
      return { ref: r, a: a };
    }
    var host = (fn.closest && (fn.closest(".bit") || fn.closest(".col"))) || fn.parentNode;
    if (host && host.querySelectorAll) {
      var links = host.querySelectorAll("a.ref");
      for (var i = 0; i < links.length; i++) {
        if (fn.compareDocumentPosition(links[i]) & 4) {
          r = parseRefNode(links[i]);
          if (r) return { ref: r, a: links[i] };
        }
      }
    }
    return null;
  }
  function noteRefForFn(fn) {
    if (!fn) return null;
    var hit = refFromAroundFn(fn);
    if (hit) return hit;
    var para = fn.closest && fn.closest(".para");
    var num = fnNumber(fn);
    if (!para || !num) return null;
    var list = para.querySelectorAll(".fn");
    for (var i = 0; i < list.length; i++) {
      if (list[i] === fn) continue;
      if (fnNumber(list[i]) !== num) continue;
      hit = refFromAroundFn(list[i]);
      if (hit) return hit;
    }
    var cols = para.querySelectorAll(".col");
    for (var c = 0; c < cols.length; c++) {
      if (fn.closest && fn.closest(".col") === cols[c]) continue;
      var link = cols[c].querySelector("a.ref");
      var r = parseRefNode(link);
      if (r) return { ref: r, a: link };
    }
    return null;
  }
  function openParsed(ref, a) {
    if (!ref) return false;
    ensureBox();
    currentRef = ref;
    currentRef.label = ref.vs1 ? refLabel(ref) : ref.label;
    savedLink = a || null;
    lookupThenShow();
    return true;
  }

  function dedupeFootnoteRefs(root) {
    var cols = (root || document).querySelectorAll(".col-footnotes");
    for (var c = 0; c < cols.length; c++) {
      var seen = {};
      var links = cols[c].querySelectorAll("a.ref");
      for (var i = 0; i < links.length; i++) {
        var a = links[i];
        var k = String(a.getAttribute("data-ref") || "").replace(/\s+/g, " ").trim().toLowerCase();
        if (!k) continue;
        if (seen[k]) {
          while (a.firstChild) a.parentNode.insertBefore(a.firstChild, a);
          a.remove();
        } else seen[k] = true;
      }
    }
  }

  ensureRefStyle();
  document.querySelectorAll("a.ref").forEach(liftFnOutOfRef);
  document.querySelectorAll(".fn").forEach(spaceAfterFn);
  dedupeFootnoteRefs(document);
  watchFootnoteOrder();
  document.querySelectorAll(".para").forEach(renumberRow);
  document.querySelectorAll(".fn").forEach(paintFnTitle);
  markExtraRefs();
  document.addEventListener("click", function (ev) {
    var det = ev.target.closest && ev.target.closest(".bit.ew-details");
    if (det) {
      ev.preventDefault();
      ev.stopPropagation();
      toggleDetails(det);
      return;
    }
    if (ev.target.closest && ev.target.closest("#ew-verse, #ew-chapter, #ew-ref-menu")) return;
    var a = ev.target.closest && ev.target.closest("a.ref");
    if (a) {
      ev.preventDefault();
      ev.stopPropagation();
      var ref = parseChapter(a.getAttribute("data-ref") || a.textContent);
      if (!ref) return;
      openParsed(ref, a);
      return;
    }
    var fn = ev.target.closest && ev.target.closest(".fn");
    if (!fn) return;
    var hit = noteRefForFn(fn);
    if (!hit || !hit.ref) return;
    ev.preventDefault();
    ev.stopPropagation();
    openParsed(hit.ref, hit.a);
  });
  document.addEventListener(
    "mousedown",
    function (ev) {
      if (ev.target.closest && ev.target.closest(".bit.ew-details")) ev.preventDefault();
    },
    true
  );
  document.addEventListener(
    "keydown",
    function (ev) {
      var det = ev.target && ev.target.classList && ev.target.classList.contains("ew-details") ? ev.target : null;
      if (!det) return;
      if (ev.key !== "Enter" && ev.key !== " ") return;
      ev.preventDefault();
      toggleDetails(det);
    }
  );
  document.addEventListener(
    "contextmenu",
    function (ev) {
      if (!canEditVerses()) return;
      if (ev.target.closest && ev.target.closest("#ew-verse, #ew-chapter, #ew-ref-menu")) return;
      var inIframe = window.parent && window.parent !== window;
      if (!inIframe) return;
      var col = ev.target.closest && ev.target.closest(".col");
      if (col && (col.classList.contains("col-photo") || (col.querySelector && col.querySelector("img.col-pic")))) return;
      ev.preventDefault();
      ev.stopPropagation();
      showRefMenu(ev, hitFromEvent(ev));
    },
    true
  );
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

  window.ewRhmHit = function (ev) {
    var menu = ensureRefMenu();
    menu._hit = hitFromEvent(ev) || { text: selectedText(), a: null };
  };
  window.ewRhmAct = function (act) {
    var menu = ensureRefMenu();
    var btn = menu.querySelector('[data-act="' + act + '"]');
    if (btn) btn.click();
  };
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
