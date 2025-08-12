// Flappy Roket — Canvas game (vanilla JS, no dependencies)
// Fitur: responsive HiDPI, kontrol sentuh & keyboard, skor tertinggi (localStorage), jeda, suara sederhana.

(() => {
  const canvas = document.getElementById('game');
  const ctx = canvas.getContext('2d');
  const overlay = document.getElementById('uiOverlay');
  const btnPause = document.getElementById('btnPause');
  const btnRestart = document.getElementById('btnRestart');
  const btnMute = document.getElementById('btnMute');

  // ----- HiDPI scaling
  let dpr = Math.max(1, window.devicePixelRatio || 1);
  function resize() {
    dpr = Math.max(1, window.devicePixelRatio || 1);
    // Canvas CSS size is controlled by CSS, we match internal buffer to it
    const rect = canvas.getBoundingClientRect();
    canvas.width = Math.round(rect.width * dpr);
    canvas.height = Math.round(rect.height * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0); // draw in CSS pixel units
  }
  new ResizeObserver(resize).observe(canvas);
  resize();

  // ----- Game state
  const STATE = { MENU:'menu', PLAY:'play', DEAD:'dead', PAUSE:'pause' };
  let state = STATE.MENU;

  // Physics
  const GRAVITY = 1500;     // px/s^2
  const FLAP = 420;         // upward impulse px/s
  const SPEED = 180;        // pipe speed px/s
  const PIPE_W = 70;
  const GAP_MIN = 160, GAP_MAX = 220;
  const SPAWN_EVERY = 1.25; // s
  const PLAYER_X_RATIO = 0.28; // player x relative to width
  const PLAYER_R = 18;      // collision radius

  // Entities
  let player, pipes, stars, score, high, timeSinceSpawn, sinceStart;
  let lastTime = 0;
  let muted = false;

  // Audio (simple WebAudio beeps)
  let ac = null;
  function ensureAudio() {
    if (!ac) {
      try {
        ac = new (window.AudioContext || window.webkitAudioContext)();
      } catch (e) {
        ac = null;
      }
    }
    if (ac && ac.state === 'suspended') ac.resume();
  }
  function beep({freq=440, dur=0.08, type='sine', gain=0.06, decay=0.08} = {}) {
    if (muted) return;
    ensureAudio();
    if (!ac) return;
    const t = ac.currentTime;
    const o = ac.createOscillator();
    const g = ac.createGain();
    o.type = type;
    o.frequency.value = freq;
    o.connect(g);
    g.connect(ac.destination);
    g.gain.setValueAtTime(gain, t);
    g.gain.exponentialRampToValueAtTime(0.0001, t + Math.max(0.01, dur + decay));
    o.start(t);
    o.stop(t + dur + decay + 0.02);
  }

  // Storage
  function loadHigh() {
    try { return parseInt(localStorage.getItem('flappy_roket_high') || '0', 10) || 0; } catch { return 0; }
  }
  function saveHigh(v) {
    try { localStorage.setItem('flappy_roket_high', String(v)); } catch {}
  }

  // Helpers
  function randRange(a, b) { return a + Math.random() * (b - a); }
  function clamp(v, a, b) { return Math.max(a, Math.min(b, v)); }
  function vw() { return canvas.width / dpr; } // drawing units
  function vh() { return canvas.height / dpr; }

  function circleRectIntersect(cx, cy, r, rx, ry, rw, rh) {
    const closestX = clamp(cx, rx, rx + rw);
    const closestY = clamp(cy, ry, ry + rh);
    const dx = cx - closestX;
    const dy = cy - closestY;
    return (dx*dx + dy*dy) <= r*r;
  }

  // Init / Reset
  function reset() {
    player = {
      x: vw() * PLAYER_X_RATIO,
      y: vh() * 0.45,
      vy: 0,
      r: PLAYER_R,
      rot: 0
    };
    pipes = [];
    stars = makeStars(90);
    score = 0;
    high = loadHigh();
    timeSinceSpawn = 0;
    sinceStart = 0;
    state = STATE.MENU;
    renderOverlay();
  }

  function makeStars(n) {
    const arr = [];
    for (let i=0;i<n;i++) {
      arr.push({
        x: Math.random() * vw(),
        y: Math.random() * vh(),
        s: Math.random() * 1.6 + 0.4,
        v: Math.random() * 30 + 20,
        tw: Math.random() * 2 * Math.PI
      });
    }
    return arr;
  }

  // Spawning pipes
  function spawnPipe() {
    const gap = clamp(GAP_MAX - score * 1.5, GAP_MIN, GAP_MAX); // makin susah seiring skor
    const margin = 40;
    const y = randRange(margin + gap/2, vh() - margin - gap/2);
    pipes.push({
      x: vw() + 10,
      y, gap,
      w: PIPE_W,
      passed: false
    });
  }

  // Input handlers
  function flap() {
    if (state === STATE.DEAD) {
      reset();
      state = STATE.PLAY;
      return;
    }
    if (state === STATE.MENU) {
      state = STATE.PLAY;
    }
    if (state === STATE.PLAY) {
      player.vy = -FLAP;
      beep({freq: 720, dur: 0.05, type:'sine', gain:0.07, decay:0.05});
    }
  }

  function togglePause() {
    if (state === STATE.PLAY) state = STATE.PAUSE;
    else if (state === STATE.PAUSE) state = STATE.PLAY;
    renderOverlay();
    updateButtons();
  }
  function restart() {
    reset();
    state = STATE.PLAY;
    renderOverlay();
  }
  function toggleMute() {
    muted = !muted;
    updateButtons();
  }

  window.addEventListener('keydown', (e) => {
    if (['Space','ArrowUp','KeyW'].includes(e.code)) { e.preventDefault(); flap(); }
    else if (e.code === 'KeyP') togglePause();
    else if (e.code === 'KeyM') toggleMute();
    else if (e.code === 'KeyR' || e.code === 'Enter') restart();
  }, {passive:false});
  canvas.addEventListener('pointerdown', flap);
  btnPause.addEventListener('click', togglePause);
  btnRestart.addEventListener('click', restart);
  btnMute.addEventListener('click', toggleMute);

  function updateButtons() {
    btnPause.setAttribute('aria-pressed', state === STATE.PAUSE ? 'true' : 'false');
    btnPause.textContent = state === STATE.PAUSE ? '▶️ Lanjut' : '⏸️ Jeda';
    btnMute.setAttribute('aria-pressed', muted ? 'true' : 'false');
    btnMute.textContent = muted ? '🔇 Bisukan' : '🔊 Suara';
  }

  // Main loop
  function frame(tms) {
    const t = tms / 1000;
    let dt = (lastTime > 0) ? (t - lastTime) : 0;
    dt = Math.min(dt, 0.033); // clamp dt for tab switching spikes
    lastTime = t;

    if (state === STATE.PLAY) {
      sinceStart += dt;
      update(dt);
    }
    draw();
    requestAnimationFrame(frame);
  }

  function update(dt) {
    // stars parallax
    for (const s of stars) {
      s.x -= (SPEED * 0.2 + s.v) * dt;
      s.tw += dt * 2;
      if (s.x < -2) { s.x = vw() + Math.random() * 50; s.y = Math.random() * vh(); }
    }

    // pipes
    timeSinceSpawn += dt;
    if (timeSinceSpawn >= SPAWN_EVERY) {
      spawnPipe();
      timeSinceSpawn = 0;
    }
    for (const p of pipes) {
      p.x -= SPEED * dt;
    }
    // remove offscreen pipes
    while (pipes.length && pipes[0].x + pipes[0].w < -10) pipes.shift();

    // player physics
    player.vy += GRAVITY * dt;
    player.y += player.vy * dt;
    player.rot = clamp(player.vy / 600, -0.35, 0.9); // rotation for drawing

    // scoring
    for (const p of pipes) {
      if (!p.passed && (player.x > p.x + p.w)) {
        p.passed = true;
        score += 1;
        if (score > high) { high = score; saveHigh(high); }
        beep({freq: 1040, dur: 0.06, type:'triangle', gain:0.05, decay:0.05});
      }
    }

    // collisions
    const px = player.x, py = player.y, pr = player.r;
    // ground / ceiling
    if (py + pr > vh() || py - pr < 0) {
      die();
      return;
    }
    // with pipes
    for (const p of pipes) {
      const topH = p.y - p.gap/2;
      const botY = p.y + p.gap/2;
      if (circleRectIntersect(px, py, pr, p.x, 0, p.w, topH) ||
          circleRectIntersect(px, py, pr, p.x, botY, p.w, vh() - botY)) {
        die();
        return;
      }
    }
  }

  function die() {
    state = STATE.DEAD;
    beep({freq: 220, dur:0.12, type:'sawtooth', gain:0.07, decay:0.15});
    renderOverlay();
  }

  // Rendering
  function draw() {
    const w = vw(), h = vh();

    // clear
    ctx.clearRect(0, 0, w, h);

    // background glow
    drawBackground(w, h);

    // stars
    for (const s of stars) {
      const twinkle = 0.5 + Math.abs(Math.sin(s.tw)) * 0.5;
      ctx.globalAlpha = 0.5 + 0.5 * twinkle;
      ctx.beginPath();
      ctx.arc(s.x, s.y, s.s, 0, Math.PI*2);
      ctx.fillStyle = '#E6F1FF';
      ctx.fill();
    }
    ctx.globalAlpha = 1;

    // pipes
    for (const p of pipes) {
      drawPipe(p);
    }

    // player
    drawPlayer(player);

    // HUD
    drawHUD();
  }

  function drawBackground(w, h) {
    const g = ctx.createLinearGradient(0, 0, 0, h);
    g.addColorStop(0, '#0b1220');
    g.addColorStop(1, '#0f2647');
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, w, h);

    // subtle horizon
    ctx.fillStyle = 'rgba(255,255,255,0.06)';
    ctx.fillRect(0, h - 6, w, 6);
  }

  function drawPipe(p) {
    const topH = p.y - p.gap/2;
    const botY = p.y + p.gap/2;
    ctx.save();
    const body = ctx.createLinearGradient(p.x, 0, p.x + p.w, 0);
    body.addColorStop(0, '#33a1ff');
    body.addColorStop(1, '#8be9fd');
    ctx.fillStyle = body;
    // top
    ctx.fillRect(p.x, 0, p.w, topH);
    // bottom
    ctx.fillRect(p.x, botY, p.w, vh() - botY);
    // caps
    ctx.fillStyle = 'rgba(255,255,255,0.18)';
    ctx.fillRect(p.x - 2, topH - 10, p.w + 4, 12);
    ctx.fillRect(p.x - 2, botY - 2, p.w + 4, 12);
    ctx.restore();
  }

  function drawPlayer(pl) {
    ctx.save();
    ctx.translate(pl.x, pl.y);
    ctx.rotate(pl.rot);

    // ship body (triangle)
    ctx.beginPath();
    ctx.moveTo(-pl.r * 0.9, -pl.r * 0.7);
    ctx.lineTo(-pl.r * 0.9,  pl.r * 0.7);
    ctx.lineTo(pl.r * 1.2, 0);
    ctx.closePath();
    const grad = ctx.createLinearGradient(-pl.r, 0, pl.r, 0);
    grad.addColorStop(0, '#7cffb7');
    grad.addColorStop(1, '#62d2ff');
    ctx.fillStyle = grad;
    ctx.shadowColor = 'rgba(0,0,0,0.35)';
    ctx.shadowBlur = 12;
    ctx.fill();
    ctx.shadowBlur = 0;

    // cockpit
    ctx.beginPath();
    ctx.arc(0, 0, pl.r * 0.4, 0, Math.PI*2);
    ctx.fillStyle = '#eaf2ff';
    ctx.globalAlpha = 0.9;
    ctx.fill();
    ctx.globalAlpha = 1;

    // flame (changes with velocity)
    const thrust = clamp(1 - (pl.vy + 400) / 1200, 0.1, 1.2);
    ctx.beginPath();
    ctx.moveTo(-pl.r * 0.9, -pl.r * 0.25);
    ctx.lineTo(-pl.r * 0.9, pl.r * 0.25);
    ctx.lineTo(-pl.r * (1.9 + 1.2 * thrust), 0);
    ctx.closePath();
    const flame = ctx.createLinearGradient(-pl.r * 0.9, 0, -pl.r * 2.8, 0);
    flame.addColorStop(0, 'rgba(255,255,255,0.9)');
    flame.addColorStop(1, '#ff9f6e');
    ctx.fillStyle = flame;
    ctx.fill();

    ctx.restore();
  }

  function drawHUD() {
    const w = vw();
    ctx.save();
    ctx.font = '600 24px system-ui, -apple-system, Segoe UI, Roboto, Ubuntu, Cantarell, Noto Sans, Arial, sans-serif';
    ctx.textAlign = 'left';
    ctx.textBaseline = 'top';
    ctx.fillStyle = 'rgba(255,255,255,0.9)';
    const margin = 12;
    ctx.fillText(`Skor: ${score}`, margin, margin);
    ctx.fillText(`Rekor: ${high}`, margin, margin + 26);
    ctx.restore();
  }

  function renderOverlay() {
    let html = '';
    if (state === STATE.MENU) {
      html = `
        <div class="panel">
          <h1>🚀 Selamat datang di <em>Flappy Roket</em></h1>
          <p>Klik / Sentuh / <kbd>Spasi</kbd> untuk terbang melewati celah pipa.</p>
          <p><strong>Kontrol:</strong> <kbd>Spasi</kbd>/<kbd>W</kbd>/<kbd>▲</kbd> terbang · <kbd>P</kbd> jeda · <kbd>R</kbd>/<kbd>Enter</kbd> ulang · <kbd>M</kbd> bisu</p>
          <p>Capai skor setinggi mungkin. Semangat!</p>
        </div>`;
    } else if (state === STATE.DEAD) {
      html = `
        <div class="panel">
          <h1>💥 Game Over</h1>
          <p>Skor akhir: <strong>${score}</strong> · Rekor: <strong>${high}</strong></p>
          <p>Klik atau tekan <kbd>Enter</kbd> untuk main lagi.</p>
        </div>`;
    } else if (state === STATE.PAUSE) {
      html = `<div class="panel"><h1>⏸️ Jeda</h1><p>Tekan <kbd>P</kbd> atau tombol <em>Lanjut</em> untuk melanjutkan.</p></div>`;
    }
    overlay.innerHTML = html;
    overlay.style.pointerEvents = (state === STATE.MENU || state === STATE.DEAD) ? 'auto' : 'none';
  }

  // Kickoff
  reset();
  updateButtons();
  requestAnimationFrame(frame);

})();