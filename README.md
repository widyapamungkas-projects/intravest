# Intravest — Indonesia Travel Story

Website B2C Intravest: curated travel operator, inquiry-based (bukan booking engine). Bilingual `/en/` dan `/id/`.
Acuan: `intravest-project-brief.md` dan `intravest-business-plan.md`.

**Stack:** Astro 7 (static) · Tailwind CSS 4 · TypeScript · MDX content collections · Formspree (form) · Netlify (hosting)

## Setup dan development

Butuh Node >= 22.23.4.

```bash
npm install
cp .env.example .env     # isi nilai asli, lihat tabel di bawah
npm run dev              # http://localhost:4321
```

| Command | Fungsi |
|---|---|
| `npm run dev` | Dev server |
| `npm run check` | Type check (`astro check`) |
| `npm run build` | Check + build produksi ke `dist/` |
| `npm run preview` | Preview hasil build |

## Environment variables

Semua variabel `PUBLIC_*` ikut masuk ke HTML publik, jadi jangan simpan secret di sini.
Di Netlify: **Site configuration → Environment variables**.

| Variabel | Fungsi | Kalau kosong |
|---|---|---|
| `PUBLIC_WHATSAPP_NUMBER` | Nomor WA, angka saja dengan kode negara (`62812...`) | Pakai nomor placeholder, **tombol WA tidak akan sampai ke siapa pun** |
| `PUBLIC_WHATSAPP_DISPLAY` | Format tampilan nomor di footer/kontak | `+<nomor>` |
| `PUBLIC_EMAIL` | Email kontak | `info@intravest.com` |
| `PUBLIC_GA4_ID` | GA4 measurement ID (`G-XXXX`) | Analytics tidak dimuat. Hanya aktif di build produksi |
| `PUBLIC_FORMSPREE_CONTACT` | Endpoint form halaman Contact | Placeholder, form tidak terkirim |
| `PUBLIC_FORMSPREE_CUSTOM_TRIP` | Endpoint form Custom Trip | Placeholder, form tidak terkirim |
| `PUBLIC_FORMSPREE_TOUR` | Endpoint form inquiry di halaman paket | Placeholder, form tidak terkirim |

Setelah GA4 aktif, klik tombol WhatsApp tercatat sebagai event `whatsapp_click` (inquiry via WA tidak lewat website, jadi ini satu-satunya sinyalnya).

## Struktur

```
src/
  pages/en|id/...      Route per bahasa (slug ID diterjemahkan: /id/paket-wisata/, /id/destinasi/, ...)
  components/          Komponen halaman, Header, Footer, WhatsAppFloat
  layouts/BaseLayout   <head>: SEO, hreflang, OG, GA4, JSON-LD
  content/             destinations/ dan tours/ (satu .yml per item, EN+ID), stories/ (md per bahasa)
  loaders/             Pembaca konten dua bahasa
  *-copy.ts            Teks UI per halaman, per bahasa
  i18n.ts              Locale, tabel slug per bahasa, pasangan EN<->ID
  site.ts              Kontak, sosial media, deskripsi default (satu tempat untuk diedit)
  schema.ts            JSON-LD homepage
  styles/global.css    Design tokens (OKLCH, light + dark)
scripts/               check-content (pengaman build), translate (terjemah AI), post-threads
.github/workflows/     Terjemah otomatis
public/                favicon, robots.txt, og/ (gambar share)
netlify.toml           Build, redirect bahasa, security headers
```

## Menambah konten

Destinasi dan paket wisata: **satu file per item**, `src/content/tours/<slug>.yml` atau `src/content/destinations/<slug>.yml`. Isinya data umum (kode, harga, hari, malam, foto, urutan) sekali saja, lalu bagian `en:` dan `id:` untuk teks. Schema ada di `src/content.config.ts` dan build gagal kalau salah.

- **Paket baru:** salin salah satu file di `src/content/tours/`, ganti isinya. `itinerary` harus punya satu entri per hari.
- **Destinasi:** sama, di `src/content/destinations/`. `description` maksimal 160 karakter.
- **Artikel (Travel Stories):** `src/content/stories/en|id/<slug>.md`, satu file per bahasa. Boleh hanya satu bahasa; artikel satu bahasa otomatis tidak dapat hreflang.
- **Harga:** `priceIsDraft: true` menandai harga belum final di halaman. Ubah ke `false` setelah harga disetujui.

## Mengelola konten lewat dashboard (tanpa coding)

