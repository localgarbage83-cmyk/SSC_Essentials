'use client';
import { useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { CATEGORIES, categoryLabel } from '@/lib/categories';
import { makePreview } from '@/lib/pdf';
import PreviewViewer from '@/components/PreviewViewer';

export function Login() {
  const r = useRouter(), [msg, setMsg] = useState('');
  async function go(e) {
    e.preventDefault(); const f = new FormData(e.currentTarget);
    const res = await fetch('/api/admin/login', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ username: f.get('username'), password: f.get('password') }) });
    if (res.ok) r.refresh(); else setMsg((await res.json().catch(() => ({}))).error || 'Login failed');
  }
  return (
    <main><h1>Admin</h1>
      <form onSubmit={go} className="panel on">
        <label>Username<input name="username" autoComplete="username" required /></label>
        <label>Password<input name="password" type="password" autoComplete="current-password" required /></label>
        <button className="btn">Sign in</button>{msg && <p className="err" role="alert">{msg}</p>}
      </form></main>
  );
}

const Field = ({ label, children }) => <label>{label}{children}</label>;
const pad = n => String(n).padStart(2, '0');

export default function Admin({ csrf, user, subjects, chapters, materials }) {
  const router = useRouter(), [tab, setTab] = useState('materials'), [msg, setMsg] = useState('');
  async function api(method, url, body) {
    const fd = body instanceof FormData;
    const res = await fetch(url, { method, headers: { 'x-csrf-token': csrf, ...(body && !fd ? { 'Content-Type': 'application/json' } : {}) }, body: body ? (fd ? body : JSON.stringify(body)) : undefined });
    const j = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(j.error || res.statusText);
    return j;
  }
  const run = async (fn, ok) => { try { const r = await fn(); setMsg(ok || 'Done'); router.refresh(); return r; } catch (e) { setMsg('Error: ' + e.message); } };
  const props = { api, run, subjects, chapters, materials, setMsg };
  return (
    <main>
      <div className="btns" style={{ justifyContent: 'space-between' }}><h1 style={{ margin: 0 }}>Admin</h1>
        <span className="mono sub small">{user} <button className="btn ghost sm" onClick={async () => { await api('POST', '/api/admin/logout'); router.refresh(); }}>Sign out</button></span></div>
      <div className="tabs" role="tablist">{['materials', 'chapters', 'subjects'].map(t => <button key={t} role="tab" aria-selected={tab === t} className="tab" onClick={() => setTab(t)}>{t[0].toUpperCase() + t.slice(1)}</button>)}</div>
      {msg && <div className="note" role="status">{msg}</div>}
      {tab === 'materials' && <Materials {...props} />}
      {tab === 'chapters' && <Chapters {...props} />}
      {tab === 'subjects' && <Subjects {...props} />}
    </main>
  );
}

function Reorder({ entity, id, run, api }) {
  return <>{['up', 'down'].map(d => <button key={d} className="btn ghost sm" aria-label={'Move ' + d} onClick={() => run(() => api('POST', '/api/admin/reorder', { entity, id, dir: d }), 'Reordered')}>{d === 'up' ? '↑' : '↓'}</button>)}</>;
}

function Materials({ api, run, subjects, chapters, materials, setMsg }) {
  const [f, setF] = useState({ q: '', subject: '', category: '', status: '' }), [edit, setEdit] = useState(null), [view, setView] = useState(null);
  const chById = useMemo(() => Object.fromEntries(chapters.map(c => [c.id, c])), [chapters]);
  const subById = useMemo(() => Object.fromEntries(subjects.map(s => [s.id, s])), [subjects]);
  const list = materials.filter(m => (!f.q || (m.title + m.description).toLowerCase().includes(f.q.toLowerCase())) && (!f.subject || m.subject_id === f.subject) && (!f.category || m.category === f.category) && (!f.status || (f.status === 'pub') === m.published));
  return (<>
    <div className="btns"><button className="btn" onClick={() => setEdit({})}>+ New material</button></div>
    {edit && <MaterialForm key={edit.id || 'new'} {...{ api, run, subjects, chapters, setMsg, m: edit, onDone: () => setEdit(null), onPreview: setView }} />}
    <div className="grid2">
      <Field label="Search"><input value={f.q} onChange={e => setF({ ...f, q: e.target.value })} placeholder="Title or description" /></Field>
      <Field label="Subject"><select value={f.subject} onChange={e => setF({ ...f, subject: e.target.value })}><option value="">All</option>{subjects.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}</select></Field>
      <Field label="Category"><select value={f.category} onChange={e => setF({ ...f, category: e.target.value })}><option value="">All</option>{CATEGORIES.map(c => <option key={c.key} value={c.key}>{c.label}</option>)}</select></Field>
      <Field label="Status"><select value={f.status} onChange={e => setF({ ...f, status: e.target.value })}><option value="">All</option><option value="pub">Published</option><option value="draft">Unpublished</option></select></Field>
    </div>
    {!list.length && <div className="empty">No materials match.</div>}
    {list.map(m => { const c = chById[m.chapter_id]; return (
      <div key={m.id} className="panel">
        <strong>{m.title}</strong>
        <div className="sub mono small">{subById[c?.subject_id]?.name} · CH {pad(c?.number)} · {categoryLabel(m.category).toUpperCase()} · {m.published ? 'PUBLISHED' : 'UNPUBLISHED'} · {m.preview_pages ? `${m.preview_pages} PREVIEW PAGES` : 'NO PREVIEW'} · {m.drive_file_id ? 'DRIVE OK' : 'NO DRIVE ID'}</div>
        <div className="btns">
          {m.preview_path && <button className="btn ghost sm" onClick={() => setView(m.id)}>Preview</button>}
          <button className="btn ghost sm" onClick={() => setEdit(m)}>Edit</button>
          <button className="btn sm" onClick={() => run(() => api('POST', '/api/admin/materials/publish', { id: m.id, published: !m.published }), m.published ? 'Unpublished' : 'Published')}>{m.published ? 'Unpublish' : 'Publish'}</button>
          <Reorder entity="materials" id={m.id} run={run} api={api} />
          <button className="btn ghost sm" onClick={() => confirm('Delete this material and its preview?') && run(() => api('DELETE', '/api/admin/materials?id=' + m.id), 'Deleted')}>Delete</button>
        </div></div>); })}
    {view && <div className="modal" role="dialog" aria-modal="true"><div><div className="btns" style={{ justifyContent: 'space-between' }}><strong>Preview (admin)</strong><button className="btn ghost sm" onClick={() => setView(null)}>Close</button></div><PreviewViewer src={`/api/preview/${view}?t=${Date.now()}`} /></div></div>}
  </>);
}

