import { useRef, useState } from 'react';
import { Chip, Field, Modal } from '../ui';
import { rupiah } from '../api';
import {
  KEY_LABEL, KEY_SHORT, MAX_HOTELS, PRICE_KEYS, TIERS, blankHotelRows, fmtIDR, leadPrice, newHotelId, pasteInto, toAmount,
  type Grid, type Hotel, type PriceCheck, type PriceKey,
} from '../../shared/pricing';

export type Pricing = { validUntil?: string; leadHotel: string; leadTier: string; hotels: Hotel[] };

type Props = {
  pricing: Pricing | undefined;
  grid: Grid | null;
  check: PriceCheck | null;
  notes: string[];
  /** satu pintu untuk semua perubahan supaya pengaturan hotel dan isi tabel tidak pernah tidak sinkron */
  onChange: (pricing: Pricing | undefined, grid: Grid | null) => void;
  hadTable: boolean;
};

export function PricingEditor({ pricing, grid, check, notes, onChange, hadTable }: Props) {
  const [pasteOpen, setPasteOpen] = useState(false);
  const [msg, setMsg] = useState<{ text: string; tone: 'ok' | 'bad' } | null>(null);

  if (!pricing || !grid) {
    return (
      <div className="card p-5">
        <h2 className="text-base font-semibold">Tabel harga bertingkat</h2>
        <p className="mt-1 text-sm text-muted">Belum ada. Dengan tabel ini halaman paket menampilkan harga per hotel, per jumlah peserta, dan per tipe kamar, plus kalkulator. Tanpa tabel, situs memakai satu angka "Harga per orang" di atas.</p>
        <button className="btn-primary mt-4" onClick={() => {
          const id = 'hotel-a';
          onChange({ leadHotel: id, leadTier: '2', hotels: [{ id, name: '', highSeason: 0 }] }, { [id]: blankHotelRows() });
        }}>{hadTable ? 'Pasang kembali tabel harga' : 'Buat tabel harga'}</button>
      </div>
    );
  }

  const hotels = pricing.hotels;
  const upd = (patch: Partial<Pricing>, g: Grid = grid) => onChange({ ...pricing, ...patch }, g);
  const setHotel = (i: number, patch: Partial<Hotel>) => upd({ hotels: hotels.map((h, k) => (k === i ? { ...h, ...patch } : h)) });
  const lead = leadPrice(grid, pricing.leadHotel, pricing.leadTier);
  const leadName = hotels.find((h) => h.id === pricing.leadHotel)?.name || pricing.leadHotel;

  function addHotel() {
    const id = newHotelId('', hotels.map((h) => h.id));
    upd({ hotels: [...hotels, { id, name: '', highSeason: 0 }] }, { ...grid, [id]: blankHotelRows() });
  }
  function removeHotel(i: number) {
    const h = hotels[i];
    if (!confirm(`Hapus hotel "${h.name || h.id}" beserta semua harganya?`)) return;
    const rest = hotels.filter((_, k) => k !== i);
    const g = { ...grid }; delete g[h.id];
    upd({ hotels: rest, leadHotel: pricing!.leadHotel === h.id ? rest[0]?.id ?? '' : pricing!.leadHotel }, g);
  }
  function move(i: number, d: -1 | 1) {
    const c = [...hotels]; const j = i + d; if (j < 0 || j >= c.length) return;
    [c[i], c[j]] = [c[j], c[i]]; upd({ hotels: c });
  }
  function setCell(hid: string, tid: string, k: PriceKey, v: number | null) {
    onChange(pricing, { ...grid!, [hid]: { ...grid![hid], [tid]: { ...grid![hid][tid], [k]: v } } });
  }
  function applyPaste(text: string, at: { hotel: string; tier: number; col: number }) {
    const r = pasteInto(grid!, hotels, at, text);
    if (r.error) { setMsg({ text: r.error, tone: 'bad' }); return false; }
    onChange(pricing, r.grid);
    setMsg({ text: `${r.filled} sel terisi dari tempelan.${r.note ? ' ' + r.note : ''}`, tone: 'ok' });
    return true;
  }

  return (
    <div className="space-y-4">
      {notes.length > 0 && <div className="rounded-lg border border-warn/40 bg-warn/10 p-3 text-sm">{notes.map((n) => <div key={n}>{n}</div>)}</div>}

      <div className="card space-y-5 p-5">
        <h2 className="text-base font-semibold">Pengaturan harga</h2>
        <div className="grid gap-5 sm:grid-cols-3">
          <Field label="Harga berlaku sampai" hint="Setelah tanggal ini situs menampilkan peringatan harga kedaluwarsa.">
            <input className="field" type="date" value={pricing.validUntil ?? ''} onChange={(e) => upd({ validUntil: e.target.value || undefined })} />
          </Field>
          <Field label='Hotel untuk "Mulai dari"'>
            <select className="field" value={pricing.leadHotel} onChange={(e) => upd({ leadHotel: e.target.value })}>
              {!hotels.some((h) => h.id === pricing.leadHotel) && <option value={pricing.leadHotel}>{pricing.leadHotel || 'Pilih…'}</option>}
              {hotels.map((h) => <option key={h.id} value={h.id}>{h.name || h.id}</option>)}
            </select>
          </Field>
          <Field label='Tier untuk "Mulai dari"' hint="Jumlah peserta dewasa.">
            <select className="field" value={pricing.leadTier} onChange={(e) => upd({ leadTier: e.target.value })}>
              {TIERS.map((t) => <option key={t.id} value={t.id}>{t.label} orang</option>)}
            </select>
          </Field>
        </div>
        <div className="rounded-lg bg-brand-soft px-4 py-3 text-sm">
          Di situs tampil: <b>mulai dari {lead ? rupiah(lead) : '—'} per orang</b>
          <span className="text-muted"> · twin share, {leadName}, {pricing.leadTier} peserta</span>
        </div>
      </div>

      <div className="card p-5">
        <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
          <h2 className="text-base font-semibold">Hotel <span className="font-normal text-muted">({hotels.length}/{MAX_HOTELS})</span></h2>
          <button className="btn-ghost" onClick={addHotel} disabled={hotels.length >= MAX_HOTELS}>+ Tambah hotel</button>
        </div>
        <ul className="space-y-3">
          {hotels.map((h, i) => (
            <li key={h.id} className="rounded-lg border border-line p-3">
              <div className="grid gap-3 sm:grid-cols-[2fr_1fr_1.2fr_1.4fr]">
                <Field label="Nama hotel" error={!h.name.trim() ? 'Wajib diisi' : undefined}><input className="field" value={h.name} onChange={(e) => setHotel(i, { name: e.target.value })} placeholder="mis. Alaya Resort Ubud" /></Field>
                <Field label="Bintang">
                  <select className="field" value={h.stars ?? ''} onChange={(e) => setHotel(i, { stars: e.target.value ? Number(e.target.value) : undefined })}>
                    <option value="">–</option>{[1, 2, 3, 4, 5].map((n) => <option key={n} value={n}>{n} ★</option>)}
                  </select>
                </Field>
                <Field label="Area"><input className="field" value={h.area ?? ''} onChange={(e) => setHotel(i, { area: e.target.value || undefined })} placeholder="Ubud" /></Field>
                <Field label="Tambahan musim ramai /orang" hint={h.highSeason ? rupiah(h.highSeason) : 'Kosong = tanpa tambahan'}>
                  <input className="field" inputMode="numeric" value={h.highSeason ? fmtIDR(h.highSeason) : ''} placeholder="0" onChange={(e) => setHotel(i, { highSeason: toAmount(e.target.value) ?? 0 })} />
                </Field>
              </div>
              <div className="mt-2 flex items-center justify-between gap-2 text-xs text-muted">
                <span>id: <code>{h.id}</code></span>
                <span className="flex gap-1">
                  <button className="btn-ghost !min-h-9 !px-3" onClick={() => move(i, -1)} disabled={i === 0} aria-label="Naikkan">↑</button>
                  <button className="btn-ghost !min-h-9 !px-3" onClick={() => move(i, 1)} disabled={i === hotels.length - 1} aria-label="Turunkan">↓</button>
                  <button className="btn-danger !min-h-9 !px-3" onClick={() => removeHotel(i)} disabled={hotels.length <= 1}>Hapus</button>
                </span>
              </div>
            </li>
          ))}
        </ul>
      </div>

      <div className="card p-5">
        <div className="mb-1 flex flex-wrap items-center justify-between gap-2">
          <h2 className="text-base font-semibold">Harga per orang (IDR)</h2>
          <button className="btn-ghost" onClick={() => setPasteOpen(true)}>Tempel dari Excel / Sheets</button>
        </div>
        <p className="hint mb-3 mt-0">Ketik langsung, atau salin blok sel dari Excel/Google Sheets, klik sel tujuan, lalu tempel (Ctrl/Cmd+V). Panah atas/bawah dan Enter pindah antar baris.</p>
        {msg && <div className={`mb-3 rounded-lg px-3 py-2 text-sm ${msg.tone === 'ok' ? 'bg-ok/10 text-ok' : 'bg-bad/10 text-bad'}`} role="status">{msg.text}</div>}
        <PriceGrid hotels={hotels} grid={grid} blanks={check?.blanks ?? {}} onCell={setCell} onPaste={applyPaste} />
      </div>

      {check && (check.errors.length > 0 || check.warnings.length > 0) && (
        <div className="card space-y-2 p-4 text-sm">
          {check.errors.map((e) => <div key={e} className="text-bad">• {e}</div>)}
          {check.warnings.map((w) => <div key={w} className="text-[oklch(0.45_0.1_70)]">△ {w}</div>)}
        </div>
      )}

      <div className="card flex flex-wrap items-center justify-between gap-3 p-4 text-sm">
        <span className="text-muted">Tidak mau tabel bertingkat lagi? Situs kembali memakai satu angka "Harga per orang".</span>
        <button className="btn-danger" onClick={() => { if (confirm('Hapus seluruh tabel harga paket ini? Berkas CSV-nya ikut dihapus saat dipublikasikan.')) onChange(undefined, null); }}>Hapus tabel harga</button>
      </div>

      {pasteOpen && <PasteModal hotels={hotels} onClose={() => setPasteOpen(false)} onApply={(t, hid) => { const ok = applyPaste(t, { hotel: hid, tier: 0, col: 0 }); if (ok) setPasteOpen(false); }} />}
    </div>
  );
}

