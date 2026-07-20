/* ============================================================
   BASTEL PVT LTD — shared.js
   Common: Cursor, Nav, Cookie, Chatbot, Reveal, Logger
   ============================================================ */

// ── CONFIG ──────────────────────────────────────────────────
const BASTEL_CONFIG = {
  API_BASE: window.location.hostname === 'localhost'
    ? 'http://localhost:3000/api'
    : '/api',
  EMAILJS_SERVICE: 'service_bfj2ua8',
  EMAILJS_OWNER_TPL: 'template_k3uoxrw',
  EMAILJS_REPLY_TPL: 'template_d6set95',
  COOKIE_KEY: 'bastel_cookie_consent',
  LOG_KEY: 'bastel_logs',
  THEME_KEY: 'bastel_theme',
};

// ── THEME TOGGLE ──────────────────────────────────────────────
(function initTheme() {
  const btn = document.getElementById('themeToggle');
  if (!btn) return;
  const setIcon = (theme) => { btn.textContent = theme === 'light' ? '🌙' : '☀️'; };
  setIcon(document.documentElement.getAttribute('data-theme') || 'dark');
  btn.addEventListener('click', () => {
    const next = document.documentElement.getAttribute('data-theme') === 'light' ? 'dark' : 'light';
    document.documentElement.setAttribute('data-theme', next);
    localStorage.setItem(BASTEL_CONFIG.THEME_KEY, next);
    setIcon(next);
  });
})();

// ── SITE CONTENT (admin-editable via /admin) ───────────────────
// Populates elements marked [data-cms="key"] (text) or [data-cms-href="key"]
// (href/mailto/tel) with the live values from /api/content. Elements keep
// their static fallback text until/unless this fetch succeeds.
(function loadSiteContent() {
  const textEls = document.querySelectorAll('[data-cms]');
  const hrefEls = document.querySelectorAll('[data-cms-href]');
  const videoEls = document.querySelectorAll('[data-cms-video]');
  if (!textEls.length && !hrefEls.length && !videoEls.length) return;

  fetch(`${BASTEL_CONFIG.API_BASE}/content`)
    .then(res => res.json())
    .then(({ success, data }) => {
      if (!success || !data) return;
      textEls.forEach(el => {
        const key = el.getAttribute('data-cms');
        if (data[key] != null) el.textContent = data[key];
      });
      hrefEls.forEach(el => {
        const key = el.getAttribute('data-cms-href');
        if (data[key] != null) el.setAttribute('href', el.getAttribute('href').replace(/^(mailto:|tel:).*/, `$1${data[key]}`));
      });
      videoEls.forEach(source => {
        const key = source.getAttribute('data-cms-video');
        if (data[key] == null || data[key] === source.getAttribute('src')) return;
        source.setAttribute('src', data[key]);
        const video = source.closest('video');
        if (!video) return;
        video.load();
        if (!video.hasAttribute('data-lazy-video')) video.play().catch(() => {});
      });
    })
    .catch(err => BLog?.error?.('Site content load failed', { error: err.message }));
})();

// ── LOGGER ──────────────────────────────────────────────────
const BLog = {
  _write(level, msg, data) {
    const entry = { ts: new Date().toISOString(), level, msg, data: data || null, page: location.pathname };
    console[level === 'error' ? 'error' : level === 'warn' ? 'warn' : 'log'](`[BASTEL][${level.toUpperCase()}]`, msg, data || '');
    try {
      const logs = JSON.parse(localStorage.getItem(BASTEL_CONFIG.LOG_KEY) || '[]');
      logs.push(entry);
      if (logs.length > 200) logs.splice(0, logs.length - 200); // keep last 200
      localStorage.setItem(BASTEL_CONFIG.LOG_KEY, JSON.stringify(logs));
    } catch(e) {}
  },
  info:  (msg, data) => BLog._write('info',  msg, data),
  warn:  (msg, data) => BLog._write('warn',  msg, data),
  error: (msg, data) => BLog._write('error', msg, data),
  getLogs() {
    try { return JSON.parse(localStorage.getItem(BASTEL_CONFIG.LOG_KEY) || '[]'); } catch { return []; }
  },
  clear() { localStorage.removeItem(BASTEL_CONFIG.LOG_KEY); }
};
window.BLog = BLog;
BLog.info('Page loaded', { page: location.pathname });

// ── COOKIE CONSENT ──────────────────────────────────────────
(function initCookies() {
  const consent = localStorage.getItem(BASTEL_CONFIG.COOKIE_KEY);
  if (consent) {
    BLog.info('Cookie consent already set', { consent });
    return;
  }
  const banner = document.getElementById('cookieBanner');
  if (!banner) return;
  setTimeout(() => banner.classList.add('show'), 1200);

  document.getElementById('cookieAccept')?.addEventListener('click', () => {
    localStorage.setItem(BASTEL_CONFIG.COOKIE_KEY, 'accepted');
    banner.classList.remove('show');
    BLog.info('Cookie consent accepted');
    // Enable analytics / tracking here if needed
  });
  document.getElementById('cookieDecline')?.addEventListener('click', () => {
    localStorage.setItem(BASTEL_CONFIG.COOKIE_KEY, 'declined');
    banner.classList.remove('show');
    BLog.info('Cookie consent declined');
  });
})();

