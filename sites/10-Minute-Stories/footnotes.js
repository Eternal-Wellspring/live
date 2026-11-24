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
      "a.ref,.col a.ref,.col-text a.ref,.para a.ref{color:var(--title,#005eb8)!important;font-family:inherit!important;font-size:inherit!important;font-weight:inherit!important;font-style:inherit!important;text-decoration:underline;text-underline-offset:0.15em;cursor:pointer;white-space:normal;overflow-wrap:anywhere}" +
      ".fn-keep{white-space:nowrap}" +
      ".fn-keep.fn-join::before{content:'\\2060'}" +
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
    var mark = el && el.querySelector && el.querySelector(".fn-mark");
    var raw = String(((mark || el) && (mark || el).textContent) || "").trim();
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
    if (keep && keep.querySelector(".fn") !== fn) {
      var own = document.createElement("span");
      own.className = "fn-keep";
      keep.parentNode.insertBefore(own, keep.nextSibling);
      while (fn.nextSibling) own.appendChild(fn.nextSibling);
      own.insertBefore(fn, own.firstChild);
      keep = own;
    }
    if (!keep) {
      keep = document.createElement("span");
      keep.className = "fn-keep";
      fn.parentNode.insertBefore(keep, fn);
      keep.appendChild(fn);
    }
    var n = nextUsefulNode(fn.nextSibling);
    if (n && n.nodeType === 1 && n.classList && n.classList.contains("ref")) {
      if (n.parentNode !== keep) keep.appendChild(n);
      return;
    }
    n = nextUsefulNode(keep.nextSibling);
    if (n && n.nodeType === 1 && n.classList && n.classList.contains("ref")) keep.appendChild(n);
  }

  function hasWordChar(s) {
    return /[0-9A-Za-z]/.test(String(s || ""));
  }

  function keepHoldsWord(keep, fn) {
    if (!keep) return false;
    var t = "";
    var n = keep.firstChild;
    while (n) {
      if (fn && (n === fn || (n.nodeType === 1 && n.contains && n.contains(fn)))) {
        n = n.nextSibling;
        continue;
      }
      if (n.nodeType === 1 && n.classList && (n.classList.contains("fn") || n.classList.contains("fn-tip"))) {
        n = n.nextSibling;
        continue;
      }
      t += n.textContent || "";
      n = n.nextSibling;
    }
    return hasWordChar(t);
  }

  function isInlineGlueParent(el) {
    if (!el || el.nodeType !== 1) return false;
    if (!/^(SPAN|B|I|EM|STRONG|U|FONT|SMALL|SUB|SUP)$/.test(el.tagName)) return false;
    if (el.classList && (el.classList.contains("fn") || el.classList.contains("fn-keep") || el.classList.contains("fn-tip") || el.classList.contains("bit") || el.classList.contains("col-text") || el.classList.contains("ref"))) return false;
    return true;
  }

  function isHardStop(el) {
    if (!el || el.nodeType !== 1) return true;
    if (/^(DIV|P|BR|IMG|TABLE|TD|TH|LI|UL|OL|SECTION|ARTICLE|MAIN|BODY|HTML)$/.test(el.tagName)) return true;
    if (el.classList && (el.classList.contains("bit") || el.classList.contains("col") || el.classList.contains("col-text") || el.classList.contains("para") || el.classList.contains("subsec") || el.classList.contains("subsec-frame") || el.classList.contains("row-block") || el.classList.contains("tab-panel"))) return true;
    return false;
  }

  function peelWordFromTextNode(textNode) {
    var t = String(textNode.nodeValue || "").replace(/\s+$/, "");
    var m = t.match(/^([\s\S]*?)(\S+)$/);
    if (!m || !m[2]) {
      if (!String(textNode.nodeValue || "").replace(/\s+/g, "") && textNode.parentNode) textNode.parentNode.removeChild(textNode);
      return null;
    }
    textNode.nodeValue = m[1];
    if (!textNode.nodeValue && textNode.parentNode) textNode.parentNode.removeChild(textNode);
    return { text: m[2], hasWord: hasWordChar(m[2]) };
  }

  function lastTextNode(el, skipFn) {
    var walker = document.createTreeWalker(el, NodeFilter.SHOW_TEXT, null);
    var last = null;
    var n;
    while ((n = walker.nextNode())) {
      if (skipFn && skipFn.contains && skipFn.contains(n)) continue;
      if (n.parentElement && n.parentElement.closest && n.parentElement.closest(".fn, .fn-tip")) continue;
      if (String(n.nodeValue || "").replace(/\s/g, "").length) last = n;
    }
    return last;
  }

  function peelLastWordFromElement(el, fn) {
    var tn = lastTextNode(el, fn);
    if (!tn) return null;
    var peeled = peelWordFromTextNode(tn);
    if (!peeled) return null;
    var clone = el.cloneNode(false);
    clone.appendChild(document.createTextNode(peeled.text));
    if (!String(el.textContent || "").replace(/\s/g, "").length && !(el.querySelector && el.querySelector("img, br, .fn, .fn-keep"))) {
      if (el.parentNode) el.parentNode.removeChild(el);
    }
    return { node: clone, hasWord: peeled.hasWord };
  }

  function splitContentAfterKeep(keep) {
    var p = keep.parentNode;
    if (!p) return;
    var after = keep.nextSibling;
    var meaningful = false;
    var n = after;
    while (n) {
      if (n.nodeType === 1 || (n.nodeType === 3 && String(n.nodeValue || "").replace(/\s/g, "").length)) {
        meaningful = true;
        break;
      }
      n = n.nextSibling;
    }
    if (!meaningful) return;
    var tail = p.cloneNode(false);
    while (keep.nextSibling) tail.appendChild(keep.nextSibling);
    if (p.parentNode) p.parentNode.insertBefore(tail, p.nextSibling);
  }

  function wrapKeepContentsInStyleClone(keep, styleEl) {
    if (!keep || !styleEl || !isInlineGlueParent(styleEl)) return;
    var clone = styleEl.cloneNode(false);
    while (keep.firstChild) clone.appendChild(keep.firstChild);
    keep.appendChild(clone);
  }

  function liftKeepToPeelSource(keep, sourceNode) {
    var p = keep.parentNode;
    if (!p || !sourceNode) return;
    if (p.contains(sourceNode)) return;
    if (!isInlineGlueParent(p)) return;
    splitContentAfterKeep(keep);
    wrapKeepContentsInStyleClone(keep, p);
    var host = p.parentNode;
    if (!host) return;
    host.insertBefore(keep, p.nextSibling);
    if (!p.hasChildNodes() || (!String(p.textContent || "").replace(/\s/g, "").length && !(p.querySelector && p.querySelector("img, br, .fn, .fn-keep")))) {
      host.removeChild(p);
    }
  }

  // Keep the marker on the line of the word before it, even when a font-size
  // (or other inline) span sits between them, and even when only punctuation
  // is in the same span as the marker (24 Nov, job 81).
  function glueFnToPrevWord(fn) {
    if (!fn || !fn.parentNode) return;
    if (fn.closest && fn.closest(".col-footnotes")) return;
    if (!fnDigits(fn)) return;

    var keep = fn.parentNode.classList && fn.parentNode.classList.contains("fn-keep") ? fn.parentNode : null;
    if (keep && keepHoldsWord(keep, fn)) return;

    var lead = fn.previousSibling;
    if (!keep && lead && lead.nodeType === 1 && lead.classList && lead.classList.contains("fn-keep")) {
      lead.appendChild(fn);
      return;
    }

    if (!keep) {
      keep = document.createElement("span");
      keep.className = "fn-keep";
      fn.parentNode.insertBefore(keep, fn);
      keep.appendChild(fn);
    }

    var steps = 0;
    var from = keep;
    while (steps++ < 16) {
      var prev = from.previousSibling;
      while (prev && prev.nodeType === 3 && !String(prev.nodeValue || "").replace(/\s+/g, "").length) {
        var blank = prev;
        prev = prev.previousSibling;
        if (blank.parentNode) blank.parentNode.removeChild(blank);
      }
      if (!prev) {
        if (from.parentNode && isInlineGlueParent(from.parentNode) && !isHardStop(from.parentNode)) {
          from = from.parentNode;
          continue;
        }
        break;
      }
      if (prev.nodeType === 3) {
        var host = prev.parentNode;
        var peeled = peelWordFromTextNode(prev);
        if (!peeled) break;
        liftKeepToPeelSource(keep, host);
        keep.insertBefore(document.createTextNode(peeled.text), keep.firstChild);
        if (peeled.hasWord) return;
        from = keep;
        continue;
      }
      if (prev.nodeType === 1 && fnGlueWhole(prev)) {
        var wholeWord = hasWordChar(prev.textContent || "");
        liftKeepToPeelSource(keep, prev);
        keep.insertBefore(prev, keep.firstChild);
        if (wholeWord) return;
        from = keep;
        continue;
      }
      if (prev.nodeType === 1 && isInlineGlueParent(prev)) {
        var part = peelLastWordFromElement(prev, fn);
        if (!part) {
          if (fnEndsInWord(prev)) keep.classList.add("fn-join");
          break;
        }
        liftKeepToPeelSource(keep, prev);
        keep.insertBefore(part.node, keep.firstChild);
        if (part.hasWord) return;
        from = keep;
        continue;
      }
      if (prev.nodeType === 1 && fnEndsInWord(prev)) keep.classList.add("fn-join");
      break;
    }
  }

  function fnGlueWhole(el) {
    if (!/^(SPAN|B|I|EM|STRONG|U|FONT|SMALL|SUB|SUP)$/.test(el.tagName)) return false;
    if (el.classList && (el.classList.contains("fn") || el.classList.contains("fn-keep") || el.classList.contains("fn-tip"))) return false;
    if (el.querySelector && el.querySelector(".fn, .fn-keep, a, br, img")) return false;
    var t = String(el.textContent || "");
    return !!t && !/\s/.test(t);
  }
  function fnEndsInWord(el) {
    if (/^(BR|IMG|DIV|P)$/.test(el.tagName)) return false;
    if (el.classList && (el.classList.contains("fn") || el.classList.contains("fn-keep"))) return false;
    return /\S$/.test(String(el.textContent || ""));
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
      var pv = String(prev.nodeValue || "").replace(/\s+$/, "");
      if (pv !== prev.nodeValue) prev.nodeValue = pv;
      if (!prev.nodeValue) prev.parentNode.removeChild(prev);
    }
    var next = fn.nextSibling;
    if (next && next.nodeType === 3) {
      var nv = String(next.nodeValue || "").replace(/^\s+/, "");
      if (nv !== next.nodeValue) next.nodeValue = nv;
      if (!next.nodeValue) next.parentNode.removeChild(next);
    }
    var sp = "\u00a0";
    var before = inNotes ? "" : sp;
    var after = extra ? sp + sp : sp;
    var paint = before + '<span class="fn-mark">' + n + "</span>" + after;
    var tipEl = fn.querySelector && fn.querySelector(".fn-tip");
    var bare = fn.innerHTML.replace(tipEl ? tipEl.outerHTML : "\u0000", "");
    var probe = document.createElement("span");
    probe.innerHTML = paint;
    if (bare !== probe.innerHTML) fn.innerHTML = paint;
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
      var n = fnValue(list[i]);
      if (!n) continue;
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

  function caretTextAt(host, node, offset) {
    var r = document.createRange();
    r.selectNodeContents(host);
    try {
      r.setEnd(node, offset);
    } catch (e) {
      return -1;
    }
    var box = document.createElement("div");
    box.appendChild(r.cloneContents());
    box.querySelectorAll(".fn").forEach(function (f) {
      f.parentNode.removeChild(f);
    });
    return box.textContent.length;
  }

  function saveCaret(row) {
    var sel = global.getSelection && global.getSelection();
    if (!sel || !sel.rangeCount || !sel.isCollapsed) return null;
    var r = sel.getRangeAt(0);
    var start = r.startContainer;
    if (!row.contains(start)) return null;
    var el = start.nodeType === 1 ? start : start.parentNode;
    var host = (el.closest && el.closest(".col-text")) || row;
    return { host: host, node: start, offset: r.startOffset, at: caretTextAt(host, start, r.startOffset) };
  }

  function restoreCaret(c) {
    if (!c || c.at < 0) return;
    var sel = global.getSelection();
    if (sel.rangeCount) {
      var r = sel.getRangeAt(0);
      if (r.startContainer === c.node && r.startOffset === c.offset && c.host.contains(c.node)) return;
    }
    if (c.host.contains(c.node) && caretTextAt(c.host, c.node, c.offset) === c.at && !(c.node.parentNode && c.node.parentNode.closest && c.node.parentNode.closest(".fn"))) {
      place(c.node, c.offset);
      return;
    }
    var walk = document.createTreeWalker(c.host, NodeFilter.SHOW_TEXT);
    var count = 0;
    var t;
    var last = null;
    while ((t = walk.nextNode())) {
      if (t.parentNode.closest && t.parentNode.closest(".fn")) continue;
      var len = t.nodeValue.length;
      if (c.at === 0 || count + len >= c.at) {
        place(t, c.at - count);
        return;
      }
      count += len;
      last = t;
    }
    if (last) place(last, last.nodeValue.length);
    function place(node, offset) {
      var nr = document.createRange();
      nr.setStart(node, Math.max(0, Math.min(offset, node.nodeType === 3 ? node.nodeValue.length : node.childNodes.length)));
      nr.collapse(true);
      sel.removeAllRanges();
      sel.addRange(nr);
    }
  }

  function renumberRow(row, full) {
    if (!row || renumbering) return;
    var fnCol = row.querySelector(".col-footnotes");
    if (!fnCol) return;
    var refs = fnCol.querySelectorAll("a.ref");
    if (!refs.length) return;
    renumbering = true;
    var caret = saveCaret(row);
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
        if (item.old !== item.next || !item.fn.querySelector(".fn-mark")) item.fn.textContent = tok + fnLabel(item.next);
      });
      story.forEach(function (s) {
        var nxt = oldToNew[s.old];
        if (nxt && (nxt !== s.old || !s.el.querySelector(".fn-mark"))) s.el.textContent = tok + fnLabel(nxt);
      });
      var rowFns = row.querySelectorAll(".fn");
      var redo = [];
      rowFns.forEach(function (fnEl) {
        var t = String(fnEl.textContent || "");
        if (t.charAt(0) === tok) fnEl.textContent = t.slice(1);
        if (full || t.charAt(0) === tok || !fnEl.querySelector(".fn-mark")) redo.push(fnEl);
      });
      redo.forEach(paintFnHit);
      if (redo.length && typeof api.titlePainter === "function") rowFns.forEach(api.titlePainter);
      restoreCaret(caret);
    } finally {
      setTimeout(function () {
        renumbering = false;
      }, 0);
    }
  }

  function touchesFootnote(list) {
    for (var i = 0; i < list.length; i++) {
      var m = list[i];
      if (m.type !== "childList") continue;
      var nodes = [].slice.call(m.addedNodes).concat([].slice.call(m.removedNodes));
      for (var j = 0; j < nodes.length; j++) {
        var nd = nodes[j];
        if (nd.nodeType !== 1) continue;
        if (nd.matches && nd.matches(".fn, a.ref")) return true;
        if (nd.querySelector && nd.querySelector(".fn, a.ref")) return true;
      }
    }
    return false;
  }

  function watchFootnoteOrder() {
    document.querySelectorAll(".col-footnotes").forEach(function (col) {
      if (col._ewMo) return;
      col._ewMo = new MutationObserver(function (list) {
        if (renumbering) return;
        if (!touchesFootnote(list)) return;
        var row = col.closest(".para");
        clearTimeout(col._ewRn);
        col._ewRn = setTimeout(function () {
          renumberRow(row);
        }, 160);
      });
      col._ewMo.observe(col.closest(".para") || col, { childList: true, subtree: true });
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
    root.querySelectorAll(".para").forEach(function (row) {
      renumberRow(row, true);
    });
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

// 10 Minute Stories only (TMS order from John, 22 Nov 2026): the story's word count and reading time at the
// foot of each story page. It is counted in the browser from the story text, so it stays right when the text
// changes. Only the Story columns count: no footnotes, footnote markers or refs, pop-up notes (the hidden text
// after an info mark), headings, row titles, Contents, Settings, pictures or captions.
// Reading time = words / 150, rounded to the nearest minute, at least 1 min. Other sites and pages are untouched.
(function () {
  if (window.ewStoryLengthBound) return;
  window.ewStoryLengthBound = true;
  function storyPage() {
    if (window.ewFolder !== "10-Minute-Stories") return false;
    var last = String(location.pathname || "").split("/").pop() || "";
    try {
      last = decodeURIComponent(last);
    } catch (e) {}
    return /^\d+-/.test(last);
  }
  function storyWords() {
    var n = 0;
    var cols = document.querySelectorAll(".tab-panel .col:not(.col-footnotes):not(.col-photo) > .col-text");
    Array.prototype.forEach.call(cols, function (src) {
      if (src.closest(".describe-contents")) return;
      var c = src.cloneNode(true);
      Array.prototype.forEach.call(c.querySelectorAll(".bit.ew-info"), function (b) {
        var s = b.nextElementSibling;
        while (s) {
          var next = s.nextElementSibling;
          if (s.classList.contains("bit")) s.remove();
          s = next;
        }
      });
      var drop = ".ew-info, .fn, a.ref, h1, h2, h3, h4, h5, h6, .row-title, img, picture, video, audio, iframe, figure, figcaption, .col-pic-alt, button, script, style, br";
      Array.prototype.forEach.call(c.querySelectorAll(drop), function (e) {
        if (c.contains(e)) e.replaceWith(" ");
      });
      Array.prototype.forEach.call(c.querySelectorAll(".bit, p, div, li"), function (e) {
        e.appendChild(document.createTextNode(" "));
      });
      String(c.textContent || "").split(/\s+/).forEach(function (w) {
        if (/[0-9A-Za-z\u00C0-\u024F]/.test(w)) n++;
      });
    });
    return n;
  }
  function paint() {
    if (!storyPage() || document.querySelector(".ew-story-length")) return;
    var n = storyWords();
    if (!n) return;
    var el = document.createElement("footer");
    el.className = "date-updated ew-story-length";
    el.textContent = n.toLocaleString("en-GB") + " words \u00b7 " + Math.max(1, Math.round(n / 150)) + " min read";
    var upd = document.querySelector("footer.date-updated");
    if (upd && upd.parentNode) upd.parentNode.insertBefore(el, upd);
    else document.body.appendChild(el);
  }
  if (document.querySelector("footer.date-updated")) paint();
  else document.addEventListener("DOMContentLoaded", paint);
})();
