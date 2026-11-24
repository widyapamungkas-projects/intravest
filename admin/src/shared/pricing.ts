// Tabel harga paket: grid di editor <-> CSV di repo. Cermin dari src/pricing-core.mjs milik situs
// (tier, kolom, aturan). Tes `test/pricing.test.ts` membandingkan keduanya; penjaga akhir tetap
// scripts/check-content.mjs dan `npm run build` situs.

export const TIERS = [
  { id: '2', label: '2', min: 2 },
  { id: '3', label: '3', min: 3 },
  { id: '4-5', label: '4–5', min: 4 },
  { id: '6-7', label: '6–7', min: 6 },
  { id: '8-9', label: '8–9', min: 8 },
  { id: '10-14', label: '10–14', min: 10 },
  { id: '15+', label: '15+', min: 15 },
] as const;
export type TierId = (typeof TIERS)[number]['id'];

export const PRICE_KEYS = ['single', 'twin', 'triple', 'childTwin', 'cwb', 'cnb'] as const;
export type PriceKey = (typeof PRICE_KEYS)[number];
export const KEY_LABEL: Record<PriceKey, string> = { single: 'Single', twin: 'Twin share', triple: 'Triple', childTwin: 'Anak (twin)', cwb: 'Anak + kasur', cnb: 'Anak tanpa kasur' };
export const KEY_SHORT: Record<PriceKey, string> = { single: 'Single', twin: 'Twin', triple: 'Triple', childTwin: 'Anak twin', cwb: 'CWB', cnb: 'CNB' };
export const CSV_HEAD = 'hotel,tier,single,twin,triple,child_twin,cwb,cnb';
export const MAX_HOTELS = 10;

export type Cell = number | null;
export type Row = Record<PriceKey, Cell>;
/** hotelId -> tierId -> harga */
export type Grid = Record<string, Record<string, Row>>;
export type Hotel = { id: string; name: string; stars?: number; area?: string; highSeason: number };

export const blankRow = (): Row => ({ single: null, twin: null, triple: null, childTwin: null, cwb: null, cnb: null });
export const blankHotelRows = (): Record<string, Row> => Object.fromEntries(TIERS.map((t) => [t.id, blankRow()]));

/** "3.500.000", "3,500,000", "Rp 3.500.000", "IDR 3500000" -> 3500000. Kosong atau bukan angka -> null. */
export function toAmount(v: unknown): Cell {
  const digits = String(v ?? '').replace(/[^\d]/g, '');
  return digits ? Number(digits) : null;
}

export function normTier(v: unknown): string {
  const s = String(v ?? '').toLowerCase().replace(/pax|orang|dewasa|\s/g, '').replace(/[–—]/g, '-').replace(/up$/, '+');
  return TIERS.find((t) => t.id === s)?.id ?? s;
}

export const fmtIDR = (n: Cell | undefined) => (n == null ? '' : n.toLocaleString('id-ID'));

function splitLine(line: string, d: string): string[] {
  const out: string[] = [];
  let cur = '', q = false;
  for (const ch of line) {
    if (ch === '"') q = !q;
    else if (ch === d && !q) { out.push(cur); cur = ''; } else cur += ch;
  }
  out.push(cur);
  return out.map((s) => s.trim());
}

const HEADERS: Record<string, string> = { hotel: 'hotel', tier: 'tier', single: 'single', twin: 'twin', triple: 'triple', childtwin: 'childTwin', cwb: 'cwb', cnb: 'cnb' };

/** Baca CSV repo ke grid. Baris untuk hotel yang tidak ada di `hotelIds` dikembalikan di `orphans`. */
export function csvToGrid(text: string, hotelIds: string[]): { grid: Grid; orphans: string[]; problems: string[] } {
  const grid: Grid = Object.fromEntries(hotelIds.map((id) => [id, blankHotelRows()]));
  const orphans = new Set<string>();
  const problems: string[] = [];
  const lines = String(text ?? '').replace(/^﻿/, '').split(/\r?\n/).filter((l) => l.trim() !== '');
  if (!lines.length) return { grid, orphans: [], problems };
  const d = lines[0].includes(';') ? ';' : ',';
  const head = splitLine(lines[0], d).map((h) => HEADERS[h.toLowerCase().replace(/[^a-z]/g, '')] ?? null);
  for (const need of ['hotel', 'tier', ...PRICE_KEYS]) if (!head.includes(need)) problems.push(`kolom "${need}" tidak ada di baris judul CSV`);
  if (problems.length) return { grid, orphans: [], problems };
  for (const line of lines.slice(1)) {
    const cells = splitLine(line, d);
    const r: Record<string, string> = {};
    head.forEach((k, c) => { if (k) r[k] = cells[c] ?? ''; });
    const hotel = r.hotel.trim(), tier = normTier(r.tier);
    if (!grid[hotel]) { orphans.add(hotel); continue; }
    if (!grid[hotel][tier]) { problems.push(`tier "${r.tier}" tidak dikenal untuk hotel ${hotel}`); continue; }
    for (const k of PRICE_KEYS) grid[hotel][tier][k] = toAmount(r[k]);
  }
  return { grid, orphans: [...orphans], problems };
}

