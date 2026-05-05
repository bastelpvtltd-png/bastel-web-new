// server.js — Bastel Pvt Ltd Backend
require('dotenv').config();
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
  allowedHeaders: ['Content-Type'],
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

// Health check (Render uses this)
app.get('/health', (_req, res) => res.json({ status: 'ok', ts: new Date().toISOString() }));

// 404
app.use((_req, res) => res.status(404).json({ success: false, message: 'Endpoint not found.' }));

// Global error handler
app.use((err, _req, res, _next) => {
  logger.error('Unhandled error', { message: err.message });
  res.status(500).json({ success: false, message: 'Internal server error.' });
});

// ── START ─────────────────────────────────────────────────────
app.listen(PORT, () => {
  logger.info(`Bastel backend running on port ${PORT}`, { env: process.env.NODE_ENV });
});
