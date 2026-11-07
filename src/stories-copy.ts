import { htmlLang, type Locale } from './i18n';

/** "en/why-your-bali-tour-needs-a-local-guide" -> "why-your-bali-tour-needs-a-local-guide" */
export const storySlug = (id: string) => id.split('/').slice(1).join('/');

export const formatDate = (locale: Locale, date: Date) =>
  new Intl.DateTimeFormat(htmlLang[locale], { dateStyle: 'long', timeZone: 'UTC' }).format(date);

interface StoriesCopy {
  index: { metaTitle: string; description: string; title: string; intro: string; empty: string };
  tipsLabel: string;
  card: { photoSoon: string };
  page: {
    crumb: string;
    metaTitle: (title: string) => string;
    photoSoon: string;
    related: string;
    ctaTitle: string;
    ctaSub: string;
    cta: string;
    customTrip: string;
    waMessage: (title: string) => string;
    share: { label: string; threads: string; whatsapp: string; copy: string; copied: string };
  };
}

export const storiesCopy: Record<Locale, StoriesCopy> = {
  en: {
    index: {
      metaTitle: 'Travel Stories | Intravest',
      description:
        'Itineraries, practical tips, and honest notes on travelling in Indonesia, written by the team that runs the trips.',
      title: 'Travel Stories',
      intro: 'Itineraries, practical tips, and honest notes from the team that runs the trips.',
      empty: 'Stories are on the way.',
    },
    tipsLabel: 'Tips & Guide',
    card: { photoSoon: 'photo coming soon' },
    page: {
      crumb: 'Travel Stories',
      metaTitle: (title) => `${title} | Intravest`,
      photoSoon: 'photo coming soon',
      related: 'Keep reading',
      ctaTitle: 'Planning a trip?',
      ctaSub: 'Tell us your dates and group size. We reply with a plan and a price.',
      cta: 'Chat on WhatsApp',
      customTrip: 'Plan a custom trip',
      waMessage: (title) => `Hi Intravest, I read "${title}" and would like to ask about a trip.`,
      share: { label: 'Share this story', threads: 'Threads', whatsapp: 'WhatsApp', copy: 'Copy link', copied: 'Link copied' },
    },
  },
  id: {
    index: {
      metaTitle: 'Cerita Perjalanan | Intravest',
      description:
        'Itinerary, tips praktis, dan catatan jujur soal liburan di Indonesia, ditulis oleh tim yang menjalankan tripnya.',
      title: 'Cerita Perjalanan',
      intro: 'Itinerary, tips praktis, dan catatan jujur dari tim yang menjalankan tripnya.',
      empty: 'Ceritanya menyusul.',
    },
    tipsLabel: 'Tips & Panduan',
    card: { photoSoon: 'foto menyusul' },
    page: {
      crumb: 'Cerita Perjalanan',
      metaTitle: (title) => `${title} | Intravest`,
      photoSoon: 'foto menyusul',
      related: 'Baca juga',
      ctaTitle: 'Lagi merencanakan trip?',
      ctaSub: 'Kirim tanggal dan jumlah peserta. Kami balas dengan rencana dan harga.',
      cta: 'Chat lewat WhatsApp',
      customTrip: 'Rencanakan trip custom',
      waMessage: (title) => `Halo Intravest, saya baca "${title}" dan ingin tanya soal trip.`,
      share: { label: 'Bagikan cerita ini', threads: 'Threads', whatsapp: 'WhatsApp', copy: 'Salin tautan', copied: 'Tautan disalin' },
    },
  },
};
