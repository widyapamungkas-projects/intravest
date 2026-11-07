# Checklist Launch Intravest

Berdasarkan Lampiran C3 di `intravest-project-brief.md`, dicocokkan dengan kondisi situs saat ini (diperbarui 6 Nov 2026).

- `[x]` = sudah dicek dan lolos. Keterangan di belakangnya menjelaskan caranya.
- `[ ]` = belum selesai. Tag **(kamu)** berarti butuh keputusan, data, atau akun darimu. Tag **(setelah deploy)** berarti baru bisa dites setelah situs online.

## Konten

- [x] Halaman Home, About, Destinations (6), Tours (3 paket Bali), Custom Trip, Travel Stories, Contact: semua ada di EN dan ID, tanpa teks placeholder
- [ ] **(kamu)** Harga final BAL-01, BAL-02, BAL-03. Sekarang harga draf dan ditandai "indikatif" di halaman. Setelah final, set `priceIsDraft: false`
- [ ] **(kamu)** Tim produk memvalidasi itinerary ketiga paket (di brief masih "draft")
- [ ] **(kamu)** Tim produk membaca 3 artikel contoh sebelum publish (fakta, jam, dan cerita tempat)
- [ ] **(kamu)** Foto asli. Semua foto masih kotak placeholder. Saat diganti, pakai `<img>` dengan `width` dan `height` eksplisit serta `loading="lazy"`
- [x] Tidak ada stock photo generik (karena belum ada foto sama sekali)
- [x] Tidak ada kata terlarang brand (terbaik, terpercaya, nomor satu, terjangkau, layanan prima, eksklusif, hemat, promo) di kode dan konten
- [x] Tidak ada penyebutan bisnis induk atau B2B di halaman publik

## SEO

- [x] Meta title dan description di semua halaman, description maksimal 160 karakter (dipaksa schema)
- [x] hreflang EN dan ID per halaman, plus `x-default` ke EN. Artikel satu bahasa tidak punya hreflang ke halaman yang tidak ada
- [x] Sitemap dibuat otomatis. Catatan: alamatnya `/sitemap-index.xml`, bukan `/sitemap.xml` seperti di brief
- [x] `robots.txt` ada dan tidak memblokir Googlebot
- [x] Schema markup: TravelAgency (Bali), TouristTrip (paket), BlogPosting (artikel)
- [ ] **(setelah deploy)** Verifikasi domain di Google Search Console, submit `/sitemap-index.xml`
- [ ] **(kamu)** Isi `PUBLIC_GA4_ID` di Netlify. Kodenya sudah siap dan hanya aktif di build production. **(setelah deploy)** Cek pageview masuk di GA4 Realtime

## Dashboard konten

- [x] Konfigurasi Pages CMS (`.pages.yml`) untuk Destinasi, Paket Wisata, dan Cerita Perjalanan, EN dan ID. Semua field dicocokkan dengan 21 file konten asli
- [x] Destinasi dan paket: satu file per item (data umum sekali, teks EN dan ID di form yang sama). Pengaman build: destinasi paket valid, foto harus ada
- [x] Terjemah otomatis lewat gateway AI (`scripts/translate.mjs` + GitHub Action). Diuji dengan gateway tiruan: isi bahasa kosong, coba ulang kalau struktur salah, buat ulang kalau sumber berubah, tidak menimpa teks yang sudah dicek, gagal dengan aman kalau kunci salah
- [ ] **(kamu)** Isi secret GitHub `AI_BASE_URL`, `AI_API_KEY`, `AI_MODEL` (lihat README), lalu tes dengan satu paket: kosongkan teks ID, simpan, tunggu Action. Kualitas terjemahan dengan modelmu belum teruji
- [x] Menu Pengaturan Situs (perusahaan, kontak, sosial) dan tombol share Travel Story. Auto-post Threads diuji dengan API tiruan
- [ ] **(kamu)** Auto-post Threads: buat app di Meta for Developers, isi secret `THREADS_USER_ID`, `THREADS_ACCESS_TOKEN`, dan `SITE_URL` di GitHub, lalu tes dengan satu artikel. Belum teruji ke API Threads asli
- [ ] **(kamu)** Login ke app.pagescms.org dengan GitHub, pasang app untuk repo `intravest`, lalu coba ubah satu paket dan simpan. Ini satu-satunya bagian yang tidak bisa kutes dari sini

