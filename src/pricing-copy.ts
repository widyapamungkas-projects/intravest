import type { Locale } from './i18n';

// Text for the price table and the self-service price calculator.
export interface PricingCopy {
  tabs: { itinerary: string; prices: string; calc: string };
  sendWa: string; sendMail: string; tabsLabel: string;
  fromCaption: (minPax: number, hotel: string) => string;
  validUntil: (d: string) => string;
  table: {
    title: string; intro: string; tierLegend: string; tierFor: (label: string) => string; adultsChip: (label: string) => string;
    hotel: string; stars: (n: number) => string; single: string; twin: string; triple: string; childTwin: string; cwb: string; cnb: string; highSeason: string; perPerson: string;
    leadLegend: string; notes: { label: string; text: string }[]; highSeasonNote: string;
  };
  sim: {
    title: string; intro: string; hotel: string; adults: string; adultsHint: string; children: string; addChild: string; childN: (n: number) => string; ageAria: (n: number) => string;
    under1: string; years: (n: number) => string; removeAria: (n: number) => string; decAdults: string; incAdults: string; highSeason: string;
    tierNote: (label: string) => string; tierSolo: string; noAdult: string; guests: string;
    adultsN: (n: number) => string; kidsN: (n: number) => string; youngN: (n: number) => string; infantsN: (n: number) => string;
    roomsTitle: string; recommended: string; alternative: string; custom: string; customHint: string; roomsN: (n: number) => string;
    allSeated: string; missing: (a: number, k: number, y: number) => string; extra: (a: number, k: number, y: number) => string;
    breakdown: string; roomN: (n: number) => string; surcharge: (people: number, each: string) => string; total: string; infantNote: string; disclaimer: string;
    roomHints: Record<string, string>; decRoom: (l: string) => string; incRoom: (l: string) => string; none: string;
    msg: { hotel: string; guests: string; rooms: string; season: string; seasonYes: string; seasonNo: string; estimate: string };
  };
}

