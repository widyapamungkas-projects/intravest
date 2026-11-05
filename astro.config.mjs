import { defineConfig } from 'astro/config';
import mdx from '@astrojs/mdx';
import sitemap from '@astrojs/sitemap';
import tailwindcss from '@tailwindcss/vite';
import { alternatePath, htmlLang } from './src/i18n.ts';

const SITE = 'https://intravest.com';

// Travel Stories articles can exist in one language only, so they get no hreflang pairing
// (BaseLayout does the same via `noAlternate`).
const storySegments = new Set(['travel-stories', 'cerita-perjalanan']);

export default defineConfig({
  site: SITE,
  trailingSlash: 'always',
  integrations: [
    mdx(),
    sitemap({
      // "/" only redirects to /en/ (or /id/), so it does not belong in the sitemap.
      filter: (page) => new URL(page).pathname !== '/',
      // The built-in i18n option pairs pages by swapping the /en/ prefix, which breaks here because
      // the ID URLs are translated (/tours/ vs /paket-wisata/). Pair them with our own route table instead.
      serialize(item) {
        const { pathname } = new URL(item.url);
        const [lang, section, slug] = pathname.split('/').filter(Boolean);
        const alt = alternatePath(pathname);
        if (!alt || (storySegments.has(section) && slug)) return item;
        const en = lang === 'en' ? item.url : new URL(alt.path, SITE).href;
        item.links = [
          { url: item.url, lang: htmlLang[lang] },
          { url: new URL(alt.path, SITE).href, lang: htmlLang[alt.locale] },
          { url: en, lang: 'x-default' },
        ];
        return item;
      },
    }),
  ],
  vite: {
    plugins: [tailwindcss()],
  },
});
