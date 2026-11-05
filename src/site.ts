import type { Locale } from './i18n';

/** Single place to edit contact details, social links, and default copy. */
export const site = {
  name: 'Intravest',
  fullName: 'Indonesia Travel Story',
  tagline: 'Travel that is worth every rupiah', // working tagline, still open
  email: 'info@intravest.com',
  whatsapp: {
    number: '628000000000', // digits only, with country code. PLACEHOLDER
    display: '+62 800 0000 0000', // PLACEHOLDER
    defaultMessage: {
      en: 'Hi Intravest, I found your website and would like to inquire about a trip.',
      id: 'Halo Intravest, saya menemukan website kalian dan ingin tanya soal trip.',
    } satisfies Record<Locale, string>,
  },
  // Form endpoints. Set the PUBLIC_* variables in Netlify; the fallback is a PLACEHOLDER that will not deliver.
  forms: {
    tour: import.meta.env.PUBLIC_FORMSPREE_TOUR ?? 'https://formspree.io/f/xxxxxxxx',
    customTrip: import.meta.env.PUBLIC_FORMSPREE_CUSTOM_TRIP ?? 'https://formspree.io/f/yyyyyyyy',
  },
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
