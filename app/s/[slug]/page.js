import Link from 'next/link';
import { notFound } from 'next/navigation';
import { getSubject, listChapters } from '@/lib/data';
import { Chevron } from '@/components/Icons';
export const dynamic = 'force-dynamic';
export async function generateMetadata({ params }) { const s = await getSubject(params.slug); return s ? { title: s.name, description: `${s.name} chapter-wise PDF study materials for SSC.` } : {}; }
export default async function Subject({ params }) {
  const s = await getSubject(params.slug); if (!s) notFound();
  const chapters = await listChapters(s.id);
  return (
    <main>
      <Link href="/" className="crumb">← Home</Link>
      <h1>{s.name}</h1><p className="sub bn">{s.name_bn}</p>
      <h2>Chapters</h2>
      {!chapters.length && <div className="empty">Chapters will appear here soon.</div>}
      {chapters.map(c => (
        <Link key={c.id} href={`/s/${s.slug}/${c.number}`} className="card">
          <span className="mono num">{String(c.number).padStart(2, '0')}</span>
          <div className="grow"><strong>{c.title}</strong>{c.title_bn && <small className="bn">{c.title_bn}</small>}</div>
          <span className={'tag mono' + (c.material_count ? '' : ' off')}>{c.material_count} PDF</span><Chevron />
        </Link>))}
    </main>
  );
}
