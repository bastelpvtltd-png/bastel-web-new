// routes/notify.js
const express  = require('express');
const router   = express.Router();
const supabase = require('../config/supabase');
const logger   = require('../middleware/logger');
const adminAuth = require('../middleware/adminAuth');

// POST /api/notify
router.post('/', async (req, res) => {
  const { name, email, type } = req.body;

  if (!name || !email) {
    return res.status(400).json({ success: false, message: 'Name and email are required.' });
  }
  const emailRx = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRx.test(email)) {
    return res.status(400).json({ success: false, message: 'Invalid email address.' });
  }

  logger.info('Notify signup', { email, type });

  const { data, error } = await supabase
    .from('notify_list')
    .insert([{
      name,
      email,
      trade_type: type || 'both',
      created_at: new Date().toISOString(),
    }])
    .select()
    .single();

  if (error) {
    if (error.code === '23505') {
      return res.status(409).json({ success: false, message: 'This email is already on our notify list.' });
    }
    logger.error('Notify DB insert failed', { error: error.message });
    return res.status(500).json({ success: false, message: 'Could not save. Please try again.' });
  }

  logger.info('Notify signup saved', { id: data.id, email });
  res.status(201).json({ success: true, message: 'You\'re on the list!', id: data.id });
});

// GET /api/notify — admin list
router.get('/', adminAuth, async (req, res) => {
  const { data, error } = await supabase
    .from('notify_list')
    .select('*')
    .order('created_at', { ascending: false });
  if (error) return res.status(500).json({ success: false, message: error.message });
  res.json({ success: true, count: data.length, data });
});

module.exports = router;
