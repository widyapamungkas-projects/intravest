import type { Locale } from './i18n';

interface HomeCopy {
  meta: { title: string; description: string };
  hero: { title: string; sub: string; ctaPrimary: string; ctaSecondary: string; photo: string };
  why: { title: string; items: { title: string; body: string }[] };
  destinations: {
    title: string;
    all: string;
    photoSoon: string;
    items: { slug: string; name: string; tagline: string }[];
  };
  how: { title: string; steps: { title: string; body: string }[] };
  testimonials: { title: string; empty: string };
  cta: { title: string; sub: string; whatsapp: string };
}

export const homeCopy: Record<Locale, HomeCopy> = {
  en: {
    meta: {
      title: 'Intravest | Curated trips across Indonesia',
      description:
        'Curated trips across Indonesia with a local guide on every itinerary, realistic timing, and honest expectations. Planned and run by our own team.',
    },
    hero: {
      title: 'Indonesia trips that live up to the photos.',
      sub: 'Curated itineraries, a local guide on every trip, and a team that runs the ground operation itself. Timing is realistic and the price is clear.',
      ctaPrimary: 'Ask us on WhatsApp',
      ctaSecondary: 'Browse destinations',
      photo: 'Hero photo coming soon',
    },
    why: {
      title: 'What you can count on',
      items: [
        {
          title: 'Itineraries that work',
          body: 'We check timing against real travel times, so your days are full without feeling rushed.',
        },
        {
          title: 'A local guide on every trip',
          body: 'Included in every itinerary. It is part of the trip, not an add-on.',
        },
        {
          title: 'Honest about what to expect',
          body: 'We tell you what is beautiful, what is crowded, and what is not worth your time.',
        },
        {
          title: 'Priced for what you get',
          body: 'Not the cheapest, not the most expensive. Meals, hotels, and activities are picked because they fit, and the price shows it.',
        },
      ],
    },
    destinations: {
      title: 'Where we take you',
      all: 'All destinations',
      photoSoon: 'photo coming soon',
      items: [
        { slug: 'bali', name: 'Bali', tagline: 'Culture, nature, and activities that fill each day without rushing it.' },
        { slug: 'lombok', name: 'Lombok', tagline: 'Beaches, waterfalls, and a slower pace.' },
        { slug: 'labuan-bajo', name: 'Labuan Bajo', tagline: 'Island days around Komodo: boats, snorkeling, and sunsets.' },
        { slug: 'yogyakarta', name: 'Yogyakarta', tagline: 'Temples, craft villages, and Javanese food worth planning a day around.' },
      ],
    },
    how: {
      title: 'How it works',
      steps: [
        { title: 'Browse', body: 'Look through destinations and fixed packages, or describe the trip you have in mind.' },
        { title: 'Ask', body: 'Message us on WhatsApp or send the form. A real person replies within a few hours with a plan and a price.' },
        { title: 'Travel', body: 'Confirm with a deposit, pay the balance a week before departure, and meet your local guide when you arrive.' },
      ],
    },
    testimonials: {
      title: 'What travelers say',
      empty: 'Traveler reviews will appear here after our first trips. We only publish feedback guests have agreed to share.',
    },
    cta: {
      title: 'Tell us where you want to go.',
      sub: 'Share your dates and group size. We will reply with a plan and a price.',
      whatsapp: 'Message us on WhatsApp',
    },
  },
  id: {
    meta: {
      title: 'Intravest | Trip Indonesia yang dikurasi',
      description:
        'Trip Indonesia yang dikurasi, dengan guide lokal di setiap itinerary, jadwal realistis, dan ekspektasi yang jujur. Diatur dan dijalankan tim kami sendiri.',
    },
    hero: {
      title: 'Liburan Indonesia yang beneran worth it.',
      sub: 'Itinerary yang dikurasi, guide lokal di setiap trip, dan tim yang menjalankan operasional di lapangan sendiri. Jadwalnya realistis, harganya jelas.',
      ctaPrimary: 'Tanya lewat WhatsApp',
      ctaSecondary: 'Lihat destinasi',
      photo: 'Foto hero menyusul',
    },
    why: {
      title: 'Yang bisa kamu andalkan',
      items: [
        {
          title: 'Itinerary yang masuk akal',
          body: 'Jadwal kami cek terhadap waktu tempuh sebenarnya, jadi harimu padat tapi tidak buru-buru.',
        },
        {
          title: 'Guide lokal di setiap trip',
          body: 'Sudah termasuk di semua itinerary. Bagian dari trip, bukan tambahan.',
        },
        {
          title: 'Jujur soal ekspektasi',
          body: 'Kami bilang apa yang memang indah, apa yang ramai, dan apa yang tidak sepadan dengan waktumu.',
        },
        {
          title: 'Harga sesuai isi',
          body: 'Bukan yang paling murah, bukan yang paling mahal. Makan, hotel, dan aktivitas dipilih karena cocok, dan harganya menunjukkan itu.',
        },
      ],
    },
    destinations: {
      title: 'Ke mana kami mengajakmu',
      all: 'Semua destinasi',
      photoSoon: 'foto menyusul',
      items: [
        { slug: 'bali', name: 'Bali', tagline: 'Budaya, alam, dan aktivitas yang mengisi tiap hari tanpa terburu-buru.' },
        { slug: 'lombok', name: 'Lombok', tagline: 'Pantai, air terjun, dan ritme yang lebih santai.' },
        { slug: 'labuan-bajo', name: 'Labuan Bajo', tagline: 'Hari-hari di pulau sekitar Komodo: kapal, snorkeling, dan sunset.' },
        { slug: 'yogyakarta', name: 'Yogyakarta', tagline: 'Candi, desa kerajinan, dan kuliner Jawa yang layak disisihkan satu hari.' },
      ],
    },
    how: {
      title: 'Cara kerjanya',
      steps: [
        { title: 'Pilih', body: 'Lihat destinasi dan paket yang tersedia, atau ceritakan trip yang kamu bayangkan.' },
        { title: 'Tanya', body: 'Kirim pesan lewat WhatsApp atau isi formulir. Orang sungguhan membalas dalam hitungan jam, lengkap dengan rencana dan harga.' },
        { title: 'Berangkat', body: 'Konfirmasi dengan DP, lunasi seminggu sebelum berangkat, lalu bertemu guide lokalmu saat tiba.' },
      ],
    },
    testimonials: {
      title: 'Kata para traveler',
      empty: 'Ulasan traveler akan tampil di sini setelah trip pertama kami. Kami hanya menampilkan testimoni yang tamu setujui untuk dibagikan.',
    },
    cta: {
      title: 'Ceritakan ke mana kamu ingin pergi.',
      sub: 'Kirim tanggal dan jumlah peserta. Kami balas dengan rencana dan harga.',
      whatsapp: 'Chat kami di WhatsApp',
    },
  },
};
