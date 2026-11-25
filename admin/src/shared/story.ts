import { z } from 'zod';
const SLUG_RE = /^[a-z0-9]+(-[a-z0-9]+)*$/;
export type Issue = { path: (string | number)[]; message: string };

// Cermin skema `stories` di src/content.config.ts untuk frontmatter. Tags disimpan SATU string dipisah koma.
export const STORY_KEY_ORDER = ['title', 'description', 'date', 'category', 'tags', 'ogImage', 'image', 'imageAlt', 'postToThreads', 'threadsText', 'threadsPostedAt'];
export const LOCALES = ['en', 'id'] as const;

export const storyFmSchema = z.looseObject({
  title: z.string({ error: 'Judul wajib diisi' }).trim().min(1, 'Judul wajib diisi'),
  description: z.string({ error: 'Deskripsi singkat wajib diisi' }).trim().min(1, 'Deskripsi singkat wajib diisi').max(160, 'Deskripsi maksimal 160 karakter'),
  date: z.string({ error: 'Tanggal wajib diisi' }).regex(/^\d{4}-\d{2}-\d{2}$/, 'Tulis tanggal sebagai YYYY-MM-DD').refine((d) => !Number.isNaN(Date.parse(d)), 'Tanggal tidak valid'),
  category: z.string({ error: 'Pilih kategori' }).min(1, 'Pilih kategori'),
  tags: z.string().optional(),
  ogImage: z.string().optional(),
  postToThreads: z.boolean().default(false),
  threadsText: z.string().optional(),
  threadsPostedAt: z.string().optional(),
  image: z.string().optional(),
  imageAlt: z.string().optional(),
});
export type StoryFm = z.infer<typeof storyFmSchema>;

export const storyKeySchema = z.object({ locale: z.enum(LOCALES), slug: z.string().regex(SLUG_RE) });

export function validateStory(fm: unknown, body: string): { ok: true; data: StoryFm } | { ok: false; issues: Issue[] } {
  const r = storyFmSchema.safeParse(fm);
  const issues: Issue[] = r.success ? [] : r.error.issues.map((i) => ({ path: i.path.filter((p): p is string | number => typeof p !== 'symbol'), message: i.message }));
  if (!body.trim()) issues.push({ path: ['body'], message: 'Isi artikel belum ditulis.' });
  return issues.length ? { ok: false, issues } : { ok: true, data: r.data! };
}

/** "Bali Itinerary, first time" -> ["bali itinerary", "first time"] untuk tampilan chip. */
export const tagList = (s?: string) => (s ?? '').split(',').map((t) => t.trim()).filter(Boolean);
