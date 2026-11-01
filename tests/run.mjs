// End-to-end tests against a real Next server + embedded Postgres (PGlite). Run: npm test
import { spawn, spawnSync } from 'node:child_process';
import fs from 'node:fs';
import { PDFDocument } from 'pdf-lib';
import { makePreview } from '../lib/pdf.js';
import { hashPassword, verifyPassword } from '../lib/password.js';

const PORT = 3100, B = `http://localhost:${PORT}`, USER = 'tester', PASS = 'correct horse battery staple';
const env = { ...process.env, PGLITE_DIR: '.data/test-pgdata', DRIVE_CHECK: 'off', NEXT_TELEMETRY_DISABLED: '1', ADMIN_USERNAME: USER, ADMIN_PASSWORD: PASS };
delete env.DATABASE_URL; delete env.SUPABASE_URL;
fs.rmSync('.data', { recursive: true, force: true });

let pass = 0, failed = 0;
const t = async (name, fn) => { try { await fn(); pass++; console.log('  ok   ' + name); } catch (e) { failed++; console.log('  FAIL ' + name + '\n       ' + e.message); } };
const eq = (a, b, m = '') => { if (a !== b) throw new Error(`${m} expected ${b}, got ${a}`); };
const pdf = async n => { const d = await PDFDocument.create(); for (let i = 0; i < n; i++) d.addPage([300, 300]).drawText('Page ' + (i + 1), { x: 50, y: 150 }); return await d.save(); };
const call = async (method, path, { cookie, csrf, body, form, headers = {} } = {}) => {
  const h = { ...headers }; if (cookie) h.cookie = cookie; if (csrf) h['x-csrf-token'] = csrf; h.origin = h.origin ?? B;
  if (body) h['content-type'] = 'application/json';
  const r = await fetch(B + path, { method, headers: h, body: form || (body ? JSON.stringify(body) : undefined), redirect: 'manual' });
  const ct = r.headers.get('content-type') || ''; let data = null;
  if (ct.includes('json')) data = await r.json(); else if (ct.includes('pdf')) data = new Uint8Array(await r.arrayBuffer()); else data = await r.text();
  return { status: r.status, data, headers: r.headers };
};
const pform = (id, bytes, orig, type = 'application/pdf') => { const f = new FormData(); f.set('id', id); if (orig) f.set('originalPages', orig); f.set('file', new Blob([bytes], { type }), 'p.pdf'); return f; };

// --- setup: migrations twice (idempotent), admin, server ---
console.log('Setup');
let r = spawnSync('node', ['scripts/migrate.mjs'], { env, encoding: 'utf8' }); console.log(r.stdout.trim().split('\n').map(x => '  ' + x).join('\n'));
if (r.status) { console.log(r.stderr); process.exit(1); }
r = spawnSync('node', ['scripts/create-admin.mjs'], { env, encoding: 'utf8' }); console.log('  ' + r.stdout.trim());
if (r.status) { console.log(r.stderr); process.exit(1); }
const srv = spawn('npx', ['next', 'dev', '-p', String(PORT)], { env, stdio: 'ignore', detached: true });
const stop = () => { try { process.kill(-srv.pid); } catch { srv.kill(); } };
process.on('exit', stop); process.on('SIGINT', () => { stop(); process.exit(1); });
for (let i = 0; i < 90; i++) { try { if ((await fetch(B + '/robots.txt')).ok) break; } catch {} await new Promise(r => setTimeout(r, 1000)); }

