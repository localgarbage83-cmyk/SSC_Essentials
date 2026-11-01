# Supabase setup (free tier)
1. supabase.com → New project (Free). Choose a region near your students. Save the **database password**.
2. **Project Settings → Database → Connection string → Transaction pooler** (port 6543). Replace `[YOUR-PASSWORD]`. This is `DATABASE_URL`.
3. **Project Settings → API**: copy **Project URL** (`SUPABASE_URL`) and the **service_role** key (`SUPABASE_SERVICE_ROLE_KEY`). The service_role key is a server secret: never put it in client code or a `NEXT_PUBLIC_` variable.
4. Run migrations from your computer:
   ```bash
   export DATABASE_URL='postgresql://…:6543/postgres'
   npm run migrate
   ```
   (or paste the files in `supabase/migrations/` into the SQL Editor, in order.)
5. Create the admin account (production database):
   ```bash
   DATABASE_URL=… ADMIN_USERNAME=you ADMIN_PASSWORD='long passphrase 12+ chars' npm run create-admin
   ```
6. Storage: nothing to do. The private `previews` bucket is created automatically on the first preview upload. (Free tier: 1 GB storage, 50 MB per file; a 5-page preview is tiny.)
7. Free projects pause after about a week of inactivity. Open the site or dashboard occasionally, or un-pause in the dashboard.
