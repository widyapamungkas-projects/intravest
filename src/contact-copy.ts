import type { Locale } from './i18n';

interface ContactCopy {
  metaTitle: string;
  description: string;
  title: string;
  intro: string;
  waTitle: string;
  waText: string;
  waCta: string;
  waMessage: string;
  emailTitle: string;
  emailText: string;
  emailCta: string;
  addressTitle: string;
  responseNote: string;
  formTitle: string;
  formIntro: string;
  name: string;
  email: string;
  message: string;
  messageHint: string;
  submit: string;
  privacy: string;
  planLink: string;
}

export const contactCopy: Record<Locale, ContactCopy> = {
  en: {
    metaTitle: 'Contact | Intravest',
    description:
      'Message us on WhatsApp or email to ask about a trip in Indonesia. We reply within a few hours.',
    title: 'Contact',
    intro: 'Questions about a trip, a package, or dates? Message us and a person from our team will reply.',
    waTitle: 'WhatsApp',
    waText: 'The fastest way to reach us. Send a message and tell us where you want to go.',
    waCta: 'Chat on WhatsApp',
    waMessage: 'Hi Intravest, I would like to inquire about a trip to Indonesia.',
    emailTitle: 'Email',
    emailText: 'Better for longer questions or if you want to send details in one go.',
    emailCta: 'Send an email',
    addressTitle: 'Our office',
    responseNote: 'We respond within a few hours.',
    formTitle: 'Or send a message here',
    formIntro: 'Leave your email and we will reply there.',
    name: 'Your name',
    email: 'Email',
    message: 'Message',
    messageHint: 'Where you want to go, when, and how many of you. Rough ideas are fine.',
    submit: 'Send message',
    privacy: 'We only use your details to reply to this message.',
    planLink: 'Already know what you want? Plan a custom trip',
  },
  id: {
    metaTitle: 'Kontak | Intravest',
    description:
      'Kirim pesan lewat WhatsApp atau email untuk tanya soal trip di Indonesia. Kami balas dalam beberapa jam.',
    title: 'Kontak',
    intro: 'Ada pertanyaan soal trip, paket, atau tanggal? Kirim pesan, dan seseorang dari tim kami akan membalas.',
    waTitle: 'WhatsApp',
    waText: 'Cara tercepat menghubungi kami. Kirim pesan dan ceritakan mau ke mana.',
    waCta: 'Chat lewat WhatsApp',
    waMessage: 'Halo Intravest, saya ingin tanya soal trip ke Indonesia.',
    emailTitle: 'Email',
    emailText: 'Lebih enak untuk pertanyaan yang panjang atau kalau mau kirim detail sekaligus.',
    emailCta: 'Kirim email',
    addressTitle: 'Kantor kami',
    responseNote: 'Kami balas dalam beberapa jam.',
    formTitle: 'Atau kirim pesan di sini',
    formIntro: 'Tinggalkan emailmu dan kami balas ke sana.',
    name: 'Nama kamu',
    email: 'Email',
    message: 'Pesan',
    messageHint: 'Mau ke mana, kapan, dan berapa orang. Ide kasar juga cukup.',
    submit: 'Kirim pesan',
    privacy: 'Data kamu hanya dipakai untuk membalas pesan ini.',
    planLink: 'Sudah tahu maunya? Rencanakan trip custom',
  },
};
