# SSC STUDY HUB v2 — PDF-based learning platform

Lightweight Next.js 14 app. All learning material is PDF (Notes, MCQ + explanations, CQ + solutions, Extra Topics, Model Questions, Other).
Students read a **5-page preview** on the site and download the **full PDF from Google Drive**. No quiz engine, no per-question database.

Free-tier stack: Vercel Hobby (hosting) · Supabase Free (Postgres + Storage for 5-page previews) · Google Drive (full PDFs) · GitHub.

## Quick start (local, zero setup)
```bash
nix-shell -p nodejs_22      # or any Node >= 20
npm install
ADMIN_USERNAME=admin ADMIN_PASSWORD='use-a-long-passphrase' npm run create-admin
npm run dev                 # http://localhost:3000   admin: /admin
```
Without `DATABASE_URL` the app uses an embedded Postgres (PGlite) in `.data/` and keeps previews in `.data/previews`. This mode is **disabled in production**.
Stop `npm run dev` before running `create-admin` (embedded DB allows one process).

## Scripts
`npm run dev | build | start | lint | test | migrate | create-admin | import-legacy -- path/to/db.json`

## Deploy
1. [SUPABASE-SETUP.md](SUPABASE-SETUP.md) → database + storage keys
2. [VERCEL-DEPLOYMENT.md](VERCEL-DEPLOYMENT.md) → GitHub → Vercel
3. [GOOGLE-DRIVE-SETUP.md](GOOGLE-DRIVE-SETUP.md) → where full PDFs live
4. [ADMIN-USER-GUIDE.md](ADMIN-USER-GUIDE.md) → adding content

Other docs: [PROJECT-ARCHITECTURE.md](PROJECT-ARCHITECTURE.md) · [DATABASE-SCHEMA.md](DATABASE-SCHEMA.md) · [SECURITY-NOTES.md](SECURITY-NOTES.md) · [TEST-REPORT.md](TEST-REPORT.md)

## NixOS
Next.js ships a prebuilt SWC binary; if it fails with a stub-ld error enable `programs.nix-ld.enable = true;`.
