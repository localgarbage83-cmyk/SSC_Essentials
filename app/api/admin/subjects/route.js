import { revalidatePath } from 'next/cache';
import { query } from '@/lib/db';
import { admin, json } from '@/lib/http';
import { subjectNew, subjectEdit } from '@/lib/schemas';
import { nextOrder } from '@/lib/data';
export const POST = admin(async (req, { audit }) => {
  const d = subjectNew.parse(await req.json());
  const r = await query('insert into subjects (slug, name, name_bn, group_key, display_order) values ($1,$2,$3,$4,$5) returning id', [d.slug, d.name, d.name_bn, d.group_key, await nextOrder('subjects')]);
  await audit('create', 'subject', r[0].id, d); revalidatePath('/', 'layout'); return json({ ok: true, id: r[0].id }, 201);
});
export const PATCH = admin(async (req, { audit }) => {
  const d = subjectEdit.parse(await req.json());
  const r = await query('update subjects set name=$2, name_bn=$3, group_key=$4 where id=$1 returning id', [d.id, d.name, d.name_bn, d.group_key]);
  if (!r.length) return json({ error: 'Not found' }, 404);
  await audit('update', 'subject', d.id, d); revalidatePath('/', 'layout'); return json({ ok: true });
});
