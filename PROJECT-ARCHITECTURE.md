# Architecture

```
Student browser ── Next.js on Vercel ── Supabase Postgres (metadata)
                        │                └ Supabase Storage (private bucket: 5-page previews only)
                        └── 302 redirect ──► Google Drive (full PDFs, shared by link)
Admin browser: picks original PDF → pdf-lib copies first 5 pages in the browser → uploads ONLY the preview
```

## Why the preview is generated in the browser
Vercel Hobby limits request bodies to 4.5 MB. Full MCQ/CQ PDFs often exceed that, so they must never be posted to a serverless function. The admin's browser reads the original locally, builds a new 5-page PDF (`lib/pdf.js`), and uploads only that (<= 4 MB). The server re-validates it: `%PDF-` signature, real parse (rejects corrupt/encrypted), 1-5 pages, and the page count must equal `min(5, original pages)`.
**Trade-off:** the server cannot prove the preview came from the original; it trusts the signed-in admin. It *can* guarantee the preview is never longer than 5 pages, and DB constraints enforce that too.

## Full PDFs
Admin uploads the original to Google Drive by hand and pastes the link/ID. Only the file ID is stored. Automated Drive upload was not built: it would push the full file through a 4.5 MB-limited function, and service accounts have no personal storage quota. See GOOGLE-DRIVE-SETUP.md.

## Layout
- `app/` student pages (`/`, `/s/[slug]`, `/s/[slug]/[n]?c=category`, `/m/[id]`), `/admin`, route handlers in `app/api`
- `lib/` db, migrations runner, auth/session, password (scrypt), storage, drive, pdf, schemas, data queries
- `supabase/migrations/` SQL (Supabase CLI compatible; `npm run migrate` also applies them)
- `components/PreviewViewer.js` canvas viewer (pdf.js) limited to 5 pages
- `scripts/`, `tests/run.mjs`

## Request flows
- Student preview: `/m/[id]` → viewer fetches `/api/preview/[id]` → stored preview bytes (published only).
- Student download: `/api/download/[id]` → best-effort Drive check → 302 to `drive.google.com/uc?export=download&id=…`.
- Public queries never select `drive_file_id` or `preview_path`.
