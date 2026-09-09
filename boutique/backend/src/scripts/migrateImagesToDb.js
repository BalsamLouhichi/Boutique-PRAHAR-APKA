// Migration unique : charge dans la base les images produit encore stockées
// sur le disque (`image_url` = /uploads/xxx.png) puis réécrit `image_url` vers
// la nouvelle route GET /api/products/images/:id.
//
// Prérequis : la migration SQL db/migration_images_in_db.sql doit être passée,
// et le .env doit pointer vers la bonne base (DB_* + DB_SSL=true pour Neon).
//
// Usage :
//   cd backend
//   node src/scripts/migrateImagesToDb.js --dry-run   # simulation
//   node src/scripts/migrateImagesToDb.js             # migration réelle

require('dotenv').config();
const fs = require('fs');
const path = require('path');
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
  const { rows } = await pool.query(
    "SELECT id, image_url FROM product_images WHERE data IS NULL AND image_url LIKE '/uploads/%' ORDER BY id"
  );

  if (rows.length === 0) {
    console.log('Aucune image disque à reprendre.');
    await pool.end();
    return;
  }

  console.log(`${rows.length} image(s) à reprendre${DRY_RUN ? ' (simulation)' : ''}.\n`);

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
      console.log(`  • ${filename} — serait chargé en base (id ${row.id})`);
      migrated += 1;
      continue;
    }

    const buffer = fs.readFileSync(localPath);
    const ext = path.extname(filename).toLowerCase();
    await pool.query(
      `UPDATE product_images
          SET data = $1,
              content_type = $2,
              image_url = '/api/products/images/' || id
        WHERE id = $3`,
      [buffer, CONTENT_TYPE_BY_EXT[ext] || 'application/octet-stream', row.id]
    );
    console.log(`  ✓ ${filename} → /api/products/images/${row.id}`);
    migrated += 1;
  }

  console.log(`\nTerminé : ${migrated} reprise(s), ${missing} manquante(s).`);
  await pool.end();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
