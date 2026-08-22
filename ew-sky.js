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
  var roadster = null;
  var nextRoadsterAt = 0;
  var teslaPic = null;
  var TESLA_NOSE = 0.22;
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
    nextRoadsterAt = performance.now() + rnd(5 * 60 * 1000, 9 * 60 * 1000);
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
  function pageRect() {
    var f = document.querySelector(".page-frame");
    if (!f) return null;
    var r = f.getBoundingClientRect();
    if (r.width < 8 || r.height < 8) return null;
    return { x: r.left, y: r.top, w: r.width, h: r.height };
  }
  function behindPage(x, y) {
    var r = pageRect();
    if (!r) return false;
    return x >= r.x && x <= r.x + r.w && y >= r.y && y <= r.y + r.h;
  }
  function skyVisible(x, y) {
    if (x < -90 || y < -90 || x > w + 90 || y > h + 90) return false;
    return !behindPage(x, y);
  }
  function clipSky() {
    var r = pageRect();
    if (!r) return;
    ctx.beginPath();
    ctx.rect(0, 0, w, h);
    ctx.rect(r.x, r.y, r.w, r.h);
    ctx.clip("evenodd");
  }
  function spawnComet() {
    var r = pageRect();
    var tx = r ? r.x + r.w * rnd(0.22, 0.78) : w * 0.5;
    var ty = r ? r.y + r.h * rnd(0.18, 0.82) : h * 0.5;
    var edge = Math.floor(rnd(0, 4));
    var x;
    var y;
    var m = 48;
    if (edge === 0) {
      x = rnd(0.04, 0.96) * w;
      y = -m;
    } else if (edge === 1) {
      x = w + m;
      y = rnd(0.04, 0.96) * h;
    } else if (edge === 2) {
      x = rnd(0.04, 0.96) * w;
      y = h + m;
    } else {
      x = -m;
      y = rnd(0.04, 0.96) * h;
    }
    var ang = Math.atan2(ty - y, tx - x);
    var sp = rnd(16, 32);
    comet = {
      x: x,
      y: y,
      vx: Math.cos(ang) * sp,
      vy: Math.sin(ang) * sp,
      size: rnd(2.5, 3.8),
      tail: rnd(120, 210),
      trail: [],
    };
  }
  function drawComet(now, dt) {
    if (!comet) return;
    comet.x += comet.vx * dt;
    comet.y += comet.vy * dt;
    var last = comet.trail[comet.trail.length - 1];
    if (!last || Math.hypot(comet.x - last.x, comet.y - last.y) >= 1.2) {
      comet.trail.push({ x: comet.x, y: comet.y });
    }
    var dist = 0;
    var i;
    for (i = comet.trail.length - 1; i > 0; i--) {
      dist += Math.hypot(comet.trail[i].x - comet.trail[i - 1].x, comet.trail[i].y - comet.trail[i - 1].y);
      if (dist > comet.tail) {
        comet.trail.splice(0, i);
        break;
      }
    }
    var vis = skyVisible(comet.x, comet.y) ? 1 : 0;
    for (i = 0; i < comet.trail.length; i++) {
      if (skyVisible(comet.trail[i].x, comet.trail[i].y)) vis++;
    }
    if (!vis) {
      comet = null;
      nextCometAt = now + rnd(14000, 38000);
      return;
    }
    var hyp = Math.hypot(comet.vx, comet.vy) || 1;
    var ux = comet.vx / hyp;
    var uy = comet.vy / hyp;
    var px = -uy;
    var py = ux;
    var head = comet.size;
    var dustLen = comet.tail;
    var ionLen = comet.tail * 1.2;
    ctx.save();
    clipSky();
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    var ion = ctx.createLinearGradient(comet.x, comet.y, comet.x - ux * ionLen, comet.y - uy * ionLen);
    ion.addColorStop(0, "rgba(150,205,255,0.55)");
    ion.addColorStop(0.28, "rgba(80,150,255,0.22)");
    ion.addColorStop(1, "rgba(60,120,255,0)");
    ctx.strokeStyle = ion;
    ctx.lineWidth = Math.max(0.7, head * 0.5);
    ctx.beginPath();
    ctx.moveTo(comet.x, comet.y);
    ctx.lineTo(comet.x - ux * ionLen, comet.y - uy * ionLen);
    ctx.stroke();
    var j;
    for (j = -2; j <= 2; j++) {
      var fan = j * head * 0.62;
      var dx = comet.x - ux * dustLen + px * fan * 2.1;
      var dy = comet.y - uy * dustLen + py * fan * 2.1;
      var dust = ctx.createLinearGradient(comet.x, comet.y, dx, dy);
      var a0 = 0.5 - Math.abs(j) * 0.09;
      dust.addColorStop(0, "rgba(255,210,140," + a0.toFixed(3) + ")");
      dust.addColorStop(0.38, "rgba(255,176,95," + (a0 * 0.42).toFixed(3) + ")");
      dust.addColorStop(1, "rgba(255,150,70,0)");
      ctx.strokeStyle = dust;
      ctx.lineWidth = head * (1.85 - Math.abs(j) * 0.38);
      ctx.beginPath();
      ctx.moveTo(comet.x, comet.y);
      ctx.quadraticCurveTo(
        comet.x - ux * dustLen * 0.42 + px * fan,
        comet.y - uy * dustLen * 0.42 + py * fan,
        dx,
        dy
      );
      ctx.stroke();
    }
    var coma = ctx.createRadialGradient(comet.x, comet.y, 0, comet.x, comet.y, head * 4.8);
    coma.addColorStop(0, "rgba(255,250,235,0.98)");
    coma.addColorStop(0.16, "rgba(255,220,155,0.58)");
    coma.addColorStop(0.42, "rgba(170,205,255,0.16)");
    coma.addColorStop(1, "rgba(170,205,255,0)");
    ctx.fillStyle = coma;
    ctx.beginPath();
    ctx.arc(comet.x, comet.y, head * 4.8, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = "rgba(255,255,248,1)";
    ctx.beginPath();
    ctx.arc(comet.x, comet.y, Math.max(1.15, head * 0.4), 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }
  function punchWhite(img) {
    var c = document.createElement("canvas");
    c.width = img.naturalWidth || img.width;
    c.height = img.naturalHeight || img.height;
    if (!c.width || !c.height) return img;
    var x = c.getContext("2d");
    x.drawImage(img, 0, 0);
    var data = x.getImageData(0, 0, c.width, c.height);
    var d = data.data;
    var i;
    for (i = 0; i < d.length; i += 4) {
      var r = d[i];
      var g = d[i + 1];
      var b = d[i + 2];
      if (r > 248 && g > 248 && b > 248) d[i + 3] = 0;
      else if (r > 232 && g > 232 && b > 232) {
        var t = (r + g + b) / 3;
        d[i + 3] = Math.max(0, Math.min(255, Math.round(((250 - t) / 18) * 255)));
      }
    }
    x.putImageData(data, 0, 0);
    return c;
  }
  function loadTesla() {
    var img = new Image();
    img.onload = function () {
      teslaPic = punchWhite(img);
    };
    img.src = "/images/sky/tesla.jpeg";
  }
  function spawnRoadster() {
    var kind = Math.floor(rnd(0, 3));
    var ang = kind === 0 ? rnd(-0.22, -0.08) : kind === 1 ? rnd(-0.03, 0.03) : rnd(0.1, 0.24);
    var sp = kind === 1 ? rnd(34, 46) : rnd(26, 38);
    var scale = kind === 0 ? rnd(0.48, 0.58) : kind === 1 ? rnd(0.62, 0.78) : rnd(0.42, 0.54);
    var y0 = kind === 0 ? rnd(0.55, 0.78) * h : kind === 1 ? rnd(0.32, 0.55) * h : rnd(0.1, 0.32) * h;
    roadster = {
      x: -180,
      y: y0,
      vx: Math.cos(ang) * sp,
      vy: Math.sin(ang) * sp,
      ang: ang,
      scale: scale,
      kind: kind,
    };
  }
  function drawRoadsterCar(dir, s) {
    ctx.save();
    ctx.scale(dir * s, s);
    ctx.fillStyle = "#111";
    ctx.beginPath();
    ctx.arc(-22, 10, 7, 0, Math.PI * 2);
    ctx.arc(24, 10, 7, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = "#3a3a3a";
    ctx.beginPath();
    ctx.arc(-22, 10, 3.2, 0, Math.PI * 2);
    ctx.arc(24, 10, 3.2, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = "#c4122f";
    ctx.beginPath();
    ctx.moveTo(-38, 6);
    ctx.lineTo(-28, -4);
    ctx.lineTo(-8, -8);
    ctx.lineTo(18, -7);
    ctx.lineTo(36, 0);
    ctx.lineTo(40, 8);
    ctx.lineTo(-38, 10);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = "rgba(170,210,240,0.4)";
    ctx.beginPath();
    ctx.moveTo(-6, -7);
    ctx.lineTo(12, -6.5);
    ctx.lineTo(16, -1);
    ctx.lineTo(-8, -1);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = "#ececec";
    ctx.beginPath();
    ctx.arc(2, -14, 6.2, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = "#d8d8d8";
    ctx.fillRect(-4, -10, 12, 10);
    ctx.fillStyle = "#0b1220";
    ctx.beginPath();
    ctx.ellipse(4, -14, 3.6, 3.1, 0.15, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }
  function drawRoadster(now, dt) {
    if (!roadster) return;
    roadster.x += roadster.vx * dt;
    roadster.y += roadster.vy * dt;
    var pic = teslaPic;
    var dw = pic ? Math.max(120, pic.width * roadster.scale * 0.28) : 90 * roadster.scale;
    var dh = pic ? dw * (pic.height / pic.width) : 40 * roadster.scale;
    if (roadster.x > w + dw || roadster.y < -dh || roadster.y > h + dh) {
      roadster = null;
      nextRoadsterAt = now + rnd(5 * 60 * 1000, 12 * 60 * 1000);
      return;
    }
    ctx.save();
    ctx.translate(roadster.x, roadster.y);
    ctx.rotate(roadster.ang - TESLA_NOSE);
    if (pic) ctx.drawImage(pic, -dw / 2, -dh / 2, dw, dh);
    else drawRoadsterCar(1, roadster.scale);
    ctx.restore();
  }
  function Layer(urls, rate, alpha, zoomMul, blend) {
    this.urls = urls || [];
    this.rate = rate;
    this.alpha = alpha;
    this.zoomMul = zoomMul;
    this.blend = blend || "source-over";
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
      ctx.globalCompositeOperation = this.blend;
      ctx.globalAlpha = this.alpha * a;
      ctx.drawImage(this.cur(), -p.ox, -p.oy, p.dw, p.dh);
      ctx.restore();
    }
    if (b > 0) {
      var p2 = this.layout(this.other(), 0, now);
      if (p2) {
        ctx.save();
        ctx.globalCompositeOperation = this.blend;
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
    ctx.fillStyle = "rgba(5,7,12,0.14)";
    ctx.fillRect(0, 0, w, h);
    var p = front && front.p ? front.p : null;
    drawWisps(p, now);
    if (!reduced) {
      if (!comet && now >= nextCometAt) spawnComet();
      drawComet(now, dt);
      if (!roadster && now >= nextRoadsterAt) spawnRoadster();
      drawRoadster(now, dt);
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
      new Layer(mid, 0.72, stacked > 1 ? 0.78 : 1, 1, stacked > 1 ? "lighter" : "source-over"),
      new Layer(near, 1.05, stacked > 1 ? 0.42 : 1, 1.12, stacked > 1 ? "lighter" : "source-over"),
    ];
    front = near.length ? layers[2] : mid.length ? layers[1] : layers[0];
  }
  function start() {
    size();
    makeField();
    loadTesla();
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
