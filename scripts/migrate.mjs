// Applies supabase/migrations/*.sql to DATABASE_URL (Supabase) — safe to re-run.
import { query, closeDb } from '../lib/db.js';
const rows = await query('select name from schema_migrations order by name'); // connecting runs pending migrations
console.log('Migrations applied:\n' + rows.map(r => ' - ' + r.name).join('\n'));
await closeDb(); process.exit(0);
