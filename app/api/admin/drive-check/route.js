import { z } from 'zod';
import { admin, json, HttpError } from '@/lib/http';
import { parseDriveId, checkDrive, DRIVE_MESSAGES } from '@/lib/drive';
export const POST = admin(async req => {
  const { input } = z.object({ input: z.string().max(500) }).parse(await req.json());
  const id = parseDriveId(input); if (!id) throw new HttpError(400, 'Invalid Google Drive link or file ID');
  const c = await checkDrive(id); return json({ id, ok: c.ok, message: c.ok ? 'Drive file is reachable' : DRIVE_MESSAGES[c.reason] });
});
