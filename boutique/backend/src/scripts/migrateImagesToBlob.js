// Migration unique : pousse les images produits stockées en local
// (`image_url` = /uploads/xxx.png) vers Vercel Blob et met à jour la base.
//
// Prérequis (variables d'environnement) :
//   - BLOB_READ_WRITE_TOKEN : jeton du store Vercel Blob
//   - DB_* : accès PostgreSQL (comme pour l'API)
//
// Usage :
//   cd backend
//   node src/scripts/migrateImagesToBlob.js           # migre
//   node src/scripts/migrateImagesToBlob.js --dry-run  # simulation

require('dotenv').config();
const fs = require('fs');
const path = require('path');
const { put } = require('@vercel/blob');
const pool = require('../config/db');

const DRY_RUN = process.argv.includes('--dry-run');

const CONTENT_TYPE_BY_EXT = {
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.png': 'image/png',
  '.webp': 'image/webp',
};

const candidateDirs = [
  path.resolve(__dirname, '../../uploads'), // backend/uploads
  path.resolve(__dirname, '../../../uploads'), // boutique/uploads (legacy)
];

function findLocalFile(filename) {
  for (const dir of candidateDirs) {
    const full = path.join(dir, filename);
    if (fs.existsSync(full)) return full;
  }
  return null;
}

async function main() {
  if (!process.env.BLOB_READ_WRITE_TOKEN) {
    console.error('BLOB_READ_WRITE_TOKEN manquant. Abandon.');
    process.exit(1);
  }

  const { rows } = await pool.query(
    "SELECT id, image_url FROM product_images WHERE image_url LIKE '/uploads/%' ORDER BY id"
  );

  if (rows.length === 0) {
    console.log('Aucune image locale à migrer.');
    await pool.end();
    return;
  }

  console.log(`${rows.length} image(s) à migrer${DRY_RUN ? ' (simulation)' : ''}.\n`);

  let migrated = 0;
  let missing = 0;

  for (const row of rows) {
    const filename = path.basename(row.image_url);
    const localPath = findLocalFile(filename);

    if (!localPath) {
      console.warn(`  ✗ ${filename} — fichier introuvable en local, ignoré`);
      missing += 1;
      continue;
    }

    if (DRY_RUN) {
      console.log(`  • ${filename} — serait poussé vers Blob`);
      migrated += 1;
      continue;
    }

    const buffer = fs.readFileSync(localPath);
    const ext = path.extname(filename).toLowerCase();
    const blob = await put(filename, buffer, {
      access: 'public',
      contentType: CONTENT_TYPE_BY_EXT[ext] || 'application/octet-stream',
      token: process.env.BLOB_READ_WRITE_TOKEN,
    });

    await pool.query('UPDATE product_images SET image_url = $1 WHERE id = $2', [blob.url, row.id]);
    console.log(`  ✓ ${filename} → ${blob.url}`);
    migrated += 1;
  }

  console.log(`\nTerminé : ${migrated} migrée(s), ${missing} manquante(s).`);
  await pool.end();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
