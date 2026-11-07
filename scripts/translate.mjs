// Draft translations for destinations and tours (src/content/{destinations,tours}/*.yml), through YOUR AI gateway.
//
// Rule: write one language, leave the other empty (no title). This script fills the empty one and marks it
// `needsReview: true`. When the source text changes later and the translation is still unchecked, it is redone.
// Once a person turns `needsReview` off, that text is never overwritten.
//
// Env (GitHub: Settings > Secrets and variables > Actions):
//   AI_BASE_URL   gateway base, e.g. https://gateway.example.com/v1   (OpenAI-style: POST {base}/chat/completions)
//   AI_API_KEY    the key (never put it in the repo)
//   AI_MODEL      model name your gateway expects
//   AI_API_STYLE  "openai" (default) or "anthropic" (POST {base}/v1/messages)
// Usage: node scripts/translate.mjs [--dry] [--only <slug>]
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import YAML from 'yaml';

const args = process.argv.slice(2);
const DRY = args.includes('--dry');
const only = args.includes('--only') ? args[args.indexOf('--only') + 1] : null;
const { AI_BASE_URL, AI_API_KEY, AI_MODEL, AI_API_STYLE = 'openai' } = process.env;
const root = path.resolve(import.meta.dirname, '..', 'src', 'content');
const META = new Set(['needsReview', 'srcDigest']);
const LANG = { en: 'English', id: 'Indonesian (Bahasa Indonesia)' };
const FORBIDDEN = ['terbaik', 'terpercaya', 'nomor satu', 'terjangkau', 'layanan prima', 'eksklusif', 'hemat', 'promo', 'best', 'cheapest', 'number one', 'affordable', 'exclusive', 'unbeatable'];

const strip = (sec) => Object.fromEntries(Object.entries(sec).filter(([k]) => !META.has(k)));
const digest = (sec) => crypto.createHash('sha1').update(JSON.stringify(strip(sec))).digest('hex').slice(0, 12);
const filled = (sec) => typeof sec?.title === 'string' && sec.title.trim() !== '';

// Same keys and same array lengths as the source, strings only where the source has strings.
function sameShape(a, b, where = '') {
  if (Array.isArray(a)) {
    if (!Array.isArray(b) || a.length !== b.length) return `${where}: jumlah item beda (${a.length} vs ${Array.isArray(b) ? b.length : 'bukan daftar'})`;
    for (let i = 0; i < a.length; i++) { const e = sameShape(a[i], b[i], `${where}[${i}]`); if (e) return e; }
    return null;
  }
  if (a && typeof a === 'object') {
    if (!b || typeof b !== 'object') return `${where}: harus objek`;
    for (const k of Object.keys(a)) if (!(k in b)) return `${where}.${k}: hilang`;
    for (const k of Object.keys(b)) if (!(k in a)) return `${where}.${k}: field tambahan`;
    for (const k of Object.keys(a)) { const e = sameShape(a[k], b[k], `${where}.${k}`); if (e) return e; }
    return null;
  }
  return typeof a === typeof b ? null : `${where}: tipe beda`;
}

function prompt(from, to, section, problem) {
  return [
    `Translate the values of this JSON from ${LANG[from]} to ${LANG[to]}. These are texts for a travel website (Indonesia Travel Story).`,
    'Rules:',
    '- Return ONLY valid JSON with exactly the same keys and the same array lengths. No commentary, no code fences.',
    '- Translate string values only. Keep numbers, codes, URLs and file names unchanged.',
    '- Keep place names, temple/attraction names and brand names as people actually use them (do not translate "Tirta Empul", "Ubud", etc.).',
    '- Keep markdown in "body" as is (paragraphs, lists, headings). Keep line breaks.',
    '- "summary" and "description" must stay at or under 160 characters.',
    '- Tone: calm, friendly, honest, like a local friend. Not salesy. Never use superlative marketing words (best, cheapest, exclusive, terbaik, terpercaya, eksklusif, hemat, promo, terjangkau).',
    '- Do not add facts that are not in the source.',
    problem ? `\nYour previous answer was rejected: ${problem}. Fix that.` : '',
    '\nJSON:',
    JSON.stringify(strip(section)),
  ].join('\n');
}

