// Usage: ADMIN_USERNAME=you ADMIN_PASSWORD='long passphrase' npm run create-admin   (or run and answer prompts)
// With the embedded dev database, stop `npm run dev` first (single writer).
import readline from 'node:readline';
import { query } from '../lib/db.js';
import { hashPassword } from '../lib/password.js';
async function ask(q, mute) {
  const rl = readline.createInterface({ input: process.stdin, output: process.stdout, terminal: true });
  if (mute) rl._writeToOutput = s => { if (s.includes(q)) process.stdout.write(s); };
  return new Promise(res => rl.question(q, a => { rl.close(); if (mute) console.log(); res(a); }));
}
const username = (process.env.ADMIN_USERNAME || await ask('Admin username: ')).trim();
const password = process.env.ADMIN_PASSWORD || await ask('Password (min 12 chars): ', true);
if (!/^[\w.@-]{3,60}$/.test(username)) { console.error('Username must be 3-60 chars: letters, digits, . _ @ -'); process.exit(1); }
if (password.length < 12) { console.error('Password must be at least 12 characters.'); process.exit(1); }
await query(`insert into admin_users (username, password_hash) values ($1,$2)
  on conflict (username) do update set password_hash = excluded.password_hash`, [username, await hashPassword(password)]);
await query('delete from admin_sessions where user_id = (select id from admin_users where username=$1)', [username]);
console.log(`Admin "${username}" saved. Existing sessions revoked.`); process.exit(0);
