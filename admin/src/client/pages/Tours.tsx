import { useEffect, useMemo, useState } from 'react';
import { Link } from 'wouter';
import { api, rupiah } from '../api';
import { Chip } from '../ui';
import { useApp } from '../App';
import { getDraft } from '../drafts';

type Tour = { slug: string; code: string; title: string; destination: string; days: number; nights: number; order: number; priceIDR?: number; priceIsDraft: boolean; hasPricing: boolean; needsReview: boolean; missingLocale: string[]; image?: string };
type Filter = 'semua' | 'draf-harga' | 'perlu-dicek' | 'belum-terjemah' | 'perubahan';

export function Tours() {
  const { toast, meta } = useApp();
  const [tours, setTours] = useState<Tour[] | null>(null);
  const [q, setQ] = useState('');
  const [filter, setFilter] = useState<Filter>('semua');

  useEffect(() => { api('/tours').then((r) => setTours(r.tours)).catch((e) => toast(e.message, 'bad')); }, [toast]);

  const shown = useMemo(() => (tours ?? []).filter((t) => {
    const hay = `${t.title} ${t.code} ${t.slug} ${t.destination}`.toLowerCase();
    if (q && !hay.includes(q.toLowerCase())) return false;
    if (filter === 'draf-harga') return t.priceIsDraft;
    if (filter === 'perlu-dicek') return t.needsReview;
    if (filter === 'belum-terjemah') return t.missingLocale.length > 0;
    if (filter === 'perubahan') return !!getDraft('tour', t.slug);
    return true;
  }), [tours, q, filter]);

  const destName = (s: string) => meta?.destinations.find((d) => d.slug === s)?.title ?? s;
  const filters: [Filter, string][] = [['semua', 'Semua'], ['draf-harga', 'Harga draf'], ['perlu-dicek', 'Perlu dicek'], ['belum-terjemah', 'Belum diterjemah'], ['perubahan', 'Ada perubahan']];

  return (
    <div>
      <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
        <div><h1 className="text-2xl font-semibold">Paket Wisata</h1><p className="text-sm text-muted">{tours ? `${tours.length} paket` : 'Memuat…'}</p></div>
        <Link href="/paket/baru" className="btn-primary">+ Paket baru</Link>
      </div>
      <div className="mb-4 space-y-3">
        <input className="field" type="search" placeholder="Cari nama, kode, atau destinasi…" value={q} onChange={(e) => setQ(e.target.value)} aria-label="Cari paket" />
        <div className="-mx-1 flex gap-2 overflow-x-auto px-1 pb-1">
          {filters.map(([k, l]) => (
            <button key={k} onClick={() => setFilter(k)} className={`shrink-0 rounded-full border px-3.5 text-sm ${filter === k ? 'border-brand bg-brand-soft text-brand-ink' : 'border-line bg-panel text-muted'}`} style={{ minHeight: 40 }}>{l}</button>
          ))}
        </div>
      </div>
      <div className="space-y-3">
        {shown.map((t) => (
          <Link key={t.slug} href={`/paket/${t.slug}`} className="card flex items-center gap-4 p-3 transition hover:border-brand/40 hover:shadow-sm">
            <div className="h-16 w-20 shrink-0 overflow-hidden rounded-lg bg-canvas">
              {t.image && <img src={`/api/image/${t.image.split('/').pop()}`} alt="" loading="lazy" className="h-full w-full object-cover" />}
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
                <span className="truncate font-medium">{t.title}</span>
                <span className="text-xs text-muted">{t.code}</span>
              </div>
              <div className="mt-0.5 text-sm text-muted">{destName(t.destination)} · {t.days} hari {t.nights} malam · {t.hasPricing ? 'tabel harga' : rupiah(t.priceIDR)}</div>
              <div className="mt-1.5 flex flex-wrap gap-1.5">
                {getDraft('tour', t.slug) && <Chip tone="brand">Perubahan belum dipublikasikan</Chip>}
                {t.priceIsDraft && <Chip tone="warn">Harga draf</Chip>}
                {t.needsReview && <Chip tone="warn">Perlu dicek</Chip>}
                {t.missingLocale.length > 0 && <Chip tone="gray">{t.missingLocale.map((l) => l.toUpperCase()).join(', ')} kosong</Chip>}
                {!t.priceIsDraft && !t.needsReview && !t.missingLocale.length && <Chip tone="ok">Siap tayang</Chip>}
              </div>
            </div>
            <span className="text-muted" aria-hidden>›</span>
          </Link>
        ))}
        {tours && !shown.length && <div className="card p-8 text-center text-muted">Tidak ada paket yang cocok.</div>}
      </div>
    </div>
  );
}
