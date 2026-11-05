import type { Locale } from './i18n';

interface AboutCopy {
  metaTitle: string;
  description: string;
  eyebrow: string;
  title: string;
  intro: string;
  storyTitle: string;
  storyBody: string[];
  principlesTitle: string;
  principles: { title: string; body: string }[];
  operationsTitle: string;
  operationsIntro: string;
  destinations: string[];
  note: string;
  promiseTitle: string;
  promiseBody: string;
  ctaTitle: string;
  ctaBody: string;
  ctaPrimary: string;
  ctaSecondary: string;
}

export const aboutCopy: Record<Locale, AboutCopy> = {
  en: {
    metaTitle: 'About Intravest | Indonesia Travel Story',
    description:
      'Meet Intravest, a curated Indonesian travel operator built on established ground operations, realistic itineraries, and local knowledge.',
    eyebrow: 'Indonesia Travel Story',
    title: 'Travel should feel worth it, not just look good on paper.',
    intro:
      'Intravest is a B2C travel brand built on the operating capability of an established Indonesian wholesale travel business. We created it for travelers who want a trip that makes sense in real life — not the cheapest option, not unnecessary luxury, and not an itinerary designed only to look impressive.',
    storyTitle: 'Why Intravest exists',
    storyBody: [
      'A good trip is rarely about fitting the most stops into a day. Timing matters. The right hotel matters. Meals matter. Having someone local who knows what actually works matters.',
      'Our role is to curate those pieces into a trip with clear value. Fixed packages give you a practical starting point, while custom trips let us shape the details around the way you travel.',
      'We are not an OTA or a marketplace. We do not fill the site with third-party listings and leave you to figure out which one is right.',
    ],
    principlesTitle: 'How we think about a good trip',
    principles: [
      {
        title: 'Curated, not crowded',
        body: 'We prioritise realistic timing and the parts of a destination that are actually worth your time.',
      },
      {
        title: 'Local guidance is part of the trip',
        body: 'A local guide is a core part of our itinerary standard, not an optional extra added at the end.',
      },
      {
        title: 'Honest representation',
        body: 'We would rather explain what a place is really like than oversell an experience that cannot match the expectation.',
      },
      {
        title: 'Value over cheap',
        body: 'Worth it means the experience, comfort, support, and price make sense together — not simply finding the lowest number.',
      },
    ],
    operationsTitle: 'Built on ground operations across Indonesia',
    operationsIntro:
      'Intravest uses an existing operating network for hotels, transport, restaurants, destination teams, and freelance local guides. Coordination is controlled from Bali, with on-ground support in the destinations we operate.',
    destinations: ['Bali', 'Lombok', 'Labuan Bajo', 'Yogyakarta', 'Surabaya', 'Jakarta–Bandung'],
    note:
      'Intravest is a separate B2C brand and channel. The operating capability is shared with the existing wholesale business, while the consumer brand, positioning, and pricing policy remain separate.',
    promiseTitle: 'Our promise',
    promiseBody:
      'A trip that is planned properly, supported locally, and clear about what you are paying for. Travel that is worth every rupiah.',
    ctaTitle: 'Tell us how you want to travel.',
    ctaBody:
      'Start with one of our curated trips or tell us what you have in mind. We will help turn it into an itinerary that actually works.',
    ctaPrimary: 'Plan a custom trip',
    ctaSecondary: 'Browse destinations',
  },
  id: {
    metaTitle: 'Tentang Intravest | Indonesia Travel Story',
    description:
      'Kenalan dengan Intravest, curated travel operator Indonesia yang dibangun di atas operasional ground handling, itinerary realistis, dan local knowledge.',
    eyebrow: 'Indonesia Travel Story',
    title: 'Liburan harus terasa worth it, bukan cuma terlihat bagus di itinerary.',
    intro:
      'Intravest adalah brand travel B2C yang dibangun di atas kapabilitas operasional bisnis wholesale travel Indonesia yang sudah berjalan. Kami membuatnya untuk traveler yang ingin perjalanan yang masuk akal saat dijalani — bukan yang paling murah, bukan mewah tanpa perlu, dan bukan itinerary yang hanya bagus dilihat di atas kertas.',
    storyTitle: 'Kenapa Intravest ada',
    storyBody: [
      'Trip yang enak bukan soal memasukkan sebanyak mungkin tempat dalam satu hari. Timing penting. Hotel yang pas penting. Makan yang layak penting. Punya orang lokal yang tahu kondisi lapangan juga penting.',
      'Peran kami adalah mengkurasi semuanya menjadi perjalanan dengan value yang jelas. Fixed package jadi titik awal yang praktis, sementara custom trip memberi ruang untuk menyesuaikan detail dengan cara kamu bepergian.',
      'Kami bukan OTA atau marketplace. Kami tidak memenuhi website dengan listing pihak ketiga lalu membiarkan kamu menebak mana yang cocok.',
    ],
    principlesTitle: 'Cara kami melihat sebuah trip yang bagus',
    principles: [
      {
        title: 'Dikurasi, bukan dipadatkan',
        body: 'Kami mengutamakan timing realistis dan bagian destinasi yang memang layak memakai waktu kamu.',
      },
      {
        title: 'Guide lokal adalah bagian dari trip',
        body: 'Guide lokal menjadi standar utama dalam itinerary kami, bukan tambahan opsional di belakang.',
      },
      {
        title: 'Representasi yang jujur',
        body: 'Kami lebih memilih menjelaskan kondisi destinasi apa adanya daripada membangun ekspektasi yang tidak bisa dipenuhi.',
      },
      {
        title: 'Value, bukan sekadar murah',
        body: 'Worth it berarti pengalaman, kenyamanan, pendampingan, dan harga terasa sepadan — bukan sekadar mencari angka paling rendah.',
      },
    ],
    operationsTitle: 'Dibangun di atas operasional lapangan di Indonesia',
    operationsIntro:
      'Intravest menggunakan jaringan operasional existing untuk hotel, transportasi, restoran, tim destinasi, dan guide lokal freelance. Koordinasi dikontrol dari Bali dengan dukungan tim lapangan di destinasi yang kami operasikan.',
    destinations: ['Bali', 'Lombok', 'Labuan Bajo', 'Yogyakarta', 'Surabaya', 'Jakarta–Bandung'],
    note:
      'Intravest adalah brand dan channel B2C yang terpisah. Kapabilitas operasional digunakan bersama bisnis wholesale existing, sementara brand konsumen, positioning, dan kebijakan harga tetap dipisahkan.',
    promiseTitle: 'Janji kami',
    promiseBody:
      'Perjalanan yang direncanakan dengan benar, terdampingi secara lokal, dan jelas value dari setiap biaya yang kamu keluarkan. Liburan yang worth it.',
    ctaTitle: 'Ceritakan cara kamu ingin liburan.',
    ctaBody:
      'Mulai dari trip yang sudah kami kurasi atau ceritakan rencana kamu. Kami bantu mengubahnya menjadi itinerary yang benar-benar bisa dijalankan.',
    ctaPrimary: 'Buat custom trip',
    ctaSecondary: 'Lihat destinasi',
  },
};
