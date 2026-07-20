// routes/marketplace.js — "Trade Direct Marketplace" listings (coming soon preview, admin-managed)
const express = require('express');
const router  = express.Router();
const supabase = require('../config/supabase');
const logger   = require('../middleware/logger');
const adminAuth = require('../middleware/adminAuth');

// GET /api/marketplace — public: active listings for the coming-soon preview grid
router.get('/', async (req, res) => {
  const { data, error } = await supabase
    .from('marketplace_items')
    .select('*')
    .eq('status', 'active')
    .order('created_at', { ascending: false });
  if (error) return res.status(500).json({ success: false, message: error.message });
  res.json({ success: true, count: data.length, data });
});

// GET /api/marketplace/all — admin: every listing regardless of status
router.get('/all', adminAuth, async (req, res) => {
  const { data, error } = await supabase.from('marketplace_items').select('*').order('created_at', { ascending: false });
  if (error) return res.status(500).json({ success: false, message: error.message });
  res.json({ success: true, count: data.length, data });
});

// POST /api/marketplace — admin: create a listing
router.post('/', adminAuth, async (req, res) => {
  const { title, description, price, image_link, category, status } = req.body;
  if (!title) return res.status(400).json({ success: false, message: 'Title is required.' });

  const { data, error } = await supabase
    .from('marketplace_items')
    .insert([{ title, description: description || null, price: price || null, image_link: image_link || null, category: category || null, status: status || 'active' }])
    .select()
    .single();

  if (error) return res.status(500).json({ success: false, message: error.message });
  logger.info('Marketplace item created', { id: data.id, title });
  res.status(201).json({ success: true, data });
});

// PUT /api/marketplace/:id — admin: update a listing
router.put('/:id', adminAuth, async (req, res) => {
  const { title, description, price, image_link, category, status } = req.body;
  const { data, error } = await supabase
    .from('marketplace_items')
    .update({ title, description, price, image_link, category, status })
    .eq('id', req.params.id)
    .select()
    .single();

  if (error) return res.status(500).json({ success: false, message: error.message });
  res.json({ success: true, data });
});

// DELETE /api/marketplace/:id — admin: remove a listing
router.delete('/:id', adminAuth, async (req, res) => {
  const { error } = await supabase.from('marketplace_items').delete().eq('id', req.params.id);
  if (error) return res.status(500).json({ success: false, message: error.message });
  res.json({ success: true, message: 'Deleted.' });
});

module.exports = router;
