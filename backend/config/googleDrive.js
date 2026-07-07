// config/googleDrive.js — uploads registration images to a shared Google Drive folder
const { google } = require('googleapis');
const { Readable } = require('stream');
const logger = require('../middleware/logger');

const oauth2Client = new google.auth.OAuth2(
  process.env.GOOGLE_CLIENT_ID,
  process.env.GOOGLE_CLIENT_SECRET
);
oauth2Client.setCredentials({ refresh_token: process.env.GOOGLE_REFRESH_TOKEN });

const drive = google.drive({ version: 'v3', auth: oauth2Client });

// Uploads a single image buffer to the Bastel Drive folder and returns a public view link.
async function uploadImage(buffer, filename, mimeType) {
  const body = new Readable();
  body.push(buffer);
  body.push(null);

  const { data } = await drive.files.create({
    requestBody: {
      name: filename,
      parents: [process.env.GOOGLE_DRIVE_FOLDER_ID],
    },
    media: { mimeType, body },
    fields: 'id',
  });

  await drive.permissions.create({
    fileId: data.id,
    requestBody: { role: 'reader', type: 'anyone' },
  });

  logger.info('Uploaded image to Google Drive', { fileId: data.id, filename });
  return `https://drive.google.com/file/d/${data.id}/view`;
}

module.exports = { uploadImage };
