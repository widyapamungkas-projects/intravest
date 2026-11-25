import { useEffect, useMemo, useState } from 'react';
import { Link } from 'wouter';
import { api } from '../api';
import { Chip } from '../ui';
import { useApp } from '../App';
import { useDrafts } from '../drafts';

type Dest = { slug: string; title: string; tagline: string; order: number; image?: string; needsReview: boolean; missingLocale: string[]; tours: number };
type Filter = 'semua' | 'perlu-dicek' | 'belum-terjemah' | 'perubahan';

export function Destinations() {
  const { toast } = useApp();
  const drafts = useDrafts().filter((d) => d.kind === 'destination');
  const [items, setItems] = useState<Dest[] | null>(null);
  const [q, setQ] = useState('');
  const [filter, setFilter] = useState<Filter>('semua');
  useEffect(() => { api('/destinations').then((r) => setItems(r.destinations)).catch((e) => toast(e.message, 'bad')); }, [toast]);

  const all = useMemo(() => {
    const have = new Set((items ?? []).map((d) => d.slug));
    const fresh: Dest[] = drafts.filter((d) => d.kind === 'destination' && !have.has(d.slug) && d.data).map((d) => ({
      slug: d.slug, title: (d as any).data.en?.title || (d as any).data.id?.title || d.slug, tagline: (d as any).data.en?.tagline || '', order: (d as any).data.order ?? 99, image: (d as any).data.image, needsReview: false, missingLocale: [], tours: 0,
    }));
    return [...(items ?? []), ...fresh];
  }, [items, drafts]);

  const draftOf = (slug: string) => drafts.find((d) => d.slug === slug);
  const shown = all.filter((d) => {
    if (q && !`${d.title} ${d.slug} ${d.tagline}`.toLowerCase().includes(q.toLowerCase())) return false;
    if (filter === 'perlu-dicek') return d.needsReview;
    if (filter === 'belum-terjemah') return d.missingLocale.length > 0;
    if (filter === 'perubahan') return !!draftOf(d.slug);
    return true;
  });
  const filters: [Filter, string][] = [['semua', 'Semua'], ['perlu-dicek', 'Perlu dicek'], ['belum-terjemah', 'Belum diterjemah'], ['perubahan', 'Ada perubahan']];

  return (
    <div>
      <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
        <div><h1 className="text-2xl font-semibold">Destinasi</h1><p className="text-sm text-muted">{items ? `${all.length} destinasi` : 'Memuat…'}</p></div>
        <Link href="/destinasi/baru" className="btn-primary">+ Destinasi baru</Link>
      </div>
      <div className="mb-4 space-y-3">
        <input className="field" type="search" placeholder="Cari destinasi…" value={q} onChange={(e) => setQ(e.target.value)} aria-label="Cari destinasi" />
        <div className="-mx-1 flex gap-2 overflow-x-auto px-1 pb-1">
          {filters.map(([k, l]) => <button key={k} onClick={() => setFilter(k)} className={`shrink-0 rounded-full border px-3.5 text-sm ${filter === k ? 'border-brand bg-brand-soft text-brand-ink' : 'border-line bg-panel text-muted'}`} style={{ minHeight: 40 }}>{l}</button>)}
        </div>
      </div>
      <div className="space-y-3">
        {shown.map((d) => {
          const dr = draftOf(d.slug);
          const del = dr?.kind === 'destination' && dr.data === null;
          return (
            <Link key={d.slug} href={`/destinasi/${d.slug}`} className={`card flex items-center gap-4 p-3 transition hover:border-brand/40 hover:shadow-sm ${del ? 'opacity-60' : ''}`}>
              <div className="h-16 w-20 shrink-0 overflow-hidden rounded-lg bg-canvas">{d.image && <img src={`/api/image/${d.image.split('/').pop()}`} alt="" loading="lazy" className="h-full w-full object-cover" />}</div>
              <div className="min-w-0 flex-1">
                <div className="truncate font-medium">{d.title}</div>
                <div className="truncate text-sm text-muted">{d.tagline || '—'} · {d.tours} paket</div>
                <div className="mt-1.5 flex flex-wrap gap-1.5">
                  {del ? <Chip tone="bad">Akan dihapus</Chip> : dr && <Chip tone="brand">{dr.baseSha ? 'Perubahan belum dipublikasikan' : 'Baru, belum dipublikasikan'}</Chip>}
                  {d.needsReview && <Chip tone="warn">Perlu dicek</Chip>}
                  {d.missingLocale.length > 0 && <Chip tone="gray">{d.missingLocale.map((l) => l.toUpperCase()).join(', ')} kosong</Chip>}
                  {!dr && !d.needsReview && !d.missingLocale.length && <Chip tone="ok">Siap tayang</Chip>}
                </div>
              </div>
              <span className="text-muted" aria-hidden>›</span>
            </Link>
          );
        })}
        {items && !shown.length && <div className="card p-8 text-center text-muted">Tidak ada destinasi yang cocok.</div>}
      </div>
    </div>
  );
}
