// config/imageCompress.js — compress an image buffer down to ~2MB
const sharp = require('sharp');

const TARGET_BYTES = 2 * 1024 * 1024;

async function compressImage(buffer) {
  let quality = 85;
  let width = 2000;
  let output = await sharp(buffer).rotate().resize({ width, withoutEnlargement: true }).jpeg({ quality }).toBuffer();

  while (output.length > TARGET_BYTES && (quality > 30 || width > 800)) {
    if (quality > 30) quality -= 10;
    else width -= 200;
    output = await sharp(buffer).rotate().resize({ width, withoutEnlargement: true }).jpeg({ quality }).toBuffer();
  }

  return output;
}

module.exports = { compressImage };
