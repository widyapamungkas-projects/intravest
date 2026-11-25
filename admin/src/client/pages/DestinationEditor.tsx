import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Link, useLocation } from 'wouter';
import { api, ApiError } from '../api';
import { SLUG_RE, cleanTour, type Issue } from '../../shared/tour';
import { validateDestination } from '../../shared/destination';
import { Chip, Field, LinesField, Toggle } from '../ui';
import { MarkdownEditor } from '../MarkdownEditor';
import { PhotoPicker } from '../PhotoPicker';
import { useApp } from '../App';
import { dropDraft, getDraft, saveDraft } from '../drafts';

type Data = Record<string, any>;
type Tab = 'umum' | 'en' | 'id';
const TABS: { id: Tab; label: string }[] = [{ id: 'umum', label: 'Umum' }, { id: 'en', label: 'English' }, { id: 'id', label: 'Indonesia' }];
const same = (a: unknown, b: unknown) => JSON.stringify(a) === JSON.stringify(b);
const tabOf = (p: (string | number)[]): Tab => (p[0] === 'en' ? 'en' : p[0] === 'id' ? 'id' : 'umum');

export function DestinationEditor({ slug: slugProp }: { slug: string | null }) {
  const { toast, openPublish, reloadMeta } = useApp();
  const [, nav] = useLocation();
  const isNew = slugProp === null;
  const [slug, setSlug] = useState(slugProp ?? '');
  const [data, setData] = useState<Data | null>(null);
  const [orig, setOrig] = useState<{ data: Data; sha: string } | null>(null);
  const [tab, setTab] = useState<Tab>('umum');
  const [loadErr, setLoadErr] = useState('');
  const [deleted, setDeleted] = useState(false);
  const loaded = useRef(false);

  useEffect(() => {
    loaded.current = false; setData(null); setLoadErr(''); setTab('umum'); setDeleted(false);
    if (isNew) { setOrig(null); setData({ order: 1, en: {}, id: {} }); loaded.current = true; return; }
    const d = getDraft('destination', slugProp!);
    api(`/destinations/${slugProp}`).then((r) => {
      setOrig({ data: r.data, sha: r.sha });
      if (d?.kind === 'destination' && d.data === null) setDeleted(true);
      setData(d?.kind === 'destination' && d.data ? d.data : r.data); loaded.current = true;
    }).catch((e: ApiError) => {
      if (e.status === 404 && d?.kind === 'destination' && d.data) { setData(d.data); loaded.current = true; } else setLoadErr(e.message);
    });
  }, [slugProp, isNew]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (!data || !loaded.current || deleted) return;
    const key = isNew ? slug : slugProp!;
    if (!key || !SLUG_RE.test(key)) return;
    if (orig && same(data, orig.data)) dropDraft('destination', key);
    else saveDraft({ kind: 'destination', slug: key, data, baseSha: orig?.sha ?? null, updatedAt: Date.now() });
  }, [data, slug, deleted]); // eslint-disable-line react-hooks/exhaustive-deps

  const set = useCallback((patch: Data) => setData((d) => ({ ...d, ...patch })), []);
  const setLoc = useCallback((l: 'en' | 'id', patch: Data) => setData((d) => ({ ...d, [l]: { ...(d?.[l] ?? {}), ...patch } })), []);

  const issues: Issue[] = useMemo(() => {
    if (!data) return [];
    const v = validateDestination(cleanTour({ ...data, slug: slug || 'x' }));
    const out = v.ok ? [] : [...v.issues];
    if (isNew && !SLUG_RE.test(slug)) out.unshift({ path: ['slug'], message: 'Alamat (slug) wajib: huruf kecil, angka, dan tanda hubung.' });
    return out;
  }, [data, slug, isNew]);
  const byTab = (t: Tab) => issues.filter((i) => tabOf(i.path) === t).length;
  const errFor = (...p: (string | number)[]) => issues.find((i) => i.path.join('.') === p.join('.'))?.message;

  if (loadErr) return <div className="card p-8 text-center"><p className="text-bad">{loadErr}</p><Link href="/destinasi" className="btn-ghost mt-4">← Kembali</Link></div>;
  if (!data) return <div className="text-muted">Memuat…</div>;

  if (deleted) return (
    <div className="card p-8 text-center">
      <p className="font-medium">Destinasi "{slugProp}" ditandai untuk dihapus.</p>
      <p className="mt-1 text-sm text-muted">Baru benar-benar terhapus saat kamu menekan Publikasikan.</p>
      <div className="mt-5 flex justify-center gap-2">
        <Link href="/destinasi" className="btn-ghost">Ke daftar</Link>
        <button className="btn-primary" onClick={() => { dropDraft('destination', slugProp!); setDeleted(false); setData(orig!.data); }}>Batalkan penghapusan</button>
      </div>
    </div>
  );

  const title = data.en?.title || data.id?.title || (isNew ? 'Destinasi baru' : slugProp);
  const dirty = !orig || !same(data, orig.data);

  return (
    <div>
      <div className="mb-4 flex items-center gap-3">
        <Link href="/destinasi" className="btn-ghost !px-3" aria-label="Kembali ke daftar">←</Link>
        <div className="min-w-0 flex-1">
          <h1 className="truncate text-xl font-semibold md:text-2xl">{title}</h1>
          <div className="mt-0.5">{dirty ? <Chip tone="brand">Perubahan tersimpan di browser, belum dipublikasikan</Chip> : <Chip tone="ok">Sama dengan yang tayang</Chip>}</div>
        </div>
      </div>

      <div className="-mx-4 mb-5 overflow-x-auto border-b border-line px-4 md:mx-0 md:px-0" role="tablist">
        <div className="flex min-w-max gap-1">
          {TABS.map((t) => {
            const n = byTab(t.id);
            return (
              <button key={t.id} role="tab" aria-selected={tab === t.id} onClick={() => setTab(t.id)}
                className={`relative min-h-11 whitespace-nowrap px-4 text-[15px] font-medium transition ${tab === t.id ? 'text-brand-ink after:absolute after:inset-x-2 after:bottom-0 after:h-0.5 after:bg-brand' : 'text-muted hover:text-ink'}`}>
                {t.label}{n > 0 && <span className="ml-1.5 rounded-full bg-bad px-1.5 text-[11px] text-white">{n}</span>}
              </button>
            );
          })}
        </div>
      </div>

      {tab === 'umum' && (
        <div className="card space-y-5 p-5">
          <div className="grid gap-5 sm:grid-cols-2">
            <Field label="Alamat halaman (slug)" error={errFor('slug')} hint="Huruf kecil dan tanda hubung, contoh: nusa-penida. Tidak bisa diganti setelah dibuat.">
              <input className="field" value={slug} disabled={!isNew} onChange={(e) => setSlug(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '-'))} placeholder="nusa-penida" />
            </Field>
            <Field label="Urutan tampil" error={errFor('order')} hint="Angka kecil tampil lebih dulu."><input className="field" type="number" min={1} value={data.order ?? 1} onChange={(e) => set({ order: Number(e.target.value) })} /></Field>
          </div>
          <PhotoPicker image={data.image} onImage={(v) => set({ image: v })} />
        </div>
      )}

      {(tab === 'en' || tab === 'id') && <DestLocale key={tab} l={tab} data={data} setLoc={setLoc} errFor={errFor} />}

      {issues.length > 0 && (
        <div className="card mt-5 border-bad/30 bg-bad/5 p-4 text-sm" role="status">
          <div className="font-medium text-bad">Yang perlu dilengkapi sebelum bisa dipublikasikan ({issues.length}):</div>
          <ul className="mt-2 space-y-1">{issues.slice(0, 12).map((i, k) => (
            <li key={k}><button className="text-left underline decoration-bad/40 underline-offset-2" onClick={() => setTab(tabOf(i.path))}>{i.message}</button> <span className="text-muted">({TABS.find((t) => t.id === tabOf(i.path))!.label})</span></li>
          ))}</ul>
        </div>
      )}

      <div className="fixed inset-x-0 bottom-0 z-20 border-t border-line bg-panel/95 px-4 py-3 backdrop-blur md:sticky md:mt-6 md:rounded-xl md:border md:px-5">
        <div className="mx-auto flex max-w-5xl items-center gap-3">
          <div className="hidden min-w-0 flex-1 text-sm text-muted sm:block">{dirty ? 'Tersimpan otomatis di browser ini. Belum masuk ke situs.' : 'Tidak ada perubahan.'}</div>
          {!isNew && <button className="btn-danger" onClick={() => {
            if (!confirm(`Hapus destinasi "${title}"? Paket yang memakainya akan ditolak saat publikasi sampai dipindah.`)) return;
            saveDraft({ kind: 'destination', slug: slugProp!, data: null, baseSha: orig!.sha, updatedAt: Date.now() });
            toast('Ditandai untuk dihapus. Terhapus saat dipublikasikan.'); nav('/destinasi');
          }}>Hapus</button>}
          {dirty && orig && <button className="btn-ghost" onClick={() => { if (confirm('Buang semua perubahan destinasi ini?')) { dropDraft('destination', slugProp!); setData(orig.data); } }}>Buang</button>}
          <button className="btn-primary flex-1 sm:flex-none" disabled={!dirty || !!issues.length}
            onClick={() => { if (isNew) { saveDraft({ kind: 'destination', slug, data, baseSha: null, updatedAt: Date.now() }); nav(`/destinasi/${slug}`, { replace: true }); } reloadMeta(); openPublish(); }}>Publikasikan…</button>
        </div>
      </div>
    </div>
  );
}

