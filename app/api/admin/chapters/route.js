import { revalidatePath } from 'next/cache';
import { query } from '@/lib/db';
import { admin, json, UUID, HttpError } from '@/lib/http';
import { chapterNew, chapterEdit } from '@/lib/schemas';
import { nextOrder } from '@/lib/data';
import { delPreview } from '@/lib/storage';
export const POST = admin(async (req, { audit }) => {
  const d = chapterNew.parse(await req.json());
  const r = await query('insert into chapters (subject_id, number, title, title_bn, display_order) values ($1,$2,$3,$4,$5) returning id', [d.subject_id, d.number, d.title, d.title_bn, await nextOrder('chapters', 'subject_id', d.subject_id)]);
  await audit('create', 'chapter', r[0].id, d); revalidatePath('/', 'layout'); return json({ ok: true, id: r[0].id }, 201);
});
export const PATCH = admin(async (req, { audit }) => {
  const d = chapterEdit.parse(await req.json());
  const r = await query('update chapters set number=$2, title=$3, title_bn=$4 where id=$1 returning id', [d.id, d.number, d.title, d.title_bn]);
  if (!r.length) throw new HttpError(404, 'Not found');
  await audit('update', 'chapter', d.id, d); revalidatePath('/', 'layout'); return json({ ok: true });
});
export const DELETE = admin(async (req, { audit }) => {
  const id = new URL(req.url).searchParams.get('id');
  if (!UUID.test(id || '')) throw new HttpError(400, 'Invalid id');
  const files = await query('select preview_path from materials where chapter_id=$1', [id]);
  const r = await query('delete from chapters where id=$1 returning id', [id]);
  if (!r.length) throw new HttpError(404, 'Not found');
  await Promise.all(files.map(f => delPreview(f.preview_path)));
  await audit('delete', 'chapter', id, { materials: files.length }); revalidatePath('/', 'layout'); return json({ ok: true });
});
