// routes/media.js — admin uploads that replace a home-page video or the logo.
// The Node backend has no persistent disk on Vercel and can't touch the
// separately-deployed static frontend, so an "upload" here means: commit the
// new file straight into the GitHub repo (which redeploys Vercel), then point
// the site_content URL at it with a cache-busting ?v= so browsers with the
// old file cached pick up the change immediately once the deploy lands.
const express = require('express');
const multer = require('multer');
const router = express.Router();
const sharp = require('sharp');
const supabase = require('../config/supabase');
const logger = require('../middleware/logger');
const adminAuth = require('../middleware/adminAuth');
const { commitFile } = require('../config/github');

const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 60 * 1024 * 1024 } });

const SLOTS = {
  hero_video: { repoPath: 'frontend/assets/video2.mp4', urlPath: '/assets/video2.mp4', contentKey: 'home_hero_video_url', kind: 'video' },
  about_video: { repoPath: 'frontend/assets/video1.mp4', urlPath: '/assets/video1.mp4', contentKey: 'home_about_video_url', kind: 'video' },
  why_video: { repoPath: 'frontend/assets/video3.mp4', urlPath: '/assets/video3.mp4', contentKey: 'home_why_video_url', kind: 'video' },
  logo: { repoPath: 'frontend/assets/bastel.png', urlPath: '/assets/bastel.png', contentKey: 'site_logo_url', kind: 'image' },
};

// GET /api/media — admin: current file info for each slot (size, so the panel
// can flag anything that looks too big/low quality before a visitor hits it).
router.get('/', adminAuth, async (req, res) => {
  const results = {};
  await Promise.all(Object.entries(SLOTS).map(async ([slot, cfg]) => {
    try {
      const r = await fetch(`${req.protocol}://${req.get('host')}${cfg.urlPath}`, { method: 'HEAD' });
      results[slot] = { bytes: Number(r.headers.get('content-length')) || null, contentType: r.headers.get('content-type') || null };
    } catch {
      results[slot] = { bytes: null, contentType: null };
    }
  }));
  res.json({ success: true, data: results });
});

// POST /api/media/upload — admin: body is multipart with fields `slot` + `file`
router.post('/upload', adminAuth, upload.single('file'), async (req, res) => {
  const { slot } = req.body;
  const cfg = SLOTS[slot];
  if (!cfg) return res.status(400).json({ success: false, message: 'Unknown slot.' });
  if (!req.file) return res.status(400).json({ success: false, message: 'No file uploaded.' });

  const isVideo = cfg.kind === 'video';
  if (isVideo && !req.file.mimetype.startsWith('video/')) {
    return res.status(400).json({ success: false, message: 'Expected a video file.' });
  }
  if (!isVideo && !req.file.mimetype.startsWith('image/')) {
    return res.status(400).json({ success: false, message: 'Expected an image file.' });
  }

  try {
    // Logos get normalized to PNG + capped dimensions; videos are committed as-is
    // (no ffmpeg available here to transcode — the panel warns about size/format
    // client-side instead).
    const buffer = isVideo
      ? req.file.buffer
      : await sharp(req.file.buffer).resize({ width: 512, height: 512, fit: 'inside', withoutEnlargement: true }).png({ compressionLevel: 9 }).toBuffer();

    await commitFile(cfg.repoPath, buffer, `chore: replace ${slot} via admin panel upload`);

    const url = `${cfg.urlPath}?v=${Date.now()}`;
    const { error } = await supabase.from('site_content').upsert(
      { key: cfg.contentKey, value: url, updated_at: new Date().toISOString() },
      { onConflict: 'key' }
    );
    if (error) throw error;

    logger.info('Media replaced via admin upload', { slot, bytes: buffer.length });
    res.json({ success: true, message: 'Uploaded — live in about a minute once Vercel redeploys.', url, bytes: buffer.length });
  } catch (err) {
    logger.error('Media upload failed', { slot, error: err.message });
    res.status(500).json({ success: false, message: err.message || 'Upload failed.' });
  }
});

module.exports = router;
