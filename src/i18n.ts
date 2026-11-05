export const locales = ['en', 'id'] as const;

export type Locale = (typeof locales)[number];

export const defaultLocale: Locale = 'en';

export const localeNames: Record<Locale, string> = {
  en: 'English',
  id: 'Bahasa Indonesia',
};

export const htmlLang: Record<Locale, string> = {
  en: 'en-US',
  id: 'id-ID',
};

/** Route prefix per locale. Both locales are always prefixed (subdirectory scheme). */
export const localePrefix = (locale: Locale) => `/${locale}`;

/** Localised path for a given locale and a locale-agnostic path (leading slash). */
export const localizedPath = (locale: Locale, path: string) => {
  const clean = path === '/' ? '' : path.replace(/^\/+|\/+$/g, '');
  return clean ? `/${locale}/${clean}/` : `/${locale}/`;
};

export type RouteKey =
  | 'about'
  | 'destinations'
  | 'tours'
  | 'custom-trip'
  | 'travel-stories'
  | 'contact';

/** Top-level URL segment per route, per locale. */
export const pathSegments: Record<RouteKey, Record<Locale, string>> = {
  about: { en: 'about', id: 'tentang-kami' },
  destinations: { en: 'destinations', id: 'destinasi' },
  tours: { en: 'tours', id: 'paket-wisata' },
  'custom-trip': { en: 'custom-trip', id: 'custom-trip' },
  'travel-stories': { en: 'travel-stories', id: 'cerita-perjalanan' },
  contact: { en: 'contact', id: 'kontak' },
};

/** Localised path for a named route, e.g. routePath('id', 'tours') -> /id/paket-wisata/ */
export const routePath = (locale: Locale, key: RouteKey, rest = '') =>
  localizedPath(locale, `/${pathSegments[key][locale]}/${rest}`);

const localeOf = (value: string): Locale | null =>
  (locales as readonly string[]).includes(value) ? (value as Locale) : null;

/** Returns the sibling-locale path for a localised path, or null when unknown. */
export const alternatePath = (path: string): { locale: Locale; path: string } | null => {
  const segments = path.replace(/^\/+|\/+$/g, '').split('/').filter(Boolean);
  if (segments.length === 0) return null;

  const current = localeOf(segments[0]);
  if (!current) return null;

  const other: Locale = current === 'en' ? 'id' : 'en';
  const rest = segments.slice(1);
  if (rest.length === 0) {
    return { locale: other, path: localizedPath(other, '/') };
  }

  // Look the segment up in the CURRENT locale so both EN->ID and ID->EN work.
  const key = (Object.keys(pathSegments) as RouteKey[]).find(
    (k) => pathSegments[k][current] === rest[0],
  );
  if (!key) return null;

  return {
    locale: other,
    path: localizedPath(other, `/${pathSegments[key][other]}/${rest.slice(1).join('/')}`),
  };
};
