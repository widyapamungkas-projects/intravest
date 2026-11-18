import type { Locale } from './i18n';

// Strings for the detail pop-ups (package and destination) used on the home, Tours and Destinations pages.
export const dialogCopy: Record<
  Locale,
  {
    close: string; day: (n: number) => string; meals: string; stay: string; included: string; notIncluded: string;
    fullPage: string; from: string; perPerson: string; whatsapp: string; payNote: string;
    form: { title: string; name: string; email: string; date: string; pax: string; paxValue: string; notes: string; preview: string; wa: string; mail: string; sla: string; notesPh: string };
    msg: { name: string; email: string; date: string; pax: string; notes: string; subject: (t: string) => string };
    dest: { departures: string; none: string; ask: string };
  }
> = {
  en: {
    close: 'Close', day: (n) => `Day ${String(n).padStart(2, '0')}`, meals: 'Meals', stay: 'Stay', included: 'Included', notIncluded: 'Not included',
    fullPage: 'Open the full page', from: 'Starting from', perPerson: '/ person', whatsapp: 'Ask on WhatsApp',
    payNote: 'Inquiry first, no instant card charge. Confirm your dates with a 30-50% down payment through Doku (bank transfer, QRIS, or e-wallet). The balance is due 7 days before departure.',
    form: { title: 'Inquire about this package', name: 'Your name', email: 'Email', date: 'Travel date', pax: 'Travelers', paxValue: '2 adults', notes: 'Notes (diet, hotel, children)', preview: 'Your message preview', wa: 'Send via WhatsApp', mail: 'Send by email', sla: 'We reply within a few hours', notesPh: 'e.g. halal meals, boutique hotel' },
    msg: { name: 'Name', email: 'Email', date: 'Travel date', pax: 'Travelers', notes: 'Notes', subject: (t) => `Inquiry: ${t}` },
    dest: { departures: 'Available packages', none: 'No fixed package yet. Tell us your dates and we will plan it.', ask: 'Ask about this trip' },
  },
  id: {
    close: 'Tutup', day: (n) => `Hari ${String(n).padStart(2, '0')}`, meals: 'Makan', stay: 'Menginap', included: 'Termasuk', notIncluded: 'Tidak termasuk',
    fullPage: 'Buka halaman lengkap', from: 'Mulai dari', perPerson: '/ orang', whatsapp: 'Tanya via WhatsApp',
    payNote: 'Tanya dulu, tanpa tagihan kartu langsung. Konfirmasi tanggal dengan DP 30-50% lewat Doku (transfer bank, QRIS, atau e-wallet). Pelunasan paling lambat 7 hari sebelum keberangkatan.',
    form: { title: 'Tanya paket ini', name: 'Nama kamu', email: 'Email', date: 'Tanggal berangkat', pax: 'Jumlah peserta', paxValue: '2 dewasa', notes: 'Catatan (makanan, hotel, anak)', preview: 'Pratinjau pesan', wa: 'Kirim via WhatsApp', mail: 'Kirim lewat email', sla: 'Kami balas dalam beberapa jam', notesPh: 'mis. makanan halal, hotel butik' },
    msg: { name: 'Nama', email: 'Email', date: 'Tanggal berangkat', pax: 'Peserta', notes: 'Catatan', subject: (t) => `Pertanyaan: ${t}` },
    dest: { departures: 'Paket tersedia', none: 'Belum ada paket tetap. Kabari tanggalmu dan kami susunkan.', ask: 'Tanya soal trip ini' },
  },
};
