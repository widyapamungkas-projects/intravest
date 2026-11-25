import { z } from 'zod';
const SLUG_RE = /^[a-z0-9]+(-[a-z0-9]+)*$/;
export type Issue = { path: (string | number)[]; message: string };

// Cermin skema `destinations` di src/content.config.ts untuk FILE mentah (bagian bersama + en: + id:).
export const DEST_KEY_ORDER = ['slug', 'order', 'image', 'en', 'id'];
export const DEST_LOCALE_KEY_ORDER = ['title', 'tagline', 'description', 'see', 'activities', 'shopping', 'imageAlt', 'body', 'needsReview'];

const locale = z.looseObject({
  title: z.string().optional(),
  tagline: z.string().optional(),
  description: z.string().optional(),
  see: z.array(z.string()).optional(),
  activities: z.array(z.string()).optional(),
  shopping: z.array(z.string()).optional(),
  imageAlt: z.string().optional(),
  body: z.string().optional(),
  needsReview: z.boolean().optional(),
});

export const destinationFileSchema = z
  .looseObject({
    slug: z.string().regex(SLUG_RE, 'Alamat (slug): huruf kecil, angka, dan tanda hubung'),
    order: z.number({ error: 'Urutan wajib diisi' }),
    image: z.string().optional(),
    en: locale.optional(),
    id: locale.optional(),
  })
  .superRefine((t, ctx) => {
    const filled = (['en', 'id'] as const).filter((l) => (t[l]?.title ?? '').trim());
    if (!filled.length) ctx.addIssue({ code: 'custom', path: ['en', 'title'], message: 'Isi nama destinasi minimal di salah satu bahasa (English atau Indonesia).' });
    for (const l of filled) {
      const x = t[l]!;
      const L = l === 'en' ? 'English' : 'Indonesia';
      if (!x.tagline?.trim()) ctx.addIssue({ code: 'custom', path: [l, 'tagline'], message: `Tagline ${L} wajib diisi.` });
      if (!x.description?.trim()) ctx.addIssue({ code: 'custom', path: [l, 'description'], message: `Deskripsi singkat ${L} wajib diisi.` });
      else if (x.description.length > 160) ctx.addIssue({ code: 'custom', path: [l, 'description'], message: `Deskripsi ${L} maksimal 160 karakter (sekarang ${x.description.length}).` });
      for (const [k, name] of [['see', 'Something to See'], ['activities', 'Something to Do'], ['shopping', 'Something to Buy']] as const)
        if (!x[k]?.filter((s) => s.trim()).length) ctx.addIssue({ code: 'custom', path: [l, k], message: `"${name}" ${L} belum diisi (minimal satu baris).` });
    }
  });

export type DestinationFile = z.infer<typeof destinationFileSchema>;
export function validateDestination(raw: unknown): { ok: true; data: DestinationFile } | { ok: false; issues: Issue[] } {
  const r = destinationFileSchema.safeParse(raw);
  if (r.success) return { ok: true, data: r.data };
  return { ok: false, issues: r.error.issues.map((i) => ({ path: i.path.filter((p): p is string | number => typeof p !== 'symbol'), message: i.message })) };
}
