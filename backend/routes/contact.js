// routes/contact.js
const express  = require('express');
const router   = express.Router();
const supabase = require('../config/supabase');
const logger   = require('../middleware/logger');
const adminAuth = require('../middleware/adminAuth');
const { sendContactEmails } = require('../config/mailer');

// POST /api/contact
router.post('/', async (req, res) => {
  const { from_name, from_email, service, message } = req.body;
  if (!from_name || !from_email || !message) {
    return res.status(400).json({ success: false, message: 'Missing required fields.' });
  }
  const emailRx = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRx.test(from_email)) {
    return res.status(400).json({ success: false, message: 'Invalid email address.' });
  }

  logger.info('Contact form received', { from_email, service });

  const { data, error } = await supabase
    .from('contact_messages')
    .insert([{
      name: from_name,
      email: from_email,
      service: service || 'Not specified',
      message,
      created_at: new Date().toISOString(),
      status: 'new',
    }])
    .select()
    .single();

  if (error) {
    logger.error('Contact DB insert failed', { error: error.message });
    return res.status(500).json({ success: false, message: 'Could not save message.' });
  }

  logger.info('Contact message saved', { id: data.id });
  sendContactEmails(data); // fire-and-forget — a failed email shouldn't fail the submission
  res.status(201).json({ success: true, message: 'Message received.', id: data.id });
});

// GET /api/contact — admin view
router.get('/', adminAuth, async (req, res) => {
  const { data, error } = await supabase
    .from('contact_messages')
    .select('*')
    .order('created_at', { ascending: false });
  if (error) return res.status(500).json({ success: false, message: error.message });
  res.json({ success: true, count: data.length, data });
});

module.exports = router;
