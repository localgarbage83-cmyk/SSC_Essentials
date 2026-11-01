import { revalidatePath } from 'next/cache';
import { query } from '@/lib/db';
import { admin, json, HttpError } from '@/lib/http';
import { publishSchema } from '@/lib/schemas';
import { getMaterialRaw } from '@/lib/data';
import { checkDrive, DRIVE_MESSAGES } from '@/lib/drive';
export const POST = admin(async (req, { audit }) => {
  const d = publishSchema.parse(await req.json()), m = await getMaterialRaw(d.id);
  if (!m) throw new HttpError(404, 'Not found');
  if (d.published) {
    if (!m.preview_path) throw new HttpError(422, 'Generate and upload the 5-page preview first');
    if (!m.drive_file_id) throw new HttpError(422, 'Add the Google Drive file ID first');
    const c = await checkDrive(m.drive_file_id);
    if (!c.ok) throw new HttpError(422, DRIVE_MESSAGES[c.reason]);
  }
  await query('update materials set published=$2 where id=$1', [d.id, d.published]);
  await audit(d.published ? 'publish' : 'unpublish', 'material', d.id); revalidatePath('/', 'layout'); return json({ ok: true });
});
