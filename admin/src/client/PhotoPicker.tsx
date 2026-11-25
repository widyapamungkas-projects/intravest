import { Field } from './ui';
import { useApp } from './App';

const PREFIX = '/src/assets/images/';

/** Foto utama dari foto yang sudah ada di repo + deskripsi (alt text). Unggah foto baru ada di tahap berikutnya. */
export function PhotoPicker({ image, alt, onImage, onAlt, altHint }: { image?: string; alt?: string; onImage: (v: string | undefined) => void; onAlt?: (v: string) => void; altHint?: string }) {
  const { meta } = useApp();
  const name = image ? String(image).split('/').pop()! : '';
  return (
    <div>
      <span className="label">Foto utama</span>
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start">
        <div className="aspect-[4/3] w-full shrink-0 overflow-hidden rounded-lg bg-canvas sm:w-56">
          {name ? <img src={`/api/image/${name}`} alt="" className="h-full w-full object-cover" /> : <div className="grid h-full place-items-center text-sm text-muted">Belum ada foto</div>}
        </div>
        <div className="flex-1 space-y-4">
          <select className="field" value={name} onChange={(e) => onImage(e.target.value ? PREFIX + e.target.value : undefined)} aria-label="Pilih foto">
            <option value="">Tanpa foto (tampil kotak placeholder)</option>
            {name && !meta?.images.includes(name) && <option value={name}>{name} (tidak ditemukan)</option>}
            {meta?.images.map((n) => <option key={n} value={n}>{n}</option>)}
          </select>
          {onAlt && <Field label="Deskripsi foto (alt text)" hint={altHint ?? 'Satu kalimat yang menggambarkan foto, untuk pembaca layar dan SEO.'}><input className="field" value={alt ?? ''} onChange={(e) => onAlt(e.target.value)} /></Field>}
        </div>
      </div>
    </div>
  );
}
