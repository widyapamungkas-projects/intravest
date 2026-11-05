import type { Locale } from './i18n';

/** "en/bali" -> "bali" */
export const destSlug = (id: string) => id.split('/').slice(1).join('/');

interface DestCopy {
  index: { metaTitle: string; description: string; title: string; intro: string };
  page: {
    crumb: string;
    see: string;
    activities: string;
    shopping: string;
    photoSoon: string;
    cta: string;
    customTrip: string;
    packagesTitle: string;
    packagesEmpty: (name: string) => string;
    packagesLink: string;
    ctaTitle: (name: string) => string;
    ctaSub: string;
    metaTitle: (name: string) => string;
    waMessage: (name: string) => string;
  };
}

export const destCopy: Record<Locale, DestCopy> = {
  en: {
    index: {
      metaTitle: 'Destinations | Intravest',
      description:
        'Bali, Lombok, Labuan Bajo, Yogyakarta, Surabaya, and Jakarta-Bandung: places where our own team runs hotels, transport, meals, and guides.',
      title: 'Destinations',
      intro: 'Six places across Indonesia where our own team handles hotels, transport, meals, and guides.',
    },
    page: {
      crumb: 'Destinations',
      see: 'Something to see',
      activities: 'Something to do',
      shopping: 'Something to buy',
      photoSoon: 'photo coming soon',
      cta: 'Ask about this trip',
      customTrip: 'Plan a custom trip',
      packagesTitle: 'Packages',
      packagesEmpty: (name) =>
        `Fixed packages for ${name} will be listed here. In the meantime, we can plan a trip around your dates.`,
      packagesLink: 'See all tours',
      ctaTitle: (name) => `Thinking about ${name}?`,
      ctaSub: 'Share your dates and group size. We will reply with a plan and a price.',
      metaTitle: (name) => `${name} trips with a local guide | Intravest`,
      waMessage: (name) => `Hi Intravest, I would like to inquire about a trip to ${name}.`,
    },
  },
  id: {
    index: {
      metaTitle: 'Destinasi | Intravest',
      description:
        'Bali, Lombok, Labuan Bajo, Yogyakarta, Surabaya, dan Jakarta-Bandung: tempat-tempat yang hotel, transport, makan, dan guide-nya kami urus sendiri.',
      title: 'Destinasi',
      intro: 'Enam tempat di Indonesia yang hotel, transport, makan, dan guide-nya diurus langsung oleh tim kami.',
    },
    page: {
      crumb: 'Destinasi',
      see: 'Yang bisa dilihat',
      activities: 'Yang bisa dilakukan',
      shopping: 'Yang bisa dibeli',
      photoSoon: 'foto menyusul',
      cta: 'Tanya soal trip ini',
      customTrip: 'Rencanakan trip custom',
      packagesTitle: 'Paket',
      packagesEmpty: (name) =>
        `Paket tetap untuk ${name} akan tampil di sini. Sementara itu, kami bisa menyusun trip sesuai tanggalmu.`,
      packagesLink: 'Lihat semua paket wisata',
      ctaTitle: (name) => `Tertarik ke ${name}?`,
      ctaSub: 'Kirim tanggal dan jumlah peserta. Kami balas dengan rencana dan harga.',
      metaTitle: (name) => `Trip ${name} dengan guide lokal | Intravest`,
      waMessage: (name) => `Halo Intravest, saya ingin tanya soal trip ke ${name}.`,
    },
  },
};
