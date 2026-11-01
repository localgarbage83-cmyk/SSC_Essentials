import crypto from 'node:crypto';
import { cookies, headers } from 'next/headers';
import { query } from './db.js';
import { HttpError } from './http-error.js';

export const COOKIE = process.env.NODE_ENV === 'production' ? '__Host-sid' : 'sid';
const TTL_HOURS = 8, WINDOW_MIN = 15, MAX_PER_IP = 10, MAX_PER_USER = 6;
const sha = s => crypto.createHash('sha256').update(s).digest('hex');
const same = (a, b) => { const x = Buffer.from(String(a)), y = Buffer.from(String(b)); return x.length === y.length && crypto.timingSafeEqual(x, y); };

export const clientIp = req => (req.headers.get('x-forwarded-for') || '').split(',')[0].trim() || 'local';
export const sessionCookie = (token, maxAge) => `${COOKIE}=${token}; Path=/; HttpOnly; SameSite=Strict; Max-Age=${maxAge}${process.env.NODE_ENV === 'production' ? '; Secure' : ''}`;

export async function createSession(userId) {
  const token = crypto.randomBytes(32).toString('base64url'), csrf = crypto.randomBytes(24).toString('base64url');
  await query('delete from admin_sessions where expires_at < now()');
  await query(`insert into admin_sessions (user_id, token_hash, csrf_token, expires_at) values ($1,$2,$3, now() + ($4 || ' hours')::interval)`, [userId, sha(token), csrf, String(TTL_HOURS)]);
  return { token, csrf, maxAge: TTL_HOURS * 3600 };
}
export async function destroySession() {
  const t = cookies().get(COOKIE)?.value; if (t) await query('delete from admin_sessions where token_hash=$1', [sha(t)]);
}
export async function getSession() {
  const t = cookies().get(COOKIE)?.value; if (!t) return null;
  const r = await query(`select s.user_id, s.csrf_token, u.username from admin_sessions s join admin_users u on u.id = s.user_id where s.token_hash=$1 and s.expires_at > now()`, [sha(t)]);
  return r[0] || null;
}
// Mutating requests: same-origin + per-session CSRF token header.
export function checkCsrf(req, session) {
  const origin = req.headers.get('origin'), host = req.headers.get('host');
  if (origin) { let h; try { h = new URL(origin).host; } catch { h = ''; } if (h !== host) throw new HttpError(403, 'Cross-origin request blocked'); }
  else if (process.env.NODE_ENV === 'production') throw new HttpError(403, 'Missing Origin header');
  if (!same(req.headers.get('x-csrf-token') || '', session.csrf_token)) throw new HttpError(403, 'Invalid CSRF token');
}
export function checkOrigin(req) {
  const origin = req.headers.get('origin');
  if (origin && new URL(origin).host !== req.headers.get('host')) throw new HttpError(403, 'Cross-origin request blocked');
}
// DB-backed limiter (serverless instances share no memory).
export async function assertNotLimited(ip, username) {
  const q = k => query(`select count(*)::int n from login_attempts where key=$1 and created_at > now() - ($2 || ' minutes')::interval`, [k, String(WINDOW_MIN)]);
  const [a, b] = await Promise.all([q('ip:' + ip), q('u:' + username.toLowerCase())]);
  if (a[0].n >= MAX_PER_IP || b[0].n >= MAX_PER_USER) throw new HttpError(429, 'Too many failed attempts. Try again in 15 minutes.');
}
export const recordFailure = (ip, username) => query('insert into login_attempts (key) values ($1), ($2)', ['ip:' + ip, 'u:' + username.toLowerCase()]);
export const clearFailures = username => query('delete from login_attempts where key=$1', ['u:' + username.toLowerCase()]);
export const hostHeader = () => headers().get('host');