function MaterialForm({ api, run, subjects, chapters, setMsg, m, onDone, onPreview }) {
  const ch0 = chapters.find(c => c.id === m.chapter_id);
  const [subject, setSubject] = useState(ch0?.subject_id || subjects[0]?.id || ''), [chapterId, setChapterId] = useState(m.chapter_id || ''), [log, setLog] = useState([]), [busy, setBusy] = useState(false), [file, setFile] = useState(null);
  const [v, setV] = useState({ category: m.category || 'notes', title: m.title || '', description: m.description || '', drive_input: m.drive_file_id || '' });
  const chs = chapters.filter(c => c.subject_id === subject).sort((a, b) => a.number - b.number);
  const say = s => setLog(l => [...l, s]);
  async function save(e) {
    e.preventDefault(); setBusy(true); setLog([]);
    try {
      if (!m.id && !file) throw new Error('Choose the original PDF so the 5-page preview can be generated');
      if (!m.id && !chapterId) throw new Error('Choose a chapter');
      const body = { ...v, drive_input: v.drive_input.trim() || null }; let id = m.id;
      if (id) { await api('PATCH', '/api/admin/materials', { id, ...body }); say('Details saved'); }
      else { id = (await api('POST', '/api/admin/materials', { chapter_id: chapterId, ...body })).id; say('Draft created (unpublished)'); }
      if (file) {
        say('Reading the PDF in your browser (it is not uploaded)…');
        const p = await makePreview(new Uint8Array(await file.arrayBuffer()));
        say(`Generated preview: first ${p.previewPages} of ${p.originalPages} pages`);
        const fd = new FormData(); fd.set('id', id); fd.set('originalPages', p.originalPages); fd.set('file', new Blob([p.bytes], { type: 'application/pdf' }), 'preview.pdf');
        await api('POST', '/api/admin/materials/preview', fd); say('Preview uploaded and validated by the server');
      }
      if (body.drive_input) { const d = await api('POST', '/api/admin/drive-check', { input: body.drive_input }); say('Drive: ' + d.message); }
      say('Saved. Review the preview, then publish from the list.'); setMsg('Saved'); await run(async () => {}, 'Saved'); onPreview?.(id);
    } catch (err) { say('Error: ' + err.message + (m.id ? '' : ' (a draft may exist in the list; fix and edit it)')); await run(async () => {}, null); }
    setBusy(false);
  }
  return (
    <form onSubmit={save} className="panel on"><strong>{m.id ? 'Edit material' : 'New material'}</strong>
      <div className="grid2">
        {!m.id && <><Field label="Subject"><select value={subject} onChange={e => { setSubject(e.target.value); setChapterId(''); }}>{subjects.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}</select></Field>
          <Field label="Chapter"><select value={chapterId} onChange={e => setChapterId(e.target.value)} required><option value="">Select…</option>{chs.map(c => <option key={c.id} value={c.id}>{c.number}. {c.title}</option>)}</select></Field></>}
        <Field label="Category"><select value={v.category} onChange={e => setV({ ...v, category: e.target.value })}>{CATEGORIES.map(c => <option key={c.key} value={c.key}>{c.label}</option>)}</select></Field>
        <Field label="Title"><input value={v.title} onChange={e => setV({ ...v, title: e.target.value })} required maxLength={150} /></Field>
      </div>
      <Field label="Short description"><textarea value={v.description} onChange={e => setV({ ...v, description: e.target.value })} maxLength={500} /></Field>
      <Field label="Google Drive link or file ID (full PDF, shared “Anyone with the link”)"><input value={v.drive_input} onChange={e => setV({ ...v, drive_input: e.target.value })} placeholder="https://drive.google.com/file/d/…" /></Field>
      <Field label={m.id ? 'Original PDF (only to regenerate the preview)' : 'Original PDF (stays in your browser; used to make the preview)'}><input type="file" accept="application/pdf" onChange={e => setFile(e.target.files[0] || null)} /></Field>
      <div className="btns"><button className="btn" disabled={busy}>{busy ? 'Working…' : 'Save and generate preview'}</button><button type="button" className="btn ghost" onClick={onDone}>Close</button></div>
      <div className="log" role="log">{log.map((l, i) => <div key={i}>{l}</div>)}</div>
    </form>
  );
}

