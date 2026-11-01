import Link from 'next/link';
import { notFound } from 'next/navigation';
import { getChapter, publishedMaterials } from '@/lib/data';
import { CATEGORIES, categoryLabel } from '@/lib/categories';
import MaterialCard from '@/components/MaterialCard';
import { Chevron } from '@/components/Icons';
export const dynamic = 'force-dynamic';
export async function generateMetadata({ params }) { const c = await getChapter(params.slug, parseInt(params.n, 10) || 0); return c ? { title: `${c.subject_name} · Chapter ${c.number}: ${c.title}` } : {}; }
export default async function Chapter({ params, searchParams }) {
  const c = await getChapter(params.slug, parseInt(params.n, 10) || 0); if (!c) notFound();
  const all = await publishedMaterials(c.id), cat = CATEGORIES.find(x => x.key === searchParams.c);
  const back = cat ? `/s/${c.slug}/${c.number}` : `/s/${c.slug}`;
  return (
    <main>
      <Link href={back} className="crumb">← {cat ? `Chapter ${c.number}` : c.subject_name}</Link>
      <div className="mono sub small">{c.subject_name.toUpperCase()} · CHAPTER {String(c.number).padStart(2, '0')}</div>
      <h1>{c.title}</h1>{c.title_bn && <p className="sub bn">{c.title_bn}</p>}
      {!cat ? (<>
        <h2>Material categories</h2>
        {CATEGORIES.map(k => { const n = all.filter(m => m.category === k.key).length; return (
          <Link key={k.key} href={`/s/${c.slug}/${c.number}?c=${k.key}`} className="card">
            <div className="grow"><strong>{k.label}</strong></div><span className={'tag mono' + (n ? '' : ' off')}>{n} PDF</span><Chevron /></Link>); })}
      </>) : (<>
        <h2>{categoryLabel(cat.key)}</h2>
        {all.filter(m => m.category === cat.key).map(m => <MaterialCard key={m.id} m={m} />)}
        {!all.some(m => m.category === cat.key) && <div className="empty">No PDFs in this category yet.</div>}
      </>)}
    </main>
  );
}
