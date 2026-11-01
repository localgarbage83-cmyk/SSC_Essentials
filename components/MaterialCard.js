import Link from 'next/link';
import { PdfIcon, DownloadIcon } from './Icons';
import { categoryLabel } from '@/lib/categories';
export default function MaterialCard({ m }) {
  return (
    <article className="mcard">
      <div className="mcard-head"><span className="mcard-icon"><PdfIcon /></span>
        <div className="grow"><span className="mono eyebrow">{categoryLabel(m.category)}</span><h3><Link href={`/m/${m.id}`}>{m.title}</Link></h3></div></div>
      {m.description && <p className="sub">{m.description}</p>}
      <div className="mono sub small">PREVIEW · {m.preview_pages} {m.preview_pages === 1 ? 'PAGE' : 'PAGES'}{m.original_pages ? ` OF ${m.original_pages}` : ''}</div>
      <div className="btns"><Link className="btn ghost" href={`/m/${m.id}`}>Preview</Link><a className="btn" href={`/api/download/${m.id}`}><DownloadIcon /> &nbsp;Download full PDF</a></div>
    </article>
  );
}
