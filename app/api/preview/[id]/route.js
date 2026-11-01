import { query } from '@/lib/db';
import { getSession } from '@/lib/auth';
import { getPreview } from '@/lib/storage';
import { UUID } from '@/lib/uuid';
// Serves ONLY the stored preview PDF (<= 5 pages, validated at upload). Unpublished previews are admin-only.
export async function GET(_req, { params }) {
  if (!UUID.test(params.id)) return new Response('Not found', { status: 404 });
  const m = (await query('select preview_path, published from materials where id=$1', [params.id]))[0];
  if (!m?.preview_path || (!m.published && !(await getSession()))) return new Response('Not found', { status: 404 });
  const bytes = await getPreview(m.preview_path);
  if (!bytes) return new Response('Preview unavailable', { status: 502 });
  return new Response(bytes, { headers: { 'Content-Type': 'application/pdf', 'Content-Disposition': 'inline; filename="preview.pdf"', 'X-Content-Type-Options': 'nosniff', 'Cache-Control': m.published ? 'public, max-age=300' : 'private, no-store' } });
}
