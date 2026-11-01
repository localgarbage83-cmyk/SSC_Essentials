import { query } from '@/lib/db';
import { verifyPassword } from '@/lib/password';
import { createSession, sessionCookie, clientIp, assertNotLimited, recordFailure, clearFailures, checkOrigin } from '@/lib/auth';
import { fail, json, HttpError } from '@/lib/http';
import { loginSchema } from '@/lib/schemas';
export async function POST(req) {
  try {
    checkOrigin(req);
    const { username, password } = loginSchema.parse(await req.json().catch(() => ({})));
    const ip = clientIp(req); await assertNotLimited(ip, username);
    const u = (await query('select id, password_hash from admin_users where username=$1', [username]))[0];
    if (!(await verifyPassword(password, u?.password_hash)) || !u) { await recordFailure(ip, username); throw new HttpError(401, 'Invalid username or password'); }
    await clearFailures(username);
    const s = await createSession(u.id), res = json({ ok: true });
    res.headers.append('Set-Cookie', sessionCookie(s.token, s.maxAge));
    return res;
  } catch (e) { return fail(e); }
}
