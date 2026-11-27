process.env.TEST = '1';
process.env.DATA_DIR = '/tmp/cms-test-data-stageD';
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
import { cloneRepo, fakeGitHub, readAllFiles, REPO_ROOT } from './helpers.ts';
import { validateData, tidyData, imageKind } from '../src/shared/site-data.ts';

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
// WebP minimal valid header (RIFF....WEBP) + padding
const webp = Buffer.concat([Buffer.from('RIFF'), Buffer.from([0x20, 0, 0, 0]), Buffer.from('WEBPVP8 '), Buffer.alloc(40)]);

const backends: { name: string; make: () => { repo: RepoStore } }[] = [
  { name: 'git lokal', make: () => ({ repo: new LocalGitRepo(cloneRepo()) }) },
  { name: 'GitHub (server tiruan)', make: () => ({ repo: new GitHubRepo({ token: 't', repo: 'o/r', branch: 'main', fetchImpl: fakeGitHub(readAllFiles(cloneRepo())).fetchImpl }) }) },
];

test('skema data situs: berkas asli lolos, data rusak ditolak', () => {
  for (const n of ['home', 'about', 'settings'] as const) {
    const raw = JSON.parse(fs.readFileSync(path.join(REPO_ROOT, `src/data/${n}.json`), 'utf8'));
    assert.deepEqual(validateData(n, raw), { ok: true }, n);
  }
  const s = JSON.parse(fs.readFileSync(path.join(REPO_ROOT, 'src/data/settings.json'), 'utf8'));
  s.contact.whatsapp = '0812';
  s.contact.email = 'bukan-email';
  const r = validateData('settings', s) as any;
  assert.equal(r.ok, false);
  assert.equal(r.issues.length, 2);
  assert.equal((validateData('home', { heroSlides: [1, 2, 3, 4].map(() => ({ image: 'a.jpg' })) }) as any).ok, false);
});
test('imageKind membaca tanda awal berkas', () => {
  assert.equal(imageKind(webp), 'webp');
  assert.equal(imageKind(Buffer.from([0xff, 0xd8, 0xff, 0xe0, 0, 0])), 'jpg');
  assert.equal(imageKind(Buffer.from('<?php echo 1; ?>')), null);
});
test('tidyData membuang slide tanpa foto dan merapikan spasi', () => {
  const d = tidyData('home', { heroSlides: [{ image: ' a.jpg ', alt: ' x ' }, { image: '', alt: '' }], ctaImage: 'b.jpg', ctaAlt: '' });
  assert.deepEqual(d.heroSlides, [{ image: 'a.jpg', alt: 'x' }]);
});

for (const b of backends) {
  test(`foto + beranda + pengaturan [${b.name}]: SATU commit, file biner utuh`, async () => {
    const { repo } = b.make();
    const app = buildApp(repo); const sid = await login(app);
    const home = await (await get(app, '/api/data/home', sid)).json() as any;
    const settings = await (await get(app, '/api/data/settings', sid)).json() as any;
    home.data.ctaImage = 'foto-uji-contoh.webp';
    settings.data.contact.email = 'halo@contoh.com';
    const before = (await repo.history({ limit: 50 })).length;
    const res = await post(app, '/api/publish', { items: [
      { kind: 'image', name: 'foto-uji-contoh.webp', b64: webp.toString('base64') },
      { kind: 'data', name: 'home', data: home.data, baseSha: home.sha },
      { kind: 'data', name: 'settings', data: settings.data, baseSha: settings.sha },
    ] }, sid);
    assert.equal(res.status, 200, await res.clone().text());
    const hist = await repo.history({ limit: 50 });
    assert.equal(hist.length, before + 1);
    const saved = await repo.readBuffer('src/assets/images/foto-uji-contoh.webp');
    assert.ok(saved && Buffer.compare(saved.content, webp) === 0);
    const h2 = await (await get(app, '/api/data/home', sid)).json() as any;
    assert.equal(h2.data.ctaImage, 'foto-uji-contoh.webp');
  });
  test(`foto/data tidak sah ditolak [${b.name}]`, async () => {
    const { repo } = b.make();
    const app = buildApp(repo); const sid = await login(app);
    const n = (await repo.history({ limit: 50 })).length;
    let res = await post(app, '/api/publish', { items: [{ kind: 'image', name: 'palsu.webp', b64: Buffer.from('<?php ?>').toString('base64') }] }, sid);
    assert.equal(res.status, 400);
    res = await post(app, '/api/publish', { items: [{ kind: 'image', name: '../../evil.webp', b64: webp.toString('base64') }] }, sid);
    assert.equal(res.status, 400);
    res = await post(app, '/api/publish', { items: [{ kind: 'image', name: 'besar.webp', b64: Buffer.concat([webp, Buffer.alloc(5 * 1024 * 1024)]).toString('base64') }] }, sid);
    assert.equal(res.status, 413);
    const s = await (await get(app, '/api/data/settings', sid)).json() as any;
    s.data.contact.whatsapp = '12';
    res = await post(app, '/api/publish', { items: [{ kind: 'data', name: 'settings', data: s.data, baseSha: s.sha }] }, sid);
    assert.equal(res.status, 422);
    assert.equal((await repo.history({ limit: 50 })).length, n);
  });
  test(`konflik data situs [${b.name}]`, async () => {
    const { repo } = b.make();
    const app = buildApp(repo); const sid = await login(app);
    const a = await (await get(app, '/api/data/about', sid)).json() as any;
    let res = await post(app, '/api/publish', { items: [{ kind: 'data', name: 'about', data: { ...a.data, heroAlt: 'Baru' }, baseSha: a.sha }] }, sid);
    assert.equal(res.status, 200);
    res = await post(app, '/api/publish', { items: [{ kind: 'data', name: 'about', data: { ...a.data, heroAlt: 'Lain' }, baseSha: a.sha }] }, sid);
    assert.equal(res.status, 409);
  });
}
