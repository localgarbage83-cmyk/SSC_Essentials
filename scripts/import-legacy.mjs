// Imports chapter metadata (subject, number, titles) from the v1 JSON store: npm run import-legacy -- path/to/db.json
// Old PDFs, MCQs and quiz data are intentionally NOT migrated.
import fs from 'node:fs';
import { query } from '../lib/db.js';
const file = process.argv[2] || 'data/db.json';
const old = JSON.parse(fs.readFileSync(file, 'utf8'));
let added = 0, skipped = 0;
for (const c of old.chapters || []) {
  const s = (await query('select id from subjects where slug=$1', [c.subject]))[0];
  if (!s) { skipped++; continue; }
  const r = await query(`insert into chapters (subject_id, number, title, title_bn, display_order)
    values ($1,$2,$3,$4,$2) on conflict (subject_id, number) do nothing returning id`, [s.id, c.n, c.title, c.bn || null]);
  r.length ? added++ : skipped++;
}
console.log(`Chapters imported: ${added}, skipped (existing/unknown subject): ${skipped}`); process.exit(0);
