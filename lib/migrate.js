import fs from 'node:fs';
import path from 'node:path';
const DIR = path.join(process.cwd(), 'supabase', 'migrations');
// Applies supabase/migrations/*.sql in filename order, once each.
export async function migrate(c) {
  await c.exec('create table if not exists schema_migrations (name text primary key, applied_at timestamptz not null default now())');
  const done = new Set((await c.query('select name from schema_migrations')).map(r => r.name));
  const applied = [];
  for (const f of fs.readdirSync(DIR).filter(x => x.endsWith('.sql')).sort()) {
    if (done.has(f)) continue;
    await c.exec('begin;\n' + fs.readFileSync(path.join(DIR, f), 'utf8') + `\ninsert into schema_migrations(name) values ('${f}');\ncommit;`);
    applied.push(f);
  }
  return applied;
}
