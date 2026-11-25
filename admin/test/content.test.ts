process.env.TEST = '1';
process.env.DATA_DIR = '/tmp/cms-test-data-content';
process.env.NODE_ENV = 'test';
import { test, before } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { getDb } from '../src/server/db.ts';
import { createUser } from '../src/server/auth.ts';
import { outbox } from '../src/server/mail.ts';
import { buildApp } from '../src/server/index.ts';
import { LocalGitRepo } from '../src/server/repo/local.ts';
import { GitHubRepo } from '../src/server/repo/github.ts';
import type { RepoStore } from '../src/server/repo/types.ts';
import { cloneRepo, fakeGitHub, manualCommit, readAllFiles, REPO_ROOT } from './helpers.ts';
import { orderDestination, parseYaml, stringifyYaml } from '../src/server/content/yaml.ts';
import { parseStory, serializeStory } from '../src/server/content/stories.ts';
import { validateDestination } from '../src/shared/destination.ts';
import { validateStory } from '../src/shared/story.ts';
import { renderMarkdown } from '../src/client/md.ts';

getDb(':memory:');
const PW = 'rahasia-banget-123';
before(async () => { await createUser('admin@contoh.com', 'Admin Contoh', PW); });

const H = { 'content-type': 'application/json', 'x-cms': '1' };
type App = ReturnType<typeof buildApp>;
const post = (app: App, url: string, body: unknown, cookie = '') => app.request(url, { method: 'POST', headers: { ...H, cookie }, body: JSON.stringify(body) });
const get = (app: App, url: string, cookie = '') => app.request(url, { headers: { cookie } });
const cookiesOf = (res: Response) => res.headers.getSetCookie().map((c) => c.split(';')[0]).join('; ');
async function login(app: App) {
  getDb().exec('DELETE FROM attempts');
  const r1 = await post(app, '/api/auth/login', { email: 'admin@contoh.com', password: PW });
  const j1 = await r1.json() as any;
  if (j1.step === 'done') return cookiesOf(r1);
  const code = /(\d{6})/.exec(outbox.at(-1)!.text)![1];
  return cookiesOf(await post(app, '/api/auth/verify', { code }, cookiesOf(r1)));
}


const readRepo = (p: string) => fs.readFileSync(path.join(REPO_ROOT, p), 'utf8');
const storyFiles = ['en', 'id'].flatMap((l) => fs.readdirSync(path.join(REPO_ROOT, `src/content/stories/${l}`)).filter((f) => f.endsWith('.md')).map((f) => [l, f.replace(/\.md$/, '')]));
const destFiles = fs.readdirSync(path.join(REPO_ROOT, 'src/content/destinations')).filter((f) => f.endsWith('.yml')).map((f) => f.replace(/\.yml$/, ''));

for (const [l, s] of storyFiles) {
  test(`story asli ${l}/${s}: baca -> tulis -> baca kembali sama, lolos validasi`, () => {
    const a = parseStory(readRepo(`src/content/stories/${l}/${s}.md`));
    const text = serializeStory(a.fm, a.body);
    const b = parseStory(text);
    assert.deepEqual(b.fm, a.fm);
    assert.equal(b.body.trim(), a.body.trim());
    assert.equal(typeof b.fm.tags, 'string', 'tags tetap satu string');
    assert.match(text, /^---\ntitle: /);
    assert.ok(validateStory(a.fm, a.body).ok, JSON.stringify(validateStory(a.fm, a.body)));
  });
}
for (const s of destFiles) {
  test(`destinasi asli ${s}: lolos skema dan round-trip yml`, () => {
    const d = parseYaml<any>(readRepo(`src/content/destinations/${s}.yml`));
    assert.ok(validateDestination(d).ok, JSON.stringify(validateDestination(d)));
    assert.deepEqual(parseYaml(stringifyYaml(orderDestination(d))), d);
  });
}

