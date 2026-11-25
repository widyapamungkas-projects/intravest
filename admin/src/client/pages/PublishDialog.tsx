import { useState } from 'react';
import { api, ApiError } from '../api';
import { Modal } from '../ui';
import { useApp } from '../App';
import { clearDrafts, dropDraft, saveDraft, useDrafts, draftHref, draftIsDelete, draftKey, draftNoun, draftPath } from '../drafts';
import { Link } from 'wouter';

type Conflict = { path: string; theirSha: string | null; theirContent: string | null };
type Issue = { file: string; path: (string | number)[]; message: string };

export function PublishDialog({ onClose }: { onClose: () => void }) {
  const { toast, reloadMeta } = useApp();
  const drafts = useDrafts();
  const [note, setNote] = useState('');
  const [busy, setBusy] = useState(false);
  const [issues, setIssues] = useState<Issue[]>([]);
  const [conflicts, setConflicts] = useState<Conflict[]>([]);
  const [done, setDone] = useState<{ subject: string; warnings: string[]; commit: string } | null>(null);

  async function publish() {
    setBusy(true); setIssues([]); setConflicts([]);
    try {
      const items = drafts.map((d) => {
        if (d.kind === 'tour' || d.kind === 'destination') return { kind: d.kind, slug: d.slug, data: d.data, baseSha: d.baseSha };
        if (d.kind === 'story') { const [locale, slug] = d.slug.split('/'); return { kind: d.kind, locale, slug, fm: d.fm, body: d.body, baseSha: d.baseSha }; }
        return { kind: d.kind, slug: d.slug, text: d.text, baseSha: d.baseSha };
      });
      const r = await api('/publish', { body: { items, note: note.trim() || undefined } });
      clearDrafts(drafts.map((d) => draftKey(d.kind, d.slug)));
      setDone({ subject: r.subject, warnings: r.warnings ?? [], commit: r.commit });
      reloadMeta();
    } catch (e) {
      const x = e as ApiError;
      if (x.status === 422) setIssues(x.body.issues ?? [{ file: '', path: [], message: x.message }]);
      else if (x.status === 409) setConflicts(x.body.conflicts ?? []);
      else toast(x.message, 'bad');
    } finally { setBusy(false); }
  }

  const slugOf = (path: string) => path.replace(/^src\/(content|data)\//, '').replace(/\.\w+$/, '');
  function keepMine(c: Conflict) {
    const d = drafts.find((x) => draftPath(x) === c.path);
    if (d) saveDraft({ ...d, baseSha: c.theirSha });
    setConflicts((l) => l.filter((x) => x !== c));
    toast('Perubahanmu akan menimpa versi di repo saat dipublikasikan.');
  }
  function useTheirs(c: Conflict) {
    const d = drafts.find((x) => draftPath(x) === c.path);
    if (d) dropDraft(d.kind, d.slug);
    setConflicts((l) => l.filter((x) => x !== c));
    toast('Perubahanmu untuk file itu dibuang, versi terbaru dipakai.');
  }

  if (done) return (
    <Modal title="Berhasil dipublikasikan" onClose={onClose}>
      <p className="text-[15px]">Perubahan masuk ke repo sebagai satu commit:</p>
      <p className="mt-2 rounded-lg bg-canvas px-3 py-2 font-mono text-sm">{done.subject}</p>
      <p className="mt-3 text-sm text-muted">Netlify akan membangun ulang situs (sekitar 1 menit). Hanya satu build untuk semua perubahan ini.</p>
      {done.warnings.length > 0 && <details className="mt-3 text-sm"><summary className="cursor-pointer text-warn">{done.warnings.length} peringatan (tidak menghalangi)</summary><ul className="mt-2 list-disc space-y-1 pl-5 text-muted">{done.warnings.map((w) => <li key={w}>{w}</li>)}</ul></details>}
      <button className="btn-primary mt-5 w-full" onClick={onClose}>Selesai</button>
    </Modal>
  );

  return (
    <Modal title={`Publikasikan ${drafts.length} perubahan`} onClose={onClose} wide>
      {!drafts.length ? <p className="text-muted">Tidak ada perubahan yang menunggu.</p> : (
        <>
          <p className="text-sm text-muted">Semua perubahan di bawah digabung jadi <b>satu commit ke <code>main</code></b>, jadi hanya memicu satu build Netlify.</p>
          <ul className="mt-4 divide-y divide-line rounded-lg border border-line">
            {drafts.map((d) => (
              <li key={draftKey(d.kind, d.slug)} className="flex items-center gap-3 px-3 py-2.5 text-sm">
                <span className="rounded bg-brand-soft px-1.5 py-0.5 text-xs text-brand-ink">{draftIsDelete(d) ? 'dihapus' : d.baseSha ? 'diubah' : 'baru'}</span>
                <span className="min-w-0 flex-1 truncate">{draftNoun(d)} <b>{d.slug}</b></span>
                <Link href={draftHref(d)} className="text-brand underline" onClick={onClose}>buka</Link>
                <button className="text-muted underline" onClick={() => confirm(`Buang perubahan di "${d.slug}"?`) && dropDraft(d.kind, d.slug)}>buang</button>
              </li>
            ))}
          </ul>
          {drafts.length > 1 && <button className="mt-2 text-sm text-muted underline" onClick={() => confirm(`Buang SEMUA ${drafts.length} perubahan yang belum dipublikasikan? Tidak bisa dibatalkan.`) && clearDrafts(drafts.map((d) => draftKey(d.kind, d.slug)))}>Buang semua perubahan</button>}
          <label className="mt-4 block"><span className="label">Catatan <span className="font-normal text-muted">· opsional, masuk ke pesan commit</span></span>
            <input className="field" maxLength={200} value={note} onChange={(e) => setNote(e.target.value)} placeholder="mis. harga Juli diperbarui" /></label>

          {issues.length > 0 && (
            <div className="mt-4 rounded-lg border border-bad/30 bg-bad/5 p-3 text-sm" role="alert">
              <div className="font-medium text-bad">Belum bisa dipublikasikan, perbaiki dulu:</div>
              <ul className="mt-1.5 list-disc space-y-1 pl-5">{issues.map((i, k) => <li key={k}>{i.file && <span className="text-muted">{slugOf(i.file)}: </span>}{i.message}</li>)}</ul>
            </div>
          )}
          {conflicts.length > 0 && (
            <div className="mt-4 space-y-3 rounded-lg border border-warn/40 bg-warn/10 p-3 text-sm" role="alert">
              <div className="font-medium">Ada yang mengubah file ini di repo sejak kamu membukanya. Tidak ada yang ditimpa. Pilih satu:</div>
              {conflicts.map((c) => (
                <div key={c.path} className="rounded-lg bg-panel p-3">
                  <div className="font-mono text-xs">{c.path}</div>
                  <div className="mt-2 flex flex-col gap-2 sm:flex-row">
                    <button className="btn-ghost flex-1" onClick={() => useTheirs(c)}>Pakai versi terbaru di repo (buang punyaku)</button>
                    <button className="btn-danger flex-1" onClick={() => keepMine(c)}>Tetap pakai punyaku (timpa)</button>
                  </div>
                </div>
              ))}
            </div>
          )}
          <div className="mt-5 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
            <button className="btn-ghost" onClick={onClose}>Nanti saja</button>
            <button className="btn-primary" disabled={busy || conflicts.length > 0} onClick={publish}>{busy ? 'Memeriksa dan menyimpan…' : 'Publikasikan sekarang'}</button>
          </div>
        </>
      )}
    </Modal>
  );
}
