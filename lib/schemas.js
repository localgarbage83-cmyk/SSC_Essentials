import { z } from 'zod';
import { CATEGORIES } from './categories.js';
const text = (max, min = 1) => z.string().trim().min(min).max(max);
const opt = max => z.string().trim().max(max).optional().nullable().transform(v => v || null);
export const uuid = z.string().uuid();
export const loginSchema = z.object({ username: text(60), password: z.string().min(1).max(200) });
export const subjectNew = z.object({ slug: z.string().regex(/^[a-z0-9-]{2,40}$/, 'lowercase letters, digits, dashes'), name: text(80), name_bn: opt(120), group_key: z.enum(['general', 'science']) });
export const subjectEdit = z.object({ id: uuid, name: text(80), name_bn: opt(120), group_key: z.enum(['general', 'science']) });
export const chapterNew = z.object({ subject_id: uuid, number: z.coerce.number().int().min(1).max(200), title: text(150), title_bn: opt(150) });
export const chapterEdit = chapterNew.omit({ subject_id: true }).extend({ id: uuid });
export const materialNew = z.object({
  chapter_id: uuid, category: z.enum(CATEGORIES.map(c => c.key)), title: text(150),
  description: z.string().trim().max(500).default(''), drive_input: opt(500)
});
export const materialEdit = materialNew.omit({ chapter_id: true }).extend({ id: uuid, chapter_id: uuid.optional() });
export const publishSchema = z.object({ id: uuid, published: z.boolean() });
export const reorderSchema = z.object({ entity: z.enum(['subjects', 'chapters', 'materials']), id: uuid, dir: z.enum(['up', 'down']) });