export const pricingCopy: Record<Locale, PricingCopy> = {
  en: {
    tabs: { itinerary: 'Itinerary', prices: 'Prices', calc: 'Calculate your trip' },
    sendWa: 'Send via WhatsApp', sendMail: 'Send by email', tabsLabel: 'Package details',
    fromCaption: (n, h) => `twin share, min. ${n} adults, ${h}`,
    validUntil: (d) => `Prices valid until ${d}`,
    table: {
      title: 'Price per person (IDR)', intro: 'Choose the number of adults. The table updates.', tierLegend: 'Number of adults', tierFor: (l) => `Prices for ${l} adults`, adultsChip: (l) => `${l} adults`,
      hotel: 'Hotel', stars: (n) => `${n}-star`, single: 'Single', twin: 'Twin share', triple: 'Triple share', childTwin: 'Child twin', cwb: 'CWB', cnb: 'CNB', highSeason: 'High season surcharge', perPerson: 'per person',
      leadLegend: 'Price shown as "from" on the package card',
      notes: [
        { label: 'Single', text: '1 adult in one room.' },
        { label: 'Twin / Triple share', text: '2 / 3 adults sharing a room. Price is per person.' },
        { label: 'Child twin', text: '1 adult + 1 child (age 4–12) in one room.' },
        { label: 'CWB (child with bed)', text: '2 adults + 1 child (age 4–12) with an extra bed.' },
        { label: 'CNB (child no bed)', text: '2 adults + 1 child (age 1–3) sharing the parents\' bed.' },
        { label: 'Example', text: '2 adults + 1 child + 1 infant = twin share + CWB + CNB.' },
      ],
      highSeasonNote: 'Added per person on high season dates. Not included in the base prices.',
    },
    sim: {
      title: 'Calculate your trip', intro: 'Choose a hotel and tell us who is travelling. We suggest the rooms and work out an estimate. You can change the rooms.',
      hotel: 'Hotel', adults: 'Adults', adultsHint: 'age 13 and over', children: 'Children and infants (age on the travel date)', addChild: '+ Add a child or infant', childN: (n) => `Child ${n}`, ageAria: (n) => `Age of child ${n}`,
      under1: 'Under 1 year', years: (n) => `${n} ${n === 1 ? 'year' : 'years'}`, removeAria: (n) => `Remove child ${n}`, decAdults: 'Fewer adults', incAdults: 'More adults',
      highSeason: 'My travel dates are in the high season (adds the high season surcharge)',
      tierNote: (l) => `Prices use the ${l} adults tier.`, tierSolo: 'With 1 adult the estimate uses the 2 adults tier. We confirm the final price.', noAdult: 'At least 1 adult is needed. Children and infants travel with an adult.',
      guests: 'Travellers',
      adultsN: (n) => `${n} ${n === 1 ? 'adult' : 'adults'}`, kidsN: (n) => `${n} ${n === 1 ? 'child' : 'children'} (4–12)`, youngN: (n) => `${n} ${n === 1 ? 'child' : 'children'} (1–3)`, infantsN: (n) => `${n} ${n === 1 ? 'infant' : 'infants'}`,
      roomsTitle: 'Rooms', recommended: 'Suggested', alternative: 'Alternative', custom: 'Choose my own rooms', customHint: 'Set how many of each room type.', roomsN: (n) => `${n} ${n === 1 ? 'room' : 'rooms'}`,
      allSeated: 'Everyone has a room.',
      missing: (a, k, y) => [a && `${a} adult${a > 1 ? 's' : ''}`, k && `${k} child${k > 1 ? 'ren' : ''} (4–12)`, y && `${y} child${y > 1 ? 'ren' : ''} (1–3)`].filter(Boolean).join(', ') + ' still need a room.',
      extra: (a, k, y) => 'Too many places: ' + [a && `${a} adult`, k && `${k} child (4–12)`, y && `${y} child (1–3)`].filter(Boolean).join(', ') + '.',
      breakdown: 'Estimate breakdown', roomN: (n) => `Room ${n}`, surcharge: (p, e) => `High season surcharge (${p} × ${e})`, total: 'Estimated total (IDR)', infantNote: 'Infants under 1 are not in this estimate. We confirm with you.',
      disclaimer: 'This is an estimate. We confirm the final price after your inquiry.',
      roomHints: { SGL: '1 adult', TWN: '2 adults', TRP: '3 adults', CT: '1 adult + 1 child 4–12', CWB: '2 adults + 1 child 4–12', CNB: '2 adults + 1 child 1–3', SCNB: '1 adult + 1 child 1–3', CWBNB: '2 adults + child 4–12 + child 1–3' },
      decRoom: (l) => `Fewer ${l} rooms`, incRoom: (l) => `More ${l} rooms`, none: 'none',
      msg: { hotel: 'Hotel', guests: 'Travellers', rooms: 'Rooms', season: 'High season', seasonYes: 'yes', seasonNo: 'no', estimate: 'Estimate from the website' },
    },
  },
  id: {
    tabs: { itinerary: 'Itinerary', prices: 'Harga', calc: 'Hitung sendiri' },
    sendWa: 'Kirim via WhatsApp', sendMail: 'Kirim lewat email', tabsLabel: 'Detail paket',
    fromCaption: (n, h) => `twin share, min. ${n} dewasa, ${h}`,
    validUntil: (d) => `Harga berlaku sampai ${d}`,
    table: {
      title: 'Harga per orang (IDR)', intro: 'Pilih jumlah dewasa. Tabel menyesuaikan.', tierLegend: 'Jumlah dewasa', tierFor: (l) => `Harga untuk ${l} dewasa`, adultsChip: (l) => `${l} dewasa`,
      hotel: 'Hotel', stars: (n) => `Bintang ${n}`, single: 'Single', twin: 'Twin share', triple: 'Triple share', childTwin: 'Child twin', cwb: 'CWB', cnb: 'CNB', highSeason: 'High season surcharge', perPerson: 'per orang',
      leadLegend: 'Harga "mulai dari" di kartu paket',
      notes: [
        { label: 'Single', text: '1 dewasa dalam satu kamar.' },
        { label: 'Twin / Triple share', text: '2 / 3 dewasa sekamar. Harga per orang.' },
        { label: 'Child twin', text: '1 dewasa + 1 anak (usia 4–12) dalam satu kamar.' },
        { label: 'CWB (child with bed)', text: '2 dewasa + 1 anak (usia 4–12) dengan extra bed.' },
        { label: 'CNB (child no bed)', text: '2 dewasa + 1 anak (usia 1–3) tidur satu bed dengan orang tua.' },
        { label: 'Contoh', text: '2 dewasa + 1 anak + 1 bayi = twin share + CWB + CNB.' },
      ],
      highSeasonNote: 'Ditambahkan per orang pada tanggal musim ramai. Tidak termasuk di harga dasar.',
    },
    sim: {
      title: 'Hitung sendiri', intro: 'Pilih hotel dan isi siapa saja yang berangkat. Kami sarankan susunan kamar dan menghitung estimasinya. Susunan kamar bisa kamu ubah.',
      hotel: 'Hotel', adults: 'Dewasa', adultsHint: 'usia 13 tahun ke atas', children: 'Anak dan bayi (usia saat berangkat)', addChild: '+ Tambah anak atau bayi', childN: (n) => `Anak ${n}`, ageAria: (n) => `Usia anak ${n}`,
      under1: 'Di bawah 1 tahun', years: (n) => `${n} tahun`, removeAria: (n) => `Hapus anak ${n}`, decAdults: 'Kurangi dewasa', incAdults: 'Tambah dewasa',
      highSeason: 'Tanggal perjalananku di musim ramai (menambah high season surcharge)',
      tierNote: (l) => `Harga memakai tier ${l} dewasa.`, tierSolo: 'Untuk 1 dewasa, estimasi memakai tier 2 dewasa. Harga final kami konfirmasi.', noAdult: 'Minimal 1 dewasa. Anak dan bayi berangkat bersama dewasa.',
      guests: 'Peserta',
      adultsN: (n) => `${n} dewasa`, kidsN: (n) => `${n} anak (4–12)`, youngN: (n) => `${n} anak (1–3)`, infantsN: (n) => `${n} bayi`,
      roomsTitle: 'Kamar', recommended: 'Disarankan', alternative: 'Alternatif', custom: 'Atur kamar sendiri', customHint: 'Tentukan jumlah tiap jenis kamar.', roomsN: (n) => `${n} kamar`,
      allSeated: 'Semua peserta sudah dapat kamar.',
      missing: (a, k, y) => [a && `${a} dewasa`, k && `${k} anak (4–12)`, y && `${y} anak (1–3)`].filter(Boolean).join(', ') + ' belum dapat kamar.',
      extra: (a, k, y) => 'Kelebihan tempat: ' + [a && `${a} dewasa`, k && `${k} anak (4–12)`, y && `${y} anak (1–3)`].filter(Boolean).join(', ') + '.',
      breakdown: 'Rincian estimasi', roomN: (n) => `Kamar ${n}`, surcharge: (p, e) => `High season surcharge (${p} × ${e})`, total: 'Estimasi total (IDR)', infantNote: 'Bayi di bawah 1 tahun tidak dihitung di estimasi ini. Kami konfirmasi ke kamu.',
      disclaimer: 'Ini estimasi. Harga final kami konfirmasi setelah kamu mengirim pertanyaan.',
      roomHints: { SGL: '1 dewasa', TWN: '2 dewasa', TRP: '3 dewasa', CT: '1 dewasa + 1 anak 4–12', CWB: '2 dewasa + 1 anak 4–12', CNB: '2 dewasa + 1 anak 1–3', SCNB: '1 dewasa + 1 anak 1–3', CWBNB: '2 dewasa + anak 4–12 + anak 1–3' },
      decRoom: (l) => `Kurangi kamar ${l}`, incRoom: (l) => `Tambah kamar ${l}`, none: 'tidak ada',
      msg: { hotel: 'Hotel', guests: 'Peserta', rooms: 'Kamar', season: 'Musim ramai', seasonYes: 'ya', seasonNo: 'tidak', estimate: 'Estimasi dari situs' },
    },
  },
};
