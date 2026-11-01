import { destroySession, sessionCookie } from '@/lib/auth';
import { admin, json } from '@/lib/http';
export const POST = admin(async () => {
  await destroySession();
  const res = json({ ok: true }); res.headers.append('Set-Cookie', sessionCookie('', 0)); return res;
});
