// Preview PDF storage. Production: Supabase Storage (private bucket, service-role key, server only).
// Local dev only: .data/previews on disk (never used in production).
import fs from 'node:fs/promises';
import path from 'node:path';
const hasSupabase = () => !!(process.env.SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY);
const bucket = () => process.env.SUPABASE_PREVIEW_BUCKET || 'previews';
const base = () => process.env.SUPABASE_URL.replace(/\/$/, '') + '/storage/v1';
const auth = () => ({ Authorization: 'Bearer ' + process.env.SUPABASE_SERVICE_ROLE_KEY, apikey: process.env.SUPABASE_SERVICE_ROLE_KEY });
const LOCAL = path.join(process.cwd(), '.data', 'previews');
const safe = p => { if (!/^[\w/-]+\.pdf$/.test(p) || p.includes('..')) throw new Error('bad path'); return p; };
let ensured = false;

export async function putPreview(p, bytes) {
  safe(p);
  if (!hasSupabase()) {
    if (process.env.NODE_ENV === 'production') throw new Error('Supabase Storage is not configured');
    const f = path.join(LOCAL, p); await fs.mkdir(path.dirname(f), { recursive: true }); return fs.writeFile(f, bytes);
  }
  if (!ensured) {   // create the private bucket on first use (409 = already exists)
    const r = await fetch(base() + '/bucket', { method: 'POST', headers: { ...auth(), 'Content-Type': 'application/json' }, body: JSON.stringify({ id: bucket(), name: bucket(), public: false }) });
    if (!r.ok && r.status !== 409 && !(await r.clone().text()).includes('already exists')) throw new Error('Could not create storage bucket: ' + r.status);
    ensured = true;
  }
  const r = await fetch(`${base()}/object/${bucket()}/${p}`, { method: 'POST', headers: { ...auth(), 'Content-Type': 'application/pdf', 'x-upsert': 'true' }, body: bytes });
  if (!r.ok) throw new Error('Storage upload failed: ' + r.status);
}
export async function getPreview(p) {
  safe(p);
  if (!hasSupabase()) { try { return await fs.readFile(path.join(LOCAL, p)); } catch { return null; } }
  const r = await fetch(`${base()}/object/authenticated/${bucket()}/${p}`, { headers: auth() });
  return r.ok ? Buffer.from(await r.arrayBuffer()) : null;
}
export async function delPreview(p) {
  if (!p) return;
  try {
    safe(p);
    if (!hasSupabase()) return await fs.rm(path.join(LOCAL, p), { force: true });
    await fetch(`${base()}/object/${bucket()}/${p}`, { method: 'DELETE', headers: auth() });
  } catch { /* best effort */ }
}
