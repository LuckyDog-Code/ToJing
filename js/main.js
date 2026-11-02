(function () {
  const C = window.LETTER;
  const $ = (id) => document.getElementById(id);
  const reduced = matchMedia("(prefers-reduced-motion: reduce)").matches;

  gsap.registerPlugin(ScrollTrigger);
  ScrollTrigger.config({ ignoreMobileResize: true });
  if ("scrollRestoration" in history) history.scrollRestoration = "manual";
  scrollTo(0, 0);

  /* ---------------- 填入文字 ---------------- */
  function splitChars(el, text) {
    el.textContent = "";
    for (const ch of text) {
      const s = document.createElement("span");
      s.className = "ch";
      s.textContent = ch === " " ? " " : ch;
      el.appendChild(s);
    }
  }

  splitChars($("intro-title"), "Happy Birthday");
  $("intro-name").textContent = C.herName;
  $("start-btn").textContent = C.startButton;
  $("env-label").textContent = C.envelopeLabel;
  $("letter-greeting").textContent = C.greeting;
  $("letter-closing").textContent = C.closing;
  $("letter-signoff").textContent = C.signoff;
  $("letter-from").textContent = C.from;
  $("letter-date").textContent = C.date;
  $("cake-hint").textContent = C.cakeHint;
  $("mic-btn").textContent = C.micButton;
  splitChars($("final-wish"), C.finalWish);
  $("final-sub").textContent = C.finalSub;

  // 正文：空行分段，单个换行保留为段内换行
  const body = $("letter-body");
  C.body.trim().split(/\n\s*\n/).forEach((para) => {
    const p = document.createElement("p");
    p.className = "reveal";
    para.trim().split("\n").forEach((line, i) => {
      if (i) p.appendChild(document.createElement("br"));
      p.appendChild(document.createTextNode(line.trim()));
    });
    body.appendChild(p);
  });
  document.querySelectorAll(".letter-greeting, .letter-closing, .letter-sign").forEach((el) => el.classList.add("reveal"));

  /* ---------------- 音乐 ---------------- */
  const audio = $("bgm");
  const musicBtn = $("music-btn");
  const TARGET_VOL = 0.85;
  let musicStarted = false;

  function setPlayingUI(on) {
    musicBtn.classList.toggle("playing", on);
    musicBtn.classList.remove("nudge");
  }

  // iOS / 微信只允许在点击时开始播放，滑动不算。所以在「轻触开启」的点击里就静音开始播放，
  // 信封打开时取消静音（已经在播放的音频取消静音不需要再点击）。
  // 不用 Web Audio 处理音乐：iOS 上它会和麦克风抢音频会话，导致吹蜡烛读不到声音。
  function unlockAudio() {
    audio.muted = true;
    audio.play().catch(() => {});
  }

  function startMusic() {
    if (musicStarted) return;
    musicStarted = true;
    audio.currentTime = 0; // 点开启后一直在静音播放，从头开始
    audio.volume = 0; // iOS 忽略 volume，会直接以系统音量播放
    audio.muted = false;
    const p = audio.paused ? audio.play() : Promise.resolve();
    p.then(() => {
      setPlayingUI(true);
      gsap.to(audio, { volume: TARGET_VOL, duration: 4, ease: "sine.inOut" });
    }).catch(() => {
      // 浏览器仍然拦截：让音乐按钮跳动提示，下一次点击时重试（iOS 上只有 click 算用户操作）
      musicStarted = false;
      musicBtn.classList.add("nudge");
      addEventListener("click", startMusic, { once: true });
    });
  }

  musicBtn.addEventListener("click", (e) => {
    e.stopPropagation();
    if (!musicStarted) return startMusic();
    if (audio.paused) { audio.play(); setPlayingUI(true); }
    else { audio.pause(); setPlayingUI(false); }
  });

  // 微信内置浏览器：在 JSBridge 就绪时预加载
  document.addEventListener("WeixinJSBridgeReady", () => { if (audio.paused) audio.load(); }, false);

  /* ---------------- 1. 开场 ---------------- */
  const intro = gsap.timeline({ delay: 0.3 });
  intro
    .fromTo("#intro-title .ch",
      { opacity: 0, y: 40, rotation: -8 },
      { opacity: 1, y: 0, rotation: 0, duration: 0.9, ease: "back.out(2)", stagger: 0.06 })
    .fromTo("#intro-name", { opacity: 0, y: 16 }, { opacity: 1, y: 0, duration: 1, ease: "power2.out" }, "-=0.3")
    .fromTo("#start-btn", { opacity: 0, scale: 0.85 }, { opacity: 1, scale: 1, duration: 0.8, ease: "back.out(2)" }, "-=0.2");

  $("start-btn").addEventListener("click", (e) => {
    unlockAudio();
    const r = e.currentTarget.getBoundingClientRect();
    Effects.burst(r.left + r.width / 2, r.top + r.height / 2, 70);

    gsap.to("#start-btn", {
      opacity: 0, scale: 0.8, duration: 0.5, ease: "power2.in",
      onComplete: () => { $("start-btn").style.visibility = "hidden"; },
    });
    gsap.to("#scroll-hint", { autoAlpha: 1, duration: 0.8, delay: 0.4 });
    musicBtn.classList.add("show");

    document.body.classList.remove("locked");
    ScrollTrigger.refresh();
  }, { once: true });

  /* ---------------- 漂浮的生日元素 ---------------- */
  const balloon = (c) => `<svg viewBox="0 0 60 120" width="100%"><path d="M30 76 C 26 90, 36 98, 30 120" stroke="rgba(255,255,255,.5)" stroke-width="1" fill="none"/><path d="M30 4 C 48 4 56 20 56 36 C 56 56 40 72 30 74 C 20 72 4 56 4 36 C 4 20 12 4 30 4Z" fill="${c}"/><path d="M27 74 l3 6 l3 -6z" fill="${c}"/><ellipse cx="20" cy="24" rx="6" ry="10" fill="rgba(255,255,255,.35)" transform="rotate(20 20 24)"/></svg>`;
  const sparkle = (c) => `<svg viewBox="0 0 40 40" width="100%"><path d="M20 0 C22 14 26 18 40 20 C26 22 22 26 20 40 C18 26 14 22 0 20 C14 18 18 14 20 0Z" fill="${c}"/></svg>`;
  const gift = `<svg viewBox="0 0 60 60" width="100%"><rect x="6" y="24" width="48" height="32" rx="3" fill="#b59cff"/><rect x="2" y="16" width="56" height="12" rx="3" fill="#cdb8ff"/><rect x="26" y="16" width="8" height="40" fill="#ffe27a"/><path d="M30 16 C 20 2 8 8 16 16Z M30 16 C 40 2 52 8 44 16Z" fill="#ffe27a"/></svg>`;

  // [left%, top%, 宽度(vw), 视差速度, 类型]
  const FLOATERS = [
    [6, 16, 11, 1.4, balloon("#ff8fb1")],
    [84, 10, 9, 1.1, balloon("#8fd3ff")],
    [76, 62, 12, 1.7, balloon("#b59cff")],
    [10, 66, 8, 0.9, balloon("#ffe27a")],
    [46, 4, 4, 0.6, sparkle("#ffe3a3")],
    [22, 44, 3, 1.2, sparkle("#ffffff")],
    [90, 40, 3.5, 0.8, sparkle("#ffd1e0")],
    [60, 86, 4, 1.3, sparkle("#ffe3a3")],
    [3, 88, 9, 1.5, gift],
  ];
  const floaterBox = $("floaters");
  const floaterEls = FLOATERS.map(([x, y, w, speed, html], i) => {
    const el = document.createElement("div");
    el.className = "floater";
    el.style.cssText = `left:${x}%;top:${y}%;width:clamp(${w * 2.6}px, ${w}vw, ${w * 6}px)`;
    el.innerHTML = `<div style="--bob:${5 + (i % 4)}s;--delay:${-i * 0.7}s">${html}</div>`;
    el.dataset.speed = speed;
    floaterBox.appendChild(el);
    return el;
  });

  /* ---------------- 2/3. 信封打开（固定画面，跟随滚动） ---------------- */
  const env = $("envelope");
  const tl = gsap.timeline({ defaults: { ease: "none" } });

  tl.fromTo(env,
      { y: () => innerHeight * 0.55, scale: 0.28, rotation: -14, opacity: 0 },
      { y: 0, scale: 1, rotation: 0, opacity: 1, duration: 1.4, ease: "power2.out" })
    .to("#seal", { scale: 1.12, duration: 0.25, ease: "sine.inOut" })
    .addLabel("crack")
    .set(".seal-whole", { autoAlpha: 0 }, "crack")
    .set(".seal-t, .seal-b", { autoAlpha: 1 }, "crack")
    .to(".seal-t", { y: -40, rotation: -6, opacity: 0, duration: 0.7, ease: "power1.in" }, "crack+=0.01")
    .to(".seal-b", { y: 34, rotation: 10, opacity: 0, duration: 0.6, ease: "power1.in" }, "crack+=0.01")
    .to("#env-flap", { rotationX: 180, duration: 0.9, ease: "power1.inOut" }, "crack+=0.25")
    .set("#env-flap", { zIndex: 2 }, "crack+=0.7")
    .addLabel("open")
    .to("#env-paper", { yPercent: -68, duration: 1.1, ease: "power2.out" })
    .to(env, { scale: 2.4, opacity: 0, y: () => innerHeight * 0.1, duration: 0.9, ease: "power2.in" }, "+=0.2")
    .to({}, { duration: 0.15 });

  // 漂浮元素在整段里以不同速度上移，并在最后淡出
  const total = tl.duration();
  floaterEls.forEach((el) => {
    tl.fromTo(el, { y: () => innerHeight * 0.4 * el.dataset.speed },
      { y: () => -innerHeight * 0.5 * el.dataset.speed, duration: total }, 0);
  });
  tl.to(floaterEls, { opacity: 0, duration: 0.5 }, total - 0.8);

  const openAt = tl.labels.open / total;
  ScrollTrigger.create({
    trigger: "#envelope-section",
    start: "top top",
    end: () => "+=" + innerHeight * (reduced ? 1.6 : 2.8),
    pin: true,
    scrub: reduced ? true : 0.8,
    animation: tl,
    invalidateOnRefresh: true,
    onUpdate(self) {
      if (self.progress >= openAt * 0.95) startMusic();
    },
  });

  gsap.to("#scroll-hint", {
    opacity: 0,
    scrollTrigger: { trigger: "#intro", start: "top top", end: "20% top", scrub: true },
  });

  /* ---------------- 4. 信 ---------------- */
  gsap.fromTo("#letter-card", { y: 80, opacity: 0, scale: 0.94 }, {
    y: 0, opacity: 1, scale: 1, duration: 1.2, ease: "power3.out",
    scrollTrigger: { trigger: "#letter-section", start: "top 85%" },
  });

  gsap.utils.toArray(".reveal").forEach((el) => {
    gsap.to(el, {
      opacity: 1, y: 0, duration: 1.1, ease: "power2.out",
      scrollTrigger: { trigger: el, start: "top 90%" },
    });
  });

  /* ---------------- 5. 蛋糕 ---------------- */
  gsap.fromTo("#cake-wrap", { y: 60, opacity: 0, scale: 0.9 }, {
    y: 0, opacity: 1, scale: 1, duration: 1.2, ease: "back.out(1.4)",
    scrollTrigger: { trigger: "#cake-section", start: "top 70%" },
  });

  let blown = false;
  function blowOut() {
    if (blown) return;
    blown = true;
    stopMic();
    $("candles").classList.add("out");
    $("cake-wrap").classList.add("blown");

    const r = $("candles").getBoundingClientRect();
    setTimeout(() => {
      Effects.cannons();
      Effects.burst(r.left + r.width / 2, r.top + r.height / 2, 90);
    }, 450);
    setTimeout(() => Effects.heartRain(7000), 1400);

    gsap.timeline({ delay: 0.9 })
      .fromTo("#final-wish .ch",
        { opacity: 0, y: 30, scale: 0.6 },
        { opacity: 1, y: 0, scale: 1, duration: 0.7, ease: "back.out(2.5)", stagger: 0.09 })
      .fromTo("#final-sub", { opacity: 0, y: 12 }, { opacity: 1, y: 0, duration: 1.2, ease: "power2.out" }, "+=0.2");
  }
  $("candles").addEventListener("click", blowOut);

  /* 对着麦克风吹气 */
  const AC = window.AudioContext || window.webkitAudioContext;
  let micStream, micCtx, micRaf, micBusy = false;
  function closeMicCtx() {
    if (micCtx) micCtx.close();
    micCtx = null;
  }
  function stopMic() {
    cancelAnimationFrame(micRaf);
    if (micStream) micStream.getTracks().forEach((t) => t.stop());
    micStream = null;
    closeMicCtx();
    micBusy = false;
    $("mic-btn").classList.remove("listening");
    document.querySelectorAll(".flame").forEach((f) => { f.style.opacity = ""; });
    if (musicStarted && audio.paused) audio.play().catch(() => {}); // iOS 开麦时可能打断背景音乐
  }

  // iOS 上 AudioContext 必须在麦克风打开之后再建：开麦会改采样率，之前建的读到的全是 0。
  // 仍然读不到声音时换成按麦克风采样率重建。
  function buildAnalyser(way) {
    closeMicCtx();
    if (way === 0) micCtx = new AC();
    else if (way === 1) {
      const sr = micStream.getAudioTracks()[0].getSettings().sampleRate;
      if (!sr) return null;
      micCtx = new AC({ sampleRate: sr });
    } else return null;
    micCtx.resume();
    const analyser = micCtx.createAnalyser();
    analyser.fftSize = 1024;
    analyser.smoothingTimeConstant = 0;
    // Safari 不会处理没接到输出的节点；接一个音量为 0 的出口
    const sink = micCtx.createGain();
    sink.gain.value = 0;
    micCtx.createMediaStreamSource(micStream).connect(analyser).connect(sink).connect(micCtx.destination);
    return analyser;
  }

  $("mic-btn").addEventListener("click", async () => {
    const btn = $("mic-btn");
    if (micBusy) return;
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia || !AC) {
      btn.textContent = "这里用不了麦克风，点一下蜡烛就好啦";
      return;
    }
    micBusy = true;
    try {
      // 关掉降噪、回声消除和自动增益，否则吹气声会被当成噪音滤掉
      micStream = await navigator.mediaDevices.getUserMedia({
        audio: { echoCancellation: false, noiseSuppression: false, autoGainControl: false },
      });
    } catch (err) {
      stopMic();
      btn.textContent = err && err.name === "NotAllowedError"
        ? "没有拿到麦克风权限，点一下蜡烛就好啦"
        : "麦克风用不了，点一下蜡烛就好啦";
      return;
    }
    btn.classList.add("listening");
    btn.textContent = "在听哦，对着手机用力吹～";

    let way = 0, analyser = buildAnalyser(way);
    let fbuf, bbuf;
    const bufs = () => {
      fbuf = analyser.getFloatTimeDomainData ? new Float32Array(analyser.fftSize) : null;
      bbuf = new Uint8Array(analyser.fftSize);
    };
    bufs();
    function level() {
      let sum = 0, n = analyser.fftSize;
      if (fbuf) { analyser.getFloatTimeDomainData(fbuf); for (let i = 0; i < n; i++) sum += fbuf[i] * fbuf[i]; }
      else { analyser.getByteTimeDomainData(bbuf); for (let i = 0; i < n; i++) { const v = (bbuf[i] - 128) / 128; sum += v * v; } }
      return Math.sqrt(sum / n);
    }

    // 不同手机的麦克风灵敏度差很多，先听半秒环境音，再按「比环境响很多」来判断吹气
    const debug = /debug/.test(location.search);
    const flames = document.querySelectorAll(".flame");
    let t0 = performance.now(), wayStart = t0;
    const deadline = t0 + 30000;
    let noise = 0, noiseN = 0, loud = 0, peak = 0;

    (function listen() {
      const rms = level();
      const now = performance.now();
      peak = Math.max(peak, rms);
      // 一秒多都是完全的 0：说明这种方式读不到麦克风，换下一种
      if (peak === 0 && now - wayStart > 1200) {
        let next = null;
        while (!next && way < 1) next = buildAnalyser(++way);
        if (next) { analyser = next; bufs(); wayStart = t0 = now; noise = noiseN = 0; }
        else wayStart = Infinity;
      }
      if (now - t0 < 500) { noise += rms; noiseN++; }
      else {
        const base = noise / Math.max(1, noiseN);
        const thr = Math.min(0.08, Math.max(0.02, base * 4));
        const k = Math.min(1, rms / thr);
        flames.forEach((f) => { f.style.opacity = String(1 - 0.6 * k); }); // 火苗随气息变弱，让她知道在起作用
        loud = rms > thr ? loud + 1 : Math.max(0, loud - 1);
        if (debug) btn.textContent = `方式${way} ${micCtx ? micCtx.state + " " + micCtx.sampleRate : ""} 环境${base.toFixed(3)} 当前${rms.toFixed(3)} 门槛${thr.toFixed(3)} 最高${peak.toFixed(3)}`;
        if (loud > 6) return blowOut();
      }
      if (now > deadline) { stopMic(); btn.textContent = C.micButton; return; }
      micRaf = requestAnimationFrame(listen);
    })();
  });

  // 标题保持一行：按实际宽度缩小字号（不同字体/后备字体宽度不同）
  const title = $("intro-title");
  function fitTitle() {
    title.style.fontSize = "";
    const max = Math.min(innerWidth - 32, 1100);
    const w = title.scrollWidth;
    if (w > max) title.style.fontSize = parseFloat(getComputedStyle(title).fontSize) * (max / w) + "px";
  }
  fitTitle();
  let fitW = innerWidth;
  addEventListener("resize", () => { if (innerWidth !== fitW) { fitW = innerWidth; fitTitle(); } });

  // 字体加载完后重新计算标题和滚动位置
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(() => { fitTitle(); ScrollTrigger.refresh(); });
})();
