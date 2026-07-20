// routes/content.js — editable site text (mission, vision, contact info, director's message)
const express = require('express');
const router  = express.Router();
const supabase = require('../config/supabase');
const logger   = require('../middleware/logger');
const adminAuth = require('../middleware/adminAuth');

// GET /api/content — public: the live site reads current content from here
router.get('/', async (req, res) => {
  const { data, error } = await supabase.from('site_content').select('key, value');
  if (error) return res.status(500).json({ success: false, message: error.message });
  const content = {};
  data.forEach(row => { content[row.key] = row.value; });
  res.json({ success: true, data: content });
});

// PUT /api/content — admin only: body is { key: value, key2: value2, ... }
router.put('/', adminAuth, async (req, res) => {
  const entries = Object.entries(req.body || {});
  if (!entries.length) return res.status(400).json({ success: false, message: 'No content provided.' });

  const rows = entries.map(([key, value]) => ({ key, value: String(value ?? ''), updated_at: new Date().toISOString() }));
  const { error } = await supabase.from('site_content').upsert(rows, { onConflict: 'key' });
  if (error) {
    logger.error('Site content update failed', { error: error.message });
    return res.status(500).json({ success: false, message: error.message });
  }

  logger.info('Site content updated', { keys: entries.map(([k]) => k) });
  res.json({ success: true, message: 'Content updated.' });
});

module.exports = router;
