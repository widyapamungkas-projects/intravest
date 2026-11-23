import { z } from 'zod';

// Cermin dari skema `tours` di src/content.config.ts, tapi untuk FILE mentah (bagian bersama + en: + id:).
// Tes `test/schema-parity.test.ts` memastikan semua file asli lolos skema ini DAN `npm run build` situs
// tetap menjadi penjaga akhir. Kalau content.config.ts berubah, ubah file ini juga.

export const SLUG_RE = /^[a-z0-9]+(-[a-z0-9]+)*$/;

export const TIERS = ['2', '3', '4-5', '6-7', '8-9', '10-14', '15+'] as const;

const day = z.object({
  title: z.string({ error: 'Judul hari wajib diisi' }).trim().min(1, 'Judul hari wajib diisi'),
  plan: z.array(z.string().trim().min(1), { error: 'Isi minimal satu kegiatan per hari' }).min(1, 'Isi minimal satu kegiatan per hari'),
  meals: z.string({ error: 'Isi info makan tiap hari (boleh "-")' }).trim().min(1, 'Isi info makan tiap hari (boleh "-")'),
  stay: z.string().optional(),
});
export type TourDay = z.infer<typeof day>;

export const hotelSchema = z.object({
  id: z.string().regex(SLUG_RE, 'ID hotel: huruf kecil, angka, tanda hubung'),
  name: z.string().trim().min(1, 'Nama hotel wajib'),
  stars: z.number().int().min(1).max(5).optional(),
  area: z.string().optional(),
  highSeason: z.number().int().min(0).default(0),
});

const pricingSchema = z.object({
  validUntil: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Tulis tanggal sebagai YYYY-MM-DD').optional(),
  leadHotel: z.string().min(1, 'Pilih hotel "harga mulai dari"'),
  leadTier: z.enum(TIERS, { error: 'Pilih tier "harga mulai dari"' }),
  hotels: z.array(hotelSchema).min(1, 'Minimal satu hotel'),
});

/** Teks satu bahasa. Semua opsional di tingkat ini; kelengkapan dicek di superRefine kalau judulnya terisi. */
const locale = z.looseObject({
  title: z.string().optional(),
  summary: z.string().optional(),
  priceNote: z.string().optional(),
  highSeasonNote: z.string().optional(),
  imageAlt: z.string().optional(),
  itinerary: z.array(day).optional(),
  inclusions: z.array(z.string()).optional(),
  exclusions: z.array(z.string()).optional(),
  body: z.string().optional(),
  needsReview: z.boolean().optional(),
});

export const tourFileSchema = z
  .looseObject({
    slug: z.string().regex(SLUG_RE, 'Alamat (slug): huruf kecil, angka, dan tanda hubung'),
    code: z.string({ error: 'Kode paket wajib diisi' }).trim().min(1, 'Kode paket wajib diisi'),
    destination: z.string({ error: 'Pilih destinasi' }).min(1, 'Pilih destinasi'),
    days: z.number().int().min(1, 'Minimal 1 hari'),
    nights: z.number().int().min(0),
    order: z.number(),
    priceIDR: z.number().int().positive('Harga harus lebih dari 0').optional(),
    priceIsDraft: z.boolean().default(false),
    pricing: pricingSchema.optional(),
    minPax: z.number().int().min(1).default(2),
    image: z.string().optional(),
    en: locale.optional(),
    id: locale.optional(),
  })
  .superRefine((t, ctx) => {
    const filled = (['en', 'id'] as const).filter((l) => (t[l]?.title ?? '').trim());
    if (!filled.length) ctx.addIssue({ code: 'custom', path: ['en', 'title'], message: 'Isi judul minimal di salah satu bahasa (English atau Indonesia).' });
    if (t.priceIDR === undefined && t.pricing === undefined) ctx.addIssue({ code: 'custom', path: ['priceIDR'], message: 'Isi harga per orang atau tabel harga.' });
    for (const l of filled) {
      const x = t[l]!;
      const L = l === 'en' ? 'English' : 'Indonesia';
      if (!x.summary?.trim()) ctx.addIssue({ code: 'custom', path: [l, 'summary'], message: `Ringkasan ${L} wajib diisi.` });
      else if (x.summary.length > 160) ctx.addIssue({ code: 'custom', path: [l, 'summary'], message: `Ringkasan ${L} maksimal 160 karakter (sekarang ${x.summary.length}).` });
      if (!x.itinerary?.length) ctx.addIssue({ code: 'custom', path: [l, 'itinerary'], message: `Itinerary ${L} belum diisi.` });
      else if (x.itinerary.length !== t.days) ctx.addIssue({ code: 'custom', path: [l, 'itinerary'], message: `Itinerary ${L} punya ${x.itinerary.length} hari, padahal paket ${t.days} hari.` });
      if (!x.inclusions?.filter((s) => s.trim()).length) ctx.addIssue({ code: 'custom', path: [l, 'inclusions'], message: `"Sudah termasuk" ${L} belum diisi.` });
      if (!x.exclusions?.filter((s) => s.trim()).length) ctx.addIssue({ code: 'custom', path: [l, 'exclusions'], message: `"Belum termasuk" ${L} belum diisi.` });
    }
  });

export type TourFile = z.infer<typeof tourFileSchema>;
export type TourLocale = NonNullable<TourFile['en']>;
export type Issue = { path: (string | number)[]; message: string };

/** Rapikan input dari form: teks dipangkas, string kosong dibuang, list tanpa baris kosong. */
export function cleanTour<T extends Record<string, unknown>>(raw: T): T {
  const walk = (v: unknown, key?: string): unknown => {
    if (typeof v === 'string') {
      const t = key === 'body' ? v.replace(/\s+$/g, '') : v.trim();
      return t === '' ? undefined : t;
    }
    if (Array.isArray(v)) {
      const arr = v.map((x) => walk(x)).filter((x) => x !== undefined);
      return arr;
    }
    if (v && typeof v === 'object') {
      const out: Record<string, unknown> = {};
      for (const [k, x] of Object.entries(v)) {
        const c = walk(x, k);
        if (c !== undefined) out[k] = c;
      }
      return out;
    }
    return v;
  };
  const out = walk(raw) as Record<string, unknown>;
  // "stay" kosong boleh hilang, tapi "meals" wajib ada: pertahankan sebagai "-" bila kosong dibuang -> biarkan validator memberi tahu.
  return out as T;
}

export function validateTour(raw: unknown): { ok: true; data: TourFile } | { ok: false; issues: Issue[] } {
  const r = tourFileSchema.safeParse(raw);
  if (r.success) return { ok: true, data: r.data };
  return { ok: false, issues: r.error.issues.map((i) => ({ path: i.path.filter((p): p is string | number => typeof p !== 'symbol'), message: i.message })) };
}

export const TOUR_KEY_ORDER = ['slug', 'code', 'destination', 'days', 'nights', 'order', 'priceIDR', 'priceIsDraft', 'pricing', 'minPax', 'image', 'en', 'id'];
export const LOCALE_KEY_ORDER = ['title', 'imageAlt', 'summary', 'priceNote', 'itinerary', 'inclusions', 'exclusions', 'highSeasonNote', 'body', 'needsReview'];
export const DAY_KEY_ORDER = ['title', 'plan', 'meals', 'stay'];