console.log('\nAuthentication & authorization');
const adminRoutes = [['POST', '/api/admin/subjects'], ['PATCH', '/api/admin/subjects'], ['POST', '/api/admin/chapters'], ['PATCH', '/api/admin/chapters'], ['DELETE', '/api/admin/chapters?id=x'], ['POST', '/api/admin/materials'], ['PATCH', '/api/admin/materials'], ['DELETE', '/api/admin/materials?id=x'], ['POST', '/api/admin/materials/preview'], ['POST', '/api/admin/materials/publish'], ['POST', '/api/admin/reorder'], ['POST', '/api/admin/drive-check'], ['POST', '/api/admin/logout']];
await t('every admin API rejects anonymous requests (401)', async () => { for (const [m, p] of adminRoutes) eq((await call(m, p, { body: {} })).status, 401, m + ' ' + p); });
await t('admin page shows login form when signed out', async () => { const x = await call('GET', '/admin'); eq(x.status, 200); if (!x.data.includes('Sign in')) throw new Error('no login form'); if (x.data.includes('csrf')) throw new Error('csrf leaked'); });
await t('wrong password rejected (401)', async () => eq((await call('POST', '/api/admin/login', { body: { username: USER, password: 'nope-nope-nope' } })).status, 401));
await t('login from another origin is blocked (403)', async () => eq((await call('POST', '/api/admin/login', { body: { username: USER, password: PASS }, headers: { origin: 'https://evil.example' } })).status, 403));
let cookie, csrf;
await t('correct login sets HttpOnly SameSite=Strict cookie', async () => {
  const x = await call('POST', '/api/admin/login', { body: { username: USER, password: PASS } }); eq(x.status, 200);
  const sc = x.headers.get('set-cookie'); if (!/HttpOnly/i.test(sc) || !/SameSite=Strict/i.test(sc)) throw new Error('flags: ' + sc);
  cookie = sc.split(';')[0];
});
await t('admin page exposes CSRF token only to signed-in admin', async () => { const x = await call('GET', '/admin', { cookie }); const m = x.data.match(/csrf\\?":\\?"([\w-]{20,})/); if (!m) throw new Error('csrf not found'); csrf = m[1]; });
await t('password hashing: scrypt format, verifies right password only, unique salts', async () => { const a = await hashPassword('pass-phrase-123'), b = await hashPassword('pass-phrase-123'); if (!a.startsWith('scrypt$32768$8$1$') || a === b) throw new Error('format/salt'); eq(await verifyPassword('pass-phrase-123', a), true); eq(await verifyPassword('pass-phrase-124', a), false); eq(await verifyPassword('x', undefined), false); });
await t('write without CSRF token rejected (403)', async () => eq((await call('POST', '/api/admin/drive-check', { cookie, body: { input: 'abcdefghij12345' } })).status, 403));
await t('write with wrong CSRF token rejected (403)', async () => eq((await call('POST', '/api/admin/drive-check', { cookie, csrf: 'x'.repeat(30), body: { input: 'abcdefghij12345' } })).status, 403));
await t('cross-origin write with valid cookie+token rejected (403)', async () => eq((await call('POST', '/api/admin/drive-check', { cookie, csrf, body: { input: 'abcdefghij12345' }, headers: { origin: 'https://evil.example' } })).status, 403));
await t('login rate limit triggers (429) after repeated failures', async () => { let last; for (let i = 0; i < 8; i++) last = (await call('POST', '/api/admin/login', { body: { username: 'ghost', password: 'wrongwrongwrong' } })).status; eq(last, 429); });

