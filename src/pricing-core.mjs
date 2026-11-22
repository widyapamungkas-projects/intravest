// Package price tables: tier list, CSV parsing and validation. Plain JavaScript so the build check
// (scripts/check-content.mjs) and the pages share one implementation.
//
// A package keeps its numbers in src/data/pricing/<package-slug>.csv, one row per hotel and tier:
//   hotel,tier,single,twin,triple,child_twin,cwb,cnb
// All amounts are IDR per person. Tiers are counted in adults. A tier price is calculated on the lowest
// number of adults in that tier, which leaves room to discount larger groups later.

export const TIERS = [
  { id: '2', label: '2', min: 2 },
  { id: '3', label: '3', min: 3 },
  { id: '4-5', label: '4–5', min: 4 },
  { id: '6-7', label: '6–7', min: 6 },
  { id: '8-9', label: '8–9', min: 8 },
  { id: '10-14', label: '10–14', min: 10 },
  { id: '15+', label: '15+', min: 15 },
];
export const PRICE_KEYS = ['single', 'twin', 'triple', 'childTwin', 'cwb', 'cnb'];
export const MAX_HOTELS = 10;

/** Tier for a number of adults. Fewer than 2 adults use the 2-person tier. */
export function tierForAdults(adults) {
  let found = TIERS[0];
  for (const t of TIERS) if (adults >= t.min) found = t;
  return found;
}

const HEADERS = { hotel: 'hotel', tier: 'tier', single: 'single', twin: 'twin', triple: 'triple', childtwin: 'childTwin', cwb: 'cwb', cnb: 'cnb' };

function splitLine(line, d) {
  const out = [];
  let cur = '';
  let q = false;
  for (const ch of line) {
    if (ch === '"') q = !q;
    else if (ch === d && !q) { out.push(cur); cur = ''; } else cur += ch;
  }
  out.push(cur);
  return out.map((s) => s.trim());
}

/** Accepts 3500000, 3.500.000, 3,500,000, "IDR 3,500,000" and Rp 3.500.000. */
function toAmount(v) {
  const digits = String(v ?? '').replace(/[^\d]/g, '');
  return digits ? Number(digits) : NaN;
}

function toTierId(v) {
  const s = String(v ?? '').toLowerCase().replace(/pax|orang|dewasa|[\s]/g, '').replace(/[–—]/g, '-').replace(/up$/, '+');
  return TIERS.find((t) => t.id === s)?.id ?? s;
}

/** @returns {{ rows: any[], errors: string[] }} */
export function parsePricingCsv(text) {
  const errors = [];
  const lines = String(text ?? '').replace(/^﻿/, '').split(/\r?\n/).filter((l) => l.trim() !== '');
  if (!lines.length) return { rows: [], errors: ['file harga kosong.'] };
  const d = lines[0].includes(';') ? ';' : ',';
  const head = splitLine(lines[0], d).map((h) => HEADERS[h.toLowerCase().replace(/[^a-z]/g, '')] ?? null);
  for (const need of ['hotel', 'tier', ...PRICE_KEYS]) if (!head.includes(need)) errors.push(`kolom "${need}" tidak ada di baris judul.`);
  if (errors.length) return { rows: [], errors };
  const rows = [];
  lines.slice(1).forEach((line, i) => {
    const cells = splitLine(line, d);
    const row = { line: i + 2 };
    head.forEach((k, c) => { if (k) row[k] = cells[c] ?? ''; });
    row.hotel = String(row.hotel).trim();
    row.tier = toTierId(row.tier);
    for (const k of PRICE_KEYS) row[k] = toAmount(row[k]);
    rows.push(row);
  });
  return { rows, errors };
}

/**
 * @param {{ rows: any[], hotels: any[], leadHotel?: string, leadTier?: string, validUntil?: string, today?: Date }} p
 * @returns {{ errors: string[], warnings: string[] }}
 */
export function validatePricing({ rows, hotels, leadHotel, leadTier, validUntil, today = new Date() }) {
  const errors = [];
  const warnings = [];
  const ids = new Set(hotels.map((h) => h.id));
  if (!hotels.length) errors.push('belum ada hotel di pengaturan harga paket.');
  if (hotels.length > MAX_HOTELS) warnings.push(`ada ${hotels.length} hotel, tampilan paling nyaman sampai ${MAX_HOTELS}.`);
  if (ids.size !== hotels.length) errors.push('ada id hotel yang kembar.');
  const seen = new Set();
  for (const r of rows) {
    const where = `baris ${r.line}`;
    if (!ids.has(r.hotel)) errors.push(`${where}: hotel "${r.hotel}" tidak ada di daftar hotel paket. Pilihan: ${[...ids].join(', ')}.`);
    if (!TIERS.some((t) => t.id === r.tier)) errors.push(`${where}: tier "${r.tier}" tidak dikenal. Pilihan: ${TIERS.map((t) => t.id).join(', ')}.`);
    for (const k of PRICE_KEYS) if (!(r[k] > 0)) errors.push(`${where}: kolom ${k} harus berupa angka lebih dari 0.`);
    const key = `${r.hotel}|${r.tier}`;
    if (seen.has(key)) errors.push(`${where}: hotel "${r.hotel}" tier ${r.tier} muncul dua kali.`);
    seen.add(key);
    if (r.twin > 0 && r.cwb > r.twin) warnings.push(`${where}: harga CWB lebih tinggi dari twin share.`);
    if (r.cwb > 0 && r.cnb > r.cwb) warnings.push(`${where}: harga CNB lebih tinggi dari CWB.`);
  }
  for (const h of hotels) for (const t of TIERS) if (!seen.has(`${h.id}|${t.id}`)) errors.push(`hotel "${h.id}" belum punya harga untuk tier ${t.id}.`);
  for (const h of hotels) {
    const tw = TIERS.map((t) => rows.find((r) => r.hotel === h.id && r.tier === t.id)?.twin).filter(Boolean);
    for (let i = 1; i < tw.length; i++) if (tw[i] > tw[i - 1]) { warnings.push(`hotel "${h.id}": harga twin naik di tier ${TIERS[i].id}. Harga biasanya turun saat peserta bertambah.`); break; }
  }
  if (leadHotel && !ids.has(leadHotel)) errors.push(`hotel lead-in "${leadHotel}" tidak ada di daftar hotel.`);
  if (leadTier && !TIERS.some((t) => t.id === leadTier)) errors.push(`tier lead-in "${leadTier}" tidak dikenal. Pilihan: ${TIERS.map((t) => t.id).join(', ')}.`);
  if (!leadHotel || !leadTier) errors.push('isi hotel dan tier lead-in (dasar harga "Mulai dari").');
  if (validUntil) {
    const dt = new Date(`${validUntil}T23:59:59`);
    if (Number.isNaN(dt.getTime())) errors.push(`tanggal berlaku "${validUntil}" tidak valid. Tulis YYYY-MM-DD.`);
    else if (dt < today) warnings.push(`harga sudah lewat masa berlaku (${validUntil}). Perbarui CSV dan tanggalnya.`);
  } else warnings.push('tanggal "berlaku sampai" belum diisi.');
  return { errors, warnings };
}

/** Rows + hotel settings -> { hotels: [{ id, name, ..., prices: { [tierId]: { single, twin, ... } } }] } */
export function buildPricing(rows, hotels) {
  return hotels.map((h) => {
    const prices = {};
    for (const r of rows) if (r.hotel === h.id) prices[r.tier] = Object.fromEntries(PRICE_KEYS.map((k) => [k, r[k]]));
    return { ...h, prices };
  });
}
