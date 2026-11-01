# Security notes
**Implemented**
- Passwords: scrypt (N=32768, r=8, p=1, random salt) via Node crypto; constant-time compare; dummy hash for unknown users (no username timing leak). Min 12 characters when created.
- Sessions: 32-byte random token, only its SHA-256 stored server-side; `HttpOnly; SameSite=Strict` (`__Host-` prefix + `Secure` in production); 8 h expiry; logout deletes the row (verified by test).
- CSRF: every mutating admin API requires same-origin `Origin` + per-session `x-csrf-token`. Login checks Origin.
- Rate limit: DB-backed (works on serverless): 10 failed logins/IP and 6/username per 15 min → 429.
- Authorization: every `/api/admin/*` handler is wrapped by `admin()`; unauthenticated calls get 401 (tested for each route).
- Input: zod schemas on every body; parameterized SQL only; UUID checks on ids; storage paths whitelisted.
- Uploads: size cap, content-type, `%PDF-` signature, full pdf-lib parse (rejects corrupt/encrypted), ≤ 5 pages, DB check constraints.
- Public data never includes Drive IDs or storage paths. Secrets only in server env vars; `.env*` git-ignored.
- RLS enabled on all tables; Supabase `anon`/`authenticated` privileges revoked.
- Headers: nosniff, frame protection, referrer and permissions policies. Admin pages are `noindex`.

**Honest limits**
- A Drive link is a bearer link: anyone who has the download URL can share it. Not a DRM system.
- The server trusts the admin that the 5-page preview came from the right file (it only validates length/format).
- No CSP is set (Next.js inline scripts would need nonces); add one if you host sensitive data.
- Single admin role; no 2FA. Keep the password long and unique.
- `npm audit` should be re-run before each release.

## Dependency audit (`npm audit --omit=dev`, run at build time of this release)
Fixed: **zod** upgraded to 4.x. Mitigated, no in-range fix available:
- **next 14.2.35** (latest 14.x): advisory about the Image Optimizer DoS. The app does not use `next/image`; `images.unoptimized` is set, removing that surface. Fixed only in Next 16 (major upgrade; plan one when convenient).
- **postcss (bundled by Next)**: XSS when stringifying untrusted CSS. The app never processes user-supplied CSS.
- **pdfjs-dist 3.11.174**: malicious-PDF script execution advisory. The viewer sets `isEvalSupported: false` and `enableScripting: false` (the documented mitigation) and only ever opens previews that the server validated. Its optional `canvas`/`tar`/`node-pre-gyp` chain is install-time only and is not bundled (`canvas` is aliased to `false`). Upgrading to pdfjs-dist 5+/6 is a major change that needs browser re-testing.