console.log('\nContent management');
const H = { cookie, csrf }, J = (m, p, body) => call(m, p, { ...H, body });
let subjects, hm, chapterId, chapter2;
await t('7 subjects seeded: 3 general + 4 science, GMath and HMath separate', async () => {
  const x = await call('GET', '/'); for (const n of ['English 2nd Paper', 'ICT', 'General Mathematics', 'Physics', 'Chemistry', 'Higher Mathematics', 'Biology']) if (!x.data.includes(n)) throw new Error('missing ' + n);
  const a = await call('GET', '/admin', { cookie }); subjects = [...a.data.matchAll(/\\?"id\\?":\\?"([0-9a-f-]{36})\\?",\\?"slug\\?":\\?"([a-z]+)\\?"/g)].map(m => ({ id: m[1], slug: m[2] })); eq(subjects.length, 7); hm = subjects.find(s => s.slug === 'hmath');
});
await t('create chapter; duplicate number rejected (409); bad body (400)', async () => {
  const c = await J('POST', '/api/admin/chapters', { subject_id: hm.id, number: 1, title: 'Sets and Functions', title_bn: 'সেট ও ফাংশন' }); eq(c.status, 201); chapterId = c.data.id;
  eq((await J('POST', '/api/admin/chapters', { subject_id: hm.id, number: 1, title: 'Dup' })).status, 409);
  eq((await J('POST', '/api/admin/chapters', { subject_id: 'nope', number: 'x' })).status, 400);
  chapter2 = (await J('POST', '/api/admin/chapters', { subject_id: hm.id, number: 2, title: 'Algebra' })).data.id;
});
const DRIVE = '1AbCdEfGhIjKlMnOpQrStUvWxYz012345';
let mid;
await t('create material from Drive share URL; invalid Drive input rejected (400)', async () => {
  const m = await J('POST', '/api/admin/materials', { chapter_id: chapterId, category: 'mcq', title: 'Sets MCQ', description: '35 MCQ with explanations', drive_input: `https://drive.google.com/file/d/${DRIVE}/view?usp=sharing` }); eq(m.status, 201); mid = m.data.id;
  eq((await J('POST', '/api/admin/materials', { chapter_id: chapterId, category: 'mcq', title: 'Bad', drive_input: 'not a drive id!!' })).status, 400);
  eq((await J('POST', '/api/admin/materials', { chapter_id: chapterId, category: 'videos', title: 'Bad' })).status, 400);
});
await t('cannot publish without preview (422)', async () => eq((await J('POST', '/api/admin/materials/publish', { id: mid, published: true })).status, 422));
const full = await pdf(12), prev = await makePreview(full);
await t('browser-side makePreview keeps exactly first 5 of 12 pages', async () => { eq(prev.previewPages, 5); eq(prev.originalPages, 12); eq((await PDFDocument.load(prev.bytes)).getPageCount(), 5); });
await t('preview upload rejects non-PDF content-type (415)', async () => eq((await call('POST', '/api/admin/materials/preview', { ...H, form: pform(mid, new Uint8Array([1, 2, 3]), 12, 'text/plain') })).status, 415));
await t('preview upload rejects wrong signature (415)', async () => eq((await call('POST', '/api/admin/materials/preview', { ...H, form: pform(mid, new TextEncoder().encode('hello world, not a pdf'), 12) })).status, 415));
await t('preview upload rejects corrupt PDF with valid signature (415)', async () => eq((await call('POST', '/api/admin/materials/preview', { ...H, form: pform(mid, new TextEncoder().encode('%PDF-1.4\ngarbage garbage'), 12) })).status, 415));
await t('preview upload rejects oversize (>4MB) (413)', async () => { const b = new Uint8Array(4.5 * 1024 * 1024); b.set(new TextEncoder().encode('%PDF-1.4')); eq((await call('POST', '/api/admin/materials/preview', { ...H, form: pform(mid, b, 12) })).status, 413); });
await t('preview with 12 pages (full PDF) rejected (422)', async () => eq((await call('POST', '/api/admin/materials/preview', { ...H, form: pform(mid, full, 12) })).status, 422));
await t('preview with 3 pages when original has 12 rejected (422)', async () => { const p3 = (await makePreview(full, 3)).bytes; eq((await call('POST', '/api/admin/materials/preview', { ...H, form: pform(mid, p3, 12) })).status, 422); });
await t('valid 5-page preview accepted', async () => { const x = await call('POST', '/api/admin/materials/preview', { ...H, form: pform(mid, prev.bytes, 12) }); eq(x.status, 200); eq(x.data.pages, 5); });
await t('unpublished preview: anonymous 404, admin 200', async () => { eq((await call('GET', `/api/preview/${mid}`)).status, 404); eq((await call('GET', `/api/preview/${mid}`, { cookie })).status, 200); });
await t('publish succeeds with preview + Drive ID', async () => eq((await J('POST', '/api/admin/materials/publish', { id: mid, published: true })).status, 200));

