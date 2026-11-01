import crypto from 'node:crypto';
import { revalidatePath } from 'next/cache';
import { query } from '@/lib/db';
import { admin, json, HttpError } from '@/lib/http';
import { getMaterialRaw } from '@/lib/data';
import { inspectPdf } from '@/lib/pdf';
import { putPreview, delPreview } from '@/lib/storage';
import { PREVIEW_PAGES } from '@/lib/categories';
const MAX_BYTES = 4 * 1024 * 1024; // Vercel Hobby request bodies are capped at 4.5 MB
// Receives ONLY the browser-generated preview (<= 5 pages). The full PDF never reaches this server.
export const POST = admin(async (req, { audit }) => {
  const fd = await req.formData(), file = fd.get('file'), id = String(fd.get('id') || '');
  const m = await getMaterialRaw(id); if (!m) throw new HttpError(404, 'Material not found');
  if (!file || typeof file === 'string' || !file.size) throw new HttpError(400, 'Preview file is required');
  if (file.size > MAX_BYTES) throw new HttpError(413, 'Preview is larger than 4 MB. Compress images in the first pages of the PDF.');
  if (file.type && file.type !== 'application/pdf') throw new HttpError(415, 'Preview must be a PDF');
  const bytes = new Uint8Array(await file.arrayBuffer());
  let pages; try { ({ pages } = await inspectPdf(bytes)); } catch (e) { throw new HttpError(415, 'Invalid or encrypted PDF: ' + e.message); }
  if (pages > PREVIEW_PAGES) throw new HttpError(422, `Preview has ${pages} pages; the limit is ${PREVIEW_PAGES}`);
  const original = parseInt(fd.get('originalPages'), 10) || null;
  if (original && pages !== Math.min(PREVIEW_PAGES, original)) throw new HttpError(422, `Preview must contain exactly the first ${Math.min(PREVIEW_PAGES, original)} pages`);
  if (original && original < pages) throw new HttpError(422, 'originalPages is smaller than preview pages');
  const path = `${m.id}/${crypto.randomBytes(8).toString('hex')}.pdf`;
  await putPreview(path, bytes);
  await query('update materials set preview_path=$2, preview_pages=$3, original_pages=coalesce($4, original_pages) where id=$1', [m.id, path, pages, original]);
  await delPreview(m.preview_path); await audit('preview', 'material', m.id, { pages });
  revalidatePath('/', 'layout'); return json({ ok: true, pages });
});
