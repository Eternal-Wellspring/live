(function (global) {
  var api = global.ewFootnotes || {};
  api.titlePainter = api.titlePainter || null;

  function bumpHost(el) {
    var host = el && el.closest && el.closest("[contenteditable='true']");
    if (host) host.dispatchEvent(new Event("input", { bubbles: true }));
  }

  function ensureFnStyle() {
    if (document.getElementById("ew-fn-style")) return;
    var s = document.createElement("style");
    s.id = "ew-fn-style";
    s.textContent =
      "a.ref,.col a.ref,.col-text a.ref,.para a.ref{color:var(--title,#005eb8)!important;font-weight:400!important;font-size:calc(1em - 2px)!important;text-decoration:underline;text-underline-offset:0.15em;cursor:pointer;white-space:nowrap}" +
      ".fn-keep{white-space:nowrap}" +
      ".col-footnotes .fn-keep{display:block;white-space:nowrap}" +
      ".col-footnotes .bit .fn-keep+.fn-keep{margin-top:var(--para-gap,0px)}" +
      ".fn{font-size:1em;font-weight:700;line-height:inherit;vertical-align:baseline;cursor:pointer;color:var(--title,#005eb8);text-decoration:none!important;display:inline-block;position:relative;padding:0;white-space:pre}" +
      ".fn-mark{font-size:.7em;font-weight:700;line-height:1;vertical-align:super}" +
      ".fn-tip{display:none;position:absolute;left:0;bottom:calc(100% + .28rem);z-index:80;padding:.15rem .45rem;border:1px solid var(--line,#c5d0d4);background:#fff;color:var(--title,#005eb8);font:400 .85em Arial,Helvetica,sans-serif;white-space:nowrap;pointer-events:none}" +
      ".fn:hover .fn-tip,.fn:focus .fn-tip{display:block}" +
      "a.ref .fn,.col-footnotes .fn{text-decoration:none!important;display:inline-block;position:relative;white-space:pre}" +
      ".col.col-footnotes{flex:0 0 auto!important;width:max-content!important;max-width:42%!important;min-width:0!important;box-sizing:border-box;padding:.15rem .4rem!important;text-align:left!important;white-space:normal!important}" +
      ".col.col-footnotes .col-text,.col.col-footnotes .bit{white-space:normal!important}" +
      ".col.col-footnotes a.ref{white-space:nowrap}";
    document.head.appendChild(s);
  }

  function isFootnotesFormat(name) {
    var n = String(name || "")
      .trim()
      .toLowerCase()
      .replace(/\s+/g, "");
    return n === "footnotes" || n.indexOf("bibleref") === 0;
  }

  function footnoteNumsFromText(html) {
    var n = (String(html || "").match(/<a\b[^>]*\bref\b/gi) || []).length;
    var out = {};
    for (var i = 1; i <= n; i++) out[i] = true;
    return out;
  }

  function liftTypedFnsInPlain(text, allowed) {
    return String(text || "")
      .split(/(<[^>]+>)/)
      .map(function (part) {
        if (!part || part.charAt(0) === "<") return part;
        return part.replace(/(^|[\s.,;:!?])(\d{1,2})(?=\s)/g, function (m, pre, num) {
          var n = parseInt(num, 10);
          if (!allowed[n]) return m;
          return pre + '<span class="fn">' + num + "</span>";
        });
      })
      .join("");
  }

  function spaceAfterEachRef(html) {
    return String(html || "").replace(/(<a\b[^>]*\bref\b[^>]*>[\s\S]*?<\/a>)(?!\s)/gi, "$1 ");
  }

  function formatNotesCol(html) {
    var s = String(html || "");
    if (!s) return s;
    s = s.replace(/\r\n/g, "\n").replace(/\r/g, "\n");
    s = spaceAfterEachRef(s);
    s = s.replace(/(<\/a>)(?:\s|<br\s*\/?>)+/gi, "$1 ");
    s = s.replace(/[ \t]*\n+[ \t]*/g, " ");
    s = s.replace(/ {2,}/g, " ");
    return s.replace(/^\s+|\s+$/g, "");
  }

  function cleanRefLabel(raw) {
    var s = String(raw || "");
    if (/<|&lt;/i.test(s)) {
      var hits = s.match(/\d?[A-Za-z]{2,5}\s+\d+\s*:\s*\d+(?:\s*[-–]\s*\d+)?/g) || [];
      if (hits.length) s = hits[hits.length - 1];
      else s = s.replace(/<[^>]+>/g, " ");
    }
    return s.replace(/\s+/g, " ").replace(/\s*:\s*/, ":").replace(/\s*[-–]\s*/, "-").trim();
  }

  function looksMangledRefs(html) {
    var s = String(html || "");
    return (
      /data-ref\s*=\s*["'][^"']*</i.test(s) ||
      /data-ref\s*=\s*["']\s*</i.test(s) ||
      /<\/a>\s*-\s*\d/.test(s) ||
      /-\d+">[A-Za-z]/.test(s)
    );
  }

  function hasCoveringDataRef(html, vis) {
    var want = String(vis || "").toLowerCase();
    if (!want) return false;
    var re = /data-ref\s*=\s*["']([^"']+)["']/gi;
    var m;
    var src = String(html || "");
    while ((m = re.exec(src))) {
      var got = String(m[1] || "").toLowerCase();
      if (got === want || got.indexOf(want) === 0) return true;
    }
    return false;
  }

  function wrapBareRefText(html, vis, anchor) {
    var re = new RegExp(vis.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "i");
    var longer = new RegExp(vis.replace(/[.*+?^${}()|[\]\\]/g, "\\$&") + "\\s*[-–]\\s*\\d+", "i");
    var parts = String(html || "").split(/(<[^>]+>)/);
    for (var i = 0; i < parts.length; i++) {
      if (!parts[i] || parts[i].charAt(0) === "<") continue;
      if (longer.test(parts[i])) continue;
      if (re.test(parts[i])) {
        parts[i] = parts[i].replace(re, anchor);
        break;
      }
    }
    return parts.join("");
  }

  function sanitizeRefHtml(html) {
    var s = String(html || "").replace(/<span\b[^>]*\bfn\b[^>]*>\s*<\/span>/gi, "");
    if (!looksMangledRefs(s)) return s;
    var labels = [];
    var text = s.replace(/">/g, " ").replace(/<[^>]+>/g, " ");
    var hits = text.match(/\d?[A-Za-z]{2,5}\s+\d+\s*:\s*\d+(?:\s*[-–]\s*\d+)?/g) || [];
    hits.forEach(function (h) {
      var lab = h.replace(/\s+/g, " ").replace(/\s*:\s*/, ":").replace(/\s*[-–]\s*/, "-");
      var k = lab.toLowerCase();
      var shorter = labels.findIndex(function (x) {
        return k.indexOf(x.toLowerCase()) === 0 && k.length > x.length;
      });
      if (shorter >= 0) labels[shorter] = lab;
      else if (
        !labels.some(function (x) {
          return x.toLowerCase() === k || x.toLowerCase().indexOf(k) === 0;
        })
      )
        labels.push(lab);
    });
    var nums = (s.match(/<span\b[^>]*\bfn\b[^>]*>\s*\d+\s*<\/span>/gi) || [])
      .map(function (t) {
        return (t.match(/\d+/) || [""])[0];
      })
      .filter(Boolean);
    var bits = labels.map(function (lab, i) {
      var n = nums[i] || String(i + 1);
      return '<span class="fn">' + n + '</span> <a class="ref" href="#ref" data-ref="' + lab + '">' + lab + "</a>";
    });
    return bits.join("\n\n");
  }

  function keepPopupRefs(next, prev) {
    if (!/<a\b[^>]*\bref\b/i.test(prev)) return next;
    var out = sanitizeRefHtml(next);
    var re = /<a\b[^>]*\bref\b[^>]*>[\s\S]*?<\/a>/gi;
    var m;
    var src = String(prev || "");
    var visList = [];
    while ((m = re.exec(src))) {
      var vis = cleanRefLabel(m[0]);
      if (!vis || vis.indexOf("<") >= 0) continue;
      visList.push(vis);
    }
    visList.sort(function (a, b) {
      return b.length - a.length;
    });
    visList.forEach(function (vis) {
      if (hasCoveringDataRef(out, vis)) return;
      var anchor = '<a class="ref" href="#ref" data-ref="' + vis.replace(/"/g, "") + '">' + vis + "</a>";
      out = wrapBareRefText(out, vis, anchor);
    });
    return out;
  }

  function inFootnotesCol(el) {
    var col = el && el.closest && el.closest(".col");
    return !!(col && col.classList.contains("col-footnotes"));
  }

  function selectedText() {
    var sel = global.getSelection && global.getSelection();
    if (!sel || sel.isCollapsed) return "";
    return String(sel.toString() || "").replace(/\s+/g, " ").trim();
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

  function nextUsefulNode(n) {
    while (n && n.nodeType === 3) {
      var nx = n.nextSibling;
      if (!String(n.nodeValue || "").trim()) {
        if (n.parentNode) n.parentNode.removeChild(n);
      }
      n = nx;
    }
    return n;
  }

  function glueNoteRef(fn) {
    if (!fn || !fn.parentNode) return;
    if (!(fn.closest && fn.closest(".col-footnotes"))) return;
    var keep = fn.parentNode.classList && fn.parentNode.classList.contains("fn-keep") ? fn.parentNode : null;
    if (!keep) {
      keep = document.createElement("span");
      keep.className = "fn-keep";
      fn.parentNode.insertBefore(keep, fn);
      keep.appendChild(fn);
    }
    var n = nextUsefulNode(fn.nextSibling);
    if (n && n.nodeType === 1 && n.classList && n.classList.contains("ref")) {
      keep.appendChild(n);
      return;
    }
    n = nextUsefulNode(keep.nextSibling);
    if (n && n.nodeType === 1 && n.classList && n.classList.contains("ref")) keep.appendChild(n);
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
    if (inNotes) glueNoteRef(fn);
    else glueFnToPrevWord(fn);
  }

  function spaceAfterFn(fn) {
    paintFnHit(fn);
    if (typeof api.titlePainter === "function") api.titlePainter(fn);
  }

  function fnNodeForRef(a) {
    if (!a) return null;
    var inner = a.querySelector && a.querySelector(".fn");
    if (inner) return inner;
    var prev = a.previousElementSibling;
    if (prev && prev.classList && prev.classList.contains("fn")) return prev;
    if (prev && prev.classList && prev.classList.contains("fn-keep")) {
      inner = prev.querySelector && prev.querySelector(".fn");
      if (inner) return inner;
    }
    return null;
  }

  function liftFnOutOfRef(a) {
    if (!a || !a.parentNode) return null;
    var inner = a.querySelector && a.querySelector(".fn");
    if (!inner) return fnNodeForRef(a);
    a.parentNode.insertBefore(inner, a);
    spaceAfterFn(inner);
    return inner;
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
    var sel = global.getSelection && global.getSelection();
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
      row.querySelectorAll(".fn").forEach(function (fnEl) {
        var t = String(fnEl.textContent || "");
        if (t.charAt(0) === tok) {
          fnEl.textContent = t.slice(1);
          spaceAfterFn(fnEl);
        } else spaceAfterFn(fnEl);
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

  function paintAll(root) {
    ensureFnStyle();
    root = root || document;
    root.querySelectorAll("a.ref").forEach(liftFnOutOfRef);
    root.querySelectorAll(".fn").forEach(spaceAfterFn);
    dedupeFootnoteRefs(root);
    watchFootnoteOrder();
    root.querySelectorAll(".para").forEach(renumberRow);
    if (typeof api.titlePainter === "function") {
      root.querySelectorAll(".fn").forEach(api.titlePainter);
    }
  }

  api.isFootnotesFormat = isFootnotesFormat;
  api.footnoteNumsFromText = footnoteNumsFromText;
  api.liftTypedFnsInPlain = liftTypedFnsInPlain;
  api.formatNotesCol = formatNotesCol;
  api.spaceAfterEachRef = spaceAfterEachRef;
  api.cleanRefLabel = cleanRefLabel;
  api.sanitizeRefHtml = sanitizeRefHtml;
  api.keepPopupRefs = keepPopupRefs;
  api.inFootnotesCol = inFootnotesCol;
  api.applyFootnote = applyFootnote;
  api.prependFootnote = prependFootnote;
  api.renumberRow = renumberRow;
  api.paintAll = paintAll;
  api.ensureFnStyle = ensureFnStyle;
  api.setTitlePainter = function (fn) {
    api.titlePainter = fn;
  };

  ensureFnStyle();
  global.ewFootnotes = api;
})(window);
