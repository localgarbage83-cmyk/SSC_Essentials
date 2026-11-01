// Google Drive links. Files are uploaded to Drive by the admin (see GOOGLE-DRIVE-SETUP.md); we store only the file ID.
const ID_RE = /^[A-Za-z0-9_-]{10,120}$/;
export function parseDriveId(input) {
  const s = String(input || '').trim();
  const m = s.match(/\/(?:file|document|presentation)\/d\/([A-Za-z0-9_-]+)/) || s.match(/[?&]id=([A-Za-z0-9_-]+)/);
  const id = m ? m[1] : s;
  return ID_RE.test(id) ? id : null;
}
export const downloadUrl = id => `https://drive.google.com/uc?export=download&id=${encodeURIComponent(id)}`;

// Best-effort reachability check. { ok, reason } where reason is not_found | private | unreachable | skipped.
export async function checkDrive(id) {
  if (process.env.DRIVE_CHECK === 'off') return { ok: true, reason: 'skipped' };
  try {
    const r = await fetch(downloadUrl(id), { method: 'HEAD', redirect: 'manual', signal: AbortSignal.timeout(5000) });
    const loc = r.headers.get('location') || '';
    if (r.status === 404) return { ok: false, reason: 'not_found' };
    if (r.status === 401 || r.status === 403 || loc.includes('accounts.google.com')) return { ok: false, reason: 'private' };
    return { ok: true };
  } catch { return { ok: false, reason: 'unreachable' }; }
}
export const DRIVE_MESSAGES = {
  not_found: 'Google Drive says this file does not exist. Check the file ID.',
  private: 'The file is private. In Drive set sharing to "Anyone with the link: Viewer".',
  unreachable: 'Could not reach Google Drive to verify the file. Try again.',
  skipped: 'Drive check skipped.'
};