function DestLocale({ l, data, setLoc, errFor }: { l: 'en' | 'id'; data: Data; setLoc: (l: 'en' | 'id', p: Data) => void; errFor: (...p: (string | number)[]) => string | undefined }) {
  const x = data[l] ?? {};
  const L = l === 'en' ? 'English' : 'Indonesia';
  const other = l === 'en' ? 'Indonesia' : 'English';
  const desc = x.description?.length ?? 0;
  return (
    <div className="space-y-5">
      {!x.title?.trim() && <div className="rounded-lg border border-warn/40 bg-warn/10 p-3 text-sm">Bagian {L} masih kosong. Kalau dibiarkan, halaman {L} sementara memakai teks {other}. Mulai mengetik nama destinasi untuk mengisinya sendiri.</div>}
      <div className="card space-y-5 p-5">
        <div className="grid gap-5 sm:grid-cols-2">
          <Field label={`Nama destinasi (${L})`} error={errFor(l, 'title')}><input className="field" value={x.title ?? ''} onChange={(e) => setLoc(l, { title: e.target.value })} /></Field>
          <Field label="Tagline" error={errFor(l, 'tagline')} hint="Satu kalimat pendek di kartu destinasi."><input className="field" value={x.tagline ?? ''} onChange={(e) => setLoc(l, { tagline: e.target.value })} /></Field>
        </div>
        <Field label="Deskripsi singkat" error={errFor(l, 'description')} hint={<span className={desc > 160 ? 'text-bad' : ''}>{desc}/160 karakter · tampil di kartu dan hasil Google</span>}>
          <textarea className="field" rows={3} value={x.description ?? ''} onChange={(e) => setLoc(l, { description: e.target.value })} />
        </Field>
        <Field label="Deskripsi foto (alt text)" hint="Satu kalimat yang menggambarkan foto utama."><input className="field" value={x.imageAlt ?? ''} onChange={(e) => setLoc(l, { imageAlt: e.target.value })} /></Field>
      </div>
      <div className="card space-y-5 p-5">
        <Field label="Something to See" error={errFor(l, 'see')} hint="Satu baris per item."><LinesField value={x.see ?? []} onChange={(v) => setLoc(l, { see: v })} rows={4} /></Field>
        <Field label="Something to Do" error={errFor(l, 'activities')} hint="Satu baris per item."><LinesField value={x.activities ?? []} onChange={(v) => setLoc(l, { activities: v })} rows={4} /></Field>
        <Field label="Something to Buy" error={errFor(l, 'shopping')} hint="Satu baris per item."><LinesField value={x.shopping ?? []} onChange={(v) => setLoc(l, { shopping: v })} rows={3} /></Field>
      </div>
      <div className="card space-y-5 p-5">
        <div><span className="label">Tulisan pengantar</span><MarkdownEditor value={x.body ?? ''} onChange={(v) => setLoc(l, { body: v })} rows={9} /></div>
        <Toggle checked={!!x.needsReview} onChange={(v) => setLoc(l, { needsReview: v })} label="Perlu dicek" hint="Nyalakan kalau teks ini hasil terjemahan otomatis dan belum dibaca orang. Matikan setelah dicek." />
      </div>
    </div>
  );
}