/** Grid -> CSV persis seperti format file di repo: urutan hotel mengikuti daftar hotel, lalu urutan tier. */
export function gridToCsv(grid: Grid, hotels: Pick<Hotel, 'id'>[]): string {
  const out = [CSV_HEAD];
  for (const h of hotels) for (const t of TIERS) {
    const r = grid[h.id]?.[t.id] ?? blankRow();
    out.push([h.id, t.id, ...PRICE_KEYS.map((k) => r[k] ?? '')].join(','));
  }
  return out.join('\n') + '\n';
}

/** Teks tempelan dari Excel/Google Sheets (tab) atau CSV -> baris sel. Tahan kutip, \r\n, dan titik koma. */
export function parsePasted(text: string): string[][] {
  const t = String(text ?? '').replace(/^﻿/, '').replace(/\r\n?/g, '\n').replace(/\n+$/, '');
  if (!t.trim()) return [];
  const d = t.includes('\t') ? '\t' : t.split('\n')[0].includes(';') ? ';' : ',';
  const rows: string[][] = [];
  let row: string[] = [], cur = '', q = false;
  for (let i = 0; i < t.length; i++) {
    const ch = t[i];
    if (q) { if (ch === '"') { if (t[i + 1] === '"') { cur += '"'; i++; } else q = false; } else cur += ch; }
    else if (ch === '"' && cur === '') q = true;
    else if (ch === d) { row.push(cur); cur = ''; }
    else if (ch === '\n') { row.push(cur); rows.push(row); row = []; cur = ''; }
    else cur += ch;
  }
  row.push(cur); rows.push(row);
  return rows.map((r) => r.map((c) => c.trim()));
}

export type PasteResult = { grid: Grid; filled: number; note?: string; error?: string };

/**
 * Tempel ke grid. Tiga bentuk yang dikenali:
 *  1. tabel lengkap (hotel, tier, 6 harga, boleh dengan baris judul): dipetakan per hotel dan tier;
 *  2. blok dengan kolom tier di depan (tier, 6 harga): ke hotel tempat kursor berada;
 *  3. blok angka polos: diisi mulai dari sel yang sedang aktif ke kanan dan ke bawah (tidak melewati tepi).
 * `at` = sel aktif {hotel, tier index, kolom}.
 */
export function pasteInto(grid: Grid, hotels: Pick<Hotel, 'id' | 'name'>[], at: { hotel: string; tier: number; col: number }, text: string): PasteResult {
  let rows = parsePasted(text);
  if (!rows.length) return { grid, filled: 0, error: 'Tidak ada isi yang bisa ditempel.' };
  const next: Grid = JSON.parse(JSON.stringify(grid));
  const isHeader = (r: string[]) => r.some((c) => /^(hotel|tier|single|twin|triple|child|cwb|cnb)/i.test(c.trim()));
  if (isHeader(rows[0])) rows = rows.slice(1);
  if (!rows.length) return { grid, filled: 0, error: 'Hanya ada baris judul, tidak ada angka.' };

  const byName = (s: string) => hotels.find((h) => h.id === s.trim() || h.name.trim().toLowerCase() === s.trim().toLowerCase());
  let filled = 0;
  const put = (hid: string, tid: string, ci: number, v: string) => {
    const k = PRICE_KEYS[ci];
    if (!next[hid]?.[tid] || !k) return;
    next[hid][tid][k] = toAmount(v); filled++;
  };

  // 1. tabel lengkap
  if (rows.every((r) => r.length >= 8) && rows.every((r) => TIERS.some((t) => t.id === normTier(r[1])))) {
    const unknown = new Set<string>();
    for (const r of rows) {
      const h = byName(r[0]);
      if (!h) { unknown.add(r[0]); continue; }
      PRICE_KEYS.forEach((_, ci) => put(h.id, normTier(r[1]), ci, r[2 + ci]));
    }
    return { grid: next, filled, note: unknown.size ? `Hotel tidak dikenal dilewati: ${[...unknown].join(', ')}.` : undefined };
  }

  // 2. kolom tier di depan
  const lead = rows.every((r) => r.length >= 7 && TIERS.some((t) => t.id === normTier(r[0])));
  if (lead) {
    for (const r of rows) PRICE_KEYS.forEach((_, ci) => put(at.hotel, normTier(r[0]), ci, r[1 + ci]));
    return { grid: next, filled };
  }

  // 3. blok polos dari sel aktif
  const hIdx = hotels.findIndex((h) => h.id === at.hotel);
  if (hIdx < 0) return { grid, filled: 0, error: 'Klik sel tujuan dulu, baru tempel.' };
  const flat: { hid: string; tid: string }[] = [];
  for (const h of hotels) for (const t of TIERS) flat.push({ hid: h.id, tid: t.id });
  const start = hIdx * TIERS.length + at.tier;
  let cut = false;
  rows.forEach((r, ri) => {
    const target = flat[start + ri];
    if (!target) { cut = true; return; }
    r.forEach((v, ci) => { if (at.col + ci < PRICE_KEYS.length) put(target.hid, target.tid, at.col + ci, v); else cut = true; });
  });
  return { grid: next, filled, note: cut ? 'Sebagian isi tidak muat di tabel dan dilewati.' : undefined };
}

