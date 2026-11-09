// Runs before every build (npm "prebuild"). Catches content mistakes the schema cannot, in plain language.
//   ERRORS (stop the build; the live site stays as it is):
//     - a tour points at a destination that does not exist
//     - a photo file named in the content is missing from src/assets/images
//     - an item has no title in either language
//   WARNINGS (build continues):
//     - photo without description (page title is used instead)
//     - a language still using the other language's text, or an unchecked machine translation
// Destinations and tours are one yml file per item with both languages (src/loaders/bilingual.ts), so EN/ID
// pairs and shared facts (price, days) cannot drift apart. Travel Stories stay one file per language.
import fs from 'node:fs';
import path from 'node:path';
import YAML from 'yaml';

const src = path.resolve(import.meta.dirname, '..', 'src');
const errors = [];
const warn = (m) => console.warn(`PERINGATAN ${m}`);

const readYml = (collection) => {
  const dir = path.join(src, 'content', collection);
  return fs.readdirSync(dir).filter((f) => f.endsWith('.yml')).map((f) => ({
    slug: f.replace(/\.yml$/, ''),
    data: YAML.parse(fs.readFileSync(path.join(dir, f), 'utf8')) ?? {},
  }));
};
const destinations = readYml('destinations');
const tours = readYml('tours');
const destSlugs = new Set(destinations.map((d) => d.slug));

for (const [label, items] of [['Destinasi', destinations], ['Paket', tours]]) {
  for (const { slug, data } of items) {
    const filled = ['en', 'id'].filter((l) => data[l]?.title?.trim());
    if (!filled.length) errors.push(`${label} "${slug}": isi judul minimal di salah satu bahasa (EN atau ID).`);
    for (const l of ['en', 'id']) {
      if (!filled.includes(l) && filled.length) warn(`${label} "${slug}": teks ${l.toUpperCase()} masih kosong, sementara memakai teks ${filled[0].toUpperCase()}. Isi manual atau tunggu terjemah otomatis.`);
      else if (data[l]?.needsReview) warn(`${label} "${slug}": teks ${l.toUpperCase()} hasil terjemah otomatis, belum dicek orang. Setelah dicek, matikan "Perlu dicek".`);
    }
  }
}
for (const { slug, data } of tours) {
  if (!destSlugs.has(data.destination)) errors.push(`Paket "${slug}" menunjuk destinasi "${data.destination}" yang tidak ada. Pilihan: ${[...destSlugs].join(', ')}.`);
}

// Photos: a referenced file must exist in src/assets/images; a missing description only warns.
const imgDir = path.join(src, 'assets', 'images');
const imgFiles = fs.existsSync(imgDir) ? fs.readdirSync(imgDir).map((f) => f.toLowerCase()) : [];
const checkImage = (where, image, alt) => {
  if (!image) return;
  const name = image.split('/').pop().toLowerCase();
  if (!imgFiles.includes(name)) errors.push(`${where}: foto "${image}" tidak ditemukan di src/assets/images. Unggah fotonya atau kosongkan kolom foto.`);
  if (!alt || !alt.trim()) warn(`${where}: foto "${image}" belum punya "Deskripsi foto". Situs memakai judul halaman sebagai pengganti.`);
};
for (const [col, items] of [['destinations', destinations], ['tours', tours]]) {
  for (const { slug, data } of items) for (const l of ['en', 'id']) checkImage(`${col}/${slug} (${l.toUpperCase()})`, data.image, data[l]?.imageAlt);
}
const storiesDir = path.join(src, 'content', 'stories');
for (const l of ['en', 'id']) {
  const d = path.join(storiesDir, l);
  if (!fs.existsSync(d)) continue;
  for (const f of fs.readdirSync(d).filter((x) => /\.(md|mdx)$/.test(x))) {
    const fm = YAML.parse((fs.readFileSync(path.join(d, f), 'utf8').split(/^---\s*$/m)[1]) ?? '') ?? {};
    checkImage(`stories/${l}/${f}`, fm.image, fm.imageAlt);
  }
}
const homeFile = path.join(src, 'data', 'home.json');
if (fs.existsSync(homeFile)) {
  const h = JSON.parse(fs.readFileSync(homeFile, 'utf8'));
  checkImage('Halaman Depan (hero)', h.heroImage, h.heroAlt);
  checkImage('Halaman Depan (Kenapa Intravest)', h.whyImage, h.whyAlt);
  checkImage('Halaman Depan (penutup)', h.ctaImage, h.ctaAlt);
}

const aboutFile = path.join(src, 'data', 'about.json');
if (fs.existsSync(aboutFile)) {
  const h = JSON.parse(fs.readFileSync(aboutFile, 'utf8'));
  checkImage('Tentang Kami (atas)', h.heroImage, h.heroAlt);
  checkImage('Tentang Kami (cerita)', h.storyImage, h.storyAlt);
  for (const n of [1, 2, 3, 4]) checkImage(`Tentang Kami (tempat ${n})`, h[`place${n}`], h[`place${n}Alt`]);
}

// Settings page: catch values that would silently break links.
const settingsFile = path.join(src, 'data', 'settings.json');
if (fs.existsSync(settingsFile)) {
  const st = JSON.parse(fs.readFileSync(settingsFile, 'utf8'));
  const wa = (st.contact?.whatsapp ?? '').trim();
  if (wa && !/^\d{8,15}$/.test(wa.replace(/\D/g, ''))) errors.push(`Pengaturan: nomor WhatsApp "${wa}" tidak valid. Tulis dengan kode negara, contoh 6281234567890.`);
  const email = (st.contact?.email ?? '').trim();
  if (email && !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) errors.push(`Pengaturan: email "${email}" tidak valid.`);
  for (const [k, v] of Object.entries(st.social ?? {})) {
    if (v && v.trim() && !/^(https?:\/\/\S+|@[\w.]+|[\w-]+(\.[\w-]+)+\/\S*)$/.test(v.trim())) warn(`Pengaturan: alamat ${k} "${v}" kurang jelas. Tulis alamat lengkap (https://...) atau @namaakun.`);
  }
}
// Threads: caption length (the API allows 500 characters).
for (const l of ['en', 'id']) {
  const d = path.join(storiesDir, l);
  if (!fs.existsSync(d)) continue;
  for (const f of fs.readdirSync(d).filter((x) => /\.(md|mdx)$/.test(x))) {
    const fm = YAML.parse((fs.readFileSync(path.join(d, f), 'utf8').split(/^---\s*$/m)[1]) ?? '') ?? {};
    if (fm.postToThreads && !fm.threadsPostedAt) warn(`stories/${l}/${f}: akan diposting ke Threads setelah situs selesai diperbarui.`);
  }
}

if (errors.length) {
  console.error('\nKONTEN BERMASALAH, build dihentikan:\n' + errors.map((e) => `  - ${e}`).join('\n') + '\n');
  process.exit(1);
}
console.log('check-content: OK');
