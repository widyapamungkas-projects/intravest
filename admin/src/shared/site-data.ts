import { z } from 'zod';

// Cermin pemeriksaan di scripts/check-content.mjs untuk src/data/{home,about,settings}.json.
// Kunci yang tidak dikenal dipertahankan (looseObject) supaya dashboard tidak menghapus isian milik situs.
export type Issue = { path: (string | number)[]; message: string };
export const DATA_NAMES = ['home', 'about', 'settings'] as const;
export type DataName = (typeof DATA_NAMES)[number];

const s = z.string().optional();

const home = z.looseObject({
  heroSlides: z.array(z.looseObject({ image: z.string().min(1, 'Pilih foto untuk slide ini'), alt: s })).max(3, 'Maksimal 3 slide hero').optional(),
  ctaImage: s, ctaAlt: s,
});
const about = z.looseObject({ heroImage: s, heroAlt: s, storyImage: s, storyAlt: s });
const settings = z.looseObject({
  company: z.looseObject({ name: z.string().trim().min(1, 'Nama perusahaan wajib diisi'), fullName: s, tagline: s, logo: s, favicon: s, address: s, descriptionEn: s, descriptionId: s }),
  contact: z.looseObject({
    whatsapp: z.string().optional().refine((v) => !v?.trim() || /^\d{8,15}$/.test(v.replace(/\D/g, '')), 'Nomor WhatsApp tidak valid. Tulis dengan kode negara, contoh 6281234567890.'),
    whatsappDisplay: s,
    email: z.string().optional().refine((v) => !v?.trim() || /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(v.trim()), 'Email tidak valid.'),
  }),
  social: z.looseObject({ instagram: s, threads: s }).optional(),
});

export const dataSchemas = { home, about, settings } as const;

export function validateData(name: DataName, raw: unknown): { ok: true } | { ok: false; issues: Issue[] } {
  const r = dataSchemas[name].safeParse(raw);
  if (r.success) return { ok: true };
  return { ok: false, issues: r.error.issues.map((i) => ({ path: i.path.filter((p): p is string | number => typeof p !== 'symbol'), message: i.message })) };
}

/** Rapikan spasi pinggir; kunci kosong DIPERTAHANKAN sebagai "" (situs membaca kunci itu). Slide hero tanpa foto dibuang. */
export function tidyData(name: DataName, raw: any): any {
  const walk = (v: any): any => (typeof v === 'string' ? v.replace(/\r\n/g, '\n').trim() : Array.isArray(v) ? v.map(walk) : v && typeof v === 'object' ? Object.fromEntries(Object.entries(v).map(([k, x]) => [k, walk(x)])) : v);
  const d = walk(raw);
  if (name === 'home' && Array.isArray(d.heroSlides)) d.heroSlides = d.heroSlides.filter((x: any) => x?.image);
  return d;
}

export const IMAGE_NAME_RE = /^[a-z0-9][a-z0-9-]{0,80}\.(webp|jpe?g|png)$/;
export const MAX_IMAGE_BYTES = 4 * 1024 * 1024;

/** Cek tanda awal berkas (magic bytes) agar nama .webp benar-benar webp, bukan berkas lain. */
export function imageKind(buf: Uint8Array): 'webp' | 'jpg' | 'png' | null {
  if (buf.length > 12 && buf[0] === 0x52 && buf[1] === 0x49 && buf[2] === 0x46 && buf[3] === 0x46 && buf[8] === 0x57 && buf[9] === 0x45 && buf[10] === 0x42 && buf[11] === 0x50) return 'webp';
  if (buf.length > 3 && buf[0] === 0xff && buf[1] === 0xd8 && buf[2] === 0xff) return 'jpg';
  if (buf.length > 8 && buf[0] === 0x89 && buf[1] === 0x50 && buf[2] === 0x4e && buf[3] === 0x47) return 'png';
  return null;
}