function Chapters({ api, run, subjects, chapters }) {
  const [sub, setSub] = useState(subjects[0]?.id || ''), [edit, setEdit] = useState(null);
  const list = chapters.filter(c => c.subject_id === sub).sort((a, b) => a.display_order - b.display_order);
  const submit = (e, id) => { e.preventDefault(); const d = Object.fromEntries(new FormData(e.currentTarget)); const f = e.currentTarget; run(async () => { await api(id ? 'PATCH' : 'POST', '/api/admin/chapters', id ? { id, ...d } : { subject_id: sub, ...d }); setEdit(null); f.reset?.(); }, 'Saved'); };
  const form = (c, id) => <form onSubmit={e => submit(e, id)} className="grid2"><Field label="Number"><input name="number" type="number" min="1" defaultValue={c?.number} required /></Field><Field label="Title"><input name="title" defaultValue={c?.title} required /></Field><Field label="Bengali title (optional)"><input className="bn" name="title_bn" defaultValue={c?.title_bn || ''} /></Field><div className="btns"><button className="btn">{id ? 'Save' : 'Add chapter'}</button>{id && <button type="button" className="btn ghost" onClick={() => setEdit(null)}>Cancel</button>}</div></form>;
  return (<>
    <Field label="Subject"><select value={sub} onChange={e => setSub(e.target.value)}>{subjects.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}</select></Field>
    {list.map(c => <div key={c.id} className="panel">{edit === c.id ? form(c, c.id) : <div className="btns"><div className="grow"><strong className="mono">{pad(c.number)}</strong> {c.title} <span className="bn sub">{c.title_bn}</span></div>
      <button className="btn ghost sm" onClick={() => setEdit(c.id)}>Edit</button><Reorder entity="chapters" id={c.id} run={run} api={api} />
      <button className="btn ghost sm" onClick={() => confirm('Delete this chapter and ALL its materials?') && run(() => api('DELETE', '/api/admin/chapters?id=' + c.id), 'Chapter deleted')}>Delete</button></div>}</div>)}
    <div className="panel on"><strong>Add chapter</strong>{form(null, null)}</div>
  </>);
}

function Subjects({ api, run, subjects }) {
  const [edit, setEdit] = useState(null);
  const submit = (e, id) => { e.preventDefault(); const d = Object.fromEntries(new FormData(e.currentTarget)); const f = e.currentTarget; run(async () => { await api(id ? 'PATCH' : 'POST', '/api/admin/subjects', id ? { id, ...d } : d); setEdit(null); f.reset?.(); }, 'Saved'); };
  const form = (s, id) => <form onSubmit={e => submit(e, id)} className="grid2">{!id && <Field label="Slug (URL, lowercase)"><input name="slug" pattern="[a-z0-9-]{2,40}" required /></Field>}<Field label="Name"><input name="name" defaultValue={s?.name} required /></Field><Field label="Bengali / secondary name"><input className="bn" name="name_bn" defaultValue={s?.name_bn || ''} /></Field><Field label="Group"><select name="group_key" defaultValue={s?.group_key || 'general'}><option value="general">General</option><option value="science">Science</option></select></Field><div className="btns"><button className="btn">{id ? 'Save' : 'Add subject'}</button>{id && <button type="button" className="btn ghost" onClick={() => setEdit(null)}>Cancel</button>}</div></form>;
  return (<>
    {subjects.map(s => <div key={s.id} className="panel">{edit === s.id ? form(s, s.id) : <div className="btns"><div className="grow"><strong>{s.name}</strong> <span className="sub bn">{s.name_bn}</span><div className="mono sub small">/{s.slug} · {s.group_key.toUpperCase()}</div></div><button className="btn ghost sm" onClick={() => setEdit(s.id)}>Edit</button><Reorder entity="subjects" id={s.id} run={run} api={api} /></div>}</div>)}
    <div className="panel on"><strong>Add subject</strong>{form(null, null)}</div>
  </>);
}