console.log('\nPublic site: preview, download, data exposure');
await t('public preview returns a valid PDF with at most 5 pages', async () => { const x = await call('GET', `/api/preview/${mid}`); eq(x.status, 200); eq((await PDFDocument.load(x.data)).getPageCount(), 5); });
await t('preview endpoint has no way to select pages/other files', async () => { const x = await call('GET', `/api/preview/${mid}?page=9&file=full`); eq((await PDFDocument.load(x.data)).getPageCount(), 5); eq((await call('GET', '/api/preview/../../etc/passwd')).status, 404); eq((await call('GET', '/api/preview/not-a-uuid')).status, 404); });
await t('Drive file ID never appears in public pages', async () => { for (const p of ['/', '/s/hmath', '/s/hmath/1', '/s/hmath/1?c=mcq', `/m/${mid}`, '/sitemap.xml']) { const x = await call('GET', p); eq(x.status, 200, p); if (String(x.data).includes(DRIVE)) throw new Error('Drive ID leaked on ' + p); } });
await t('chapter/category/material pages render published content', async () => { const x = await call('GET', '/s/hmath/1?c=mcq'); if (!x.data.includes('Sets MCQ')) throw new Error('card missing'); if (!(await call('GET', `/m/${mid}`)).data.includes('Download full PDF')) throw new Error('no download button'); eq((await call('GET', '/s/hmath/1?c=notes')).data.includes('Sets MCQ'), false); });
await t('download redirects (302) to Google Drive', async () => { const x = await call('GET', `/api/download/${mid}`); eq(x.status, 302); eq(x.headers.get('location'), `https://drive.google.com/uc?export=download&id=${DRIVE}`); });
await t('download of unknown/unpublished material is 404', async () => { eq((await call('GET', '/api/download/00000000-0000-4000-8000-000000000000')).status, 404); eq((await call('GET', '/api/download/zzz')).status, 404); });
await t('short PDF (3 pages) gets a 3-page preview', async () => {
  const m = await J('POST', '/api/admin/materials', { chapter_id: chapter2, category: 'notes', title: 'Short notes', drive_input: DRIVE + 'x' });
  const p = await makePreview(await pdf(3)); eq(p.previewPages, 3);
  eq((await call('POST', '/api/admin/materials/preview', { ...H, form: pform(m.data.id, p.bytes, 3) })).status, 200); eq((await J('POST', '/api/admin/materials/publish', { id: m.data.id, published: true })).status, 200);
  eq((await PDFDocument.load((await call('GET', `/api/preview/${m.data.id}`)).data)).getPageCount(), 3);
});
await t('unpublish hides material everywhere', async () => { await J('POST', '/api/admin/materials/publish', { id: mid, published: false }); eq((await call('GET', `/m/${mid}`)).status, 404); eq((await call('GET', `/api/preview/${mid}`)).status, 404); eq((await call('GET', `/api/download/${mid}`)).status, 404); await J('POST', '/api/admin/materials/publish', { id: mid, published: true }); });
await t('reorder, edit and subject edit work', async () => { eq((await J('POST', '/api/admin/reorder', { entity: 'materials', id: mid, dir: 'down' })).status, 200); eq((await J('PATCH', '/api/admin/materials', { id: mid, category: 'mcq', title: 'Sets MCQ v2', description: 'x' })).status, 200); eq((await J('PATCH', '/api/admin/subjects', { id: hm.id, name: 'Higher Mathematics', name_bn: 'উচ্চতর গণিত', group_key: 'science' })).status, 200); });
await t('delete material removes stored preview file', async () => {
  const files = () => fs.readdirSync('.data/previews/' + mid).length; eq(files(), 1);
  eq((await call('DELETE', `/api/admin/materials?id=${mid}`, H)).status, 200); if (fs.existsSync('.data/previews/' + mid) && files()) throw new Error('preview file remains'); eq((await call('GET', `/api/preview/${mid}`)).status, 404);
});
await t('deleting a chapter cascades to its materials', async () => eq((await call('DELETE', `/api/admin/chapters?id=${chapter2}`, H)).status, 200));
await t('logout invalidates the session server-side', async () => { eq((await J('POST', '/api/admin/logout')).status, 200); eq((await call('POST', '/api/admin/drive-check', { cookie, csrf, body: { input: DRIVE } })).status, 401); });
await t('unknown route renders friendly 404 page', async () => { const x = await call('GET', '/nope'); eq(x.status, 404); });

stop();
console.log(`\n${pass} passed, ${failed} failed`); process.exit(failed ? 1 : 0);
