import { useRef, useState } from 'react';
import { useApp } from '../App';
import { useDrafts } from '../drafts';
import { removeImage, useImageSrc } from '../imageStore';
import { addPhoto } from '../upload';
import { fmtBytes } from '../image';

function Thumb({ name }: { name: string }) {
  const src = useImageSrc(name);
  return <img src={src} alt="" loading="lazy" className="aspect-[4/3] w-full rounded-t-lg bg-canvas object-cover" />;
}

export function Gallery() {
  const { meta, toast } = useApp();
  const drafts = useDrafts();
  const pending = drafts.filter((d) => d.kind === 'image');
  const file = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const [q, setQ] = useState('');
  const [over, setOver] = useState(false);

  async function upload(files: FileList | File[]) {
    setBusy(true);
    const names = new Set([...(meta?.images ?? []), ...pending.map((p) => p.slug)]);
    let ok = 0;
    for (const f of Array.from(files)) {
      try { const n = await addPhoto(f, [...names]); names.add(n); ok++; } catch (e) { toast((e as Error).message, 'bad'); }
    }
    if (ok) toast(`${ok} foto siap diunggah. Tekan Publikasikan untuk memasukkannya ke situs.`);
    setBusy(false); if (file.current) file.current.value = '';
  }
  const existing = (meta?.images ?? []).filter((n) => n.toLowerCase().includes(q.toLowerCase()));

  return (
    <div>
      <h1 className="text-2xl font-semibold">Gambar</h1>
      <p className="mt-1 text-sm text-muted">Foto diperkecil dan dikompres otomatis di browser sebelum diunggah (maks 2000 px, WebP). Foto baru masuk ke situs bersama perubahan lain dalam satu commit.</p>

      <div className={`mt-5 rounded-xl border-2 border-dashed p-6 text-center transition ${over ? 'border-brand bg-brand-soft' : 'border-line bg-panel'}`}
        onDragOver={(e) => { e.preventDefault(); setOver(true); }} onDragLeave={() => setOver(false)}
        onDrop={(e) => { e.preventDefault(); setOver(false); upload(e.dataTransfer.files); }}>
        <input ref={file} type="file" accept="image/*" multiple hidden onChange={(e) => e.target.files && upload(e.target.files)} />
        <button className="btn-primary" disabled={busy} onClick={() => file.current?.click()}>{busy ? 'Mengompres…' : '⬆ Pilih foto'}</button>
        <p className="mt-2 text-sm text-muted">atau seret foto ke sini (boleh banyak sekaligus)</p>
      </div>

      {pending.length > 0 && (
        <section className="mt-6">
          <h2 className="font-semibold">Menunggu dipublikasikan ({pending.length})</h2>
          <div className="mt-3 grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-4">
            {pending.map((p) => p.kind === 'image' && (
              <figure key={p.slug} className="card overflow-hidden !p-0">
                <Thumb name={p.slug} />
                <figcaption className="space-y-1 p-3 text-xs">
                  <div className="truncate font-mono text-[13px]">{p.slug}</div>
                  <div className="text-muted">{p.w}×{p.h} px · {fmtBytes(p.bytes)} <span className="text-ok">(asli {fmtBytes(p.origBytes)})</span></div>
                  {p.w < 1200 && <div className="text-warn">Lebar di bawah 1200 px, bisa terlihat buram.</div>}
                  <button className="text-bad underline" onClick={() => confirm(`Buang foto "${p.slug}"?`) && removeImage(p.slug)}>Buang</button>
                </figcaption>
              </figure>
            ))}
          </div>
        </section>
      )}

      <section className="mt-8">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 className="font-semibold">Foto di situs ({meta?.images.length ?? '…'})</h2>
          <input className="field !w-full sm:!w-64" placeholder="Cari nama foto…" value={q} onChange={(e) => setQ(e.target.value)} aria-label="Cari foto" />
        </div>
        <div className="mt-3 grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-4">
          {existing.map((n) => (
            <figure key={n} className="card overflow-hidden !p-0">
              <Thumb name={n} />
              <figcaption className="truncate p-3 font-mono text-[13px]" title={n}>{n}</figcaption>
            </figure>
          ))}
        </div>
        {meta && !existing.length && <p className="mt-4 text-sm text-muted">Tidak ada foto yang cocok.</p>}
      </section>
    </div>
  );
}
