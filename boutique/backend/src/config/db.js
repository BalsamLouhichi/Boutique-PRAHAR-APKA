const { Pool } = require('pg');

// Chaîne de connexion unique (Neon, Vercel Postgres, Supabase...) si fournie,
// sinon variables séparées DB_*.
const connectionString = process.env.DATABASE_URL || process.env.POSTGRES_URL;
const useSSL = process.env.DB_SSL === 'true'
  || /[?&]sslmode=require/.test(connectionString || '');

const pool = new Pool({
  ...(connectionString
    ? { connectionString }
    : {
      host: process.env.DB_HOST || 'localhost',
      port: process.env.DB_PORT || 5432,
      user: process.env.DB_USER || 'postgres',
      password: process.env.DB_PASSWORD || 'postgres',
      database: process.env.DB_NAME || 'boutique',
    }),
  max: 10,
  idleTimeoutMillis: 30000,
  ssl: useSSL ? { rejectUnauthorized: false } : false,
});

pool.on('error', (err) => {
  console.error('Erreur inattendue du pool PostgreSQL', err);
});

module.exports = pool;