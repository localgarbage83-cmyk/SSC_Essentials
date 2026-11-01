// Runs in the browser (admin generates the preview) and on the server (re-validates it).
import { PDFDocument } from 'pdf-lib';
import { PREVIEW_PAGES } from './categories.js';

// Copy the first N pages of the original into a brand-new document. The original is never uploaded.
export async function makePreview(originalBytes, max = PREVIEW_PAGES) {
  const src = await PDFDocument.load(originalBytes); // throws on encrypted/corrupt files
  const originalPages = src.getPageCount();
  if (!originalPages) throw new Error('The PDF has no pages');
  const count = Math.min(max, originalPages), out = await PDFDocument.create();
  const pages = await out.copyPages(src, Array.from({ length: count }, (_, i) => i));
  pages.forEach(p => out.addPage(p));
  out.setTitle('Preview'); out.setProducer('SSC Study Hub'); out.setCreator('SSC Study Hub');
  return { bytes: await out.save(), originalPages, previewPages: count };
}
// Server-side: confirm an uploaded preview is a real, unencrypted PDF with 1..5 pages.
export async function inspectPdf(bytes) {
  const head = new TextDecoder('latin1').decode(bytes.subarray(0, 5));
  if (head !== '%PDF-') throw new Error('Not a PDF file (bad signature)');
  const doc = await PDFDocument.load(bytes);
  return { pages: doc.getPageCount() };
}