// ── CURSOR ──────────────────────────────────────────────────
(function initCursor() {
  const cursor = document.getElementById('cursor');
  const cursorDot = document.getElementById('cursorDot');
  if (!cursor || !cursorDot) return;

  let mouseX = 0, mouseY = 0, curX = 0, curY = 0;
  document.addEventListener('mousemove', (e) => {
    mouseX = e.clientX; mouseY = e.clientY;
    cursorDot.style.transform = `translate(${mouseX}px,${mouseY}px) translate(-50%,-50%)`;
  });
  (function animateCursor() {
    curX += (mouseX - curX) * 0.12;
    curY += (mouseY - curY) * 0.12;
    cursor.style.transform = `translate(${curX}px,${curY}px) translate(-50%,-50%)`;
    requestAnimationFrame(animateCursor);
  })();
  document.querySelectorAll('a, button, .service-card, .mvv-card, .why-card, .process-step, .reg-card').forEach(el => {
    el.addEventListener('mouseenter', () => { cursor.style.width='60px'; cursor.style.height='60px'; cursor.style.borderColor='rgba(34,212,240,0.5)'; });
    el.addEventListener('mouseleave', () => { cursor.style.width='40px'; cursor.style.height='40px'; cursor.style.borderColor='var(--cyan)'; });
  });
})();

// ── NAVBAR ──────────────────────────────────────────────────
(function initNav() {
  const nav = document.getElementById('nav');
  const navToggle = document.getElementById('navToggle');
  const mobileMenu = document.getElementById('mobileMenu');
  if (!nav) return;

  window.addEventListener('scroll', () => {
    nav.classList.toggle('scrolled', window.scrollY > 60);
    // Active link highlighting (only for index page sections)
    let current = '';
    document.querySelectorAll('section[id]').forEach(sec => {
      if (window.scrollY + 120 >= sec.offsetTop) current = sec.id;
    });
    document.querySelectorAll('.nav-link[href^="#"]').forEach(link => {
      link.classList.toggle('active', link.getAttribute('href') === '#' + current);
    });
  });

  // Highlight current page link
  const path = location.pathname.replace(/\//g,'').replace('.html','') || 'index';
  document.querySelectorAll('.nav-link[data-page]').forEach(link => {
    if (link.dataset.page === path) link.classList.add('active');
  });

  navToggle?.addEventListener('click', () => {
    mobileMenu.classList.toggle('open');
    const spans = navToggle.querySelectorAll('span');
    if (mobileMenu.classList.contains('open')) {
      spans[0].style.transform='rotate(45deg) translate(4.5px,4.5px)';
      spans[1].style.opacity='0';
      spans[2].style.transform='rotate(-45deg) translate(4.5px,-4.5px)';
    } else {
      spans.forEach(s => { s.style.transform=''; s.style.opacity=''; });
    }
  });
  document.querySelectorAll('.mob-link').forEach(link => {
    link.addEventListener('click', () => {
      mobileMenu.classList.remove('open');
      navToggle.querySelectorAll('span').forEach(s => { s.style.transform=''; s.style.opacity=''; });
    });
  });

  // Smooth scroll for anchor links
  document.querySelectorAll('a[href^="#"]').forEach(a => {
    a.addEventListener('click', (e) => {
      const target = document.querySelector(a.getAttribute('href'));
      if (target) {
        e.preventDefault();
        window.scrollTo({ top: target.getBoundingClientRect().top + window.scrollY - nav.offsetHeight, behavior: 'smooth' });
      }
    });
  });
})();

// ── REVEAL ON SCROLL ────────────────────────────────────────
function initReveal() {
  const els = document.querySelectorAll('.reveal-up');
  const observer = new IntersectionObserver((entries) => {
    entries.forEach(e => { if (e.isIntersecting) e.target.classList.add('visible'); });
  }, { threshold: 0.1, rootMargin: '0px 0px -40px 0px' });
  els.forEach(el => observer.observe(el));
}

// ── LOADER ──────────────────────────────────────────────────
(function initLoader() {
  const loader = document.getElementById('loader');
  if (!loader) { initReveal(); return; }
  const progress = document.getElementById('loaderProgress');
  document.body.style.overflow = 'hidden';
  let val = 0;
  const iv = setInterval(() => {
    val += Math.random() * 14 + 4;
    if (val >= 100) {
      val = 100; clearInterval(iv);
      setTimeout(() => {
        loader.classList.add('hidden');
        document.body.style.overflow = '';
        initReveal();
        BLog.info('Site loaded');
      }, 400);
    }
    if (progress) progress.style.width = val + '%';
  }, 80);
})();

// ── CHATBOT ─────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
  const toggler  = document.querySelector('.chatbot-toggler');
  const closeBtn = document.querySelector('.close-btn');
  const chatbox  = document.querySelector('.chatbox');
  const chatInput= document.querySelector('.chat-input textarea');
  const sendBtn  = document.querySelector('#send-btn');
  if (!toggler || !chatbox) return;

  const mkLi = (msg, cls) => {
    const li = document.createElement('li');
    li.classList.add('chat', cls);
    li.innerHTML = cls === 'outgoing' ? `<p></p>` : `<span class="icon">🤖</span><p></p>`;
    li.querySelector('p').textContent = msg;
    return li;
  };
  const respond = (el) => {
    setTimeout(() => {
      el.querySelector('p').textContent = "The chatbot is being upgraded. Please use the Contact form or email bastel.pvt.ltd@gmail.com 📧";
      chatbox.scrollTo(0, chatbox.scrollHeight);
    }, 900);
  };
  const handleChat = () => {
    const msg = chatInput.value.trim(); if (!msg) return;
    chatInput.value = '';
    chatbox.appendChild(mkLi(msg, 'outgoing'));
    chatbox.scrollTo(0, chatbox.scrollHeight);
    BLog.info('Chatbot message sent', { msg });
    setTimeout(() => {
      const li = mkLi('Checking…', 'incoming');
      chatbox.appendChild(li); chatbox.scrollTo(0, chatbox.scrollHeight);
      respond(li);
    }, 500);
  };
  sendBtn?.addEventListener('click', handleChat);
  chatInput?.addEventListener('keydown', e => { if (e.key==='Enter' && !e.shiftKey && window.innerWidth>800) { e.preventDefault(); handleChat(); } });
  closeBtn?.addEventListener('click', () => document.body.classList.remove('show-chatbot'));
  toggler.addEventListener('click', () => document.body.classList.toggle('show-chatbot'));
});

