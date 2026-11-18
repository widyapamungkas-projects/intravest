import type { Locale } from './i18n';

// Copy for the home page sections added in the commercial-portal layout (finder, packages, stories, standard).
interface HomeUi {
  hero: { badge: string; ctaPackages: string; ctaCustom: string; prev: string; next: string; goTo: (n: number) => string; label: string };
  finder: {
    label: string;
    tabs: { fixed: string; custom: string; group: string };
    destination: string;
    duration: string;
    durationAll: string;
    travelers: string;
    travelerOptions: string[];
    findPackages: string;
    customDest: string;
    customDestOptions: string[];
    customDuration: string;
    customDurationOptions: string[];
    customPax: string;
    customPaxOptions: string[];
    style: string;
    styleOptions: string[];
    requestQuote: string;
    groupType: string;
    groupTypeOptions: string[];
    groupSize: string;
    groupSizeOptions: string[];
    dates: string;
    dateOptions: string[];
    sendGroup: string;
    note: string;
    waCustom: (dest: string, dur: string, pax: string, style: string) => string;
    waGroup: (dest: string, type: string, size: string, dates: string) => string;
  };
  destinations: { eyebrow: string; sub: string; seeAll: (n: number) => string; explore: string; flagship: string };
  packages: {
    eyebrow: string;
    title: string;
    sub: string;
    all: string;
    guide: string;
    meals: string;
    car: string;
    from: string;
    perPerson: string;
    view: string;
    whatsapp: string;
    empty: string;
    draft: string;
    dialog: { close: string; day: (n: number) => string; meals: string; stay: string; included: string; notIncluded: string; fullPage: string };
  };
  stories: { eyebrow: string; title: string; sub: string; all: string; read: string };
  standard: { eyebrow: string; title: string; items: { title: string; body: string }[] };
  cta: { custom: string };
}

