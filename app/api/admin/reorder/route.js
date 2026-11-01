import { revalidatePath } from 'next/cache';
import { admin, json, HttpError } from '@/lib/http';
import { reorderSchema } from '@/lib/schemas';
import { reorder } from '@/lib/data';
export const POST = admin(async req => {
  const d = reorderSchema.parse(await req.json());
  if (!(await reorder(d.entity, d.id, d.dir))) throw new HttpError(404, 'Not found');
  revalidatePath('/', 'layout'); return json({ ok: true });
});