// ── COUNTER ANIMATION ────────────────────────────────────────
(function initCounters() {
  const animateCounter = (el) => {
    const target = parseInt(el.getAttribute('data-target'), 10);
    const start = performance.now();
    const update = (now) => {
      const p = Math.min((now - start) / 2000, 1);
      el.textContent = Math.round((1 - Math.pow(1-p,3)) * target);
      if (p < 1) requestAnimationFrame(update);
    };
    requestAnimationFrame(update);
  };
  const obs = new IntersectionObserver((entries) => {
    entries.forEach(e => { if (e.isIntersecting) { e.target.querySelectorAll('.stat-num').forEach(animateCounter); obs.unobserve(e.target); } });
  }, { threshold: 0.5 });
  const heroStats = document.querySelector('.hero-stats');
  if (heroStats) obs.observe(heroStats);
})();

// ── PARALLAX ─────────────────────────────────────────────────
window.addEventListener('scroll', () => {
  const hero = document.querySelector('.hero-video');
  if (hero) hero.style.transform = `translateY(${window.scrollY * 0.25}px)`;
});

// ── GRAIN ANIMATION ──────────────────────────────────────────
(function createGrain() {
  const grain = document.querySelector('.hero-grain');
  if (!grain) return;
  let frame = 0;
  (function animate() {
    if (++frame % 2 === 0) grain.style.backgroundPosition = `${Math.random()*100}% ${Math.random()*100}%`;
    requestAnimationFrame(animate);
  })();
})();

// ── DYNAMIC ACTIVE NAV STYLE ─────────────────────────────────
const dynStyle = document.createElement('style');
dynStyle.textContent = `.nav-link.active:not(.contact-btn):not(.upcoming-btn){color:var(--cyan)!important;}.nav-link.active:not(.contact-btn):not(.upcoming-btn)::after{width:100%!important;}`;
document.head.appendChild(dynStyle);

// ── CORE VALUES ACCORDION ────────────────────────────────────
document.querySelectorAll('.value-header').forEach(header => {
  header.addEventListener('click', () => {
    const item = header.parentElement;
    document.querySelectorAll('.value-item').forEach(o => { if (o !== item) o.classList.remove('active'); });
    item.classList.toggle('active');
  });
});

// ── LAZY BACKGROUND VIDEOS ────────────────────────────────────
// Only starts downloading/playing videos marked [data-lazy-video] once they
// scroll near the viewport, instead of every background video loading and
// autoplaying at once on page load.
(function lazyVideos() {
  const videos = document.querySelectorAll('video[data-lazy-video]');
  if (!videos.length) return;

  if (!('IntersectionObserver' in window)) {
    videos.forEach(v => v.play());
    return;
  }

  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (!entry.isIntersecting) return;
      const video = entry.target;
      video.play().catch(() => {});
      observer.unobserve(video);
    });
  }, { rootMargin: '200px' });

  videos.forEach(v => observer.observe(v));
})();

BLog.info('Shared JS initialized');
