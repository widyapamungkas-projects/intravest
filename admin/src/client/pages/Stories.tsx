import { useEffect, useMemo, useState } from 'react';
import { Link } from 'wouter';
import { api } from '../api';
import { Chip } from '../ui';
import { useApp } from '../App';
import { useDrafts } from '../drafts';

type Story = { locale: 'en' | 'id'; slug: string; title: string; date: string; category: string; tags: string; image?: string; threads: 'tidak' | 'menunggu' | 'terkirim' };
type Filter = 'semua' | 'en' | 'id' | 'threads' | 'perubahan';

export function Stories() {
  const { toast, meta } = useApp();
  const drafts = useDrafts().filter((d) => d.kind === 'story');
  const [items, setItems] = useState<Story[] | null>(null);
  const [q, setQ] = useState('');
  const [filter, setFilter] = useState<Filter>('semua');
  useEffect(() => { api('/stories').then((r) => setItems(r.stories)).catch((e) => toast(e.message, 'bad')); }, [toast]);

  const all = useMemo(() => {
    const have = new Set((items ?? []).map((s) => `${s.locale}/${s.slug}`));
    const fresh: Story[] = drafts.flatMap((d) => (d.kind === 'story' && d.fm && !have.has(d.slug)
      ? [{ locale: d.slug.split('/')[0] as 'en' | 'id', slug: d.slug.split('/')[1], title: d.fm.title || d.slug, date: d.fm.date ?? '', category: d.fm.category ?? '', tags: d.fm.tags ?? '', image: d.fm.image, threads: d.fm.postToThreads ? 'menunggu' as const : 'tidak' as const }] : []));
    return [...fresh, ...(items ?? [])];
  }, [items, drafts]);

  const draftOf = (s: Story) => drafts.find((d) => d.slug === `${s.locale}/${s.slug}`);
  const cat = (c: string) => (c === 'tips' ? 'Tips & Panduan' : meta?.destinations.find((d) => d.slug === c)?.title ?? c);
  const shown = all.filter((s) => {
    if (q && !`${s.title} ${s.slug} ${s.tags} ${s.category}`.toLowerCase().includes(q.toLowerCase())) return false;
    if (filter === 'en' || filter === 'id') return s.locale === filter;
    if (filter === 'threads') return s.threads !== 'tidak';
    if (filter === 'perubahan') return !!draftOf(s);
    return true;
  });
  const filters: [Filter, string][] = [['semua', 'Semua'], ['en', 'English'], ['id', 'Indonesia'], ['threads', 'Threads'], ['perubahan', 'Ada perubahan']];

  return (
    <div>
      <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
        <div><h1 className="text-2xl font-semibold">Cerita Perjalanan</h1><p className="text-sm text-muted">{items ? `${all.length} artikel` : 'Memuat…'}</p></div>
        <Link href="/cerita/baru" className="btn-primary">+ Artikel baru</Link>
      </div>
      <div className="mb-4 space-y-3">
        <input className="field" type="search" placeholder="Cari judul, tag, atau kategori…" value={q} onChange={(e) => setQ(e.target.value)} aria-label="Cari artikel" />
        <div className="-mx-1 flex gap-2 overflow-x-auto px-1 pb-1">
          {filters.map(([k, l]) => <button key={k} onClick={() => setFilter(k)} className={`shrink-0 rounded-full border px-3.5 text-sm ${filter === k ? 'border-brand bg-brand-soft text-brand-ink' : 'border-line bg-panel text-muted'}`} style={{ minHeight: 40 }}>{l}</button>)}
        </div>
      </div>
      <div className="space-y-3">
        {shown.map((s) => {
          const dr = draftOf(s);
          const del = dr?.kind === 'story' && dr.fm === null;
          return (
            <Link key={`${s.locale}/${s.slug}`} href={`/cerita/${s.locale}/${s.slug}`} className={`card flex items-center gap-4 p-3 transition hover:border-brand/40 hover:shadow-sm ${del ? 'opacity-60' : ''}`}>
              <div className="h-16 w-20 shrink-0 overflow-hidden rounded-lg bg-canvas">{s.image && <img src={`/api/image/${s.image.split('/').pop()}`} alt="" loading="lazy" className="h-full w-full object-cover" />}</div>
              <div className="min-w-0 flex-1">
                <div className="line-clamp-2 font-medium">{s.title}</div>
                <div className="mt-0.5 truncate text-sm text-muted">{s.date} · {cat(s.category)}</div>
                <div className="mt-1.5 flex flex-wrap gap-1.5">
                  <Chip tone="gray">{s.locale === 'en' ? 'English' : 'Indonesia'}</Chip>
                  {del ? <Chip tone="bad">Akan dihapus</Chip> : dr && <Chip tone="brand">{dr.baseSha ? 'Perubahan belum dipublikasikan' : 'Baru, belum dipublikasikan'}</Chip>}
                  {s.threads === 'menunggu' && <Chip tone="warn">Akan diposting ke Threads</Chip>}
                  {s.threads === 'terkirim' && <Chip tone="ok">Sudah di Threads</Chip>}
                </div>
              </div>
              <span className="text-muted" aria-hidden>›</span>
            </Link>
          );
        })}
        {items && !shown.length && <div className="card p-8 text-center text-muted">Tidak ada artikel yang cocok.</div>}
      </div>
    </div>
  );
}
