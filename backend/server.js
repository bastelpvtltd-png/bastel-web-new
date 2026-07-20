// server.js — Bastel Pvt Ltd Backend
require('dotenv').config();
const path        = require('path');
const express     = require('express');
const cors        = require('cors');
const helmet      = require('helmet');
const morgan      = require('morgan');
const rateLimit   = require('express-rate-limit');
const logger      = require('./middleware/logger');

const app  = express();
const PORT = process.env.PORT || 3000;

// ── ALLOWED ORIGINS ──────────────────────────────────────────
const ALLOWED = (process.env.ALLOWED_ORIGINS || '')
  .split(',').map(o => o.trim()).filter(Boolean);

// ── MIDDLEWARE ────────────────────────────────────────────────
app.use(helmet({ contentSecurityPolicy: false }));
app.use(morgan('tiny'));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// CORS
app.use(cors({
  origin: (origin, cb) => {
    // allow non-browser requests (curl, Render health checks) and listed origins
    if (!origin || ALLOWED.length === 0 || ALLOWED.includes(origin)) {
      cb(null, true);
    } else {
      logger.warn('CORS blocked', { origin });
      cb(new Error('Not allowed by CORS'));
    }
  },
  methods: ['GET', 'POST', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'x-admin-key'],
}));

// Global rate limit — 100 req / 15 min per IP
app.use(rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: 'Too many requests. Please try again later.' },
}));

// ── ROUTES ────────────────────────────────────────────────────
app.use('/api/register', require('./routes/register'));
app.use('/api/notify',   require('./routes/notify'));
app.use('/api/contact',  require('./routes/contact'));
app.use('/api/content',  require('./routes/content'));
app.use('/api/marketplace', require('./routes/marketplace'));

// Admin dashboard — served at /admin both locally and on Vercel (vercel.json
// routes /admin(.*) here). Gated client-side by the ADMIN_KEY sent as
// x-admin-key on every data request; the HTML shell itself is not secret.
app.use('/admin', express.static(path.join(__dirname, 'admin')));

// Health check (Render uses this)
app.get('/health', (_req, res) => res.json({ status: 'ok', ts: new Date().toISOString() }));

// Clean URLs for local dev (mirrors the /services etc. rewrites in vercel.json,
// which only apply on the actual Vercel deployment, not `node server.js`).
const CLEAN_PAGES = {
  '/services': 'services.html',
  '/freight-process': 'freight-process.html',
  '/register': 'register.html',
  '/upcoming': 'upcoming.html',
  '/marketplace': 'marketplace.html',
  '/privacy': 'privacy.html',
  '/terms': 'terms.html',
};
Object.entries(CLEAN_PAGES).forEach(([route, file]) => {
  app.get(route, (_req, res) => res.sendFile(path.join(__dirname, '..', 'frontend', 'pages', file)));
});

// Serves the site itself when running locally (`node server.js`). On Vercel,
// vercel.json routes non-api paths straight to frontend/** as a separate
// static deployment, so this middleware is never reached there.
app.use(express.static(path.join(__dirname, '..', 'frontend')));

// 404
app.use((_req, res) => res.status(404).json({ success: false, message: 'Endpoint not found.' }));

// Global error handler
app.use((err, _req, res, _next) => {
  logger.error('Unhandled error', { message: err.message });
  res.status(500).json({ success: false, message: 'Internal server error.' });
});

// ── START ─────────────────────────────────────────────────────
if (require.main === module) {
  app.listen(PORT, () => {
    logger.info(`Bastel backend running on port ${PORT}`, { env: process.env.NODE_ENV });
  });
}

module.exports = app;