test('story: tanggal tetap YYYY-MM-DD, judul bertitik dua aman, CRLF dan BOM dibaca', () => {
  const t = serializeStory({ title: 'Bali: yang worth it', description: 'x', date: '2026-11-05', category: 'tips', tags: 'a, b' }, 'Isi\n\n## H2\n');
  assert.match(t, /date: 2026-11-05\n/);
  const p = parseStory(t);
  assert.equal(p.fm.title, 'Bali: yang worth it');
  assert.equal(parseStory('\uFEFF' + t.replace(/\n/g, '\r\n')).fm.title, 'Bali: yang worth it');
});

test('pratinjau markdown: HTML di-escape dan tautan berbahaya tidak jadi <a>', () => {
  const h = renderMarkdown('<script>alert(1)</script>\n\n[x](javascript:alert(1)) dan [ok](https://a.com/?q=1&r=2)\n\n- satu\n- **dua**\n\n## Judul');
  assert.doesNotMatch(h, /<script/);
  assert.doesNotMatch(h, /href="javascript/);
  assert.match(h, /<a href="https:\/\/a\.com\/\?q=1&amp;r=2"/);
  assert.match(h, /<ul><li>satu<\/li><li><strong>dua<\/strong><\/li><\/ul>/);
  assert.match(h, /<h2>Judul<\/h2>/);
});

type Backend = { name: string; make: () => { repo: RepoStore; external: (p: string, c: string) => void; show: (p: string) => Promise<string | null> } };
const backends: Backend[] = [
  { name: 'git lokal', make: () => { const dir = cloneRepo(); const repo = new LocalGitRepo(dir); return { repo, external: (p, c) => manualCommit(dir, p, c, 'manual'), show: async (p) => (await repo.read(p))?.content ?? null }; } },
  { name: 'GitHub (server tiruan)', make: () => {
    const fake = fakeGitHub(readAllFiles(cloneRepo()));
    const repo = new GitHubRepo({ token: 't', repo: 'o/r', branch: 'main', fetchImpl: fake.fetchImpl });
    return { repo, external: (p, c) => fake.externalCommit(p, c), show: async (p) => (await repo.read(p))?.content ?? null };
  } },
];

const goodDest = () => ({
  order: 9, image: '/src/assets/images/billebante.jpg',
  en: { title: 'Nusa Penida (contoh)', tagline: 'Cliffs and clear water.', description: 'Nusa Penida with a local guide. Contoh.', see: ['Kelingking'], activities: ['Snorkel'], shopping: ['Weaving'], imageAlt: 'Cliff', body: 'Teks contoh.', needsReview: true },
  id: {},
});

for (const b of backends) {
  test(`cerita+destinasi [${b.name}]: edit story, tambah story, edit destinasi -> SATU commit`, async () => {
    const { repo, show } = b.make();
    const app = buildApp(repo); const sid = await login(app);
    const [l, s] = storyFiles.find(([x]) => x === 'en')!;
    const st = await (await get(app, `/api/stories/${l}/${s}`, sid)).json() as any;
    const ds = await (await get(app, '/api/destinations/lombok', sid)).json() as any;
    ds.data.en.see.push('Tambahan baris (contoh)');
    const before = (await repo.history({ limit: 50 })).length;
    const res = await post(app, '/api/publish', { items: [
      { kind: 'story', locale: l, slug: s, fm: { ...st.fm, title: 'Judul baru: uji' }, body: st.body + '\n\nParagraf baru.', baseSha: st.sha },
      { kind: 'story', locale: 'id', slug: 'artikel-uji-contoh', fm: { title: 'Artikel uji (contoh)', description: 'Deskripsi uji.', date: '2026-11-25', category: 'tips', tags: 'uji, contoh' }, body: 'Isi uji.', baseSha: null },
      { kind: 'destination', slug: 'lombok', data: ds.data, baseSha: ds.sha },
    ] }, sid);
    assert.equal(res.status, 200, await res.clone().text());
    const out = await res.json() as any;
    assert.equal(out.changed.length, 3);
    assert.equal((await repo.history({ limit: 50 })).length, before + 1);
    assert.match((await show(`src/content/stories/${l}/${s}.md`))!, /Paragraf baru\./);
    assert.match((await show('src/content/stories/id/artikel-uji-contoh.md'))!, /tags: uji, contoh/);
    assert.match((await show('src/content/destinations/lombok.yml'))!, /Tambahan baris \(contoh\)/);
  });

  test(`cerita [${b.name}]: deskripsi > 160, tanggal salah, isi kosong -> 422, tanpa commit`, async () => {
    const { repo } = b.make();
    const app = buildApp(repo); const sid = await login(app);
    const head = (await repo.history({ limit: 1 }))[0].commit;
    const res = await post(app, '/api/publish', { items: [{ kind: 'story', locale: 'en', slug: 'rusak', fm: { title: 'T', description: 'x'.repeat(161), date: '5 Nov', category: 'tips' }, body: '  ', baseSha: null }] }, sid);
    assert.equal(res.status, 422);
    const t = JSON.stringify(await res.json());
    assert.match(t, /160/); assert.match(t, /YYYY-MM-DD/); assert.match(t, /Isi artikel/);
    assert.equal((await repo.history({ limit: 1 }))[0].commit, head);
  });

  test(`destinasi [${b.name}]: destinasi baru lengkap lolos; "id" kosong dibiarkan (jatuh ke English)`, async () => {
    const { repo, show } = b.make();
    const app = buildApp(repo); const sid = await login(app);
    const res = await post(app, '/api/publish', { items: [{ kind: 'destination', slug: 'nusa-penida', data: goodDest(), baseSha: null }] }, sid);
    assert.equal(res.status, 200, await res.clone().text());
    const y = (await show('src/content/destinations/nusa-penida.yml'))!;
    assert.match(y, /^slug: nusa-penida\norder: 9\n/);
    const list = await (await get(app, '/api/destinations', sid)).json() as any;
    assert.deepEqual(list.destinations.find((d: any) => d.slug === 'nusa-penida').missingLocale, ['id']);
  });

  test(`destinasi [${b.name}]: terlalu pendek/kosong ditolak, hapus destinasi yang dipakai paket ditolak`, async () => {
    const { repo } = b.make();
    const app = buildApp(repo); const sid = await login(app);
    const bad = goodDest(); bad.en.see = []; bad.en.description = 'y'.repeat(170);
    let res = await post(app, '/api/publish', { items: [{ kind: 'destination', slug: 'nusa-penida', data: bad, baseSha: null }] }, sid);
    assert.equal(res.status, 422);
    assert.match(JSON.stringify(await res.json()), /160/);
    const ds = await (await get(app, '/api/destinations/bali', sid)).json() as any;
    res = await post(app, '/api/publish', { items: [{ kind: 'destination', slug: 'bali', data: null, baseSha: ds.sha }] }, sid);
    assert.equal(res.status, 422, 'paket Bali masih memakai destinasi ini');
  });

  test(`cerita [${b.name}]: hapus artikel menghapus berkas; konflik dengan commit manual -> 409`, async () => {
    const { repo, external, show } = b.make();
    const app = buildApp(repo); const sid = await login(app);
    const [l, s] = storyFiles[0];
    const st = await (await get(app, `/api/stories/${l}/${s}`, sid)).json() as any;
    external(`src/content/stories/${l}/${s}.md`, readRepo(`src/content/stories/${l}/${s}.md`) + '\nTambahan manual.\n');
    let res = await post(app, '/api/publish', { items: [{ kind: 'story', locale: l, slug: s, fm: st.fm, body: st.body + 'x', baseSha: st.sha }] }, sid);
    assert.equal(res.status, 409);
    assert.equal(((await res.json()) as any).conflicts[0].path, `src/content/stories/${l}/${s}.md`);
    const fresh = await (await get(app, `/api/stories/${l}/${s}`, sid)).json() as any;
    res = await post(app, '/api/publish', { items: [{ kind: 'story', locale: l, slug: s, fm: null, body: '', baseSha: fresh.sha }] }, sid);
    assert.equal(res.status, 200, await res.clone().text());
    assert.equal(await show(`src/content/stories/${l}/${s}.md`), null);
  });
}
