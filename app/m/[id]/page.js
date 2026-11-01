import Link from 'next/link';
import { notFound } from 'next/navigation';
import { getPublicMaterial } from '@/lib/data';
import { categoryLabel } from '@/lib/categories';
import PreviewViewer from '@/components/PreviewViewer';
import { DownloadIcon } from '@/components/Icons';
export const dynamic = 'force-dynamic';
export async function generateMetadata({ params }) { const m = await getPublicMaterial(params.id); return m ? { title: `${m.title} · ${m.subject_name}`, description: m.description || `${categoryLabel(m.category)} PDF for ${m.subject_name}` } : {}; }
export default async function Material({ params, searchParams }) {
  const m = await getPublicMaterial(params.id); if (!m) notFound();
  return (
    <main>
      <Link href={`/s/${m.slug}/${m.chapter_number}?c=${m.category}`} className="crumb">← {m.subject_name} · Chapter {m.chapter_number}</Link>
      <div className="mono eyebrow">{categoryLabel(m.category)}</div>
      <h1>{m.title}</h1>{m.description && <p className="sub">{m.description}</p>}
      {searchParams.download === 'unavailable' && <div className="note" role="alert">The full PDF is temporarily unavailable on Google Drive. Please try again later.</div>}
      <div className="btns"><a className="btn" href={`/api/download/${m.id}`}><DownloadIcon /> &nbsp;Download full PDF</a></div>
      <p className="mono sub small">PREVIEW · FIRST {m.preview_pages} {m.original_pages ? `OF ${m.original_pages} ` : ''}PAGES. THE FULL PDF OPENS FROM GOOGLE DRIVE.</p>
      <PreviewViewer src={`/api/preview/${m.id}`} />
    </main>
  );
}
