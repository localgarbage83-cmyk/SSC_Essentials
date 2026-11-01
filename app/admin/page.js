import { getSession } from '@/lib/auth';
import { adminSubjects, adminChapters, adminMaterials } from '@/lib/data';
import Admin, { Login } from './Admin';
export const dynamic = 'force-dynamic';
export const metadata = { title: 'Admin', robots: { index: false, follow: false } };
export default async function Page() {
  const s = await getSession();
  if (!s) return <Login />;
  const [subjects, chapters, materials] = await Promise.all([adminSubjects(), adminChapters(), adminMaterials()]);
  return <Admin csrf={s.csrf_token} user={s.username} subjects={subjects} chapters={chapters} materials={materials} />;
}
