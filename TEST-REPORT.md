# Implementation & test report (v2.0.0)

## Audit of v1 (found and fixed)
| v1 problem | v2 |
|---|---|
| JSON file DB + PDFs on local disk (breaks on Vercel) | Supabase Postgres + Supabase Storage (previews only) |
| Full PDFs stored on the web server and served publicly | Full PDFs only in Google Drive; server stores the file ID |
| Login rate limit in memory (useless on serverless) | DB-backed limiter |
| Stateless HMAC cookie, no revocation, one env password | Random server-side sessions (hashed), logout revokes, scrypt-hashed admin users |
| No CSRF token | Origin check + per-session CSRF token |
| Quiz engine, MCQ import/export, templates, progress page | Removed entirely (routes, components, libs, deps, templates) |
| `useSupabase`-style lint errors / no lint config | ESLint configured, clean |
Also found by testing: embedded dev DB crashed if `.data/` did not exist (fixed); `npm audit` flagged zod (upgraded) and others (mitigated, see SECURITY-NOTES).

## Executed and passed
| Check | Result |
|---|---|
| `npm install` | OK |
| `npm run lint` (next/core-web-vitals) | 0 warnings, 0 errors |
| `npm run build` (production) | OK, 19 routes |
| Migrations applied on real Postgres engine (PGlite), seed has 7 subjects | OK |
| `npm test` (38 end-to-end tests against a running server) | 38 passed, 0 failed |
Covered by the 38 tests: 401 on every admin route when anonymous; wrong password; cross-origin login blocked; cookie flags; CSRF missing/wrong/cross-origin; login rate limit 429; password hash format/verify; 7 subjects incl. separate General/Higher Maths; chapter/material CRUD and validation (400/409); Drive URL parsing; publish blocked without preview; preview rejects wrong content-type, bad signature, corrupt PDF, >4 MB, full 12-page PDF, wrong page count; valid 5-page accepted; 3-page PDF gets 3-page preview; public preview PDF has ≤ 5 pages and ignores page/file params; unpublished preview 404 for public, 200 for admin; **Drive ID never present in any public page**; download 302 to Google Drive URL; unknown/unpublished download 404; unpublish hides everywhere; reorder/edit; delete removes stored preview; chapter delete cascades; logout invalidates session; friendly 404.
JavaScript syntax/type checking is covered by ESLint and the build (project is plain JS, no TypeScript).

## NOT verified (be aware)
- **Supabase Postgres/Storage and Google Drive were never contacted** (sandbox has no access/credentials). The Postgres layer ran on PGlite (real Postgres engine, embedded) and storage on local disk; the Supabase Storage REST calls follow the documented API but are untested. The Drive reachability check and Drive download redirect were tested with the check disabled (`DRIVE_CHECK=off`); the redirect URL format is tested, live Drive behaviour is not.
- **The browser UI** (admin form flow, in-browser preview generation, the pdf.js canvas viewer, mobile layout at 360-412 px, Bengali font rendering) was **not run in a browser** (none available). The preview-generation function itself is tested in Node; the viewer and layout need a manual check on a phone after deploy.
- Vercel deployment itself, PWA install, and offline behaviour were not tested.