## Teknis

- [x] Tidak ada tautan internal yang rusak (semua tautan dan aset di 35 halaman diperiksa terhadap hasil build)
- [x] Mobile responsive: dites di Chromium pada lebar 320, 360, 390, 768px untuk semua halaman. Tidak ada overflow horizontal, menu hamburger terlihat dan bisa dibuka
- [x] Target sentuh minimal 44px untuk semua tombol dan tautan navigasi
- [x] Kontras teks lolos WCAG AA 4.5:1 di mode terang dan gelap (10 jenis halaman, termasuk 404)
- [x] Font brand di-host sendiri (tidak ada permintaan ke Google), file utama di-preload
- [x] Halaman 404 ada, on-brand, dua bahasa, dan `noindex`
- [x] Tombol WhatsApp mengambang di semua halaman, pesan terisi sesuai paket atau destinasi (dites untuk BAL-02 dan Lombok)
- [ ] **(kamu)** Isi nomor WhatsApp asli di menu Pengaturan Situs (atau `PUBLIC_WHATSAPP_NUMBER` di Netlify). Selama belum diisi, semua tombol WhatsApp memakai nomor placeholder `628000000000`
- [ ] **(kamu)** Buat 3 form di Formspree dan isi `PUBLIC_FORMSPREE_CONTACT`, `PUBLIC_FORMSPREE_TOUR`, `PUBLIC_FORMSPREE_CUSTOM_TRIP`. **(setelah deploy)** Tes kirim tiap form dan pastikan email masuk ke inbox yang benar
- [ ] **(setelah deploy)** HTTPS aktif, tidak ada peringatan mixed content
- [ ] **(setelah deploy)** Core Web Vitals di PageSpeed Insights. Yang sudah dijaga di kode: tidak ada layout shift dari font (preload), tidak ada gambar tanpa dimensi

## Operasional

- [ ] **(kamu)** WhatsApp Business: nomor final, foto profil, deskripsi
- [ ] **(kamu)** Email `info@intravest.com` aktif dan masuk inbox
- [ ] **(kamu)** Tentukan dan briefing dedicated inquiry handler, serta SLA balas (target di brief: dalam beberapa jam)
- [ ] **(kamu)** Serahkan Lampiran C1 (template respons WhatsApp dan email) ke handler
- [ ] **(kamu)** Tes transaksi Doku berhasil
- [ ] **(kamu)** Putuskan kebijakan refund dan cancellation B2C, lalu tampilkan di website
- [ ] **(kamu)** Putuskan policy inquiry dari SG/MY/IN: ditangani langsung atau dirujuk ke partner (brief: harus diputuskan sebelum launch)

## Brand

- [ ] **(kamu)** Logo final: ganti `src/components/Logo.astro` dan `public/favicon.svg`. Sekarang masih placeholder
- [x] Favicon ada (SVG dan ICO), masih placeholder dari logo sementara
- [ ] **(kamu)** Gambar share (OG) final: ganti `public/og/default.jpg` (1200x630). Sekarang placeholder
- [ ] **(kamu)** URL Instagram, TikTok, Threads di menu Pengaturan Situs. Selama kosong, tautannya disembunyikan dari footer
- [ ] **(kamu)** Keputusan terbuka di brief: domain final, tagline final, cek trademark DJKI

## Soft launch (sebelum diumumkan)

- [ ] **(setelah deploy)** Tes alur lengkap: jelajah, halaman paket, inquiry WhatsApp, dapat balasan
- [x] Android Chrome di perangkat sungguhan (sudah dilihat langsung di HP, tampilan dan font)
- [ ] **(kamu)** Tes di iPhone (Safari), serta Firefox dan Safari di desktop. Chromium sudah dites otomatis
- [ ] **(kamu)** Owner review akhir semua halaman utama, EN dan ID
