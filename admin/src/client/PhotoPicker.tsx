import { useRef, useState } from 'react';
import { Field } from './ui';
import { useApp } from './App';
import { useDrafts } from './drafts';
import { useImageSrc } from './imageStore';
import { addPhoto } from './upload';

const PREFIX = '/src/assets/images/';

/** Pilih foto yang sudah ada di repo atau unggah foto baru (dikompres otomatis di browser) + deskripsi (alt text). */
export function PhotoPicker({ image, alt, onImage, onAlt, altHint, label = 'Foto utama' }: { image?: string; alt?: string; onImage: (v: string | undefined) => void; onAlt?: (v: string) => void; altHint?: string; label?: string }) {
  const { meta, toast } = useApp();
  const drafts = useDrafts();
  const file = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const name = image ? String(image).split('/').pop()! : '';
  const src = useImageSrc(name || undefined);
  const pending = drafts.filter((d) => d.kind === 'image').map((d) => d.slug);
  const all = [...new Set([...(meta?.images ?? []), ...pending])].sort();

  async function upload(f?: File) {
    if (!f) return;
    setBusy(true);
    try { onImage(PREFIX + (await addPhoto(f, all))); toast('Foto siap. Akan diunggah saat kamu menekan Publikasikan.'); }
    catch (e) { toast((e as Error).message, 'bad'); }
    finally { setBusy(false); if (file.current) file.current.value = ''; }
  }
  return (
    <div>
      <span className="label">{label}</span>
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start">
        <div className="aspect-[4/3] w-full shrink-0 overflow-hidden rounded-lg bg-canvas sm:w-56">
          {name ? <img src={src} alt="" className="h-full w-full object-cover" /> : <div className="grid h-full place-items-center text-sm text-muted">Belum ada foto</div>}
        </div>
        <div className="flex-1 space-y-4">
          <select className="field" value={name} onChange={(e) => onImage(e.target.value ? PREFIX + e.target.value : undefined)} aria-label="Pilih foto">
            <option value="">Tanpa foto (tampil kotak placeholder)</option>
            {name && meta && !all.includes(name) && <option value={name}>{name} (tidak ditemukan)</option>}
            {all.map((n) => <option key={n} value={n}>{n}{pending.includes(n) ? ' (baru, belum dipublikasikan)' : ''}</option>)}
          </select>
          <div>
            <input ref={file} type="file" accept="image/*" hidden onChange={(e) => upload(e.target.files?.[0])} />
            <button type="button" className="btn-ghost" disabled={busy} onClick={() => file.current?.click()}>{busy ? 'Mengompres…' : '⬆ Unggah foto baru'}</button>
            <span className="hint ml-2 inline">Otomatis dikecilkan (maks 2000 px) dan dijadikan WebP.</span>
          </div>
          {onAlt && <Field label="Deskripsi foto (alt text)" hint={altHint ?? 'Satu kalimat yang menggambarkan foto, untuk pembaca layar dan SEO.'}><input className="field" value={alt ?? ''} onChange={(e) => onAlt(e.target.value)} /></Field>}
        </div>
      </div>
    </div>
  );
}
