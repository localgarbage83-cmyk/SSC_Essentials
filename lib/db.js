// Postgres access. Production: node-postgres -> Supabase pooler (DATABASE_URL).
// Local dev/tests only (no DATABASE_URL, NODE_ENV != production): embedded PGlite in .data/.
import fs from 'node:fs';
import { migrate } from './migrate.js';

const g = globalThis;
async function connect() {
  if (process.env.DATABASE_URL) {
    const { default: pg } = await import('pg');
    const pool = new pg.Pool({
      connectionString: process.env.DATABASE_URL,
      max: process.env.VERCEL ? 1 : 5,
      ssl: process.env.DATABASE_SSL === 'off' ? false : { rejectUnauthorized: false }
    });
    return { query: async (t, p) => (await pool.query(t, p)).rows, exec: t => pool.query(t), kind: 'pg' };
  }
  if (process.env.NODE_ENV === 'production') throw new Error('DATABASE_URL is required in production');
  const { PGlite } = await import('@electric-sql/pglite');
  const dir = process.env.PGLITE_DIR || '.data/pgdata';
  fs.mkdirSync(dir, { recursive: true });
  const lite = new PGlite(dir);
  await lite.waitReady;
  return { query: async (t, p) => (await lite.query(t, p)).rows, exec: t => lite.exec(t), kind: 'pglite' };
}
async function client() {
  if (!g.__sscDb) {
    g.__sscDb = connect().then(async c => { await migrate(c); return c; });
    g.__sscDb.catch(() => { g.__sscDb = null; });
  }
  return g.__sscDb;
}
export const query = async (text, params = []) => (await client()).query(text, params);
export const dbKind = async () => (await client()).kind;
export const closeDb = async () => { g.__sscDb = null; };
