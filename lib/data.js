import { query } from './db.js';
import { UUID } from './uuid.js';

// ---- Public reads. Never select drive_file_id or preview_path here. ----
export const listSubjects = () => query(`
  select s.id, s.slug, s.name, s.name_bn, s.group_key,
    (select count(*)::int from chapters c where c.subject_id = s.id) as chapter_count,
    (select count(*)::int from materials m join chapters c on c.id = m.chapter_id where c.subject_id = s.id and m.published) as material_count
  from subjects s order by s.display_order, s.name`);
export const getSubject = async slug => (await query('select id, slug, name, name_bn, group_key from subjects where slug=$1', [slug]))[0];
export const listChapters = subjectId => query(`
  select c.id, c.number, c.title, c.title_bn,
    (select count(*)::int from materials m where m.chapter_id = c.id and m.published) as material_count
  from chapters c where c.subject_id=$1 order by c.display_order, c.number`, [subjectId]);
export const getChapter = async (slug, n) => (await query(`
  select c.id, c.number, c.title, c.title_bn, s.slug, s.name as subject_name, s.name_bn as subject_name_bn
  from chapters c join subjects s on s.id = c.subject_id where s.slug=$1 and c.number=$2`, [slug, n]))[0];
export const publishedMaterials = chapterId => query(`
  select id, category, title, description, preview_pages, original_pages from materials
  where chapter_id=$1 and published order by display_order, created_at`, [chapterId]);
export const getPublicMaterial = async id => !UUID.test(id) ? null : (await query(`
  select m.id, m.category, m.title, m.description, m.preview_pages, m.original_pages,
    c.number as chapter_number, c.title as chapter_title, s.slug, s.name as subject_name
  from materials m join chapters c on c.id = m.chapter_id join subjects s on s.id = c.subject_id
  where m.id=$1 and m.published`, [id]))[0];
export const allPublishedIds = () => query('select m.id, m.updated_at from materials m where m.published');

// ---- Admin reads (include Drive IDs). ----
export const adminSubjects = () => query('select * from subjects order by display_order, name');
export const adminChapters = () => query('select * from chapters order by display_order, number');
export const adminMaterials = () => query(`
  select m.*, c.number as chapter_number, c.title as chapter_title, c.subject_id
  from materials m join chapters c on c.id = m.chapter_id order by m.display_order, m.created_at`);
export const getMaterialRaw = async id => !UUID.test(id) ? null : (await query('select * from materials where id=$1', [id]))[0];

// Next display_order within a sibling group.
export const nextOrder = async (table, col, val) => (await query(`select coalesce(max(display_order), 0) + 1 as n from ${table}${col ? ` where ${col}=$1` : ''}`, col ? [val] : []))[0].n;

// Move one row up/down among its siblings; renumbers the whole group in one statement.
const GROUPS = { subjects: null, chapters: 'subject_id', materials: 'chapter_id' };
export async function reorder(entity, id, dir) {
  const col = GROUPS[entity], row = (await query(`select * from ${entity} where id=$1`, [id]))[0];
  if (!row) return false;
  const sibs = await query(`select id from ${entity} ${col ? `where ${col}=$1` : 'where $1::text is null'} order by display_order, created_at`, [col ? row[col] : null]);
  const ids = sibs.map(r => r.id), i = ids.indexOf(id), j = dir === 'up' ? i - 1 : i + 1;
  if (j < 0 || j >= ids.length) return true;
  [ids[i], ids[j]] = [ids[j], ids[i]];
  await query(`update ${entity} t set display_order = u.o from unnest($1::uuid[], $2::int[]) as u(id, o) where t.id = u.id`, [ids, ids.map((_, k) => k + 1)]);
  return true;
}
