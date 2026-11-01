# Admin guide (`/admin`)
**Sign in** with the account made by `npm run create-admin`. Sessions last 8 hours; use Sign out on shared devices.

## Add a PDF (about 2 minutes)
1. In Drive: upload the full PDF, share "Anyone with the link: Viewer", copy the link.
2. Dashboard → **Materials → + New material**.
3. Choose Subject → Chapter → Category (Notes / MCQ + Detailed Explanation / CQ + Complete Solutions / Extra Topics / Model Questions / Other).
4. Enter Title and a short description.
5. Paste the Drive link. Choose the **original PDF** file: it stays in your browser and is used to build the preview.
6. **Save and generate preview.** The log shows: draft created → first 5 of N pages generated → preview uploaded and validated → Drive check.
7. A preview window opens. Check it, close it, then press **Publish** on the list row.
Publishing is refused if the preview or Drive file is missing/unreachable.

## Everyday tasks
- **Edit** title/description/category/Drive link; choose a new original PDF to regenerate the preview.
- **Publish / Unpublish**, **↑ ↓** reorder, **Delete** (removes the stored preview too; the Drive file is untouched).
- **Search / filter** by text, subject, category, status.
- **Chapters tab**: add, edit, reorder, delete (deleting a chapter deletes its materials). **Subjects tab**: add or edit names/group, reorder.

## Errors you may see
- *Preview larger than 4 MB*: compress images on the first pages of the PDF.
- *Invalid or encrypted PDF*: remove the PDF password and retry.
- *Drive: file is private / does not exist*: fix sharing or the ID.
- A failed new upload leaves an **unpublished draft**; open it with Edit and retry.