/** Hotel baru: id dibuat dari nama (hotel-a, hotel-b, ... kalau nama kosong), selalu unik. */
export function newHotelId(name: string, existing: string[]): string {
  const base = name.toLowerCase().replace(/\(.*?\)/g, '').normalize('NFKD').replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
  if (base) { let id = base, n = 2; while (existing.includes(id)) id = `${base}-${n++}`; return id; }
  for (let i = 0; i < 26; i++) { const id = `hotel-${String.fromCharCode(97 + i)}`; if (!existing.includes(id)) return id; }
  let n = 27; while (existing.includes(`hotel-${n}`)) n++; return `hotel-${n}`;
}

export type PriceCheck = { errors: string[]; warnings: string[]; blanks: Record<string, number> };

/** Cermin validatePricing situs, dengan pesan per hotel (bukan per baris CSV) supaya mudah dibaca. */
export function checkPricing(p: { grid: Grid; hotels: Hotel[]; leadHotel?: string; leadTier?: string; validUntil?: string; today?: Date }): PriceCheck {
  const { grid, hotels, leadHotel, leadTier, validUntil, today = new Date() } = p;
  const errors: string[] = [], warnings: string[] = [];
  const blanks: Record<string, number> = {};
  const ids = hotels.map((h) => h.id);
  if (!hotels.length) errors.push('Tambahkan minimal satu hotel.');
  if (hotels.length > MAX_HOTELS) warnings.push(`Ada ${hotels.length} hotel, tampilan paling nyaman sampai ${MAX_HOTELS}.`);
  if (new Set(ids).size !== ids.length) errors.push('Ada id hotel yang kembar.');
  for (const h of hotels) {
    const label = h.name.trim() || h.id;
    let blank = 0, bad = 0;
    for (const t of TIERS) for (const k of PRICE_KEYS) {
      const v = grid[h.id]?.[t.id]?.[k];
      if (v == null) blank++; else if (!(v > 0)) bad++;
    }
    blanks[h.id] = blank + bad;
    if (blank) errors.push(`${label}: ${blank} sel harga masih kosong.`);
    if (bad) errors.push(`${label}: ${bad} sel harga harus lebih dari 0.`);
    const tw = TIERS.map((t) => grid[h.id]?.[t.id]?.twin).filter((v): v is number => !!v);
    for (let i = 1; i < tw.length; i++) if (tw[i] > tw[i - 1]) { warnings.push(`${label}: harga twin naik di tier berikutnya. Harga biasanya turun saat peserta bertambah.`); break; }
    for (const t of TIERS) {
      const r = grid[h.id]?.[t.id]; if (!r) continue;
      if (r.twin && r.cwb && r.cwb > r.twin) { warnings.push(`${label}, tier ${t.label}: harga CWB lebih tinggi dari twin share.`); break; }
      if (r.cwb && r.cnb && r.cnb > r.cwb) { warnings.push(`${label}, tier ${t.label}: harga CNB lebih tinggi dari CWB.`); break; }
    }
  }
  if (!leadHotel || !leadTier) errors.push('Pilih hotel dan tier untuk harga "mulai dari".');
  else {
    if (!ids.includes(leadHotel)) errors.push(`Hotel "mulai dari" (${leadHotel}) tidak ada di daftar hotel.`);
    if (!TIERS.some((t) => t.id === leadTier)) errors.push(`Tier "mulai dari" (${leadTier}) tidak dikenal.`);
  }
  if (validUntil) {
    const dt = new Date(`${validUntil}T23:59:59`);
    if (Number.isNaN(dt.getTime())) errors.push(`Tanggal berlaku "${validUntil}" tidak valid.`);
    else if (dt < today) warnings.push(`Harga sudah lewat masa berlaku (${validUntil}). Perbarui harga dan tanggalnya.`);
  } else warnings.push('Tanggal "berlaku sampai" belum diisi.');
  return { errors, warnings, blanks };
}

/** Harga "mulai dari" yang akan tampil di situs: twin share pada hotel dan tier lead-in. */
export function leadPrice(grid: Grid, leadHotel?: string, leadTier?: string): number | null {
  if (!leadHotel || !leadTier) return null;
  return grid[leadHotel]?.[leadTier]?.twin ?? null;
}
