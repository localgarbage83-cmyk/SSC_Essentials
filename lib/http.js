import { getSession, checkCsrf } from './auth.js';
import { HttpError } from './http-error.js';
import { query } from './db.js';
export { HttpError };
export const json = (d, s = 200) => Response.json(d, { status: s, headers: { 'Cache-Control': 'no-store' } });
export function fail(e) {
  if (e instanceof HttpError) return json({ error: e.message }, e.status);
  if (e?.name === 'ZodError') return json({ error: e.issues.map(i => `${i.path.join('.') || 'input'}: ${i.message}`).join('; ') }, 400);
  if (e?.code === '23505') return json({ error: 'That value already exists' }, 409);
  if (e?.code === '23514' || e?.code === '23503') return json({ error: 'Rejected by database constraints' }, 422);
  console.error(e); return json({ error: 'Server error' }, 500);
}
// Every admin API goes through this: session check (always) + CSRF (when write).
export const admin = (fn, { write = true } = {}) => async (req, ctx = {}) => {
  try {
    const session = await getSession();
    if (!session) throw new HttpError(401, 'Not signed in');
    if (write) checkCsrf(req, session);
    const audit = (action, entity, id, detail) => query('insert into audit_log (user_id, action, entity, entity_id, detail) values ($1,$2,$3,$4,$5)', [session.user_id, action, entity, id ? String(id) : null, detail ? JSON.stringify(detail) : null]);
    return await fn(req, { ...ctx, session, audit });
  } catch (e) { return fail(e); }
};
export { UUID } from './uuid.js';
