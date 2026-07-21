/* ============================================================
   BASTEL PVT LTD — canvas-bg.js
   Code-generated background animations for the home page (no video
   files, no hosting/bandwidth cost). Three independent canvases:
     #heroCanvas   — global trade route network (hero section)
     #aboutCanvas  — drifting connection-particle constellation
     #whyCanvas    — animated data-stream grid
   Each pauses its render loop while scrolled out of view.
   ============================================================ */
(function () {
  const REDUCED_MOTION = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  const COLOR = {
    green: '#1a7a4a',
    cyan: '#22d4f0',
    cyanLight: '#5ee2f5',
    dark: '#060c0a',
  };

  function hexToRgb(hex) {
    const n = parseInt(hex.slice(1), 16);
    return { r: (n >> 16) & 255, g: (n >> 8) & 255, b: n & 255 };
  }
  const CYAN_RGB = hexToRgb(COLOR.cyan);
  const GREEN_RGB = hexToRgb(COLOR.green);
  const rgba = (c, a) => `rgba(${c.r},${c.g},${c.b},${a})`;

  // ── Base class: handles DPI-correct sizing + a page-visibility-gated rAF loop ──
  class CanvasScene {
    constructor(canvas) {
      this.canvas = canvas;
      this.ctx = canvas.getContext('2d');
      this.running = false;
      this.raf = null;
      this.dpr = Math.min(window.devicePixelRatio || 1, 2);
      this._resize = this._resize.bind(this);
      this._tick = this._tick.bind(this);
      this._resize();
      window.addEventListener('resize', this._resize);
      this.init();

      if (REDUCED_MOTION) { this.draw(0); return; } // static single frame, no loop

      this.start();
      document.addEventListener('visibilitychange', () => {
        document.hidden ? this.stop() : this.start();
      });
    }
    _resize() {
      const rect = this.canvas.getBoundingClientRect();
      this.w = Math.max(1, rect.width);
      this.h = Math.max(1, rect.height);
      this.canvas.width = this.w * this.dpr;
      this.canvas.height = this.h * this.dpr;
      this.ctx.setTransform(this.dpr, 0, 0, this.dpr, 0, 0);
      if (this.onResize) this.onResize();
    }
    start() { if (!this.running) { this.running = true; this.last = performance.now(); this.raf = requestAnimationFrame(this._tick); } }
    stop() { this.running = false; if (this.raf) cancelAnimationFrame(this.raf); }
    _tick(now) {
      if (!this.running) return;
      const dt = Math.min((now - this.last) / 1000, 0.05);
      this.last = now;
      this.draw(dt);
      this.raf = requestAnimationFrame(this._tick);
    }
    init() {}
    draw(_dt) {}
  }

  // ── HERO: global trade-route network radiating from Colombo ──────────
  class HeroNetwork extends CanvasScene {
    init() {
      // Node positions as fractions of canvas size — Colombo is the hub.
      this.nodes = [
        { key: 'colombo',     x: 0.16, y: 0.60, hub: true,  label: 'COLOMBO' },
        { key: 'dubai',       x: 0.36, y: 0.32 },
        { key: 'singapore',   x: 0.68, y: 0.58 },
        { key: 'shanghai',    x: 0.86, y: 0.30 },
        { key: 'rotterdam',   x: 0.52, y: 0.16 },
        { key: 'southampton', x: 0.30, y: 0.14 },
      ];
      this.hub = this.nodes[0];
      this.routes = this.nodes.slice(1).map((n, i) => ({
        from: this.hub, to: n,
        pulses: [
          { t: (i * 0.37) % 1, speed: 0.28 + (i % 3) * 0.06 },
          { t: (i * 0.37 + 0.5) % 1, speed: 0.22 + (i % 2) * 0.07 },
        ],
      }));
      this.dots = Array.from({ length: 70 }, () => ({
        x: Math.random(), y: Math.random(), r: Math.random() * 1.1 + 0.3, a: Math.random() * 0.3 + 0.08,
      }));
      this.t = 0;
    }
    pointOn(route, t) {
      // Quadratic bezier bowing slightly "upward" (toward top of canvas) for a great-circle feel.
      const { from, to } = route;
      const mx = (from.x + to.x) / 2, my = (from.y + to.y) / 2 - 0.09;
      const u = 1 - t;
      return {
        x: u * u * from.x + 2 * u * t * mx + t * t * to.x,
        y: u * u * from.y + 2 * u * t * my + t * t * to.y,
      };
    }
    draw(dt) {
      const { ctx, w, h } = this;
      this.t += dt;
      ctx.clearRect(0, 0, w, h);

      // faint background dot texture
      this.dots.forEach(d => {
        ctx.beginPath();
        ctx.arc(d.x * w, d.y * h, d.r, 0, Math.PI * 2);
        ctx.fillStyle = rgba(CYAN_RGB, d.a * 0.5);
        ctx.fill();
      });

      // route lines
      this.routes.forEach(route => {
        ctx.beginPath();
        for (let i = 0; i <= 40; i++) {
          const p = this.pointOn(route, i / 40);
          ctx.lineTo(p.x * w, p.y * h);
        }
        ctx.strokeStyle = rgba(CYAN_RGB, 0.28);
        ctx.lineWidth = 1.2;
        ctx.stroke();
      });

      // traveling shipment pulses (with a short glowing trail)
      this.routes.forEach(route => {
        route.pulses.forEach(pulse => {
          pulse.t = (pulse.t + dt * pulse.speed) % 1;
          const glow = Math.sin(pulse.t * Math.PI); // fade in/out along the path
          for (let trail = 0; trail < 6; trail++) {
            const tt = pulse.t - trail * 0.012;
            if (tt < 0) continue;
            const p = this.pointOn(route, tt);
            const trailA = (1 - trail / 6) * (0.9 * glow + 0.15);
            ctx.beginPath();
            ctx.arc(p.x * w, p.y * h, trail === 0 ? 3.2 : 3.2 - trail * 0.4, 0, Math.PI * 2);
            ctx.fillStyle = rgba(CYAN_RGB, trailA);
            if (trail === 0) { ctx.shadowColor = COLOR.cyan; ctx.shadowBlur = 12; }
            ctx.fill();
            ctx.shadowBlur = 0;
          }
        });
      });

      // nodes
      this.nodes.forEach(n => {
        const px = n.x * w, py = n.y * h;
        const pulse = 0.6 + Math.sin(this.t * 2.6 + n.x * 6) * 0.4;
        const baseR = n.hub ? 4.5 : 3;
        // outer breathing halo
        ctx.beginPath();
        ctx.arc(px, py, baseR + 6 * pulse, 0, Math.PI * 2);
        ctx.fillStyle = rgba(n.hub ? GREEN_RGB : CYAN_RGB, 0.10 * pulse);
        ctx.fill();
        // core dot
        ctx.beginPath();
        ctx.arc(px, py, baseR, 0, Math.PI * 2);
        ctx.fillStyle = n.hub ? COLOR.cyanLight : rgba(CYAN_RGB, 0.9);
        ctx.shadowColor = COLOR.cyan;
        ctx.shadowBlur = n.hub ? 14 : 8;
        ctx.fill();
        ctx.shadowBlur = 0;
        if (n.hub) {
          ctx.font = '600 11px "DM Sans", sans-serif';
          ctx.fillStyle = rgba(CYAN_RGB, 0.75);
          ctx.textBaseline = 'middle';
          ctx.fillText(n.label, px + 10, py);
        }
      });
    }
  }

  // ── ABOUT: drifting connection-particle constellation ────────────────
  class AboutParticles extends CanvasScene {
    init() {
      const count = 34;
      this.particles = Array.from({ length: count }, () => ({
        x: Math.random(), y: Math.random(),
        vx: (Math.random() - 0.5) * 0.09, vy: (Math.random() - 0.5) * 0.09,
        r: Math.random() * 1.8 + 1.2,
      }));
      this.linkDist = 0.18;
    }
    draw(dt) {
      const { ctx, w, h } = this;
      ctx.clearRect(0, 0, w, h);
      this.particles.forEach(p => {
        p.x += p.vx * dt; p.y += p.vy * dt;
        if (p.x < 0 || p.x > 1) p.vx *= -1;
        if (p.y < 0 || p.y > 1) p.vy *= -1;
        p.x = Math.min(1, Math.max(0, p.x));
        p.y = Math.min(1, Math.max(0, p.y));
      });
      for (let i = 0; i < this.particles.length; i++) {
        for (let j = i + 1; j < this.particles.length; j++) {
          const a = this.particles[i], b = this.particles[j];
          const dx = a.x - b.x, dy = a.y - b.y;
          const dist = Math.hypot(dx, dy);
          if (dist < this.linkDist) {
            ctx.beginPath();
            ctx.moveTo(a.x * w, a.y * h);
            ctx.lineTo(b.x * w, b.y * h);
            ctx.strokeStyle = rgba(CYAN_RGB, (1 - dist / this.linkDist) * 0.45);
            ctx.lineWidth = 1;
            ctx.stroke();
          }
        }
      }
      // one shared glow pass instead of per-particle shadowBlur (much cheaper)
      ctx.shadowColor = COLOR.cyan;
      ctx.shadowBlur = 5;
      this.particles.forEach(p => {
        ctx.beginPath();
        ctx.arc(p.x * w, p.y * h, p.r, 0, Math.PI * 2);
        ctx.fillStyle = rgba(GREEN_RGB, 0.95);
        ctx.fill();
      });
      ctx.shadowBlur = 0;
    }
  }

  // ── WHY US: animated data-stream grid ─────────────────────────────────
  class WhyGrid extends CanvasScene {
    init() {
      this.cell = 46;
      this.streams = Array.from({ length: 22 }, () => this._newStream());
    }
    _newStream() {
      return {
        col: Math.floor(Math.random() * 40),
        y: -Math.random() * 1,
        len: 0.14 + Math.random() * 0.22,
        speed: 0.28 + Math.random() * 0.34,
        a: 0.4 + Math.random() * 0.45,
      };
    }
    draw(dt) {
      const { ctx, w, h } = this;
      ctx.clearRect(0, 0, w, h);

      // faint grid
      ctx.strokeStyle = rgba(CYAN_RGB, 0.1);
      ctx.lineWidth = 1;
      for (let x = 0; x < w; x += this.cell) { ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, h); ctx.stroke(); }
      for (let y = 0; y < h; y += this.cell) { ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(w, y); ctx.stroke(); }

      const cols = Math.max(1, Math.round(w / this.cell));
      this.streams.forEach(s => {
        s.y += s.speed * dt;
        if (s.y - s.len > 1) Object.assign(s, this._newStream(), { y: -s.len });
        const x = (s.col % cols) * this.cell + this.cell / 2;
        const y0 = s.y * h, y1 = (s.y - s.len) * h;
        const grad = ctx.createLinearGradient(x, y1, x, y0);
        grad.addColorStop(0, rgba(CYAN_RGB, 0));
        grad.addColorStop(1, rgba(CYAN_RGB, s.a));
        ctx.strokeStyle = grad;
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(x, Math.max(0, y1));
        ctx.lineTo(x, Math.min(h, y0));
        ctx.stroke();
        // bright leading tip
        if (y0 >= 0 && y0 <= h) {
          ctx.beginPath();
          ctx.arc(x, y0, 2, 0, Math.PI * 2);
          ctx.fillStyle = rgba(CYAN_RGB, Math.min(1, s.a + 0.3));
          ctx.shadowColor = COLOR.cyan;
          ctx.shadowBlur = 8;
          ctx.fill();
          ctx.shadowBlur = 0;
        }
      });
    }
  }

  document.addEventListener('DOMContentLoaded', () => {
    const heroCanvas = document.getElementById('heroCanvas');
    const aboutCanvas = document.getElementById('aboutCanvas');
    const whyCanvas = document.getElementById('whyCanvas');
    if (heroCanvas) new HeroNetwork(heroCanvas);
    if (aboutCanvas) new AboutParticles(aboutCanvas);
    if (whyCanvas) new WhyGrid(whyCanvas);
  });
})();