Situs ini tidak punya backend. Konten adalah file di repo GitHub, dan setiap perubahan yang tersimpan otomatis membangun ulang situs di Netlify. Untuk mengisi dan mengedit konten lewat tampilan form, pakai [Pages CMS](https://pagescms.org) (gratis, tidak perlu mengubah kode situs). Konfigurasinya sudah ada di `.pages.yml`.

**Sekali saja:**

1. Buka [app.pagescms.org](https://app.pagescms.org) dan masuk dengan akun GitHub yang punya akses ke repo ini.
2. Pasang GitHub App Pages CMS dan beri akses ke repo `intravest`. Untuk repo di organisasi, ini perlu akun owner organisasi.
3. Pilih repo `intravest`, branch `main`. Menu konten akan muncul: Destinasi, Paket Wisata, Cerita Perjalanan (EN dan ID), Halaman Depan, dan Pengaturan Situs.

**Sehari-hari:** buka entri, ubah isinya, klik simpan. Pages CMS menyimpan sebagai commit ke `main`, lalu Netlify membangun ulang (sekitar 1 menit).

**Satu form untuk dua bahasa.** Di Destinasi dan Paket Wisata, bagian atas form berisi data umum yang berlaku untuk EN dan ID (harga, hari, foto, urutan), dan di bawahnya ada bagian "Teks Inggris (EN)" dan "Teks Indonesia (ID)". Harga atau foto cukup diisi sekali.

**Terjemahan otomatis.** Tulis satu bahasa saja, kosongkan Nama/Judul bahasa lainnya, simpan. GitHub Action `translate.yml` memanggil gateway AI-mu dan mengisi bahasa yang kosong, ditandai "Terjemahan otomatis, perlu dicek". Baca hasilnya, perbaiki kalau perlu, lalu matikan "Perlu dicek". Selama masih menyala dan teks sumber berubah, terjemahannya dibuat ulang. Setelah dimatikan, tidak pernah ditimpa lagi. Selama menunggu terjemahan, halaman bahasa kosong memakai teks bahasa lain, jadi tombol ganti bahasa tidak pernah mengarah ke halaman yang tidak ada.

Pasang sekali di GitHub: **Settings → Secrets and variables → Actions → New repository secret**:

| Secret | Isi |
|---|---|
| `AI_BASE_URL` | Alamat dasar gateway, mis. `https://gateway.contoh.com/v1` (dipanggil `POST {AI_BASE_URL}/chat/completions`, format OpenAI) |
| `AI_API_KEY` | Kunci API gateway |
| `AI_MODEL` | Nama model yang dipakai gateway |
| `AI_API_STYLE` | Opsional. `anthropic` kalau gateway-mu memakai format Anthropic (`/v1/messages`). Kosong = format OpenAI |

Tanpa secret ini Action tidak melakukan apa-apa. Bisa dijalankan manual di tab **Actions → Translate content → Run workflow**, atau di komputer: `AI_BASE_URL=... AI_API_KEY=... AI_MODEL=... node scripts/translate.mjs` (`--dry` untuk melihat apa yang akan diterjemahkan). Hasil terjemahan selalu draf: baca dulu sebelum menganggapnya final, terutama itinerary dan angka.

Aturan yang dijaga otomatis saat build:

- Paket harus menunjuk destinasi yang ada, dan jumlah entri itinerary harus sama dengan jumlah hari.
- Foto yang dipilih harus ada di `src/assets/images`. Kalau tidak, build gagal dengan pesan jelas dan **situs yang sedang online tidak berubah** (Netlify tidak mempublikasikan build yang gagal).
- Deskripsi SEO maksimal 160 karakter.
- Peringatan (build tetap jalan): foto tanpa deskripsi, bahasa yang masih memakai teks bahasa lain, terjemahan otomatis yang belum dicek.
- Artikel Travel Stories boleh hanya satu bahasa.

**Foto:** setiap destinasi, paket, dan artikel punya kolom **Foto utama** dan **Deskripsi foto**. Klik kolom foto, unggah dari komputer atau HP, isi deskripsi satu kalimat, simpan. Foto masuk ke `src/assets/images/`. Server Pages CMS menolak unggahan besar (error 413, sekitar di atas 4 MB), jadi kecilkan dulu atau unggah langsung lewat GitHub (Add file → Upload files). Saat build, situs membuat versi WebP berbagai ukuran otomatis dan memberi ukuran tetap supaya halaman tidak loncat. Foto besar di halaman depan diatur di menu **Halaman Depan**. Selama kolom foto kosong, tampil kotak placeholder.

Foto artikel yang dipakai sebagai gambar share (OG) tetap kolom terpisah `ogImage` (path ke `public/og/`, 1200x630).

**Pengaturan Situs** (menu "Pengaturan Situs"): nama merek, tagline, alamat kantor (opsional, tampil di footer dan halaman Kontak; kosong = disembunyikan), deskripsi singkat, nomor WhatsApp, email, dan alamat profil Instagram, TikTok, Threads. Nilai yang diisi di sini menang atas Environment variable Netlify; kolom yang kosong memakai nilai Netlify, lalu nilai bawaan. Akun sosial yang kosong disembunyikan dari footer. Nomor WhatsApp ditulis dengan kode negara (`6281234567890`), spasi dan tanda plus dibersihkan otomatis. Build gagal kalau nomor, email, atau alamat sosial salah format.

GA4 dan endpoint form (Formspree) bukan konten: tetap diisi di dashboard Netlify (Environment variables).

**Tombol share dan auto-post Threads.** Setiap Travel Story punya tombol Share (Threads, WhatsApp, Salin tautan) untuk pembaca. Untuk memposting artikel ke akun Threads kamu sendiri secara otomatis, nyalakan "Posting ke Threads saat terbit" di form artikel (teks posting boleh dikosongkan: dipakai judul dan deskripsi, plus tautan artikel). Setelah situs selesai diperbarui dan artikelnya sudah bisa dibuka, GitHub Action `threads.yml` memposting satu kali lalu mengisi "Sudah diposting ke Threads". Pasang di GitHub (Settings → Secrets and variables → Actions):

| Nama | Isi |
|---|---|
| `SITE_URL` | Alamat situs live, mis. `https://intravest.com` (boleh di tab Variables) |
| `THREADS_USER_ID` | ID pengguna Threads akun yang memposting |
| `THREADS_ACCESS_TOKEN` | Token Threads API dari app Meta for Developers (izin `threads_basic` dan `threads_content_publish`). Token jangka panjang berlaku 60 hari dan harus diperbarui; kalau kedaluwarsa, Action gagal dengan pesan jelas dan artikel dicoba lagi pada push berikutnya |

Tanpa secret ini Action tidak melakukan apa-apa. Uji tanpa memposting: `node scripts/post-threads.mjs --dry`. Mau posting ulang artikel yang sudah terposting: kosongkan "Sudah diposting ke Threads" lalu simpan.

## Deploy ke Netlify

1. Push repo ke GitHub, lalu **Add new site → Import from Git** dan pilih repo ini.
2. Build settings terbaca otomatis dari `netlify.toml` (`npm run build`, publish `dist`, Node 22).
3. Isi environment variables di atas, lalu deploy.
4. **Domain settings:** tambahkan domain final dan tunggu SSL aktif. Kalau domain final bukan `intravest.com`, ganti `SITE` di `astro.config.mjs`, `site` di config yang sama, dan URL sitemap di `public/robots.txt`.
5. Di Google Search Console, verifikasi domain lalu submit `https://<domain>/sitemap-index.xml`.

Yang sudah diatur oleh `netlify.toml`:

- `/` redirect ke `/en/` sebagai bahasa default (302). Halaman yang sudah di `/id/...` atau `/en/...` tidak disentuh.
- Header keamanan: `X-Frame-Options`, `X-Content-Type-Options`, `Referrer-Policy`, `Permissions-Policy`.
- Cache 1 tahun untuk aset ber-hash di `/_astro/`.

## Sebelum launch

Item di bawah masih placeholder atau belum diputuskan. Checklist lengkap dengan status verifikasi ada di [`docs/LAUNCH-CHECKLIST.md`](docs/LAUNCH-CHECKLIST.md) (berdasarkan Lampiran C3 di brief).

- [ ] Nomor WhatsApp, email domain, GA4 ID, dan 3 endpoint Formspree (env vars di atas)
- [ ] Domain final (`intravest.com` / `.id` / `.co.id`) dan cek trademark DJKI
- [ ] Logo final: ganti `src/components/Logo.astro` dan `public/favicon.svg`
- [ ] Gambar share: ganti `public/og/default.jpg` (1200x630). `public/og/placeholder.jpg` adalah gambar yang dirujuk artikel contoh, ganti atau hapus bersama frontmatter `ogImage`-nya
- [ ] Foto asli: `Placeholder.astro` masih menggantikan semua foto. Saat diganti, pakai `<img>` dengan `width`/`height` eksplisit dan `loading="lazy"` supaya CLS tetap nol
- [ ] Harga final BAL-01, BAL-02, BAL-03, lalu set `priceIsDraft: false`
- [ ] URL profil Instagram, TikTok, Threads di `src/site.ts`
- [x] Halaman About (`/en/about/`, `/id/tentang-kami/`)
- [ ] Minimal 3 artikel blog sudah publish (sekarang 3 contoh, 2 EN dan 1 ID)
- [ ] Kebijakan refund dan cancellation B2C
- [ ] Test form end-to-end dan Doku test transaction
