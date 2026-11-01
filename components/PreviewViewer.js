'use client';
import { useEffect, useRef, useState } from 'react';
import { PREVIEW_PAGES } from '@/lib/categories';
// Renders the preview PDF page by page on canvas (works on mobile browsers that cannot show inline PDFs).
export default function PreviewViewer({ src }) {
  const wrap = useRef(null), canvas = useRef(null);
  const [doc, setDoc] = useState(null), [page, setPage] = useState(1), [status, setStatus] = useState('loading');
  useEffect(() => {
    let dead = false, task;
    (async () => {
      try {
        const pdfjs = await import('pdfjs-dist/legacy/build/pdf');
        pdfjs.GlobalWorkerOptions.workerSrc = new URL('pdfjs-dist/legacy/build/pdf.worker.min.js', import.meta.url).toString();
        task = pdfjs.getDocument({ url: src, withCredentials: true, isEvalSupported: false, enableScripting: false });
        const d = await task.promise; if (dead) return;
        setDoc(d); setPage(1); setStatus('ready');
      } catch { if (!dead) setStatus('error'); }
    })();
    return () => { dead = true; task?.destroy?.(); };
  }, [src]);
  const total = doc ? Math.min(doc.numPages, PREVIEW_PAGES) : 0;
  useEffect(() => {
    if (!doc) return; let dead = false, job;
    (async () => {
      const p = await doc.getPage(page), w = wrap.current.clientWidth, dpr = window.devicePixelRatio || 1;
      const base = p.getViewport({ scale: 1 }), vp = p.getViewport({ scale: (w / base.width) * dpr }), c = canvas.current;
      c.width = vp.width; c.height = vp.height; c.style.width = '100%'; c.style.height = 'auto';
      job = p.render({ canvasContext: c.getContext('2d'), viewport: vp }); try { await job.promise; } catch { /* cancelled */ }
      if (dead) return;
    })();
    return () => { dead = true; job?.cancel?.(); };
  }, [doc, page]);
  return (
    <div className="viewer" ref={wrap}>
      {status === 'loading' && <div className="empty">Loading preview…</div>}
      {status === 'error' && <div className="empty">The preview could not be loaded. You can still download the full PDF.</div>}
      {status === 'ready' && <>
        <canvas ref={canvas} aria-label={`Preview page ${page} of ${total}`} />
        <div className="viewer-bar">
          <button className="btn ghost" disabled={page <= 1} onClick={() => setPage(page - 1)}>Previous</button>
          <span className="mono">{page} / {total}</span>
          <button className="btn ghost" disabled={page >= total} onClick={() => setPage(page + 1)}>Next</button>
        </div></>}
    </div>
  );
}
