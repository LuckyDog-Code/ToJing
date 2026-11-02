/* 星空背景（闪烁星星 + 流星 + 漂浮光点）与礼花，都用 Canvas 画，只在需要时运行 */
(function () {
  const reduced = matchMedia("(prefers-reduced-motion: reduce)").matches;
  const DPR = Math.min(window.devicePixelRatio || 1, 2);

  function fit(canvas, ctx) {
    const w = innerWidth, h = innerHeight;
    canvas.width = Math.round(w * DPR);
    canvas.height = Math.round(h * DPR);
    ctx.setTransform(DPR, 0, 0, DPR, 0, 0);
    return { w, h };
  }

  /* ---------------- 星空 ---------------- */
  const sky = document.getElementById("sky");
  const sctx = sky.getContext("2d");
  let W, H, stars = [], motes = [], meteors = [];
  let nextMeteor = 2500;
  const STAR_COLORS = ["255,255,255", "255,236,200", "210,220,255", "255,210,230"];

  // 预先画好一颗发光的星星贴图，之后每帧只 drawImage，比每帧画渐变省得多
  const glow = document.createElement("canvas");
  glow.width = glow.height = 32;
  (function () {
    const g = glow.getContext("2d");
    const grd = g.createRadialGradient(16, 16, 0, 16, 16, 16);
    grd.addColorStop(0, "rgba(255,255,255,1)");
    grd.addColorStop(0.2, "rgba(255,240,220,.8)");
    grd.addColorStop(1, "rgba(255,240,220,0)");
    g.fillStyle = grd;
    g.fillRect(0, 0, 32, 32);
  })();

  function buildSky() {
    ({ w: W, h: H } = fit(sky, sctx));
    const count = Math.min(380, Math.round((W * H) / 3800));
    stars = Array.from({ length: count }, () => ({
      x: Math.random() * W,
      y: Math.random() * H,
      r: Math.random() < 0.9 ? Math.random() * 1.1 + 0.3 : Math.random() * 1.6 + 1.2,
      c: STAR_COLORS[(Math.random() * STAR_COLORS.length) | 0],
      base: Math.random() * 0.6 + 0.3,
      speed: Math.random() * 0.0025 + 0.0006,
      phase: Math.random() * Math.PI * 2,
      depth: Math.random() * 0.6 + 0.2, // 视差深度
    }));
    const moteCount = reduced ? 0 : Math.min(28, Math.round(W / 40));
    motes = Array.from({ length: moteCount }, newMote);
  }

  function newMote() {
    return {
      x: Math.random() * W,
      y: Math.random() * H,
      vy: -(Math.random() * 0.15 + 0.05),
      vx: (Math.random() - 0.5) * 0.08,
      s: Math.random() * 10 + 6,
      a: Math.random() * 0.35 + 0.15,
    };
  }

  function spawnMeteor() {
    const fromLeft = Math.random() < 0.5;
    const speed = Math.random() * 6 + 8;
    const angle = (Math.random() * 15 + 20) * (Math.PI / 180);
    meteors.push({
      x: fromLeft ? Math.random() * W * 0.5 : W * 0.5 + Math.random() * W * 0.5,
      y: Math.random() * H * 0.35,
      vx: (fromLeft ? 1 : -1) * Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed,
      life: 0,
      max: 60 + Math.random() * 30,
    });
  }

  let scrollY = 0;
  addEventListener("scroll", () => { scrollY = window.scrollY; }, { passive: true });

  let last = performance.now(), running = true;
  function drawSky(now) {
    if (!running) return;
    const dt = Math.min(now - last, 50);
    last = now;
    sctx.clearRect(0, 0, W, H);

    // 星星（随滚动有轻微视差）
    for (const s of stars) {
      const tw = reduced ? s.base : s.base + Math.sin(now * s.speed + s.phase) * 0.35;
      let y = (s.y - scrollY * s.depth * 0.08) % H;
      if (y < 0) y += H;
      sctx.globalAlpha = Math.max(0.05, Math.min(1, tw));
      if (s.r > 1.2) {
        const d = s.r * 7;
        sctx.drawImage(glow, s.x - d / 2, y - d / 2, d, d);
      } else {
        sctx.fillStyle = `rgb(${s.c})`;
        sctx.fillRect(s.x, y, s.r, s.r);
      }
    }

    // 漂浮的柔光点
    for (const m of motes) {
      m.x += m.vx * dt;
      m.y += m.vy * dt;
      if (m.y < -20) { Object.assign(m, newMote()); m.y = H + 20; }
      sctx.globalAlpha = m.a;
      sctx.drawImage(glow, m.x - m.s / 2, m.y - m.s / 2, m.s, m.s);
    }

    // 流星
    if (!reduced) {
      nextMeteor -= dt;
      if (nextMeteor <= 0) { spawnMeteor(); nextMeteor = 3000 + Math.random() * 5000; }
    }
    sctx.lineCap = "round";
    for (let i = meteors.length - 1; i >= 0; i--) {
      const m = meteors[i];
      m.life += dt / 16.7;
      m.x += m.vx * dt / 16.7;
      m.y += m.vy * dt / 16.7;
      const t = m.life / m.max;
      const alpha = t < 0.2 ? t / 0.2 : 1 - (t - 0.2) / 0.8;
      const tx = m.x - m.vx * 9, ty = m.y - m.vy * 9;
      const grd = sctx.createLinearGradient(m.x, m.y, tx, ty);
      grd.addColorStop(0, `rgba(255,250,235,${alpha})`);
      grd.addColorStop(1, "rgba(255,250,235,0)");
      sctx.globalAlpha = 1;
      sctx.strokeStyle = grd;
      sctx.lineWidth = 2;
      sctx.beginPath();
      sctx.moveTo(m.x, m.y);
      sctx.lineTo(tx, ty);
      sctx.stroke();
      if (m.life >= m.max) meteors.splice(i, 1);
    }
    sctx.globalAlpha = 1;
    requestAnimationFrame(drawSky);
  }

  /* ---------------- 礼花 ---------------- */
  const cf = document.getElementById("confetti");
  const cctx = cf.getContext("2d");
  let CW, CH, pieces = [], confettiRunning = false;
  const CONF_COLORS = ["#ff8fb1", "#ffe27a", "#8fd3ff", "#b59cff", "#ffffff", "#e8436b", "#9effc9"];

  function fitConfetti() { ({ w: CW, h: CH } = fit(cf, cctx)); }

  function heartPath(ctx, s) {
    ctx.beginPath();
    ctx.moveTo(0, s * 0.3);
    ctx.bezierCurveTo(-s, -s * 0.4, -s * 0.5, -s, 0, -s * 0.45);
    ctx.bezierCurveTo(s * 0.5, -s, s, -s * 0.4, 0, s * 0.3);
    ctx.fill();
  }

  function addPiece(p) {
    pieces.push(Object.assign({
      rot: Math.random() * Math.PI * 2,
      vr: (Math.random() - 0.5) * 0.3,
      tilt: Math.random() * Math.PI,
      vt: Math.random() * 0.2 + 0.05,
      color: CONF_COLORS[(Math.random() * CONF_COLORS.length) | 0],
      size: Math.random() * 6 + 5,
      shape: Math.random() < 0.18 ? "heart" : Math.random() < 0.5 ? "rect" : "circle",
      life: 0,
      max: 260 + Math.random() * 120,
      gravity: 0.12,
      drag: 0.985,
    }, p));
  }

  function burst(x, y, n = 120) {
    for (let i = 0; i < n; i++) {
      const a = Math.random() * Math.PI * 2;
      const v = Math.random() * 9 + 4;
      addPiece({ x, y, vx: Math.cos(a) * v, vy: Math.sin(a) * v - 5 });
    }
    startConfetti();
  }

  // 从屏幕底部两侧往上喷
  function cannons() {
    const n = CW < 600 ? 70 : 110;
    for (let i = 0; i < n; i++) {
      const left = i % 2 === 0;
      const a = (left ? -60 : -120) * Math.PI / 180 + (Math.random() - 0.5) * 0.5;
      const v = Math.random() * 10 + 13;
      addPiece({ x: left ? 0 : CW, y: CH, vx: Math.cos(a) * v, vy: Math.sin(a) * v });
    }
    startConfetti();
  }

  // 缓缓飘落的爱心雨
  function heartRain(duration = 6000) {
    if (reduced) return;
    const end = performance.now() + duration;
    (function drop() {
      if (performance.now() > end) return;
      addPiece({
        x: Math.random() * CW, y: -20,
        vx: (Math.random() - 0.5) * 0.6, vy: Math.random() * 1 + 1,
        shape: "heart", color: Math.random() < 0.6 ? "#ff8fb1" : "#e8436b",
        size: Math.random() * 8 + 8, gravity: 0.01, drag: 1, vr: (Math.random() - 0.5) * 0.04,
        max: 700,
      });
      startConfetti();
      setTimeout(drop, 120);
    })();
  }

  let clast = 0;
  function startConfetti() {
    if (confettiRunning) return;
    confettiRunning = true;
    clast = performance.now();
    requestAnimationFrame(drawConfetti);
  }

  function drawConfetti(now) {
    const k = Math.min(now - clast, 50) / 16.7;
    clast = now;
    cctx.clearRect(0, 0, CW, CH);
    for (let i = pieces.length - 1; i >= 0; i--) {
      const p = pieces[i];
      p.life += k;
      p.vx *= Math.pow(p.drag, k);
      p.vy = p.vy * Math.pow(p.drag, k) + p.gravity * k;
      p.x += p.vx * k;
      p.y += p.vy * k;
      p.rot += p.vr * k;
      p.tilt += p.vt * k;
      if (p.life > p.max || p.y > CH + 40) { pieces.splice(i, 1); continue; }
      const fade = p.max - p.life < 40 ? (p.max - p.life) / 40 : 1;
      cctx.globalAlpha = fade;
      cctx.fillStyle = p.color;
      cctx.setTransform(DPR, 0, 0, DPR, p.x * DPR, p.y * DPR);
      cctx.rotate(p.rot);
      if (p.shape === "heart") {
        heartPath(cctx, p.size);
      } else {
        cctx.scale(1, Math.cos(p.tilt)); // 翻转的纸片感
        if (p.shape === "rect") cctx.fillRect(-p.size / 2, -p.size / 4, p.size, p.size / 2);
        else { cctx.beginPath(); cctx.arc(0, 0, p.size / 3, 0, Math.PI * 2); cctx.fill(); }
      }
    }
    cctx.setTransform(DPR, 0, 0, DPR, 0, 0);
    cctx.globalAlpha = 1;
    if (pieces.length) requestAnimationFrame(drawConfetti);
    else { confettiRunning = false; cctx.clearRect(0, 0, CW, CH); }
  }

  /* ---------------- 启动 ---------------- */
  let resizeTimer, lastW = innerWidth;
  addEventListener("resize", () => {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(() => {
      fitConfetti();
      // 手机地址栏伸缩只改变高度，此时不重新生成星星，避免闪烁
      if (innerWidth !== lastW || innerHeight > H) { lastW = innerWidth; buildSky(); }
    }, 150);
  });

  document.addEventListener("visibilitychange", () => {
    running = !document.hidden;
    if (running) { last = performance.now(); requestAnimationFrame(drawSky); }
  });

  buildSky();
  fitConfetti();
  requestAnimationFrame(drawSky);

  window.Effects = { burst, cannons, heartRain };
})();
