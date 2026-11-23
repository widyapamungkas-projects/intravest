import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Link, useLocation } from 'wouter';
import { api, ApiError, rupiah } from '../api';
import { cleanTour, validateTour, SLUG_RE, type Issue } from '../../shared/tour';
import { Chip, Field, LinesField, Toggle } from '../ui';
import { Itinerary, type Day } from './Itinerary';
import { useApp } from '../App';
import { dropDraft, getDraft, saveDraft } from '../drafts';

type Data = Record<string, any>;
type Tab = 'umum' | 'en' | 'id' | 'harga';
const TABS: { id: Tab; label: string }[] = [{ id: 'umum', label: 'Umum' }, { id: 'en', label: 'English' }, { id: 'id', label: 'Indonesia' }, { id: 'harga', label: 'Harga' }];
const blankDay = (): Day => ({ title: '', plan: [], meals: '' });
const IMG_PREFIX = '/src/assets/images/';
const same = (a: unknown, b: unknown) => JSON.stringify(a) === JSON.stringify(b);

function tabOf(path: (string | number)[]): Tab {
  if (path[0] === 'en') return 'en';
  if (path[0] === 'id') return 'id';
  if (['pricing', 'priceIDR', 'priceIsDraft'].includes(String(path[0]))) return 'harga';
  return 'umum';
}