function PriceGrid({ hotels, grid, blanks, onCell, onPaste }: {
  hotels: Hotel[]; grid: Grid; blanks: Record<string, number>;
  onCell: (hid: string, tid: string, k: PriceKey, v: number | null) => void;
  onPaste: (text: string, at: { hotel: string; tier: number; col: number }) => boolean;
}) {
  const ref = useRef<HTMLTableElement>(null);
  const move = (r: number, c: number) => { (ref.current?.querySelector(`input[data-r="${r}"][data-c="${c}"]`) as HTMLInputElement | null)?.focus(); };
  return (
    <div className="-mx-5 overflow-x-auto px-5 pb-1">
      <table ref={ref} className="w-full min-w-[720px] border-separate border-spacing-0 text-sm tabular-nums"
        onPaste={(e) => {
          const el = e.target as HTMLInputElement;
          if (el.dataset.hotel === undefined) return;
          const text = e.clipboardData.getData('text');
          if (!/[\t\n]/.test(text.trim())) return; // satu angka: biarkan input menanganinya
          e.preventDefault();
          onPaste(text, { hotel: el.dataset.hotel!, tier: Number(el.dataset.tier), col: Number(el.dataset.c) });
        }}>
        <thead>
          <tr>
            <th className="sticky left-0 z-10 w-16 border-b border-line bg-panel px-2 py-2 text-left font-medium text-muted">Peserta</th>
            {PRICE_KEYS.map((k) => <th key={k} className="border-b border-line px-2 py-2 text-right font-medium text-muted" title={KEY_LABEL[k]}>{KEY_SHORT[k]}</th>)}
          </tr>
        </thead>
        {hotels.map((h, hi) => (
          <tbody key={h.id}>
            <tr>
              <th colSpan={1 + PRICE_KEYS.length} className="sticky left-0 border-b border-line bg-canvas px-2 py-2 text-left">
                <span className="font-semibold">{h.name || h.id}</span>
                {h.stars ? <span className="ml-2 text-muted">{'★'.repeat(h.stars)}</span> : null}
                {h.area ? <span className="ml-2 font-normal text-muted">{h.area}</span> : null}
                {blanks[h.id] ? <span className="ml-3"><Chip tone="warn">{blanks[h.id]} sel belum terisi</Chip></span> : null}
              </th>
            </tr>
            {TIERS.map((t, ti) => (
              <tr key={t.id}>
                <th scope="row" className="sticky left-0 z-10 border-b border-line bg-panel px-2 py-0 text-left font-medium">{t.label} org</th>
                {PRICE_KEYS.map((k, ci) => {
                  const v = grid[h.id]?.[t.id]?.[k] ?? null;
                  return (
                    <td key={k} className="border-b border-line p-0.5">
                      <Cell value={v} label={`${h.name || h.id}, ${t.label} orang, ${KEY_LABEL[k]}`}
                        data={{ 'data-r': hi * TIERS.length + ti, 'data-c': ci, 'data-hotel': h.id, 'data-tier': ti }}
                        onChange={(n) => onCell(h.id, t.id, k, n)}
                        onNav={(dr) => move(hi * TIERS.length + ti + dr, ci)} />
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        ))}
      </table>
    </div>
  );
}

function Cell({ value, onChange, onNav, label, data }: { value: number | null; onChange: (n: number | null) => void; onNav: (dr: number) => void; label: string; data: Record<string, string | number> }) {
  const [focus, setFocus] = useState(false);
  const empty = value == null;
  return (
    <input {...data} aria-label={label} inputMode="numeric" autoComplete="off"
      className={`h-11 w-full min-w-[96px] rounded-md border px-2 text-right outline-none transition focus:border-brand focus:ring-2 focus:ring-brand/20 ${empty ? 'border-warn/50 bg-warn/5' : 'border-transparent bg-transparent hover:border-line'}`}
      value={focus ? (value ?? '') : fmtIDR(value)}
      onFocus={(e) => { setFocus(true); e.currentTarget.select(); }}
      onBlur={() => setFocus(false)}
      onChange={(e) => onChange(toAmount(e.target.value))}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === 'ArrowDown') { e.preventDefault(); onNav(1); }
        else if (e.key === 'ArrowUp') { e.preventDefault(); onNav(-1); }
      }} />
  );
}

function PasteModal({ hotels, onClose, onApply }: { hotels: Hotel[]; onClose: () => void; onApply: (text: string, hotelId: string) => void }) {
  const [text, setText] = useState('');
  const [hid, setHid] = useState(hotels[0]?.id ?? '');
  return (
    <Modal title="Tempel dari Excel / Google Sheets" onClose={onClose} wide>
      <p className="text-sm text-muted">Salin sel di spreadsheet, lalu tempel di kotak ini. Bentuk yang dikenali:</p>
      <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-muted">
        <li><b>Tabel lengkap</b> dengan kolom <code>hotel, tier, single, twin, triple, child_twin, cwb, cnb</code> (judul boleh ikut): masuk ke hotel dan tier yang sesuai.</li>
        <li><b>Satu hotel</b>: 7 baris (tier 2 sampai 15+) × 6 kolom angka, boleh dengan kolom tier di depan: masuk ke hotel yang dipilih di bawah.</li>
      </ul>
      <label className="mt-4 block"><span className="label">Hotel tujuan (untuk tempelan satu hotel)</span>
        <select className="field" value={hid} onChange={(e) => setHid(e.target.value)}>{hotels.map((h) => <option key={h.id} value={h.id}>{h.name || h.id}</option>)}</select></label>
      <label className="mt-4 block"><span className="label">Tempel di sini</span>
        <textarea className="field font-mono text-[13px]" rows={9} value={text} onChange={(e) => setText(e.target.value)} placeholder={'2\t6.775.000\t5.875.000\t…'} /></label>
      <div className="mt-5 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
        <button className="btn-ghost" onClick={onClose}>Batal</button>
        <button className="btn-primary" disabled={!text.trim()} onClick={() => onApply(text, hid)}>Isi tabel</button>
      </div>
    </Modal>
  );
}
