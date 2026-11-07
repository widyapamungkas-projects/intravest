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
  content/             MDX: destinations, tours, stories (folder en/ dan id/)
  *-copy.ts            Teks UI per halaman, per bahasa
  i18n.ts              Locale, tabel slug per bahasa, pasangan EN<->ID
  site.ts              Kontak, sosial media, deskripsi default (satu tempat untuk diedit)
  schema.ts            JSON-LD homepage
  styles/global.css    Design tokens (OKLCH, light + dark)
public/                favicon, robots.txt, og/ (gambar share)
netlify.toml           Build, redirect bahasa, security headers
```

## Menambah konten

Nama folder = locale, nama file = slug URL. Schema lengkap ada di `src/content.config.ts`; build gagal kalau frontmatter salah.

- **Paket baru:** buat `src/content/tours/en/<slug>.md` **dan** `src/content/tours/id/<slug>.md` dengan nama file yang **sama** (hreflang memetakan slug 1:1). Isi dari template Lampiran C4 di brief. `itinerary` harus punya satu entry per hari.
- **Destinasi:** sama, di `src/content/destinations/`. `description` maksimal 160 karakter.
- **Artikel (Travel Stories):** `src/content/stories/en|id/<slug>.md`. Boleh hanya satu bahasa; slug EN dan ID tidak harus sama. Artikel satu bahasa otomatis tidak dapat hreflang.
- **Harga:** `priceIsDraft: true` menandai harga belum final di halaman. Ubah ke `false` setelah harga disetujui.

## Mengelola konten lewat dashboard (tanpa coding)

Situs ini tidak punya backend. Konten adalah file di repo GitHub, dan setiap perubahan yang tersimpan otomatis membangun ulang situs di Netlify. Untuk mengisi dan mengedit konten lewat tampilan form, pakai [Pages CMS](https://pagescms.org) (gratis, tidak perlu mengubah kode situs). Konfigurasinya sudah ada di `.pages.yml`.

**Sekali saja:**

1. Buka [app.pagescms.org](https://app.pagescms.org) dan masuk dengan akun GitHub yang punya akses ke repo ini.
2. Pasang GitHub App Pages CMS dan beri akses ke repo `intravest`. Untuk repo di organisasi, ini perlu akun owner organisasi.
3. Pilih repo `intravest`, branch `main`. Menu konten akan muncul: Destinasi, Paket Wisata, dan Cerita Perjalanan, masing-masing per bahasa (EN dan ID).

**Sehari-hari:** buka entri, ubah isinya, klik simpan. Pages CMS menyimpan sebagai commit ke `main`, lalu Netlify membangun ulang (sekitar 1 menit).

Aturan yang dijaga otomatis saat build:

- **Destinasi dan Paket Wisata harus ada di EN dan ID dengan nama file yang sama.** Nama file dibuat dari kolom "Nama", jadi isi nama yang sama di kedua bahasa. Kalau ada yang kurang, build gagal dengan pesan jelas dan **situs yang sedang online tidak berubah** (Netlify tidak mempublikasikan build yang gagal).
- **Data inti paket harus sama di EN dan ID:** kode, destinasi, jumlah hari dan malam, harga, status draf harga, dasar peserta, dan urutan. Kalau kamu mengubah harga di satu bahasa saja, build gagal dan menyebut field mana yang beda. Teks (nama, ringkasan, itinerary, isi) boleh dan memang berbeda per bahasa.
- Paket harus menunjuk destinasi yang ada, dan jumlah entri itinerary harus sama dengan jumlah hari.
- Deskripsi SEO maksimal 160 karakter.
- Artikel Travel Stories boleh hanya satu bahasa.

Hal yang belum bisa lewat dashboard: foto di halaman. Semua foto masih placeholder di kode. Saat foto asli sudah ada, kolom gambar perlu ditambahkan ke konten dan komponen halaman (pekerjaan kecil, minta saja).

Nomor WhatsApp, GA4, dan endpoint form bukan konten: diisi di dashboard Netlify (Environment variables), bukan di CMS.

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
