import { revalidatePath } from 'next/cache';
import { query } from '@/lib/db';
import { admin, json, UUID, HttpError } from '@/lib/http';
import { materialNew, materialEdit } from '@/lib/schemas';
import { nextOrder, getMaterialRaw } from '@/lib/data';
import { parseDriveId } from '@/lib/drive';
import { delPreview } from '@/lib/storage';
const driveId = input => { if (!input) return null; const id = parseDriveId(input); if (!id) throw new HttpError(400, 'Invalid Google Drive link or file ID'); return id; };
export const POST = admin(async (req, { audit }) => {
  const d = materialNew.parse(await req.json()), drive = driveId(d.drive_input);
  const r = await query('insert into materials (chapter_id, category, title, description, drive_file_id, display_order) values ($1,$2,$3,$4,$5,$6) returning id',
    [d.chapter_id, d.category, d.title, d.description, drive, await nextOrder('materials', 'chapter_id', d.chapter_id)]);
  await audit('create', 'material', r[0].id, { title: d.title }); return json({ ok: true, id: r[0].id }, 201);
});
export const PATCH = admin(async (req, { audit }) => {
  const d = materialEdit.parse(await req.json()), old = await getMaterialRaw(d.id);
  if (!old) throw new HttpError(404, 'Not found');
  const drive = d.drive_input ? driveId(d.drive_input) : old.drive_file_id;
  if (!drive && old.published) throw new HttpError(422, 'A published material needs a Drive file');
  await query('update materials set category=$2, title=$3, description=$4, drive_file_id=$5 where id=$1', [d.id, d.category, d.title, d.description, drive]);
  await audit('update', 'material', d.id, { title: d.title }); revalidatePath('/', 'layout'); return json({ ok: true });
});
export const DELETE = admin(async (req, { audit }) => {
  const id = new URL(req.url).searchParams.get('id');
  if (!UUID.test(id || '')) throw new HttpError(400, 'Invalid id');
  const r = await query('delete from materials where id=$1 returning preview_path', [id]);
  if (!r.length) throw new HttpError(404, 'Not found');
  await delPreview(r[0].preview_path); await audit('delete', 'material', id); revalidatePath('/', 'layout'); return json({ ok: true });
});
