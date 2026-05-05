// routes/register.js
const express = require('express');
const router  = express.Router();
const supabase = require('../config/supabase');
const logger   = require('../middleware/logger');

// POST /api/register
router.post('/', async (req, res) => {
  const {
    trade_type, full_name, company_name, email, phone,
    country, trade_category, volume, freight_mode,
    trade_countries, requirements,
  } = req.body;

  // ── Validation ───────────────────────────────────────────
  if (!full_name || !email || !phone || !country || !trade_category || !trade_type) {
    return res.status(400).json({ success: false, message: 'Missing required fields.' });
  }
  const emailRx = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRx.test(email)) {
    return res.status(400).json({ success: false, message: 'Invalid email address.' });
  }

  logger.info('New registration attempt', { email, trade_type, country });

  // ── Insert to Supabase ───────────────────────────────────
  const { data, error } = await supabase
    .from('registrations')
    .insert([{
      trade_type,
      full_name,
      company_name: company_name || null,
      email,
      phone,
      country,
      trade_category,
      volume: volume || null,
      freight_mode: freight_mode || null,
      trade_countries: trade_countries || null,
      requirements: requirements || null,
      status: 'pending',           // pending → reviewed → approved
      created_at: new Date().toISOString(),
    }])
    .select()
    .single();

  if (error) {
    logger.error('Registration DB insert failed', { error: error.message, email });
    // Handle duplicate email
    if (error.code === '23505') {
      return res.status(409).json({ success: false, message: 'This email is already registered with us.' });
    }
    return res.status(500).json({ success: false, message: 'Registration failed. Please try again.' });
  }

  logger.info('Registration saved', { id: data.id, email });
  res.status(201).json({ success: true, message: 'Registration submitted successfully.', id: data.id });
});

// GET /api/register — admin: list all (add auth middleware in production)
router.get('/', async (req, res) => {
  const { status, type } = req.query;
  let query = supabase.from('registrations').select('*').order('created_at', { ascending: false });
  if (status) query = query.eq('status', status);
  if (type)   query = query.eq('trade_type', type);

  const { data, error } = await query;
  if (error) return res.status(500).json({ success: false, message: error.message });
  res.json({ success: true, count: data.length, data });
});

module.exports = router;
