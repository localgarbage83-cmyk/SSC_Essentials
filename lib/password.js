// scrypt (Node built-in, OWASP-listed). Format: scrypt$N$r$p$salt$hash
import crypto from 'node:crypto';
const N = 32768, R = 8, P = 1, LEN = 64, MAXMEM = 128 * 1024 * 1024;
const scrypt = (pw, salt, n, r, p) => new Promise((res, rej) => crypto.scrypt(pw, salt, LEN, { N: n, r, p, maxmem: MAXMEM }, (e, k) => (e ? rej(e) : res(k))));
export async function hashPassword(pw) {
  const salt = crypto.randomBytes(16);
  return ['scrypt', N, R, P, salt.toString('base64'), (await scrypt(pw, salt, N, R, P)).toString('base64')].join('$');
}
let dummy;
export async function verifyPassword(pw, stored) {
  if (!stored) { dummy ??= await hashPassword('dummy-password'); stored = dummy; pw = pw + '\0'; }   // equalise timing for unknown users
  const [alg, n, r, p, salt, hash] = stored.split('$');
  if (alg !== 'scrypt') return false;
  const key = await scrypt(pw, Buffer.from(salt, 'base64'), +n, +r, +p), want = Buffer.from(hash, 'base64');
  return key.length === want.length && crypto.timingSafeEqual(key, want);
}
