import fs from 'node:fs';
import path from 'node:path';
import YAML from 'yaml';
import type { Loader } from 'astro/loaders';

const LOCALES = ['en', 'id'] as const;
// Keys that live inside the `en:` / `id:` sections. Everything else at the top of the file is shared by both languages.
const SECTION_ONLY = new Set(['en', 'id']);

/**
 * One YAML file per item (e.g. src/content/tours/bali-essentials.yml) holds the shared facts once (price, days, photo...)
 * and a text section per language. This loader turns each file into two entries, "en/<slug>" and "id/<slug>", with the
 * same shape the pages already use, so no page needs to know the files are merged.
 *
 * If one language has no text yet (title empty), that locale falls back to the other language's text and is flagged
 * `needsReview`. Pages then exist in both languages from the first save (no dead language switch), and the
 * translate step later fills the real translation.
 */
export function bilingualLoader(dir: string): Loader {
  const base = path.resolve(dir);
  return {
    name: 'bilingual-yaml',
    load: async ({ store, parseData, renderMarkdown, generateDigest, logger, watcher }) => {
      const run = async () => {
        store.clear();
        for (const file of fs.readdirSync(base).filter((f) => f.endsWith('.yml')).sort()) {
          const slug = file.replace(/\.yml$/, '');
          const raw = YAML.parse(fs.readFileSync(path.join(base, file), 'utf8')) ?? {};
          const shared = Object.fromEntries(Object.entries(raw).filter(([k]) => !SECTION_ONLY.has(k) && k !== 'slug'));
          const has = (l: string) => typeof raw[l]?.title === 'string' && raw[l].title.trim() !== '';
          if (!has('en') && !has('id')) throw new Error(`${file}: isi judul (title) minimal di salah satu bahasa (en atau id).`);
          for (const locale of LOCALES) {
            const own = has(locale);
            const text = own ? raw[locale] : raw[locale === 'en' ? 'id' : 'en'];
            if (!own) logger.warn(`${file}: teks ${locale.toUpperCase()} kosong, sementara memakai teks bahasa lain.`);
            const { body = '', srcDigest: _d, ...rest } = text;
            const id = `${locale}/${slug}`;
            const data = await parseData({ id, data: { ...shared, ...rest, needsReview: own ? (rest.needsReview ?? false) : true } });
            store.set({ id, data, body, rendered: await renderMarkdown(body), digest: generateDigest({ data, body }) });
          }
        }
      };
      await run();
      watcher?.add(base);
      watcher?.on('change', async (p: string) => {
        if (path.resolve(p).startsWith(base)) await run();
      });
    },
  };
}
