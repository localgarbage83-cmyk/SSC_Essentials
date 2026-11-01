# Deploy: GitHub → Vercel Hobby
1. `git init && git add . && git commit -m "SSC Study Hub v2"`; create a GitHub repo and push. `.env*` and `.data/` are git-ignored.
2. vercel.com → Add New → Project → import the repo (Framework: Next.js, no build overrides).
3. Environment Variables (Production + Preview), from `.env.example`: `DATABASE_URL`, `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, `SUPABASE_PREVIEW_BUCKET`, `SITE_URL`. Do **not** set `DRIVE_CHECK=off` in production.
4. Deploy. Visit `/admin`, sign in with the account you created (SUPABASE-SETUP step 5).
5. Add a custom domain later in Vercel → Domains; update `SITE_URL`.

## Hobby limits that shaped the design
- Request body ≤ 4.5 MB → full PDFs never go through the server; previews are generated in the browser and capped at 4 MB.
- Serverless filesystem is not persistent → no files written to disk in production (previews are in Supabase Storage).
- Functions use one pooled DB connection each (`max: 1`) with Supabase's transaction pooler.
- Hobby is for non-commercial use under Vercel's terms; check them if you later charge for access.
## Updating
Push to `main`; Vercel redeploys. Add new SQL files to `supabase/migrations/` and run `npm run migrate` against production before/after deploying.
