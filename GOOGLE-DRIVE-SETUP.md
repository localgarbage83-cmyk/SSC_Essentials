# Google Drive setup
**Decision:** full PDFs are uploaded to Drive manually; the dashboard stores only the file ID. This is real, not simulated, and costs nothing. Automated upload was deliberately not built (4.5 MB serverless body limit; service accounts have no storage quota of their own, so files would have to live in a shared drive/OAuth account with extra setup).

## Storage ownership
Files live in **your personal Google account** (15 GB free shared with Gmail/Photos). You own them, you pay (or not) for the quota. Create one folder, e.g. `SSC Study Hub`, with a sub-folder per subject.

## Per PDF
1. Upload the full PDF to Drive.
2. Right click → **Share** → General access → **Anyone with the link** → **Viewer**.
3. **Copy link** (looks like `https://drive.google.com/file/d/FILE_ID/view…`).
4. Paste the link (or just `FILE_ID`) into the dashboard's Drive field. The server extracts the ID and builds the download URL.

## Notes and limits
- A public link can be shared by anyone who has it. The site does **not** make the original PDF technically protected; it only avoids exposing the link in page data (downloads go through `/api/download/[id]`).
- Drive can throttle files with very heavy traffic ("Quota exceeded" for a day). The site shows a friendly message when Drive reports the file missing/private, but cannot detect quota blocks in advance. Mitigations: keep PDFs small, keep a second copy in another Drive, or move to a free CDN-backed host later.
- If you replace a file, upload a new version and paste the new ID (or use "Make a copy" + same sharing). Editing the Drive file in place via "Manage versions" keeps the same ID.
- Publishing runs a best-effort reachability check against Drive and refuses obviously missing/private files. If Drive cannot be reached at that moment you are told to retry.
