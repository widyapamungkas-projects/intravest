import type { Locale } from './i18n';
import settings from './data/settings.json';

const env = import.meta.env;
// Edited through the dashboard (src/data/settings.json). A filled value wins; an empty one falls back to the
// PUBLIC_* env var, then to the built-in default.
const filled = (v: unknown): string | undefined => (typeof v === 'string' && v.trim() !== '' ? v.trim() : undefined);
// Accepts a full URL, "@handle", or "instagram.com/handle" and returns a working https URL ('#' when not set).
const profile = (v: unknown, base: string): string => {
  const x = filled(v);
  if (!x) return '#';
  if (/^https?:\/\//i.test(x)) return x;
  if (x.startsWith('@')) return `${base}${x}`;
  return `https://${x.replace(/^\/+/, '')}`;
};
const waNumber: string = (filled(settings.contact.whatsapp)?.replace(/\D/g, '') || undefined) ?? env.PUBLIC_WHATSAPP_NUMBER ?? '628000000000'; // digits only, with country code. PLACEHOLDER fallback

/** Single place to edit contact details, social links, and default copy. Contact values come from PUBLIC_* env vars (see .env.example). */
export const site = {
  name: filled(settings.company.name) ?? 'Intravest',
  address: filled(settings.company.address),
  fullName: filled(settings.company.fullName) ?? 'Indonesia Travel Story',
  tagline: filled(settings.company.tagline) ?? 'Travel that is worth every rupiah',
  email: filled(settings.contact.email) ?? (env.PUBLIC_EMAIL as string | undefined) ?? 'info@intravest.com',
  whatsapp: {
    number: waNumber,
    display: filled(settings.contact.whatsappDisplay) ?? (env.PUBLIC_WHATSAPP_DISPLAY as string | undefined) ?? `+${waNumber}`,
    defaultMessage: {
      en: 'Hi Intravest, I found your website and would like to inquire about a trip.',
      id: 'Halo Intravest, saya menemukan website kalian dan ingin tanya soal trip.',
    } satisfies Record<Locale, string>,
  },
  // Form endpoints. Set the PUBLIC_* variables in Netlify; the fallback is a PLACEHOLDER that will not deliver.
  forms: {
    contact: import.meta.env.PUBLIC_FORMSPREE_CONTACT ?? 'https://formspree.io/f/xxxxxxxx',
    tour: import.meta.env.PUBLIC_FORMSPREE_TOUR ?? 'https://formspree.io/f/zzzzzzzz',
    customTrip: import.meta.env.PUBLIC_FORMSPREE_CUSTOM_TRIP ?? 'https://formspree.io/f/yyyyyyyy',
  },
  /** GA4 measurement ID. Analytics is only loaded when this is set AND the build is a production build. */
  ga4: env.PUBLIC_GA4_ID as string | undefined,
  // Profile URLs from the dashboard. '#' = not set yet: the footer hides that account.
  social: {
    instagram: profile(settings.social.instagram, 'https://instagram.com/').replace('/@', '/'),
    tiktok: profile(settings.social.tiktok, 'https://www.tiktok.com/'),
    threads: profile(settings.social.threads, 'https://www.threads.net/'),
  },
  description: {
    en: filled(settings.company.descriptionEn) ?? 'Curated trips across Indonesia with local guides and realistic itineraries, planned and run by our own team.',
    id: filled(settings.company.descriptionId) ?? 'Trip Indonesia yang dikurasi, dengan guide lokal dan itinerary realistis, diatur dan dijalankan tim kami sendiri.',
  } satisfies Record<Locale, string>,
};

export const whatsappLink = (message: string) =>
  `https://wa.me/${site.whatsapp.number}?text=${encodeURIComponent(message)}`;
