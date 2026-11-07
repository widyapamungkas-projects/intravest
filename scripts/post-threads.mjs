// Posts Travel Stories to Threads once, when the dashboard toggle "Posting ke Threads saat terbit" is on and the
// story has no `threadsPostedAt` yet. Waits until the article is live on the site (the link must open), posts,
// then writes `threadsPostedAt` into the story file (the workflow commits that).
//
// Env (GitHub: Settings > Secrets and variables > Actions):
//   SITE_URL              live site address, e.g. https://intravest.com  (Variables tab is fine)
//   THREADS_USER_ID       Threads user id of the account that posts
//   THREADS_ACCESS_TOKEN  Threads API token (long-lived tokens last 60 days, see README)
//   THREADS_API_BASE      optional, default https://graph.threads.net/v1.0
//   WAIT_SECONDS          optional, how long to wait for the article to go live (default 900)
// Usage: node scripts/post-threads.mjs [--dry]
import fs from 'node:fs';
import path from 'node:path';

const DRY = process.argv.includes('--dry');
const { SITE_URL, THREADS_USER_ID, THREADS_ACCESS_TOKEN } = process.env;
const BASE = (process.env.THREADS_API_BASE || 'https://graph.threads.net/v1.0').replace(/\/+$/, '');
const WAIT = Number(process.env.WAIT_SECONDS || 900) * 1000;
const root = path.resolve(import.meta.dirname, '..', 'src', 'content', 'stories');
const SEGMENT = { en: 'travel-stories', id: 'cerita-perjalanan' };

const scalar = (fm, key) => {
  const m = fm.match(new RegExp(`^${key}:[ \\t]*(.*)$`, 'm'));
  if (!m) return undefined;
  let v = m[1].trim().replace(/\s+#.*$/, '');
  if (/^(".*"|'.*')$/.test(v)) v = v.slice(1, -1).replace(/\\"/g, '"').replace(/''/g, "'");
  return v;
};
// Multi-line caption (block scalar) is rare; support the simple forms Pages CMS writes.
const block = (fm, key) => {
  const m = fm.match(new RegExp(`^${key}:[ \\t]*[|>][-+]?[ \\t]*\\n((?:[ \\t]+.*\\n?)+)`, 'm'));
  return m ? m[1].replace(/^[ \t]{1,4}/gm, '').trim() : undefined;
};

const pending = [];
for (const locale of ['en', 'id']) {
  const dir = path.join(root, locale);
  if (!fs.existsSync(dir)) continue;
  for (const f of fs.readdirSync(dir).filter((x) => /\.(md|mdx)$/.test(x))) {
    const file = path.join(dir, f);
    const raw = fs.readFileSync(file, 'utf8');
    const fm = raw.split(/^---\s*$/m)[1] ?? '';
    if (scalar(fm, 'postToThreads') !== 'true') continue;
    if (scalar(fm, 'threadsPostedAt')) continue;
    const slug = f.replace(/\.(md|mdx)$/, '');
    pending.push({
      file, raw, locale, slug,
      url: `${(SITE_URL || '').replace(/\/+$/, '')}/${locale}/${SEGMENT[locale]}/${slug}/`,
      title: scalar(fm, 'title'),
      description: scalar(fm, 'description'),
      caption: block(fm, 'threadsText') ?? scalar(fm, 'threadsText'),
    });
  }
}

if (!pending.length) { console.log('post-threads: tidak ada artikel yang perlu diposting.'); process.exit(0); }
const missing = [!SITE_URL && 'SITE_URL', !THREADS_USER_ID && 'THREADS_USER_ID', !THREADS_ACCESS_TOKEN && 'THREADS_ACCESS_TOKEN'].filter(Boolean);
if (!DRY && missing.length) { console.log(`post-threads: ${missing.join(', ')} belum diisi, dilewati (${pending.length} artikel menunggu).`); process.exit(0); }

const compose = (p) => {
  let t = (p.caption || `${p.title}\n\n${p.description ?? ''}`).trim();
  if (t.length > 450) t = t.slice(0, 449).trimEnd() + '…';
  return t;
};
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
async function waitLive(url) {
  const end = Date.now() + WAIT;
  while (Date.now() < end) {
    try { const r = await fetch(url, { redirect: 'follow' }); if (r.ok) return true; } catch {}
    await sleep(15000);
  }
  return false;
}
async function api(pathPart, params) {
  const res = await fetch(`${BASE}/${pathPart}`, { method: 'POST', body: new URLSearchParams({ ...params, access_token: THREADS_ACCESS_TOKEN }) });
  const j = await res.json().catch(() => ({}));
  if (!res.ok || j.error) throw new Error(`Threads ${res.status}: ${j.error?.message ?? JSON.stringify(j)}${j.error?.code === 190 ? ' (token kedaluwarsa: buat token baru, lihat README)' : ''}`);
  return j;
}

let failed = 0;
for (const p of pending) {
  console.log(`${p.locale}/${p.slug}: ${p.url}`);
  if (DRY) { console.log('  teks:', JSON.stringify(compose(p))); continue; }
  try {
    if (!(await waitLive(p.url))) throw new Error('artikel belum live di situs (build Netlify mungkin gagal atau lama). Akan dicoba lagi pada push berikutnya.');
    const created = await api(`${THREADS_USER_ID}/threads`, { media_type: 'TEXT', text: compose(p), link_attachment: p.url });
    await sleep(3000);
    const published = await api(`${THREADS_USER_ID}/threads_publish`, { creation_id: created.id });
    const stamp = new Date().toISOString();
    const out = /^threadsPostedAt:.*$/m.test(p.raw)
      ? p.raw.replace(/^threadsPostedAt:.*$/m, `threadsPostedAt: "${stamp}"`)
      : p.raw.replace(/^(---\s*\r?\n[\s\S]*?\r?\n)(---)/, `$1threadsPostedAt: "${stamp}"\n$2`);
    fs.writeFileSync(p.file, out);
    console.log(`  terposting (id ${published.id})`);
  } catch (e) {
    failed++;
    console.error(`  GAGAL: ${e.message}`);
  }
}
process.exit(failed ? 1 : 0);
