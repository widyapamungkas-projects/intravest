import type { Locale } from './i18n';
import { htmlLang, localizedPath } from './i18n';
import { site } from './site';

/** Homepage structured data: the business itself (TravelAgency is a schema.org LocalBusiness subtype). */
export const homeStructuredData = (locale: Locale, siteUrl: URL | string | undefined) => {
  const base = siteUrl ?? 'https://intravest.com';
  const sameAs = Object.values(site.social).filter((u) => u.startsWith('http'));
  return {
    '@context': 'https://schema.org',
    '@type': 'TravelAgency',
    name: site.name,
    alternateName: site.fullName,
    url: new URL(localizedPath(locale, '/'), base).href,
    logo: new URL('/favicon.svg', base).href,
    image: new URL('/og/default.jpg', base).href,
    email: site.email,
    description: site.description[locale],
    inLanguage: htmlLang[locale],
    address: { '@type': 'PostalAddress', addressRegion: 'Bali', addressCountry: 'ID' },
    areaServed: { '@type': 'Country', name: 'Indonesia' },
    ...(sameAs.length ? { sameAs } : {}),
  };
};
