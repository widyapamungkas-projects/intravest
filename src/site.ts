import type { Locale } from './i18n';

const env = import.meta.env;
const waNumber: string = env.PUBLIC_WHATSAPP_NUMBER ?? '628000000000'; // digits only, with country code. PLACEHOLDER fallback

/** Single place to edit contact details, social links, and default copy. Contact values come from PUBLIC_* env vars (see .env.example). */
export const site = {
  name: 'Intravest',
  fullName: 'Indonesia Travel Story',
  tagline: 'Travel that is worth every rupiah', // working tagline, still open
  email: (env.PUBLIC_EMAIL as string | undefined) ?? 'info@intravest.com',
  whatsapp: {
    number: waNumber,
    display: (env.PUBLIC_WHATSAPP_DISPLAY as string | undefined) ?? `+${waNumber}`,
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
  // TODO: replace '#' with real profile URLs once the accounts exist
  social: {
    instagram: '#',
    tiktok: '#',
    threads: '#',
  },
  description: {
    en: 'Curated trips across Indonesia with local guides and realistic itineraries, planned and run by our own team.',
    id: 'Trip Indonesia yang dikurasi, dengan guide lokal dan itinerary realistis, diatur dan dijalankan tim kami sendiri.',
  } satisfies Record<Locale, string>,
};

export const whatsappLink = (message: string) =>
  `https://wa.me/${site.whatsapp.number}?text=${encodeURIComponent(message)}`;
