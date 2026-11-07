// Runs before every build (npm "prebuild"). Fails with a plain-language message when content edited by hand
// or through the CMS dashboard would produce broken links, which the schema alone cannot catch:
//   1. Destinations and tours must exist in BOTH languages with the SAME file name (hreflang and the language
//      switcher map the slug 1:1, so a one-language entry would link to a page that does not exist).
//   2. Every tour must point at a destination that exists.
// Travel Stories are exempt on purpose: an article may exist in one language only.
import fs from 'node:fs';
import path from 'node:path';

const root = path.resolve(import.meta.dirname, '..', 'src', 'content');
const slugs = (collection, locale) => {
  const dir = path.join(root, collection, locale);
  if (!fs.existsSync(dir)) return [];
  return fs.readdirSync(dir).filter((f) => /\.(md|mdx)$/.test(f)).map((f) => f.replace(/\.(md|mdx)$/, ''));
};

const errors = [];
for (const [collection, label] of [['destinations', 'Destinasi'], ['tours', 'Paket wisata']]) {
  const en = slugs(collection, 'en');
  const id = slugs(collection, 'id');
  for (const s of en) if (!id.includes(s)) errors.push(`${label} "${s}" ada di EN tapi belum ada di ID (src/content/${collection}/id/${s}.md).`);
  for (const s of id) if (!en.includes(s)) errors.push(`${label} "${s}" ada di ID tapi belum ada di EN (src/content/${collection}/en/${s}.md).`);
}

const destinations = new Set(slugs('destinations', 'en'));
for (const locale of ['en', 'id']) {
  for (const s of slugs('tours', locale)) {
    const file = ['md', 'mdx'].map((e) => path.join(root, 'tours', locale, `${s}.${e}`)).find(fs.existsSync);
    const m = fs.readFileSync(file, 'utf8').match(/^destination:\s*["']?([^"'\r\n]+?)["']?\s*$/m);
    if (!m) errors.push(`Paket "${locale}/${s}" tidak punya field destination.`);
    else if (!destinations.has(m[1])) errors.push(`Paket "${locale}/${s}" menunjuk destinasi "${m[1]}" yang tidak ada. Pilihan: ${[...destinations].join(', ')}.`);
  }
}

// 3. Facts that must be identical in both languages (price, length, code...) are stored in two files, so a
//    one-language edit would show two different prices. Compare them.
const SAME_IN_BOTH = ['code', 'destination', 'days', 'nights', 'priceIDR', 'priceIsDraft', 'minPax', 'order'];
const scalar = (text, key) => {
  const m = text.match(new RegExp(`^${key}:\\s*["']?([^"'\\r\\n#]+?)["']?\\s*(?:#.*)?$`, 'm'));
  return m ? m[1] : undefined;
};
const readTour = (locale, s) => {
  const file = ['md', 'mdx'].map((e) => path.join(root, 'tours', locale, `${s}.${e}`)).find(fs.existsSync);
  return file ? fs.readFileSync(file, 'utf8').split(/^---\s*$/m)[1] ?? '' : null;
};
for (const s of slugs('tours', 'en').filter((x) => slugs('tours', 'id').includes(x))) {
  const en = readTour('en', s);
  const id = readTour('id', s);
  for (const key of SAME_IN_BOTH) {
    const a = scalar(en, key);
    const b = scalar(id, key);
    if (a !== b) errors.push(`Paket "${s}": field "${key}" beda antara EN (${a ?? 'kosong'}) dan ID (${b ?? 'kosong'}). Ubah di kedua bahasa.`);
  }
}

if (errors.length) {
  console.error('\nKONTEN TIDAK KONSISTEN, build dihentikan:\n' + errors.map((e) => `  - ${e}`).join('\n') + '\n');
  process.exit(1);
}
console.log('check-content: OK (pasangan EN/ID lengkap, destinasi paket valid)');
