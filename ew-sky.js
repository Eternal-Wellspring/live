/* Sky plates. Name them so 1 2 3 sit together: sky-1.jpg near, sky-2.jpg middle, sky-3.jpg far. */
(function () {
  var cvs = document.getElementById("ew-sky");
  if (!cvs || !cvs.getContext) return;
  var ctx = cvs.getContext("2d", { alpha: false });
  var reduced = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var dpr = 1;
  var w = 0;
  var h = 0;
  var last = 0;
  var stars = [];
  var starCount = -1;
  var wisps = [];
  var meteor = null;
  var nextMeteorAt = 0;
  var comet = null;
  var nextCometAt = 0;
  var layers = [];
  var front = null;

  function rnd(a, b) {
    return a + Math.random() * (b - a);
  }
  function seed(n) {
    var x = Math.sin(n * 127.1) * 43758.5453;
    return x - Math.floor(x);
  }
  function skyOn() {
    return window.getComputedStyle(cvs).display !== "none";
  }
  function size() {
    dpr = Math.min(window.devicePixelRatio || 1, 2);
    w = window.innerWidth;
    h = window.innerHeight;
    cvs.width = Math.max(1, Math.round(w * dpr));
    cvs.height = Math.max(1, Math.round(h * dpr));
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }
  function cssVar(name, fallback) {
    var v = getComputedStyle(document.documentElement).getPropertyValue(name).trim();
    var n = parseFloat(v);
    return isFinite(n) ? n : fallback;
  }
  function wave(now, mins, origin) {
    var ms = Math.max(1, mins) * 60 * 1000;
    var u = ((now - origin) / ms) % 2;
    return u > 1 ? 2 - u : u;
  }
  function makeStars(n) {
    stars = [];
    starCount = n;
    var i;
    for (i = 0; i < n; i++) {
      stars.push({
        x: seed(i + 1),
        y: seed(i + 51),
        r: 0.7 + seed(i + 101) * (i % 7 === 0 ? 2.4 : 1.3),
        a: 0.78 + seed(i + 151) * 0.22,
        p: seed(i + 201) * Math.PI * 2,
        s: 0.65 + seed(i + 251) * 0.7,
        c: seed(i + 301) > 0.82 ? "255,226,196" : seed(i + 321) > 0.65 ? "196,214,255" : "255,255,255",
      });
    }
  }
  function makeField() {
    makeStars(Math.round(cssVar("--ew-sky-stars", 50)));
    wisps = [];
    nextMeteorAt = performance.now() + rnd(28000, 80000);
    nextCometAt = performance.now() + rnd(8000, 18000);
  }
  function spawnMeteor() {
    var edge = Math.floor(rnd(0, 4));
    var x;
    var y;
    var ang;
    if (edge === 0) {
      x = rnd(0, w);
      y = -16;
      ang = rnd(0.35, Math.PI - 0.35);
    } else if (edge === 1) {
      x = w + 16;
      y = rnd(0, h);
      ang = rnd((Math.PI * 2) / 3, (Math.PI * 4) / 3);
    } else if (edge === 2) {
      x = rnd(0, w);
      y = h + 16;
      ang = rnd(Math.PI + 0.35, Math.PI * 2 - 0.35);
    } else {
      x = -16;
      y = rnd(0, h);
      ang = rnd(-0.7, 0.7);
    }
    var sp = rnd(360, 580);
    meteor = {
      x: x,
      y: y,
      vx: Math.cos(ang) * sp,
      vy: Math.sin(ang) * sp,
      len: rnd(70, 125),
      born: performance.now(),
      life: rnd(500, 880),
    };
  }
  function spawnComet() {
    var toward = Math.random() < 0.5;
    var ang = rnd(0, Math.PI * 2);
    var x = w * rnd(0.12, 0.88);
    var y = h * rnd(0.12, 0.88);
    var edge = Math.floor(rnd(0, 4));
    if (toward) {
      if (edge === 0) {
        x = rnd(0.15, 0.85) * w;
        y = -20;
      } else if (edge === 1) {
        x = w + 20;
        y = rnd(0.15, 0.85) * h;
      } else if (edge === 2) {
        x = rnd(0.15, 0.85) * w;
        y = h + 20;
      } else {
        x = -20;
        y = rnd(0.15, 0.85) * h;
      }
      ang = Math.atan2(h * 0.5 - y, w * 0.5 - x) + rnd(-0.35, 0.35);
    } else {
      ang = rnd(0, Math.PI * 2);
      x = w * 0.5 + rnd(-0.2, 0.2) * w;
      y = h * 0.5 + rnd(-0.2, 0.2) * h;
    }
    var sp = rnd(22, 48);
    comet = {
      x: x,
      y: y,
      vx: Math.cos(ang) * sp,
      vy: Math.sin(ang) * sp,
      toward: toward,
      size: toward ? rnd(1.2, 2) : rnd(4.5, 7),
      trail: [],
      born: performance.now(),
      life: rnd(9000, 18000),
    };
  }
  function drawComet(now, dt) {
    if (!comet) return;
    comet.x += comet.vx * dt;
    comet.y += comet.vy * dt;
    var age = now - comet.born;
    var u = age / comet.life;
    if (u >= 1 || comet.x < -200 || comet.y < -200 || comet.x > w + 200 || comet.y > h + 200) {
      comet = null;
      nextCometAt = now + rnd(14000, 38000);
      return;
    }
    var grow = comet.toward ? 1 + u * 2.4 : Math.max(0.25, 1 - u * 0.85);
    var head = comet.size * grow;
    var fade = comet.toward ? Math.min(1, 0.35 + u * 0.9) : Math.max(0.2, 1 - u * 0.75);
    var last = comet.trail[comet.trail.length - 1];
    if (!last || Math.hypot(comet.x - last.x, comet.y - last.y) >= 1.35) {
      comet.trail.push({ x: comet.x, y: comet.y });
    }
    var dist = 0;
    var i;
    for (i = comet.trail.length - 1; i > 0; i--) {
      dist += Math.hypot(comet.trail[i].x - comet.trail[i - 1].x, comet.trail[i].y - comet.trail[i - 1].y);
      if (dist > 340) {
        comet.trail.splice(0, i);
        break;
      }
    }
    var n = comet.trail.length;
    if (n > 1) {
      ctx.lineCap = "round";
      ctx.lineJoin = "round";
      for (i = 0; i < n - 1; i++) {
        var k = 1 - i / (n - 1);
        var a = fade * Math.pow(1 - k, 1.85) * 0.38;
        if (a < 0.008) continue;
        ctx.beginPath();
        ctx.strokeStyle = "rgba(255,236,210," + a.toFixed(3) + ")";
        ctx.lineWidth = Math.max(0.55, head * (0.9 + k * 1.15));
        ctx.moveTo(comet.trail[i].x, comet.trail[i].y);
        ctx.lineTo(comet.trail[i + 1].x, comet.trail[i + 1].y);
        ctx.stroke();
      }
      for (i = 0; i < n; i++) {
        var k2 = 1 - i / (n - 1);
        if (k2 > 0.22 && i % 2) continue;
        var dust = fade * Math.pow(1 - k2, 2.15) * 0.16;
        if (dust < 0.01) continue;
        ctx.beginPath();
        ctx.fillStyle = "rgba(255,242,220," + dust.toFixed(3) + ")";
        ctx.arc(comet.trail[i].x, comet.trail[i].y, head * (0.55 + k2 * 1.35), 0, Math.PI * 2);
        ctx.fill();
      }
    }
    ctx.beginPath();
    ctx.fillStyle = "rgba(255,248,235," + (0.85 * fade).toFixed(3) + ")";
    ctx.arc(comet.x, comet.y, Math.max(1.1, head), 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.fillStyle = "rgba(255,255,255," + (0.95 * fade).toFixed(3) + ")";
    ctx.arc(comet.x, comet.y, Math.max(0.6, head * 0.45), 0, Math.PI * 2);
    ctx.fill();
  }
  function Layer(urls, rate, alpha, zoomMul) {
    this.urls = urls || [];
    this.rate = rate;
    this.alpha = alpha;
    this.zoomMul = zoomMul;
    this.idx = 0;
    this.imgA = new Image();
    this.imgB = new Image();
    this.imgA.decoding = "async";
    this.imgB.decoding = "async";
    this.showing = 0;
    this.plateStart = performance.now();
    this.fading = false;
    this.fadeFrom = 0;
    this.primed = "";
    this.p = null;
    if (this.urls[0]) this.imgA.src = this.urls[0];
    if (this.urls[1]) this.imgB.src = this.urls[1];
    else if (this.urls[0]) this.imgB.src = this.urls[0];
  }
  Layer.prototype.cur = function () {
    return this.showing ? this.imgB : this.imgA;
  };
  Layer.prototype.other = function () {
    return this.showing ? this.imgA : this.imgB;
  };
  Layer.prototype.nextSrc = function () {
    return this.urls[(this.idx + 1) % Math.max(1, this.urls.length)];
  };
  Layer.prototype.primeNext = function () {
    if (!this.urls.length) return;
    var src = this.nextSrc();
    if (this.primed === src && this.other().naturalWidth) return;
    this.primed = src;
    this.other().src = src;
  };
  Layer.prototype.scanT = function (now) {
    var mins = cssVar("--ew-sky-creep", 18) / this.rate;
    var ms = Math.max(1, mins) * 60 * 1000;
    if (reduced) return 0.35;
    var u = (now - this.plateStart) / ms;
    if (u < 0) u = 0;
    if (u > 0.72) this.primeNext();
    if (u >= 1) {
      u = 1;
      if (!this.fading) {
        this.primeNext();
        if (this.other().complete && this.other().naturalWidth) {
          this.fading = true;
          this.fadeFrom = now;
        }
      }
    }
    return u;
  };
  Layer.prototype.layout = function (img, t, now) {
    if (!img || !img.naturalWidth) return null;
    var zoomAmt = cssVar("--ew-sky-zoom", 1.4);
    var zoomMins = cssVar("--ew-sky-zoom-mins", 12);
    if (zoomAmt < 1.05) zoomAmt = 1.05;
    var z = reduced ? 0.45 : wave(now, zoomMins / this.rate, this.plateStart);
    var base = 1.18 * this.zoomMul;
    var extra = base + (base * zoomAmt - base) * z;
    var s = Math.max((w * extra) / img.naturalWidth, (h * extra) / img.naturalHeight);
    var dw = img.naturalWidth * s;
    var dh = img.naturalHeight * s;
    var roomX = Math.max(0, dw - w);
    var roomY = Math.max(0, dh - h);
    var vMins = Math.max(cssVar("--ew-sky-creep", 18) * 2, 20);
    var v = reduced ? 0.55 : wave(now, vMins, 0);
    return {
      dw: dw,
      dh: dh,
      ox: roomX * t,
      oy: roomY * (t * v + (1 - t) * (1 - v)),
      t: t,
    };
  };
  Layer.prototype.draw = function (now) {
    if (!this.urls.length) return null;
    var t = this.scanT(now);
    var a = 1;
    var b = 0;
    if (this.fading) {
      var fadeMs = Math.max(400, cssVar("--ew-sky-fade", 3) * 1000);
      var u = (now - this.fadeFrom) / fadeMs;
      if (u < 0) u = 0;
      if (u > 1) u = 1;
      u = u * u * (3 - 2 * u);
      a = 1 - u;
      b = u;
      if ((now - this.fadeFrom) / fadeMs >= 1) {
        this.fading = false;
        this.primed = "";
        this.idx = (this.idx + 1) % this.urls.length;
        this.showing = this.showing ? 0 : 1;
        this.plateStart = now;
        t = 0;
        a = 1;
        b = 0;
      }
    }
    var p = this.layout(this.cur(), t, now);
    if (p && a > 0) {
      ctx.save();
      ctx.globalAlpha = this.alpha * a;
      ctx.drawImage(this.cur(), -p.ox, -p.oy, p.dw, p.dh);
      ctx.restore();
    }
    if (b > 0) {
      var p2 = this.layout(this.other(), 0, now);
      if (p2) {
        ctx.save();
        ctx.globalAlpha = this.alpha * b;
        ctx.drawImage(this.other(), -p2.ox, -p2.oy, p2.dw, p2.dh);
        ctx.restore();
      }
    }
    this.p = p;
    return p;
  };
  function drawWisps(p, now) {
    if (!p) return;
    var i;
    for (i = 0; i < wisps.length; i++) {
      var g = wisps[i];
      var lag = reduced ? p.t : p.t * g.lag;
      var gx = g.x * p.dw - (p.dw - w) * lag;
      var gy = g.y * p.dh - (p.dh - h) * lag * 0.7;
      ctx.save();
      ctx.translate(gx, gy);
      ctx.rotate(g.rot);
      var grd = ctx.createRadialGradient(0, 0, 0, 0, 0, g.rx);
      grd.addColorStop(0, "rgba(" + g.rgb + "," + g.a + ")");
      grd.addColorStop(0.45, "rgba(" + g.rgb + "," + g.a * 0.35 + ")");
      grd.addColorStop(1, "rgba(" + g.rgb + ",0)");
      ctx.fillStyle = grd;
      ctx.beginPath();
      ctx.ellipse(0, 0, g.rx, g.ry, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }
    for (i = 0; i < stars.length; i++) {
      var st = stars[i];
      var sx = st.x * p.dw - p.ox;
      var sy = st.y * p.dh - p.oy;
      if (sx < -5 || sy < -5 || sx > w + 5 || sy > h + 5) continue;
      var on = !reduced && cssVar("--ew-sky-twinkle", 1) >= 0.5;
      var bright = cssVar("--ew-sky-bright", 70) / 100;
      if (bright < 0) bright = 0;
      var speed = Math.max(1, cssVar("--ew-sky-twinkle-speed", 6));
      var period = (16 / speed) * st.s;
      var tw = on ? 0.5 + 0.5 * (0.5 + 0.5 * Math.sin((now / 1000) * ((Math.PI * 2) / period) + st.p)) : 1;
      ctx.fillStyle = "rgba(" + st.c + "," + st.a * tw * bright + ")";
      ctx.beginPath();
      ctx.arc(sx, sy, st.r, 0, Math.PI * 2);
      ctx.fill();
    }
  }
  function frame(now) {
    if (!skyOn()) {
      last = 0;
      setTimeout(function () {
        requestAnimationFrame(frame);
      }, 400);
      return;
    }
    if (document.hidden) {
      last = 0;
      requestAnimationFrame(frame);
      return;
    }
    var dt = last ? Math.min(0.05, (now - last) / 1000) : 0.016;
    last = now;
    var want = Math.round(cssVar("--ew-sky-stars", 50));
    if (want < 0) want = 0;
    if (want > 400) want = 400;
    if (want !== starCount) makeStars(want);
    ctx.fillStyle = "#05070c";
    ctx.fillRect(0, 0, w, h);
    var i;
    for (i = 0; i < layers.length; i++) {
      layers[i].draw(now);
    }
    ctx.fillStyle = "rgba(5,7,12,0.48)";
    ctx.fillRect(0, 0, w, h);
    var p = front && front.p ? front.p : null;
    drawWisps(p, now);
    if (!reduced) {
      if (!comet && now >= nextCometAt) spawnComet();
      drawComet(now, dt);
      if (!meteor && now >= nextMeteorAt) spawnMeteor();
      if (meteor) {
        meteor.x += meteor.vx * dt;
        meteor.y += meteor.vy * dt;
        var age = now - meteor.born;
        if (age > meteor.life) {
          meteor = null;
          nextMeteorAt = now + rnd(45000, 120000);
        } else {
          var fade = 1 - age / meteor.life;
          var hyp = Math.hypot(meteor.vx, meteor.vy) || 1;
          var nx = meteor.vx / hyp;
          var ny = meteor.vy / hyp;
          var x2 = meteor.x - nx * meteor.len;
          var y2 = meteor.y - ny * meteor.len;
          var mg = ctx.createLinearGradient(x2, y2, meteor.x, meteor.y);
          mg.addColorStop(0, "rgba(210,224,255,0)");
          mg.addColorStop(1, "rgba(255,255,255," + 0.8 * fade + ")");
          ctx.strokeStyle = mg;
          ctx.lineWidth = 1.15;
          ctx.lineCap = "round";
          ctx.beginPath();
          ctx.moveTo(x2, y2);
          ctx.lineTo(meteor.x, meteor.y);
          ctx.stroke();
        }
      }
    }
    requestAnimationFrame(frame);
  }
  function useCatalog(d) {
    var L = (d && d.layers) || {};
    var one = (d && d.images) || [];
    var far = L["3"] && L["3"].length ? L["3"] : one.length ? one : ["/images/ew-sky.jpg"];
    var mid = L["2"] || [];
    var near = L["1"] || [];
    var stacked = (near.length ? 1 : 0) + (mid.length ? 1 : 0) + 1;
    layers = [
      new Layer(far, 0.48, 1, 0.92),
      new Layer(mid, 0.72, stacked > 1 ? 0.22 : 1, 1),
      new Layer(near, 1.05, stacked > 1 ? 0.16 : 1, 1.12),
    ];
    front = near.length ? layers[2] : mid.length ? layers[1] : layers[0];
  }
  function start() {
    size();
    makeField();
    window.addEventListener("resize", size);
    requestAnimationFrame(frame);
  }

  fetch("/sky-images")
    .then(function (r) {
      return r.ok ? r.json() : Promise.reject();
    })
    .then(function (d) {
      useCatalog(d);
      start();
    })
    .catch(function () {
      fetch("/images/sky/list.json")
        .then(function (r) {
          return r.ok ? r.json() : Promise.reject();
        })
        .then(function (d) {
          useCatalog(Array.isArray(d) ? { images: d, layers: { "3": d } } : d);
          start();
        })
        .catch(function () {
          useCatalog({ images: ["/images/ew-sky.jpg"], layers: { "3": ["/images/ew-sky.jpg"] } });
          start();
        });
    });
})();
