import { query } from '@/lib/db';
import { UUID } from '@/lib/uuid';
import { downloadUrl, checkDrive } from '@/lib/drive';
// Redirects to Google Drive. The Drive ID is never sent to the browser in page data.
export async function GET(req, { params }) {
  const m = UUID.test(params.id) ? (await query('select drive_file_id from materials where id=$1 and published', [params.id]))[0] : null;
  if (!m?.drive_file_id) return new Response('Not found', { status: 404 });
  const c = await checkDrive(m.drive_file_id);
  if (!c.ok && c.reason !== 'unreachable') return Response.redirect(new URL(`/m/${params.id}?download=unavailable`, req.url), 303);
  return Response.redirect(downloadUrl(m.drive_file_id), 302);
}