export function TourEditor({ slug: slugProp }: { slug: string | null }) {
  const { toast, meta, openPublish } = useApp();
  const [, nav] = useLocation();
  const isNew = slugProp === null;
  const [slug, setSlug] = useState(slugProp ?? '');
  const [data, setData] = useState<Data | null>(null);
  const [orig, setOrig] = useState<{ data: Data; sha: string; csv: { text: string; sha: string } | null } | null>(null);
  const [tab, setTab] = useState<Tab>('umum');
  const [loadErr, setLoadErr] = useState('');
  const loaded = useRef(false);

  // --- muat: draf lokal lebih dulu, kalau ada; kalau tidak, versi di repo ---
  useEffect(() => {
    loaded.current = false; setData(null); setLoadErr(''); setTab('umum');
    if (isNew) {
      const nextOrder = 1;
      setOrig(null);
      setData({ code: '', destination: meta?.destinations[0]?.slug ?? '', days: 1, nights: 0, order: nextOrder, priceIsDraft: true, minPax: 2, en: { itinerary: [blankDay()] }, id: {} });
      loaded.current = true;
      return;
    }
    api(`/tours/${slugProp}`).then((r) => {
      setOrig({ data: r.data, sha: r.sha, csv: r.csv });
      const d = getDraft('tour', slugProp!);
      setData(d?.data ?? r.data); loaded.current = true;
    }).catch((e: ApiError) => {
      const d = getDraft('tour', slugProp!);
      if (e.status === 404 && d) { setData(d.data); loaded.current = true; } else setLoadErr(e.message);
    });
  }, [slugProp, isNew]); // eslint-disable-line react-hooks/exhaustive-deps

  // --- simpan otomatis ke draf lokal (bukan ke repo) ---
  useEffect(() => {
    if (!data || !loaded.current) return;
    const key = isNew ? slug : slugProp!;
    if (!key || !SLUG_RE.test(key)) return;
    if (orig && same(data, orig.data)) { dropDraft('tour', key); return; }
    saveDraft({ kind: 'tour', slug: key, data, baseSha: orig?.sha ?? null, updatedAt: Date.now() });
  }, [data, slug]); // eslint-disable-line react-hooks/exhaustive-deps

  const set = useCallback((patch: Data) => setData((d) => ({ ...d, ...patch })), []);
  const setLoc = useCallback((l: 'en' | 'id', patch: Data) => setData((d) => ({ ...d, [l]: { ...(d?.[l] ?? {}), ...patch } })), []);

  // --- itinerary: tambah/hapus/geser berlaku di kedua bahasa yang sudah terisi dan berpasangan ---
  const hasTitle = (d: Data, l: 'en' | 'id') => !!d[l]?.title?.trim();
  const editItin = useCallback((l: 'en' | 'id', fn: (a: Day[], isSelf: boolean) => Day[]) => {
    setData((d) => {
      if (!d) return d;
      const mine: Day[] = d[l]?.itinerary ?? [];
      const nextMine = fn(mine, true);
      const o = l === 'en' ? 'id' : 'en';
      const other: Day[] = d[o]?.itinerary ?? [];
      const out: Data = { ...d, [l]: { ...d[l], itinerary: nextMine } };
      if (hasTitle(d, o) && other.length === mine.length) {
        out[o] = { ...d[o], itinerary: fn(other, false) };
      }
      const oldDays = d.days;
      out.days = nextMine.length;
      if (d.nights === oldDays - 1) out.nights = Math.max(0, nextMine.length - 1);
      return out;
    });
  }, []);

  const clean = useMemo(() => (data ? cleanTour({ ...data, slug: slug || 'x' }) : null), [data, slug]);
  const issues: Issue[] = useMemo(() => {
    if (!clean) return [];
    const v = validateTour(clean);
    const out = v.ok ? [] : [...v.issues];
    if (isNew && !SLUG_RE.test(slug)) out.unshift({ path: ['slug'], message: 'Alamat (slug) wajib: huruf kecil, angka, dan tanda hubung.' });
    return out;
  }, [clean, slug, isNew]);
  const byTab = (t: Tab) => issues.filter((i) => tabOf(i.path).valueOf() === t);
  const errFor = (...p: (string | number)[]) => issues.find((i) => i.path.join('.') === p.join('.'))?.message;

  if (loadErr) return <div className="card p-8 text-center"><p className="text-bad">{loadErr}</p><Link href="/paket" className="btn-ghost mt-4">← Kembali</Link></div>;
  if (!data) return <div className="text-muted">Memuat…</div>;

  const title = data.en?.title || data.id?.title || (isNew ? 'Paket baru' : slugProp);
  const dirty = !orig || !same(data, orig.data);

  return (
    <div>
      <div className="mb-4 flex items-center gap-3">
        <Link href="/paket" className="btn-ghost !px-3" aria-label="Kembali ke daftar">←</Link>
        <div className="min-w-0 flex-1">
          <h1 className="truncate text-xl font-semibold md:text-2xl">{title}</h1>
          <div className="mt-0.5 flex flex-wrap items-center gap-2 text-sm text-muted">
            <span>{data.code || 'kode belum diisi'}</span>
            {dirty ? <Chip tone="brand">Perubahan tersimpan di browser, belum dipublikasikan</Chip> : <Chip tone="ok">Sama dengan yang tayang</Chip>}
          </div>
        </div>
      </div>

      <div className="-mx-4 mb-5 overflow-x-auto border-b border-line px-4 md:mx-0 md:px-0" role="tablist">
        <div className="flex min-w-max gap-1">
          {TABS.map((t) => {
            const n = byTab(t.id).length;
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
            <Field label="Alamat halaman (slug)" error={errFor('slug')} hint={isNew ? 'Huruf kecil dan tanda hubung, contoh: bali-sunrise. Tidak bisa diganti setelah dibuat.' : 'Tidak bisa diganti setelah dibuat.'}>
              <input className="field" value={slug} disabled={!isNew} onChange={(e) => setSlug(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '-'))} placeholder="bali-sunrise" />
            </Field>
            <Field label="Kode paket" error={errFor('code')}><input className="field" value={data.code ?? ''} onChange={(e) => set({ code: e.target.value })} placeholder="BAL-04" /></Field>
            <Field label="Destinasi" error={errFor('destination')}>
              <select className="field" value={data.destination ?? ''} onChange={(e) => set({ destination: e.target.value })}>
                {!meta?.destinations.some((d) => d.slug === data.destination) && <option value={data.destination}>{data.destination || 'Pilih…'}</option>}
                {meta?.destinations.map((d) => <option key={d.slug} value={d.slug}>{d.title}</option>)}
              </select>
            </Field>
            <Field label="Urutan tampil" hint="Angka kecil tampil lebih dulu."><input className="field" type="number" min={1} value={data.order ?? 1} onChange={(e) => set({ order: Number(e.target.value) })} /></Field>
            <Field label="Jumlah hari" hint="Mengikuti banyaknya blok hari di itinerary."><input className="field" value={data.days} disabled /></Field>
            <Field label="Jumlah malam"><input className="field" type="number" min={0} value={data.nights ?? 0} onChange={(e) => set({ nights: Number(e.target.value) })} /></Field>
            <Field label="Minimal peserta"><input className="field" type="number" min={1} value={data.minPax ?? 2} onChange={(e) => set({ minPax: Number(e.target.value) })} /></Field>
          </div>
          <div>
            <span className="label">Foto utama</span>
            <div className="flex flex-col gap-4 sm:flex-row sm:items-start">
              <div className="aspect-[4/3] w-full shrink-0 overflow-hidden rounded-lg bg-canvas sm:w-56">
                {data.image ? <img src={`/api/image/${String(data.image).split('/').pop()}`} alt="" className="h-full w-full object-cover" /> : <div className="grid h-full place-items-center text-sm text-muted">Belum ada foto</div>}
              </div>
              <div className="flex-1">
                <select className="field" value={data.image ? String(data.image).split('/').pop() : ''} onChange={(e) => set({ image: e.target.value ? IMG_PREFIX + e.target.value : undefined })}>
                  <option value="">Tanpa foto (tampil kotak placeholder)</option>
                  {meta?.images.map((n) => <option key={n} value={n}>{n}</option>)}
                </select>
                <p className="hint">Memilih dari foto yang sudah ada di repo. Unggah foto baru: tahap berikutnya.</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {(tab === 'en' || tab === 'id') && <LocaleTab key={tab} l={tab} data={data} setLoc={setLoc} editItin={editItin} errFor={errFor} />}

      {tab === 'harga' && (
        <div className="space-y-4">
          <div className="card space-y-5 p-5">
            <Toggle checked={!!data.priceIsDraft} onChange={(v) => set({ priceIsDraft: v })} label="Harga masih draf" hint="Halaman paket menandai harga sebagai indikatif sampai ini dimatikan." />
            <Field label="Harga per orang (IDR)" error={errFor('priceIDR')} hint="Dipakai kalau paket tidak punya tabel harga. Kalau tabel harga ada, harga 'mulai dari' diambil dari tabel.">
              <input className="field" inputMode="numeric" value={data.priceIDR ?? ''} placeholder="4900000" onChange={(e) => { const n = e.target.value.replace(/\D/g, ''); set({ priceIDR: n ? Number(n) : undefined }); }} />
              {data.priceIDR ? <span className="hint block">{rupiah(data.priceIDR)}</span> : null}
            </Field>
          </div>
          <PricingReadOnly data={data} csv={orig?.csv ?? null} />
        </div>
      )}

      {issues.length > 0 && (
        <div className="card mt-5 border-bad/30 bg-bad/5 p-4 text-sm" role="status">
          <div className="font-medium text-bad">Yang perlu dilengkapi sebelum bisa dipublikasikan ({issues.length}):</div>
          <ul className="mt-2 space-y-1">
            {issues.slice(0, 12).map((i, k) => (
              <li key={k}><button className="text-left underline decoration-bad/40 underline-offset-2" onClick={() => setTab(tabOf(i.path))}>{i.message}</button> <span className="text-muted">({TABS.find((t) => t.id === tabOf(i.path))!.label})</span></li>
            ))}
          </ul>
        </div>
      )}

      <div className="fixed inset-x-0 bottom-0 z-20 border-t border-line bg-panel/95 px-4 py-3 backdrop-blur md:sticky md:mt-6 md:rounded-xl md:border md:px-5">
        <div className="mx-auto flex max-w-5xl items-center gap-3">
          <div className="hidden min-w-0 flex-1 text-sm text-muted sm:block">{dirty ? 'Tersimpan otomatis di browser ini. Belum masuk ke situs.' : 'Tidak ada perubahan.'}</div>
          {dirty && orig && <button className="btn-ghost" onClick={() => { if (confirm('Buang semua perubahan paket ini?')) { dropDraft('tour', slugProp!); setData(orig.data); } }}>Buang</button>}
          <button className="btn-primary flex-1 sm:flex-none" disabled={!dirty || !!issues.length}
            onClick={() => {
              if (isNew) { saveDraft({ kind: 'tour', slug, data, baseSha: null, updatedAt: Date.now() }); nav(`/paket/${slug}`, { replace: true }); }
              openPublish();
            }}>Publikasikan…</button>
        </div>
      </div>
    </div>
  );
}

function LocaleTab({ l, data, setLoc, editItin, errFor }: { l: 'en' | 'id'; data: Data; setLoc: (l: 'en' | 'id', p: Data) => void; editItin: (l: 'en' | 'id', fn: (a: Day[], self: boolean) => Day[]) => void; errFor: (...p: (string | number)[]) => string | undefined }) {
  const x = data[l] ?? {};
  const L = l === 'en' ? 'English' : 'Indonesia';
  const other = l === 'en' ? 'id' : 'en';
  const empty = !x.title?.trim();
  const itin: Day[] = x.itinerary ?? [];
  return (
    <div className="space-y-5">
      {empty && (
        <div className="rounded-lg border border-warn/40 bg-warn/10 p-3 text-sm">
          Bagian {L} masih kosong. Kalau dibiarkan kosong, halaman {L} sementara memakai teks {other === 'en' ? 'English' : 'Indonesia'} dan terjemahan otomatis (kalau sudah dipasang) akan mengisinya setelah publikasi. Mulai mengetik judul untuk mengisinya sendiri.
        </div>
      )}
      <div className="card space-y-5 p-5">
        <Field label={`Judul paket (${L})`} error={errFor(l, 'title')}><input className="field" value={x.title ?? ''} onChange={(e) => setLoc(l, { title: e.target.value })} /></Field>
        <Field label="Ringkasan" error={errFor(l, 'summary')} hint={<span className={(x.summary?.length ?? 0) > 160 ? 'text-bad' : ''}>{x.summary?.length ?? 0}/160 karakter · tampil di kartu dan hasil Google</span>}>
          <textarea className="field" rows={3} value={x.summary ?? ''} onChange={(e) => setLoc(l, { summary: e.target.value })} />
        </Field>
        <div className="grid gap-5 sm:grid-cols-2">
          <Field label="Catatan harga" hint="Contoh: Per orang, dengan asumsi 2 peserta sekamar."><textarea className="field" rows={2} value={x.priceNote ?? ''} onChange={(e) => setLoc(l, { priceNote: e.target.value })} /></Field>
          <Field label="Tanggal musim ramai" hint="Contoh: 15 Jul–31 Agu dan 20 Des–5 Jan. Tampil di bawah tabel harga."><textarea className="field" rows={2} value={x.highSeasonNote ?? ''} onChange={(e) => setLoc(l, { highSeasonNote: e.target.value })} /></Field>
        </div>
        <Field label="Deskripsi foto (alt text)" hint="Satu kalimat yang menggambarkan foto, untuk pembaca layar dan SEO."><input className="field" value={x.imageAlt ?? ''} onChange={(e) => setLoc(l, { imageAlt: e.target.value })} /></Field>
      </div>

      <div className="card p-5">
        <h2 className="mb-1 text-base font-semibold">Itinerary</h2>
        <p className="hint mb-4 mt-0">Tambah, hapus, dan urutan hari berlaku untuk English dan Indonesia sekaligus (kalau keduanya sudah terisi), supaya jumlah harinya selalu sama.</p>
        <Itinerary days={itin} errors={[errFor(l, 'itinerary')].filter(Boolean) as string[]}
          onEditDay={(i, p) => editItin(l, (a, self) => (self ? a.map((d, k) => (k === i ? { ...d, ...p } : d)) : a))}
          onMove={(from, to) => editItin(l, (a) => { const c = [...a]; const [m] = c.splice(from, 1); c.splice(to, 0, m); return c; })}
          onAdd={() => editItin(l, (a) => [...a, blankDay()])}
          onRemove={(i) => editItin(l, (a) => a.filter((_, k) => k !== i))} />
      </div>

      <div className="card space-y-5 p-5">
        <Field label="Sudah termasuk" error={errFor(l, 'inclusions')} hint="Satu baris per item. Tekan Enter untuk item berikutnya.">
          <LinesField value={x.inclusions ?? []} onChange={(v) => setLoc(l, { inclusions: v })} rows={6} />
        </Field>
        <Field label="Belum termasuk" error={errFor(l, 'exclusions')} hint="Satu baris per item.">
          <LinesField value={x.exclusions ?? []} onChange={(v) => setLoc(l, { exclusions: v })} rows={4} />
        </Field>
      </div>

      <div className="card space-y-5 p-5">
        <Field label="Cerita singkat paket" hint="Teks pengantar di halaman paket. Boleh beberapa paragraf, pisahkan dengan baris kosong."><textarea className="field" rows={7} value={x.body ?? ''} onChange={(e) => setLoc(l, { body: e.target.value })} /></Field>
        <Toggle checked={!!x.needsReview} onChange={(v) => setLoc(l, { needsReview: v })} label="Perlu dicek" hint="Nyalakan kalau teks ini hasil terjemahan otomatis dan belum dibaca orang. Matikan setelah dicek." />
      </div>
    </div>
  );
}

function PricingReadOnly({ data, csv }: { data: Data; csv: { text: string; sha: string } | null }) {
  const p = data.pricing;
  if (!p) return <div className="card p-5 text-sm text-muted">Paket ini belum punya tabel harga bertingkat. Harga memakai angka tunggal di atas.</div>;
  const rows = (csv?.text ?? '').trim().split(/\r?\n/).map((r) => r.split(','));
  return (
    <div className="card p-5">
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
        <h2 className="text-base font-semibold">Tabel harga</h2>
        <Chip tone="gray">Hanya lihat. Editor tabel menyusul di Tahap B</Chip>
      </div>
      <dl className="mb-4 grid gap-2 text-sm sm:grid-cols-3">
        <div><dt className="text-muted">Berlaku sampai</dt><dd>{p.validUntil ?? '-'}</dd></div>
        <div><dt className="text-muted">"Mulai dari" memakai</dt><dd>{p.hotels?.find((h: any) => h.id === p.leadHotel)?.name ?? p.leadHotel} · tier {p.leadTier}</dd></div>
        <div><dt className="text-muted">Hotel</dt><dd>{p.hotels?.length ?? 0}</dd></div>
      </dl>
      <div className="-mx-5 overflow-x-auto px-5">
        <table className="w-full min-w-[640px] text-sm tabular-nums">
          <thead><tr className="border-b border-line text-left text-muted">{(rows[0] ?? []).map((h) => <th key={h} className="px-2 py-2 font-medium">{h}</th>)}</tr></thead>
          <tbody>{rows.slice(1).map((r, i) => <tr key={i} className="border-b border-line/60">{r.map((c, k) => <td key={k} className="px-2 py-1.5">{k > 1 ? Number(c).toLocaleString('id-ID') : c}</td>)}</tr>)}</tbody>
        </table>
      </div>
    </div>
  );
}
