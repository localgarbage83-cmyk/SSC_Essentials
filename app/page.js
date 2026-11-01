import Link from 'next/link';
import { listSubjects } from '@/lib/data';
import { Chevron } from '@/components/Icons';
export const dynamic = 'force-dynamic';
function Card({ s }) {
  return (
    <Link href={`/s/${s.slug}`} className="card">
      <div className="grow"><strong>{s.name}</strong><small className="bn">{s.name_bn}</small></div>
      <span className="tag mono">{String(s.chapter_count).padStart(2, '0')} CH</span><Chevron />
    </Link>
  );
}
export default async function Home() {
  const subjects = await listSubjects(), total = subjects.reduce((a, s) => a + s.material_count, 0);
  return (
    <main>
      <h1 className="bn">স্বাগতম, SSC শিক্ষার্থী!</h1>
      <p className="sub">Prepare for your SSC exam, one chapter at a time. Notes, MCQ, CQ and model questions as PDFs.</p>
      <div className="btns mono"><span className="tag">{String(subjects.length).padStart(2, '0')} SUBJECTS</span><span className="tag">{total} PDF</span></div>
      <h2>General Subjects</h2>
      {subjects.filter(s => s.group_key === 'general').map(s => <Card key={s.id} s={s} />)}
      <details open><summary>Science Group <span className="sub bn">· বিজ্ঞান বিভাগ</span></summary>
        {subjects.filter(s => s.group_key === 'science').map(s => <Card key={s.id} s={s} />)}</details>
    </main>
  );
}
