# Database schema (PostgreSQL / Supabase)
Source of truth: `supabase/migrations/*.sql`. Applied automatically on first connection, or with `npm run migrate`.

| Table | Purpose | Key columns |
|---|---|---|
| subjects | The 7 subjects | slug (unique), name, name_bn, group_key (`general`/`science`), display_order |
| chapters | Chapters of a subject | subject_id → subjects (cascade), number (unique per subject), title, title_bn, display_order |
| materials | One row per PDF | chapter_id → chapters (cascade), category (`notes`,`mcq`,`cq`,`extra`,`model`,`other`), title, description, drive_file_id, preview_path, preview_pages (1-5), original_pages, display_order, published, created_at, updated_at |
| admin_users | Admin identities | username (unique), password_hash (scrypt) |
| admin_sessions | Server-side sessions | token_hash (SHA-256 of random token), csrf_token, expires_at |
| login_attempts | DB-backed rate limit | key (`ip:…`/`u:…`), created_at |
| audit_log | Who changed what | user_id, action, entity, entity_id, detail |

Constraints: `published ⇒ drive_file_id and preview_path present`; `preview_pages ≤ 5`; `preview_pages ≤ original_pages`; Drive ID format check.
All tables have Row Level Security enabled with no policies and `anon`/`authenticated` privileges revoked: the Supabase public API cannot read them; only the server connection (DATABASE_URL) can.
No PDF bytes and no individual MCQ rows are stored.

## Backup / restore metadata
```bash
pg_dump "$DATABASE_URL" --data-only --table=subjects --table=chapters --table=materials > metadata-backup.sql
psql "$DATABASE_URL" < metadata-backup.sql      # restore into a migrated database
```
(Use the *direct* connection string, port 5432, for pg_dump.) Supabase Free also keeps daily backups for a limited window; do not rely on them alone. Previews can be regenerated from your originals; keep the originals in Drive.

## Importing from v1
`npm run import-legacy -- path/to/old/data/db.json` imports chapter number/titles only. Old PDFs, MCQs and quiz data are not migrated.
