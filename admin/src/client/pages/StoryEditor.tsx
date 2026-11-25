import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Link, useLocation } from 'wouter';
import { api, ApiError } from '../api';
import { cleanTour, type Issue } from '../../shared/tour';
import { validateStory } from '../../shared/story';
import { Chip, Field, Toggle } from '../ui';
import { MarkdownEditor } from '../MarkdownEditor';
import { PhotoPicker } from '../PhotoPicker';
import { useApp } from '../App';
import { dropDraft, getDraft, saveDraft } from '../drafts';

type Fm = Record<string, any>;
type Tab = 'tulis' | 'atur';
const TABS: { id: Tab; label: string }[] = [{ id: 'tulis', label: 'Tulisan' }, { id: 'atur', label: 'Pengaturan' }];
const same = (a: unknown, b: unknown) => JSON.stringify(a) === JSON.stringify(b);
const SLUG = /^[a-z0-9]+(-[a-z0-9]+)*$/;
const today = () => new Date().toLocaleDateString('sv');
const slugify = (s: string) => s.toLowerCase().normalize('NFKD').replace(/[̀-ͯ]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 80).replace(/-+$/g, '');
const tabOf = (p: (string | number)[]): Tab => (p[0] === 'title' || p[0] === 'description' || p[0] === 'body' ? 'tulis' : 'atur');

