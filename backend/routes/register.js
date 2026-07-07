// routes/register.js
const express = require('express');
const multer  = require('multer');
const router  = express.Router();
const supabase = require('../config/supabase');
const logger   = require('../middleware/logger');
const adminAuth = require('../middleware/adminAuth');
const { compressImage } = require('../config/imageCompress');
const { uploadImage } = require('../config/googleDrive');
const { sendRegistrationEmail } = require('../config/mailer');

const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 10 * 1024 * 1024 } });

const NAME_RX     = /^[A-Za-zÀ-ſ\s.'-]{2,60}$/;
const PHONE_RX    = /^\+?[\d\s-]{7,17}$/;
const TIN_VAT_RX  = /^\d{8,9}-\d{3,4}$/;
const BR_RX       = /^[A-Za-z]{2,4}\s?\d{5,10}$/;

// Compresses + uploads one registration image slot to Drive; returns its link, or null if not provided.
async function processImage(file, fullName, slot) {
  if (!file) return null;
  const compressed = await compressImage(file.buffer);
  const safeName = fullName.replace(/[^a-z0-9]+/gi, '_').toLowerCase();
  const filename = `${safeName}_${Date.now()}_${slot}.jpg`;
  return uploadImage(compressed, filename, 'image/jpeg');
}

// POST /api/register
router.post('/', upload.fields([{ name: 'image1', maxCount: 1 }, { name: 'image2', maxCount: 1 }]), async (req, res) => {
  const {
    trade_type, full_name, company_name, email, phone,
    country, tin_vat, br_number, trade_category, commodity,
    volume, freight_mode, trade_countries, requirements,
  } = req.body;

  // ── Validation ───────────────────────────────────────────
  if (!full_name || !email || !phone || !country || !trade_category || !trade_type || !commodity) {
    return res.status(400).json({ success: false, message: 'Missing required fields.' });
  }
  const emailRx = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRx.test(email)) {
    return res.status(400).json({ success: false, message: 'Invalid email address.' });
  }
  if (!NAME_RX.test(full_name.trim())) {
    return res.status(400).json({ success: false, message: 'Invalid name — use letters only (2-60 characters).' });
  }
  if (!PHONE_RX.test(phone.trim())) {
    return res.status(400).json({ success: false, message: 'Invalid phone number — e.g. +94 77 000 0000.' });
  }
  if (tin_vat && !TIN_VAT_RX.test(tin_vat.trim())) {
    return res.status(400).json({ success: false, message: 'Invalid TIN/VAT number — expected format e.g. 242788508-2525.' });
  }
  if (br_number && !BR_RX.test(br_number.trim())) {
    return res.status(400).json({ success: false, message: 'Invalid BR number — expected format e.g. PV 12345678.' });
  }

  logger.info('New registration attempt', { email, trade_type, country });

  // ── Compress + upload commodity images to Google Drive ───
  let image1_link = null, image2_link = null;
  try {
    [image1_link, image2_link] = await Promise.all([
      processImage(req.files?.image1?.[0], full_name, 1),
      processImage(req.files?.image2?.[0], full_name, 2),
    ]);
  } catch (err) {
    logger.error('Image upload failed', { email, error: err.message });
    return res.status(500).json({ success: false, message: 'Could not upload commodity images. Please try again.' });
  }

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
      tin_vat: tin_vat || null,
      br_number: br_number || null,
      trade_category,
      commodity,
      volume: volume || null,
      freight_mode: freight_mode || null,
      trade_countries: trade_countries || null,
      requirements: requirements || null,
      image1_link,
      image2_link,
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
  // Awaited (not fire-and-forget): on Vercel the function can freeze right after
  // the response is sent, silently dropping any email still in flight.
  await sendRegistrationEmail(data);
  res.status(201).json({ success: true, message: 'Registration submitted successfully.', id: data.id });
});

// GET /api/register — admin: list all
router.get('/', adminAuth, async (req, res) => {
  const { status, type } = req.query;
  let query = supabase.from('registrations').select('*').order('created_at', { ascending: false });
  if (status) query = query.eq('status', status);
  if (type)   query = query.eq('trade_type', type);

  const { data, error } = await query;
  if (error) return res.status(500).json({ success: false, message: error.message });
  res.json({ success: true, count: data.length, data });
});

module.exports = router;
