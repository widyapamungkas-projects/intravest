import type { Locale } from './i18n';

/** "en/bali-essentials" -> "bali-essentials" */
export const tourSlug = (id: string) => id.split('/').slice(1).join('/');

export const formatIDR = (locale: Locale, amount: number) =>
  locale === 'id'
    ? `Rp ${new Intl.NumberFormat('id-ID').format(amount)}`
    : `IDR ${new Intl.NumberFormat('en-US').format(amount)}`;

export const durationLabel = (locale: Locale, days: number, nights: number) =>
  locale === 'id'
    ? `${days} hari ${nights} malam`
    : `${days} ${days === 1 ? 'day' : 'days'}, ${nights} ${nights === 1 ? 'night' : 'nights'}`;

interface TourCopy {
  index: {
    metaTitle: string;
    description: string;
    title: string;
    intro: string;
    filterLabel: string;
    filterAll: string;
    empty: (destination: string) => string;
  };
  card: { from: string; perPerson: string; photoSoon: string; details: string };
  page: {
    crumb: string;
    metaTitle: (name: string, code: string) => string;
    photoSoon: string;
    from: string;
    perPerson: string;
    draftPrice: string;
    minPax: (n: number) => string;
    itinerary: string;
    day: (n: number) => string;
    meals: string;
    stay: string;
    inclusions: string;
    exclusions: string;
    price: string;
    priceIntro: string;
    cta: string;
    customTrip: string;
    waMessage: (code: string, name: string, duration: string) => string;
    form: {
      title: string;
      intro: string;
      name: string;
      email: string;
      date: string;
      dateHint: string;
      pax: string;
      notes: string;
      notesHint: string;
      submit: string;
      privacy: string;
    };
  };
  destination: { packagesEmpty: (name: string) => string };
}

export const tourCopy: Record<Locale, TourCopy> = {
  en: {
    index: {
      metaTitle: 'Tours | Intravest',
      description:
        'Fixed itineraries with a local guide, hotels, transport, and meals included. Start with Bali, with more destinations on the way.',
      title: 'Tours',
      intro:
        'Fixed itineraries with a published price. Hotels, transport, meals, and a local guide are already in. Want something different? We can change any of them, or plan a trip from scratch.',
      filterLabel: 'Filter by destination',
      filterAll: 'All',
      empty: (d) => `No fixed packages for ${d} yet. Tell us your dates and we will plan a trip for you.`,
    },
    card: { from: 'From', perPerson: 'per person', photoSoon: 'photo coming soon', details: 'See itinerary' },
    page: {
      crumb: 'Tours',
      metaTitle: (name, code) => `${name} (${code}) tour with a local guide | Intravest`,
      photoSoon: 'photo coming soon',
      from: 'From',
      perPerson: 'per person',
      draftPrice: 'Price is indicative. We confirm the final price in your quote.',
      minPax: (n) => `Based on ${n} travelers`,
      itinerary: 'Itinerary',
      day: (n) => `Day ${n}`,
      meals: 'Meals',
      stay: 'Stay',
      inclusions: 'Included',
      exclusions: 'Not included',
      price: 'Price',
      priceIntro:
        'Prices are in IDR. A 50% deposit confirms your booking, and the balance is due 7 days before departure.',
      cta: 'Ask about this tour',
      customTrip: 'Change this itinerary',
      waMessage: (code, name, duration) =>
        `Hi Intravest, I would like to inquire about ${code} ${name} (${duration}).`,
      form: {
        title: 'Send an inquiry',
        intro: 'Tell us when you would like to go and how many of you there are. We reply within a few hours.',
        name: 'Your name',
        email: 'Email',
        date: 'Approximate travel date',
        dateHint: 'A rough date is fine.',
        pax: 'Number of travelers',
        notes: 'Anything we should know',
        notesHint: 'Optional. Dietary needs, children, mobility, special occasions.',
        submit: 'Send inquiry',
        privacy: 'We only use your details to reply to this inquiry.',
      },
    },
    destination: {
      packagesEmpty: (name) =>
        `Fixed packages for ${name} will be listed here. In the meantime, we can plan a trip around your dates.`,
    },
  },
  id: {
    index: {
      metaTitle: 'Paket Wisata | Intravest',
      description:
        'Itinerary tetap dengan guide lokal, hotel, transport, dan makan sudah termasuk. Mulai dari Bali, destinasi lain menyusul.',
      title: 'Paket Wisata',
      intro:
        'Itinerary tetap dengan harga yang dipublikasikan. Hotel, transport, makan, dan guide lokal sudah termasuk. Mau yang lain? Kami bisa ubah bagian mana pun, atau susun trip dari awal.',
      filterLabel: 'Filter berdasarkan destinasi',
      filterAll: 'Semua',
      empty: (d) => `Belum ada paket tetap untuk ${d}. Kirim tanggalmu dan kami susunkan tripnya.`,
    },
    card: { from: 'Mulai', perPerson: 'per orang', photoSoon: 'foto menyusul', details: 'Lihat itinerary' },
    page: {
      crumb: 'Paket Wisata',
      metaTitle: (name, code) => `Paket wisata ${name} (${code}) dengan guide lokal | Intravest`,
      photoSoon: 'foto menyusul',
      from: 'Mulai',
      perPerson: 'per orang',
      draftPrice: 'Harga masih indikatif. Harga final kami konfirmasi di penawaran.',
      minPax: (n) => `Dengan asumsi ${n} peserta`,
      itinerary: 'Itinerary',
      day: (n) => `Hari ${n}`,
      meals: 'Makan',
      stay: 'Menginap',
      inclusions: 'Sudah termasuk',
      exclusions: 'Belum termasuk',
      price: 'Harga',
      priceIntro:
        'Harga dalam Rupiah. DP 50% untuk mengonfirmasi booking, dan pelunasan paling lambat 7 hari sebelum keberangkatan.',
      cta: 'Tanya soal paket ini',
      customTrip: 'Ubah itinerary ini',
      waMessage: (code, name, duration) =>
        `Halo Intravest, saya ingin tanya soal ${code} ${name} (${duration}).`,
      form: {
        title: 'Kirim pertanyaan',
        intro: 'Kabari kami kapan kamu mau berangkat dan berapa orang. Kami balas dalam beberapa jam.',
        name: 'Nama kamu',
        email: 'Email',
        date: 'Perkiraan tanggal berangkat',
        dateHint: 'Perkiraan kasar juga boleh.',
        pax: 'Jumlah peserta',
        notes: 'Hal yang perlu kami tahu',
        notesHint: 'Opsional. Pantangan makanan, anak kecil, kondisi fisik, momen spesial.',
        submit: 'Kirim',
        privacy: 'Data kamu hanya dipakai untuk membalas pertanyaan ini.',
      },
    },
    destination: {
      packagesEmpty: (name) =>
        `Paket tetap untuk ${name} akan tampil di sini. Sementara itu, kami bisa menyusun trip sesuai tanggalmu.`,
    },
  },
};