export function StoryEditor({ ref: key }: { ref: { locale: string; slug: string } | null }) {
  const { toast, meta, openPublish, reloadMeta } = useApp();
  const [, nav] = useLocation();
  const isNew = key === null;
  const [locale, setLocale] = useState<'en' | 'id'>((key?.locale as 'en' | 'id') ?? 'en');
  const [slug, setSlug] = useState(key?.slug ?? '');
  const [slugTouched, setSlugTouched] = useState(false);
  const [fm, setFm] = useState<Fm | null>(null);
  const [body, setBody] = useState('');
  const [orig, setOrig] = useState<{ fm: Fm; body: string; sha: string } | null>(null);
  const [tab, setTab] = useState<Tab>('tulis');
  const [loadErr, setLoadErr] = useState('');
  const [deleted, setDeleted] = useState(false);
  const loaded = useRef(false);
  const lastKey = useRef<string | null>(null);
  const draftKey = `${locale}/${slug}`;

  useEffect(() => {
    loaded.current = false; setFm(null); setLoadErr(''); setTab('tulis'); setDeleted(false);
    if (key === null) {
      setOrig(null); setFm({ date: today(), category: 'tips', postToThreads: false }); setBody(''); setSlugTouched(false); loaded.current = true; return;
    }
    const d = getDraft('story', `${key.locale}/${key.slug}`);
    api(`/stories/${key.locale}/${key.slug}`).then((r) => {
      setOrig({ fm: r.fm, body: r.body, sha: r.sha });
      if (d?.kind === 'story' && d.fm === null) setDeleted(true);
      if (d?.kind === 'story' && d.fm) { setFm(d.fm); setBody(d.body); } else { setFm(r.fm); setBody(r.body); }
      loaded.current = true;
    }).catch((e: ApiError) => {
      if (e.status === 404 && d?.kind === 'story' && d.fm) { setFm(d.fm); setBody(d.body); loaded.current = true; } else setLoadErr(e.message);
    });
  }, [key?.locale, key?.slug]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (!fm || !loaded.current || deleted) return;
    if (!SLUG.test(slug)) return;
    if (isNew && lastKey.current && lastKey.current !== draftKey) dropDraft('story', lastKey.current);
    lastKey.current = draftKey;
    if (orig && same(fm, orig.fm) && body === orig.body) dropDraft('story', draftKey);
    else saveDraft({ kind: 'story', slug: draftKey, fm, body, baseSha: orig?.sha ?? null, updatedAt: Date.now() });
  }, [fm, body, slug, locale, deleted]); // eslint-disable-line react-hooks/exhaustive-deps

  const set = useCallback((patch: Fm) => setFm((d) => ({ ...d, ...patch })), []);
  const cleaned = useMemo(() => (fm ? cleanTour(fm) : null), [fm]);
  const issues: Issue[] = useMemo(() => {
    if (!cleaned) return [];
    const v = validateStory(cleaned, body);
    const out = v.ok ? [] : [...v.issues];
    if (isNew && !SLUG.test(slug)) out.push({ path: ['slug'], message: 'Alamat (slug) wajib: huruf kecil, angka, dan tanda hubung.' });
    const cat = cleaned.category as string | undefined;
    if (cat && cat !== 'tips' && meta && !meta.destinations.some((d) => d.slug === cat)) out.push({ path: ['category'], message: `Kategori "${cat}" bukan destinasi yang ada. Pilih dari daftar.` });
    return out;
  }, [cleaned, body, slug, isNew, meta]);
  const byTab = (t: Tab) => issues.filter((i) => tabOf(i.path) === t).length;
  const errFor = (p: string) => issues.find((i) => i.path[0] === p)?.message;

  if (loadErr) return <div className="card p-8 text-center"><p className="text-bad">{loadErr}</p><Link href="/cerita" className="btn-ghost mt-4">← Kembali</Link></div>;
  if (!fm) return <div className="text-muted">Memuat…</div>;
  if (deleted) return (
    <div className="card p-8 text-center">
      <p className="font-medium">Artikel "{key!.slug}" ditandai untuk dihapus.</p>
      <p className="mt-1 text-sm text-muted">Baru benar-benar terhapus saat kamu menekan Publikasikan.</p>
      <div className="mt-5 flex justify-center gap-2">
        <Link href="/cerita" className="btn-ghost">Ke daftar</Link>
        <button className="btn-primary" onClick={() => { dropDraft('story', draftKey); setDeleted(false); setFm(orig!.fm); setBody(orig!.body); }}>Batalkan penghapusan</button>
      </div>
    </div>
  );

  const dirty = !orig || !same(fm, orig.fm) || body !== orig.body;
  const desc = (fm.description ?? '').length;
  const tags = String(fm.tags ?? '').split(',').map((t) => t.trim()).filter(Boolean);
  const L = locale === 'en' ? 'English' : 'Indonesia';

  return (
    <div>
      <div className="mb-4 flex items-center gap-3">
        <Link href="/cerita" className="btn-ghost !px-3" aria-label="Kembali ke daftar">←</Link>
        <div className="min-w-0 flex-1">
          <h1 className="truncate text-xl font-semibold md:text-2xl">{fm.title || (isNew ? 'Artikel baru' : key!.slug)}</h1>
          <div className="mt-0.5 flex flex-wrap items-center gap-2 text-sm text-muted">
            <Chip tone="gray">{L}</Chip>
            {dirty ? <Chip tone="brand">Perubahan tersimpan di browser, belum dipublikasikan</Chip> : <Chip tone="ok">Sama dengan yang tayang</Chip>}
          </div>
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

      {tab === 'tulis' && (
        <div className="space-y-5">
          <div className="card space-y-5 p-5">
            <Field label="Judul" error={errFor('title')}>
              <input className="field text-lg font-medium" value={fm.title ?? ''} onChange={(e) => { set({ title: e.target.value }); if (isNew && !slugTouched) setSlug(slugify(e.target.value)); }} />
            </Field>
            <Field label="Deskripsi singkat" error={errFor('description')} hint={<span className={desc > 160 ? 'text-bad' : ''}>{desc}/160 karakter · tampil di kartu artikel dan hasil Google</span>}>
              <textarea className="field" rows={2} value={fm.description ?? ''} onChange={(e) => set({ description: e.target.value })} />
            </Field>
          </div>
          <div className="card p-5">
            <span className="label">Isi artikel</span>
            <MarkdownEditor value={body} onChange={setBody} rows={18} error={errFor('body')} />
            <p className="hint">Judul bagian pakai H2 (<code>## Judul</code>). Tautan ke halaman situs: <code>/en/tours/bali-essentials/</code>.</p>
          </div>
        </div>
      )}

      {tab === 'atur' && (
        <div className="space-y-5">
          <div className="card space-y-5 p-5">
            <div className="grid gap-5 sm:grid-cols-2">
              <Field label="Bahasa artikel" hint={isNew ? 'Satu artikel = satu bahasa. Untuk versi bahasa lain, buat artikel baru.' : 'Tidak bisa diganti setelah dibuat.'}>
                <select className="field" value={locale} disabled={!isNew} onChange={(e) => setLocale(e.target.value as 'en' | 'id')}><option value="en">English</option><option value="id">Indonesia</option></select>
              </Field>
              <Field label="Alamat halaman (slug)" error={errFor('slug')} hint={isNew ? 'Dibuat otomatis dari judul. Tidak bisa diganti setelah dibuat.' : 'Tidak bisa diganti setelah dibuat.'}>
                <input className="field" value={slug} disabled={!isNew} onChange={(e) => { setSlugTouched(true); setSlug(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '-')); }} />
              </Field>
              <Field label="Tanggal terbit" error={errFor('date')}><input className="field" type="date" value={fm.date ?? ''} onChange={(e) => set({ date: e.target.value })} /></Field>
              <Field label="Kategori" error={errFor('category')} hint="Destinasi, atau Tips & Panduan untuk artikel umum.">
                <select className="field" value={fm.category ?? ''} onChange={(e) => set({ category: e.target.value })}>
                  <option value="tips">Tips &amp; Panduan</option>
                  {meta?.destinations.map((d) => <option key={d.slug} value={d.slug}>{d.title}</option>)}
                  {fm.category && fm.category !== 'tips' && !meta?.destinations.some((d) => d.slug === fm.category) && <option value={fm.category}>{fm.category}</option>}
                </select>
              </Field>
            </div>
            <Field label="Tag" hint="Satu baris, pisahkan dengan koma. Contoh: bali itinerary, ubud, first time">
              <input className="field" value={fm.tags ?? ''} onChange={(e) => set({ tags: e.target.value })} />
              {tags.length > 0 && <span className="mt-2 flex flex-wrap gap-1.5">{tags.map((t) => <Chip key={t} tone="gray">{t}</Chip>)}</span>}
            </Field>
          </div>
          <div className="card p-5"><PhotoPicker image={fm.image} alt={fm.imageAlt} onImage={(v) => set({ image: v })} onAlt={(v) => set({ imageAlt: v })} /></div>
          <div className="card space-y-4 p-5">
            <Toggle checked={!!fm.postToThreads} onChange={(v) => set({ postToThreads: v })} label="Posting ke Threads saat terbit" hint={fm.threadsPostedAt ? `Sudah diposting (${String(fm.threadsPostedAt).slice(0, 10)}). Matikan lalu nyalakan lagi tidak memposting ulang.` : 'Setelah situs selesai diperbarui, bot memposting satu kali.'} />
            {fm.postToThreads && <Field label="Teks posting (opsional)" hint="Kosong = judul + deskripsi + tautan artikel."><textarea className="field" rows={3} value={fm.threadsText ?? ''} onChange={(e) => set({ threadsText: e.target.value })} /></Field>}
          </div>
        </div>
      )}

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
            if (!confirm(`Hapus artikel "${fm.title}"?`)) return;
            saveDraft({ kind: 'story', slug: draftKey, fm: null, body: '', baseSha: orig!.sha, updatedAt: Date.now() });
            toast('Ditandai untuk dihapus. Terhapus saat dipublikasikan.'); nav('/cerita');
          }}>Hapus</button>}
          {dirty && orig && <button className="btn-ghost" onClick={() => { if (confirm('Buang semua perubahan artikel ini?')) { dropDraft('story', draftKey); setFm(orig.fm); setBody(orig.body); } }}>Buang</button>}
          <button className="btn-primary flex-1 sm:flex-none" disabled={!dirty || !!issues.length}
            onClick={() => { if (isNew) { saveDraft({ kind: 'story', slug: draftKey, fm, body, baseSha: null, updatedAt: Date.now() }); nav(`/cerita/${draftKey}`, { replace: true }); } reloadMeta(); openPublish(); }}>Publikasikan…</button>
        </div>
      </div>
    </div>
  );
}
