import type { Locale } from './i18n';

interface Option {
  value: string;
  label: string;
}

interface CustomTripCopy {
  metaTitle: string;
  description: string;
  title: string;
  intro: string[];
  notOta: string;
  stepsTitle: string;
  steps: { title: string; text: string }[];
  formTitle: string;
  formIntro: string;
  name: string;
  email: string;
  whatsapp: string;
  whatsappHint: string;
  destinations: string;
  destinationsHint: string;
  duration: string;
  durationOptions: Option[];
  pax: string;
  date: string;
  dateHint: string;
  budget: string;
  budgetHint: string;
  budgetOptions: Option[];
  notes: string;
  notesHint: string;
  submit: string;
  privacy: string;
  select: string;
  waTitle: string;
  waText: string;
  waCta: string;
  waMessage: string;
}

export const customTripCopy: Record<Locale, CustomTripCopy> = {
  en: {
    metaTitle: 'Custom trips across Indonesia | Intravest',
    description:
      'Tell us what you want from the trip. We plan the itinerary, price it, and run it with our own team and local guides.',
    title: 'Plan a custom trip',
    intro: [
      'A custom trip starts from what you want, not from a list of packages. You tell us the places, the pace, and who is coming. We write an itinerary that fits, with realistic timing, and put a price on it.',
      'We are not a booking site. A person on our team reads your inquiry, plans the trip, and replies with a quote. The hotels, transport, meals, and guides are handled by our own team on the ground.',
    ],
    notOta: 'No booking engine, no auto-generated itinerary.',
    stepsTitle: 'How it works',
    steps: [
      { title: 'Tell us what you want', text: 'Fill in the form below, or message us on WhatsApp. Rough ideas are fine.' },
      { title: 'We write the itinerary', text: 'We plan the days, pick hotels that suit your group, and send a quote in IDR.' },
      { title: 'You review it', text: 'Change anything you like. We adjust the plan until it feels right.' },
      { title: 'You go', text: 'Confirm with a 50% deposit, pay the balance 7 days before, and we take it from there.' },
    ],
    formTitle: 'Tell us about your trip',
    formIntro: 'Share what you know so far. We reply within a few hours.',
    name: 'Your name',
    email: 'Email',
    whatsapp: 'WhatsApp number',
    whatsappHint: 'Optional. Include the country code. We usually reply faster on WhatsApp.',
    destinations: 'Where would you like to go?',
    destinationsHint: 'Pick as many as you like.',
    duration: 'How long',
    durationOptions: [
      { value: '2-3 days', label: '2 to 3 days' },
      { value: '4-5 days', label: '4 to 5 days' },
      { value: '6-7 days', label: '6 to 7 days' },
      { value: '8-10 days', label: '8 to 10 days' },
      { value: 'more than 10 days', label: 'More than 10 days' },
      { value: 'not sure', label: 'Not sure yet' },
    ],
    pax: 'Number of travelers',
    date: 'Approximate travel date',
    dateHint: 'A rough date is fine.',
    budget: 'Budget range per person',
    budgetHint: 'Optional. Excluding flights. It helps us pick hotels and activities that fit.',
    budgetOptions: [
      { value: 'under IDR 4,000,000', label: 'Under IDR 4,000,000' },
      { value: 'IDR 4,000,000 to 7,000,000', label: 'IDR 4,000,000 to 7,000,000' },
      { value: 'IDR 7,000,000 to 12,000,000', label: 'IDR 7,000,000 to 12,000,000' },
      { value: 'above IDR 12,000,000', label: 'Above IDR 12,000,000' },
    ],
    notes: 'Anything we should know',
    notesHint: 'Optional. Interests, pace, dietary needs, children, mobility, special occasions.',
    submit: 'Send inquiry',
    privacy: 'We only use your details to reply to this inquiry.',
    select: 'Prefer not to say',
    waTitle: 'Prefer to chat?',
    waText: 'Message us on WhatsApp and tell us about your trip in your own words.',
    waCta: 'Chat on WhatsApp',
    waMessage: 'Hi Intravest, I would like to plan a custom trip.',
  },
  id: {
    metaTitle: 'Custom trip ke berbagai tujuan di Indonesia | Intravest',
    description:
      'Ceritakan trip yang kamu mau. Kami susun itinerary, hitung harganya, dan jalankan bersama tim dan guide lokal kami sendiri.',
    title: 'Rencanakan trip custom',
    intro: [
      'Trip custom dimulai dari apa yang kamu mau, bukan dari daftar paket. Kamu cerita soal tempat, ritme, dan siapa saja yang ikut. Kami susun itinerary yang pas, dengan jadwal yang realistis, lalu kami beri harganya.',
      'Kami bukan situs booking. Seseorang dari tim kami membaca pesanmu, menyusun tripnya, dan membalas dengan penawaran. Hotel, transport, makan, dan guide diurus langsung oleh tim kami di lapangan.',
    ],
    notOta: 'Tanpa mesin booking, tanpa itinerary otomatis.',
    stepsTitle: 'Alurnya',
    steps: [
      { title: 'Ceritakan maumu', text: 'Isi form di bawah, atau kirim pesan lewat WhatsApp. Ide kasar juga cukup.' },
      { title: 'Kami susun itinerary', text: 'Kami atur harinya, pilih hotel yang cocok untuk rombonganmu, dan kirim penawaran dalam Rupiah.' },
      { title: 'Kamu review', text: 'Ubah bagian mana pun yang kamu mau. Kami sesuaikan sampai terasa pas.' },
      { title: 'Berangkat', text: 'Konfirmasi dengan DP 50%, lunasi 7 hari sebelumnya, dan sisanya kami yang urus.' },
    ],
    formTitle: 'Ceritakan rencana tripmu',
    formIntro: 'Isi yang sudah kamu tahu saja. Kami balas dalam beberapa jam.',
    name: 'Nama kamu',
    email: 'Email',
    whatsapp: 'Nomor WhatsApp',
    whatsappHint: 'Opsional. Pakai kode negara. Biasanya kami lebih cepat membalas lewat WhatsApp.',
    destinations: 'Mau ke mana?',
    destinationsHint: 'Boleh pilih lebih dari satu.',
    duration: 'Berapa lama',
    durationOptions: [
      { value: '2-3 hari', label: '2 sampai 3 hari' },
      { value: '4-5 hari', label: '4 sampai 5 hari' },
      { value: '6-7 hari', label: '6 sampai 7 hari' },
      { value: '8-10 hari', label: '8 sampai 10 hari' },
      { value: 'lebih dari 10 hari', label: 'Lebih dari 10 hari' },
      { value: 'belum tahu', label: 'Belum tahu' },
    ],
    pax: 'Jumlah peserta',
    date: 'Perkiraan tanggal berangkat',
    dateHint: 'Perkiraan kasar juga boleh.',
    budget: 'Kisaran budget per orang',
    budgetHint: 'Opsional. Di luar tiket pesawat. Membantu kami memilih hotel dan aktivitas yang sesuai.',
    budgetOptions: [
      { value: 'di bawah Rp 4.000.000', label: 'Di bawah Rp 4.000.000' },
      { value: 'Rp 4.000.000 sampai 7.000.000', label: 'Rp 4.000.000 sampai 7.000.000' },
      { value: 'Rp 7.000.000 sampai 12.000.000', label: 'Rp 7.000.000 sampai 12.000.000' },
      { value: 'di atas Rp 12.000.000', label: 'Di atas Rp 12.000.000' },
    ],
    notes: 'Hal yang perlu kami tahu',
    notesHint: 'Opsional. Minat, ritme perjalanan, pantangan makanan, anak kecil, kondisi fisik, momen spesial.',
    submit: 'Kirim',
    privacy: 'Data kamu hanya dipakai untuk membalas pertanyaan ini.',
    select: 'Tidak ingin menyebutkan',
    waTitle: 'Lebih enak ngobrol?',
    waText: 'Kirim pesan lewat WhatsApp dan ceritakan tripmu dengan bahasamu sendiri.',
    waCta: 'Chat lewat WhatsApp',
    waMessage: 'Halo Intravest, saya ingin merencanakan trip custom.',
  },
};
