import { listSubjects, allPublishedIds } from '@/lib/data';
export const dynamic = 'force-dynamic';
export default async function sitemap() {
  const base = process.env.SITE_URL || 'http://localhost:3000';
  const [s, m] = await Promise.all([listSubjects(), allPublishedIds()]);
  return [{ url: base }, ...s.map(x => ({ url: `${base}/s/${x.slug}` })), ...m.map(x => ({ url: `${base}/m/${x.id}`, lastModified: x.updated_at }))];
}
