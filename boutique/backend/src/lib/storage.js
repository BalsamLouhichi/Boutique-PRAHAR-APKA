// Stockage des images produits.
//
// En production sur Vercel (ou tout hébergement serverless), le système de
// fichiers est éphémère et en lecture seule : les fichiers écrits par multer
// disparaissent et ne sont jamais servis. On stocke donc les images sur
// Vercel Blob dès que `BLOB_READ_WRITE_TOKEN` est défini.
//
// En local / Docker (pas de token), on retombe sur un stockage disque dans
// `backend/uploads`, servi par express.static (voir src/index.js).

const crypto = require('crypto');
const fs = require('fs');
const path = require('path');
const { put, del } = require('@vercel/blob');

const EXT_BY_MIME = {
  'image/jpeg': '.jpg',
  'image/png': '.png',
  'image/webp': '.webp',
};

const localUploadsDir = path.resolve(__dirname, '../../uploads');

function useBlob() {
  return Boolean(process.env.BLOB_READ_WRITE_TOKEN);
}

function buildFilename(originalName, mimetype) {
  const ext = path.extname(originalName || '').toLowerCase() || EXT_BY_MIME[mimetype] || '';
  return crypto.randomBytes(16).toString('hex') + ext;
}

// Enregistre un buffer et renvoie l'URL à stocker en base (`image_url`).
// - Blob  : URL absolue https (ex: https://xxxx.public.blob.vercel-storage.com/abc.png)
// - Local : URL relative /uploads/abc.png
async function saveImage(file) {
  const filename = buildFilename(file.originalname, file.mimetype);

  if (useBlob()) {
    const blob = await put(filename, file.buffer, {
      access: 'public',
      contentType: file.mimetype,
      token: process.env.BLOB_READ_WRITE_TOKEN,
    });
    return blob.url;
  }

  fs.mkdirSync(localUploadsDir, { recursive: true });
  fs.writeFileSync(path.join(localUploadsDir, filename), file.buffer);
  return `/uploads/${filename}`;
}

// Supprime le fichier physique correspondant à une `image_url`.
// Best-effort : on ne fait jamais échouer la requête si la suppression rate.
async function deleteImage(imageUrl) {
  if (!imageUrl) return;

  try {
    if (/^https?:\/\//i.test(imageUrl)) {
      if (useBlob()) {
        await del(imageUrl, { token: process.env.BLOB_READ_WRITE_TOKEN });
      }
      return;
    }

    // URL relative type /uploads/xxxx.png
    const filename = path.basename(imageUrl);
    fs.rmSync(path.join(localUploadsDir, filename), { force: true });
  } catch (err) {
    console.error('Suppression de l\'image impossible :', imageUrl, err.message);
  }
}

module.exports = { saveImage, deleteImage, useBlob };