export const homeUiCopy: Record<Locale, HomeUi> = {
  en: {
    hero: {
      badge: 'Self-operated from Bali',
      ctaPackages: 'Explore Bali packages',
      ctaCustom: 'Plan a custom trip',
      prev: 'Previous photo',
      next: 'Next photo',
      goTo: (n) => `Show photo ${n}`,
      label: 'Featured destinations',
    },
    finder: {
      label: 'Trip finder',
      tabs: { fixed: 'Fixed Packages', custom: 'Custom Trip Quote', group: 'Small Group (4-12 pax)' },
      destination: 'Destination',
      duration: 'Duration',
      durationAll: 'All durations',
      travelers: 'Travelers',
      travelerOptions: ['2 adults', '3 adults', '4 adults', '2 adults + 1 child', '2 adults + 2 children', '5 or more'],
      findPackages: 'Find packages',
      customDest: 'Destinations',
      customDestOptions: ['Bali', 'Bali + Lombok', 'Bali + Labuan Bajo', 'Bali + Java', 'Not sure yet'],
      customDuration: 'Duration',
      customDurationOptions: ['4-5 days', '6-7 days', '8+ days'],
      customPax: 'Travelers',
      customPaxOptions: ['2', '3-4', '5-8'],
      style: 'Travel style',
      styleOptions: ['Relaxed', 'Culture and food', 'Active', 'A mix'],
      requestQuote: 'Request a quote',
      groupType: 'Group type',
      groupTypeOptions: ['Family', 'Friends'],
      groupSize: 'Group size',
      groupSizeOptions: ['4-6', '7-9', '10-12'],
      dates: 'Estimated dates',
      dateOptions: ['Next 3 months', 'In 3 to 6 months', 'Later than that', 'Not sure yet'],
      sendGroup: 'Send group inquiry',
      note: 'Nothing is booked or paid on this site. We reply with a proper itinerary and price first.',
      waCustom: (d, du, p, s) => `Hi Intravest, I would like a custom trip quote. Destinations: ${d}. Duration: ${du}. Travelers: ${p}. Style: ${s}.`,
      waGroup: (d, t, s, dt) => `Hi Intravest, I would like to ask about a small group trip. Destination: ${d}. Group: ${t}, ${s} people. Dates: ${dt}.`,
    },
    destinations: {
      eyebrow: 'Where we operate',
      sub: 'Six destinations, planned and run by our own team, coordinated from Bali.',
      seeAll: (n) => `See all (${n})`,
      explore: 'Explore',
      flagship: 'Flagship',
    },
    packages: {
      eyebrow: 'Flagship destination: Bali',
      title: 'Featured Bali Packages',
      sub: 'Fixed itineraries with a local guide and a meal budget of IDR 175,000-250,000 per person.',
      all: 'All Bali',
      guide: 'Local guide included',
      meals: 'Meals IDR 175k-250k/pax',
      car: 'Private car',
      from: 'Starting from',
      perPerson: '/ person',
      view: 'View itinerary',
      whatsapp: 'WhatsApp',
      empty: 'No fixed package for this duration yet. Tell us what you have in mind and we will shape one.',
      draft: 'Prices are indicative. We confirm the final price in your quote.',
      dialog: { close: 'Close itinerary', day: (n) => `Day ${String(n).padStart(2, '0')}`, meals: 'Meals', stay: 'Stay', included: 'Included', notIncluded: 'Not included', fullPage: 'Open the full tour page' },
    },
    stories: { eyebrow: 'Indonesia Travel Story', title: 'Travel Stories', sub: 'Honest itinerary breakdowns and planning notes from our team.', all: 'All stories', read: 'Read story' },
    standard: {
      eyebrow: 'The Intravest standard',
      title: 'Why Travel with Intravest',
      items: [
        { title: 'Self-operated from Bali HQ', body: 'Our own team plans and runs each trip. We are not an aggregator or a reseller.' },
        { title: 'Realistic pacing, local guides', body: 'Timing that makes sense, with a licensed local guide as part of every itinerary.' },
        { title: 'Proper meals, clear value', body: 'A meal budget of IDR 175,000-250,000 per person, and prices shown up front.' },
      ],
    },
    cta: { custom: 'Plan a custom trip' },
  },
  id: {
    hero: {
      badge: 'Dikelola langsung dari Bali',
      ctaPackages: 'Lihat paket Bali',
      ctaCustom: 'Rancang trip sendiri',
      prev: 'Foto sebelumnya',
      next: 'Foto berikutnya',
      goTo: (n) => `Tampilkan foto ${n}`,
      label: 'Destinasi pilihan',
    },
    finder: {
      label: 'Pencari trip',
      tabs: { fixed: 'Paket Tetap', custom: 'Penawaran Custom Trip', group: 'Grup Kecil (4-12 orang)' },
      destination: 'Destinasi',
      duration: 'Durasi',
      durationAll: 'Semua durasi',
      travelers: 'Peserta',
      travelerOptions: ['2 dewasa', '3 dewasa', '4 dewasa', '2 dewasa + 1 anak', '2 dewasa + 2 anak', '5 orang atau lebih'],
      findPackages: 'Cari paket',
      customDest: 'Destinasi',
      customDestOptions: ['Bali', 'Bali + Lombok', 'Bali + Labuan Bajo', 'Bali + Jawa', 'Belum yakin'],
      customDuration: 'Durasi',
      customDurationOptions: ['4-5 hari', '6-7 hari', '8+ hari'],
      customPax: 'Peserta',
      customPaxOptions: ['2', '3-4', '5-8'],
      style: 'Gaya liburan',
      styleOptions: ['Santai', 'Budaya dan kuliner', 'Aktif', 'Campuran'],
      requestQuote: 'Minta penawaran',
      groupType: 'Tipe grup',
      groupTypeOptions: ['Keluarga', 'Teman'],
      groupSize: 'Jumlah peserta',
      groupSizeOptions: ['4-6', '7-9', '10-12'],
      dates: 'Perkiraan waktu',
      dateOptions: ['3 bulan ke depan', '3 sampai 6 bulan lagi', 'Lebih dari itu', 'Belum yakin'],
      sendGroup: 'Kirim pertanyaan grup',
      note: 'Tidak ada pemesanan atau pembayaran di situs ini. Kami balas dengan itinerary dan harga dulu.',
      waCustom: (d, du, p, s) => `Halo Intravest, saya ingin minta penawaran custom trip. Destinasi: ${d}. Durasi: ${du}. Peserta: ${p}. Gaya: ${s}.`,
      waGroup: (d, t, s, dt) => `Halo Intravest, saya ingin tanya soal trip grup kecil. Destinasi: ${d}. Grup: ${t}, ${s} orang. Waktu: ${dt}.`,
    },
    destinations: {
      eyebrow: 'Tempat kami beroperasi',
      sub: 'Enam destinasi, diatur dan dijalankan tim kami sendiri, dikoordinasi dari Bali.',
      seeAll: (n) => `Lihat semua (${n})`,
      explore: 'Jelajahi',
      flagship: 'Unggulan',
    },
    packages: {
      eyebrow: 'Destinasi unggulan: Bali',
      title: 'Paket Bali Pilihan',
      sub: 'Itinerary tetap dengan guide lokal dan anggaran makan IDR 175.000-250.000 per orang.',
      all: 'Semua Bali',
      guide: 'Guide lokal termasuk',
      meals: 'Makan Rp175rb-250rb/orang',
      car: 'Mobil pribadi',
      from: 'Mulai dari',
      perPerson: '/ orang',
      view: 'Lihat itinerary',
      whatsapp: 'WhatsApp',
      empty: 'Belum ada paket tetap untuk durasi ini. Ceritakan yang kamu bayangkan, nanti kami susunkan.',
      draft: 'Harga bersifat indikatif. Harga final kami konfirmasi di penawaran.',
      dialog: { close: 'Tutup itinerary', day: (n) => `Hari ${String(n).padStart(2, '0')}`, meals: 'Makan', stay: 'Menginap', included: 'Termasuk', notIncluded: 'Tidak termasuk', fullPage: 'Buka halaman paket lengkap' },
    },
    stories: { eyebrow: 'Indonesia Travel Story', title: 'Cerita Perjalanan', sub: 'Catatan itinerary dan perencanaan yang jujur dari tim kami.', all: 'Semua cerita', read: 'Baca cerita' },
    standard: {
      eyebrow: 'Standar Intravest',
      title: 'Kenapa Liburan dengan Intravest',
      items: [
        { title: 'Dikelola sendiri dari Bali', body: 'Tim kami sendiri yang menyusun dan menjalankan tiap trip. Kami bukan agregator atau reseller.' },
        { title: 'Ritme realistis, guide lokal', body: 'Jadwal yang masuk akal, dengan guide lokal berlisensi di setiap itinerary.' },
        { title: 'Makan layak, nilai jelas', body: 'Anggaran makan Rp175.000-250.000 per orang, dan harga ditampilkan di awal.' },
      ],
    },
    cta: { custom: 'Rancang trip sendiri' },
  },
};
