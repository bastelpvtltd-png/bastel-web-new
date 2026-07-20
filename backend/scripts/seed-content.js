// One-off script: scans frontend HTML for data-cms="key" leaf text nodes,
// extracts their current (hardcoded) text as the default value, and upserts
// each key into Supabase site_content — so admin panel fields aren't blank
// and "Save All" never wipes live text back to empty on first use.
require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') });
const fs = require('fs');
const path = require('path');
const supabase = require('../config/supabase');

const FRONTEND = path.join(__dirname, '..', '..', 'frontend');

function walk(dir, out = []) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, entry.name);
    if (entry.isDirectory()) walk(p, out);
    else if (entry.name.endsWith('.html')) out.push(p);
  }
}

function decodeEntities(s) {
  return s
    .replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"').replace(/&#39;/g, "'").replace(/&nbsp;/g, ' ');
}

const files = [];
walk(FRONTEND, files);

const values = {}; // key -> value (first occurrence wins)
const seenIn = {}; // key -> [files]

for (const file of files) {
  const html = fs.readFileSync(file, 'utf8');
  const re = /data-cms(-video)?="([a-z0-9_]+)"/g;
  let m;
  while ((m = re.exec(html))) {
    const isVideo = !!m[1];
    const key = m[2];
    seenIn[key] = seenIn[key] || [];
    seenIn[key].push(path.relative(FRONTEND, file));
    if (values[key] !== undefined) continue; // already captured a value
    const tagEnd = html.indexOf('>', m.index);
    if (tagEnd === -1) continue;
    if (isVideo) {
      // default value is this tag's own src="..." attribute, not leaf text
      const tagStart = html.lastIndexOf('<', m.index);
      const tag = html.slice(tagStart, tagEnd + 1);
      const srcMatch = tag.match(/\ssrc="([^"]*)"/);
      values[key] = srcMatch ? decodeEntities(srcMatch[1]) : '';
      continue;
    }
    // find the end of the opening tag this attribute lives in, then read
    // up to the next '<' as the leaf text content.
    const nextLt = html.indexOf('<', tagEnd + 1);
    if (nextLt === -1) continue;
    const text = decodeEntities(html.slice(tagEnd + 1, nextLt).trim());
    values[key] = text;
  }
}

const keys = Object.keys(values).sort();
console.log(`Found ${keys.length} unique data-cms keys across ${files.length} files.`);

(async () => {
  const rows = keys.map(key => ({ key, value: values[key], updated_at: new Date().toISOString() }));
  // upsert in chunks, don't overwrite keys that already have a saved value
  const { data: existing, error: fetchErr } = await supabase.from('site_content').select('key');
  if (fetchErr) { console.error('Fetch existing failed:', fetchErr.message); process.exit(1); }
  const existingKeys = new Set((existing || []).map(r => r.key));
  const toInsert = rows.filter(r => !existingKeys.has(r.key));
  console.log(`${existingKeys.size} keys already in DB (left untouched), inserting ${toInsert.length} new defaults.`);
  if (toInsert.length) {
    const { error } = await supabase.from('site_content').upsert(toInsert, { onConflict: 'key' });
    if (error) { console.error('Seed failed:', error.message); process.exit(1); }
  }
  console.log('Done.');
})();