async function callGateway(text) {
  const base = AI_BASE_URL.replace(/\/+$/, '');
  const anthropic = AI_API_STYLE === 'anthropic';
  const res = await fetch(anthropic ? `${base}/v1/messages` : `${base}/chat/completions`, {
    method: 'POST',
    headers: anthropic
      ? { 'content-type': 'application/json', 'x-api-key': AI_API_KEY, 'anthropic-version': '2023-06-01' }
      : { 'content-type': 'application/json', authorization: `Bearer ${AI_API_KEY}` },
    body: JSON.stringify(
      anthropic
        ? { model: AI_MODEL, max_tokens: 8000, temperature: 0.2, messages: [{ role: 'user', content: text }] }
        : { model: AI_MODEL, temperature: 0.2, messages: [{ role: 'user', content: text }] },
    ),
  });
  if (!res.ok) throw new Error(`gateway ${res.status}: ${(await res.text()).slice(0, 300)}`);
  const j = await res.json();
  const out = anthropic ? j.content?.map((c) => c.text ?? '').join('') : j.choices?.[0]?.message?.content;
  if (!out) throw new Error('gateway: jawaban kosong');
  return out;
}

async function translate(from, to, section) {
  let problem = '';
  for (let attempt = 1; attempt <= 2; attempt++) {
    const raw = await callGateway(prompt(from, to, section, problem));
    let obj;
    try {
      obj = JSON.parse(raw.trim().replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/, ''));
    } catch {
      problem = 'bukan JSON valid';
      continue;
    }
    const shape = sameShape(strip(section), obj);
    if (shape) { problem = `struktur tidak sama: ${shape}`; continue; }
    const long = ['summary', 'description'].find((k) => typeof obj[k] === 'string' && obj[k].length > 160);
    if (long) { problem = `"${long}" ${obj[long].length} karakter, maksimal 160`; continue; }
    const hit = FORBIDDEN.find((w) => JSON.stringify(obj).toLowerCase().includes(w));
    if (hit && attempt === 1 && !JSON.stringify(strip(section)).toLowerCase().includes(hit)) { problem = `memakai kata terlarang "${hit}"`; continue; }
    return obj;
  }
  throw new Error(problem);
}

const toYaml = (data) => {
  for (const l of ['en', 'id']) if (data[l]?.body) { const n = new YAML.Scalar(data[l].body); n.type = 'BLOCK_LITERAL'; data[l].body = n; }
  return YAML.stringify(data, { lineWidth: 0 });
};

if (!DRY && (!AI_BASE_URL || !AI_API_KEY || !AI_MODEL)) {
  console.log('translate: AI_BASE_URL / AI_API_KEY / AI_MODEL belum diisi, dilewati.');
  process.exit(0);
}

let changed = 0, failed = 0;
for (const col of ['destinations', 'tours']) {
  const dir = path.join(root, col);
  for (const f of fs.readdirSync(dir).filter((x) => x.endsWith('.yml'))) {
    const slug = f.replace(/\.yml$/, '');
    if (only && only !== slug) continue;
    const file = path.join(dir, f);
    const data = YAML.parse(fs.readFileSync(file, 'utf8'));
    let touched = false;
    for (const [from, to] of [['en', 'id'], ['id', 'en']]) {
      const src = data[from], dst = data[to];
      if (!filled(src)) continue;
      const stale = filled(dst) && dst.needsReview === true && dst.srcDigest && dst.srcDigest !== digest(src);
      if (filled(dst) && !stale) continue;
      console.log(`${col}/${slug}: ${from.toUpperCase()} -> ${to.toUpperCase()}${stale ? ' (sumber berubah)' : ''}`);
      if (DRY) continue;
      try {
        const out = await translate(from, to, src);
        data[to] = { ...out, needsReview: true, srcDigest: digest(src) };
        touched = true;
      } catch (e) {
        failed++;
        console.error(`  GAGAL ${col}/${slug}: ${e.message}`);
      }
    }
    if (touched) { fs.writeFileSync(file, toYaml(data)); changed++; }
  }
}
console.log(`translate: selesai. ${changed} file diubah, ${failed} gagal.`);
process.exit(failed ? 1 : 0);
