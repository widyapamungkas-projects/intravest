import type { Locale } from './i18n';

export const navKeys = ['about', 'destinations', 'tours', 'custom-trip', 'travel-stories', 'contact'] as const;
export type NavKey = (typeof navKeys)[number];

interface UiStrings {
  nav: Record<NavKey, string>;
  navLabel: string;
  whatsapp: string;
  menu: string;
  language: string;
  replyBadge: string;
  theme: string;
  skip: string;
  footer: { explore: string; contact: string; follow: string; rights: string; destinations: string; payTitle: string; payBody: string };
}

export const ui: Record<Locale, UiStrings> = {
  en: {
    nav: {
      about: 'About',
      destinations: 'Destinations',
      tours: 'Tours',
      'custom-trip': 'Custom Trip',
      'travel-stories': 'Travel Stories',
      contact: 'Contact',
    },
    navLabel: 'Main navigation',
    whatsapp: 'WhatsApp us',
    menu: 'Menu',
    language: 'Language',
    replyBadge: 'Replies within a few hours',
    theme: 'Switch light or dark mode',
    skip: 'Skip to content',
    footer: {
      explore: 'Explore',
      contact: 'Get in touch',
      follow: 'Follow us',
      rights: 'All rights reserved.',
      destinations: 'Destinations and packages',
      payTitle: 'Inquiry and payment',
      payBody: 'Inquiry first, then a custom quote. 30-50% down payment through Doku (bank transfer, QRIS, or e-wallet). The balance is due 7 days before departure.',
    },
  },
  id: {
    nav: {
      about: 'Tentang Kami',
      destinations: 'Destinasi',
      tours: 'Paket Wisata',
      'custom-trip': 'Custom Trip',
      'travel-stories': 'Cerita Perjalanan',
      contact: 'Kontak',
    },
    navLabel: 'Navigasi utama',
    whatsapp: 'Chat WhatsApp',
    menu: 'Menu',
    language: 'Bahasa',
    replyBadge: 'Dibalas dalam hitungan jam',
    theme: 'Ganti mode terang atau gelap',
    skip: 'Langsung ke konten',
    footer: {
      explore: 'Jelajahi',
      contact: 'Hubungi kami',
      follow: 'Ikuti kami',
      rights: 'Hak cipta dilindungi.',
      destinations: 'Destinasi dan paket',
      payTitle: 'Inquiry dan pembayaran',
      payBody: 'Inquiry dulu, lalu penawaran custom. DP 30-50% lewat Doku (transfer bank, QRIS, atau e-wallet). Pelunasan paling lambat 7 hari sebelum berangkat.',
    },
  },
};
