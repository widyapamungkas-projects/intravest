# Cara mencoba dan memeriksa dashboard

Ada tiga tingkat, dari paling aman. Mulai dari tingkat 1: tidak butuh token GitHub, tidak menyentuh repo asli, tidak memicu build Netlify.

## Tingkat 1: coba di komputer sendiri dengan salinan repo (10 menit)

Dashboard punya "mode lokal": commit masuk ke salinan repo di komputermu, bukan ke GitHub.

Butuh: Node.js 22+ dan Git.

```bash
# 1. salinan khusus uji (BUKAN folder kerja utama)
git clone https://github.com/widyapamungkas-projects/intravest.git intravest-uji
cd intravest-uji && git checkout main

# 2. ambil dashboard dari branch cms-admin
git fetch origin cms-admin && git checkout cms-admin -- admin
cd admin && npm install && npm run build

# 3. buat admin dan jalankan (LOCAL_REPO = salinan tadi)
export LOCAL_REPO="$(cd .. && pwd)"     # Windows PowerShell: $env:LOCAL_REPO = (Resolve-Path ..).Path
npm run cli -- add-admin saya@contoh.com "Saya"
npm run dev
```

Buka alamat yang tercetak (biasanya http://localhost:8787). Masuk dengan email dan password tadi. Kode OTP 6 digit **dicetak di jendela terminal**, bukan dikirim lewat email.

### Daftar periksa (centang satu per satu)

**Paket**
- [ ] Buka Paket Wisata, pilih Bali Active. Ubah satu kalimat di tab English. Muncul label "belum dipublikasikan" dan tombol Publikasikan menyala.
- [ ] Edit inclusion: satu kotak teks, satu baris per item.
- [ ] Itinerary: tambah hari, hapus hari, geser urutan dengan drag.
- [ ] Kosongkan judul lalu coba Publikasikan: ditolak dengan pesan yang jelas.

**Harga**
- [ ] Tab Harga: ubah satu angka. Tekan Enter, kursor turun satu baris.
- [ ] Di Excel/Google Sheets salin blok angka 7 baris × 6 kolom, klik sel di grid, tempel. Angka terisi.
- [ ] Kosongkan satu sel: muncul "sel belum terisi" dan Publikasikan mati.
- [ ] Ubah hotel "mulai dari": kotak "Di situs tampil: mulai dari Rp …" ikut berubah.

**Destinasi dan cerita**
- [ ] Destinasi → Lombok → tab Indonesia, ubah tagline.
- [ ] Cerita → Artikel baru: ketik judul, alamat terisi otomatis. Coba tombol B, H2, tautan, lalu tab Pratinjau.
- [ ] Tag ditulis satu baris dipisah koma.

**Publikasi**
- [ ] Tekan Publikasikan (angka di tombol = jumlah perubahan). Dialog menampilkan semua perubahan. Pilih Publikasikan sekarang.
- [ ] Cek hasilnya di terminal lain:
  ```bash
  cd intravest-uji && git log --stat -3
  ```
  Harus ada **satu** commit baru berjudul "CMS: …" yang memuat semua berkas yang kamu ubah.
- [ ] Cek situs memang lolos build (butuh `npm ci` di folder utama): `cd intravest-uji && npm ci && npm run build`. Harus selesai tanpa error.
- [ ] Tutup tab, buka lagi: draf yang belum dipublikasikan masih ada (tersimpan di browser).
- [ ] Buka di HP lewat alamat IP komputer (satu Wi-Fi): tampilan tidak melebar ke samping.

**Konflik**
- [ ] Buka satu paket di dashboard. Di terminal, ubah berkas yang sama lalu `git commit -am "manual"`. Kembali ke dashboard, ubah sesuatu, Publikasikan: dashboard **tidak menimpa** dan menawarkan pilihan.

## Tingkat 2: pemeriksaan otomatis (30 detik)

```bash
cd admin
npm test             # 56 tes harus lolos
npm run typecheck    # tanpa error
npm run test:build   # opsional, lebih lama: publish tiruan + npm run build situs asli
```

## Tingkat 3: dengan GitHub asli (setelah deploy di mini PC)

Lakukan setelah tingkat 1 berjalan baik.
1. Buat token fine-grained **hanya untuk repo intravest**, izin *Contents: Read and write*. Isi `GITHUB_TOKEN` (lihat README bagian Environment dan Deploy).
2. Supaya aman: ubah `GITHUB_BRANCH=cms-test` dulu (buat branch itu dari main). Coba publikasi dulu di sana.
3. Pastikan **Branch deploys** Netlify mati, supaya branch uji tidak memakai build credit.
4. Setelah yakin, ganti `GITHUB_BRANCH=main`.

Kalau ada yang aneh, catat langkahnya dan layar yang muncul, lalu kirim ke saya.
