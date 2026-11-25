# Dashboard Intravest (admin)

Dashboard konten untuk situs Intravest. Aplikasi terpisah dari situs publik: membaca dan menulis file konten di repo lewat GitHub API, dalam **satu commit per "Publikasikan"**.

Status: **Tahap A** (login, daftar dan editor paket, publish, konflik) **Tahap B** (editor harga), dan **Tahap C** (destinasi + cerita) selesai. Berikutnya: D gambar + pengaturan, E riwayat/undo.

## Cara kerja singkat
- Perubahan disimpan sementara **di browser** (draf). Tidak ada commit sampai tombol **Publikasikan**.
- Publikasikan menggabungkan semua draf menjadi satu commit ke `main` → **satu build Netlify**.
- Sebelum commit, server memvalidasi (skema zod + `scripts/check-content.mjs` asli dari repo). Konten yang akan menggagalkan `npm run build` ditolak dengan pesan jelas.
- Server selalu membandingkan SHA file dengan versi yang kamu buka. Kalau ada yang mengubah file yang sama (commit manual, bot terjemahan), dashboard **tidak menimpa** dan menawarkan pilihan.
- Token GitHub hanya ada di server (env). Tidak pernah dikirim ke browser.

## Editor harga (tab Harga)
- Grid hotel × tier × tipe kamar. Ketik langsung, atau salin blok sel dari Excel/Google Sheets, klik sel tujuan, tempel. Tombol "Tempel dari Excel / Sheets" untuk HP atau tabel lengkap (kolom `hotel, tier, single, twin, triple, child_twin, cwb, cnb`).
- Pengaturan: berlaku sampai, hotel + tier "Mulai dari" (dengan pratinjau harga yang tampil), tambahan musim ramai per hotel, maksimal 10 hotel.
- Satu Publikasikan menulis `tours/<slug>.yml` dan `pricing/<slug>.csv` dalam satu commit. Sel kosong atau tidak valid menahan publish.
- Aturan validasi dicek ulang di server memakai `scripts/check-content.mjs` dan `src/pricing-core.mjs` asli situs.

## Destinasi dan Cerita Perjalanan
- **Destinasi**: daftar dengan pencarian dan filter (perlu dicek, belum diterjemah, ada perubahan). Editor bertab Umum | English | Indonesia. "Something to See/Do/Buy" masing-masing satu kotak teks, satu baris per item.
- **Cerita**: satu artikel = satu bahasa (`stories/en` atau `stories/id`). Tab Tulisan (judul, deskripsi, editor markdown dengan toolbar dan pratinjau) dan Pengaturan (tanggal, kategori, tag satu baris dipisah koma, foto + alt text, posting Threads). Alamat dibuat otomatis dari judul.
- Hapus: tombol Hapus hanya menandai; berkas baru terhapus saat Publikasikan. Menghapus destinasi yang masih dipakai paket ditolak oleh pemeriksaan konten.
- Pratinjau markdown di dashboard hanya gambaran sederhana (aman, semua HTML di-escape); tampilan akhir mengikuti situs.

## Login
Email + password, lalu kode OTP 6 digit lewat email (Resend). Opsi "percayai perangkat 30 hari" melewati OTP, password tetap diminta. Password di-hash scrypt, sesi cookie `HttpOnly` + `SameSite=Strict`, batas percobaan per IP dan email, akun terkunci 15 menit setelah 5 kali salah. Maksimal 3 admin (`MAX_ADMINS`).

## Environment
Salin `.env.example` ke `.env`:

| Variabel | Isi |
|---|---|
| `PUBLIC_URL` | Alamat publik dashboard, mis. `https://admin.domainmu.com` (wajib https di produksi) |
| `GITHUB_TOKEN` | Fine-grained PAT, **hanya repo intravest**, izin *Contents: Read and write* (tidak perlu yang lain) |
| `GITHUB_REPO`, `GITHUB_BRANCH` | `widyapamungkas-projects/intravest`, `main` |
| `RESEND_API_KEY`, `MAIL_FROM` | Kunci Resend dan pengirim dari domain yang sudah diverifikasi di Resend |
| `MAX_ADMINS` | Default 3 |
| `DISABLE_OTP` | `1` = lewati kode OTP, login hanya password. Untuk uji lokal. Di production diabaikan kecuali `ALLOW_INSECURE_NO_OTP=1` (tidak disarankan). |

## Deploy di mini PC (Docker + Cloudflare Tunnel)
1. `cp admin/.env.example admin/.env`, isi nilainya.
2. Dari root repo: `docker compose -f admin/docker-compose.yml --env-file admin/.env up -d --build` (atau Portainer: Stacks → Repository → `admin/docker-compose.yml`).
3. Cloudflare Tunnel: tambah *public hostname* `admin.domainmu.com` → `http://localhost:8787` (atau `http://admin:8787` kalau cloudflared satu jaringan Docker dengan container ini).
4. Buat admin pertama (lihat bawah), buka `PUBLIC_URL`, masuk.
5. Data akun/sesi ada di volume `admin-data` (SQLite). Cadangkan volume itu.

## Menambah / mengelola admin
```bash
docker compose -f admin/docker-compose.yml exec admin node dist/server/cli.js add-admin email@contoh.com "Nama"
docker compose -f admin/docker-compose.yml exec admin node dist/server/cli.js set-password email@contoh.com
docker compose -f admin/docker-compose.yml exec admin node dist/server/cli.js remove-admin email@contoh.com
docker compose -f admin/docker-compose.yml exec admin node dist/server/cli.js list-admins
```
Password ditanya di terminal (tidak tampil). Minimal 10 karakter, ada huruf dan angka.

## Mengurangi jumlah build Netlify
1. Biasakan satu sesi edit → satu Publikasikan (draf menumpuk di browser).
2. `netlify.toml` punya `ignore` supaya perubahan di folder `admin/` tidak memicu build.
3. Di Netlify: *Site configuration → Build & deploy → Branches and deploy previews*: matikan **Branch deploys** dan **Deploy Previews** (kecuali memang dipakai). Branch uji seperti `cms-test` bisa memakai credit kalau ini menyala.
4. Commit bot terjemahan (`translate.yml`) adalah push tambahan ke `main`. Kalau mau hemat, jalankan terjemahan hanya manual (workflow_dispatch) setelah beberapa perubahan.

## Pengembangan
```bash
cd admin && npm install
LOCAL_REPO=/path/ke/clone/intravest npm run dev   # mode lokal: tanpa GitHub, commit ke clone itu
npm run cli -- add-admin saya@contoh.com "Saya"
npm test            # 57 tes: auth, konflik, publish (git lokal + GitHub tiruan), round-trip YAML 3 paket asli
npm run typecheck
npm run test:build  # opsional: publish tiruan lalu `npm run build` situs asli (butuh `npm ci` di root)
```
Tanpa `RESEND_API_KEY` (dan bukan production), kode OTP dicetak di log server. Atau set `DISABLE_OTP=1` supaya login cukup password.

## Catatan teknis
- Penulisan GitHub: Git Data API (blob → tree → commit → update ref tanpa force). Konflik = SHA file yang kamu ubah sudah berbeda; file lain yang bergeser tidak menghalangi.
- Skema paket ada di `src/shared/tour.ts` (cermin `src/content.config.ts`). Kalau skema situs berubah, ubah juga file itu; `check-content.mjs` dan `npm run build` tetap penjaga akhir.
- Belum ada: tombol hapus paket, unggah foto, beranda/tentang/pengaturan, riwayat/undo. Panduan mencoba: [CARA-UJI.md](CARA-UJI.md).
