process.env.TEST = '1';
process.env.DATA_DIR = '/tmp/cms-test-data';
process.env.NODE_ENV = 'test';
import { test, before } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { getDb } from '../src/server/db.ts';
import { createUser } from '../src/server/auth.ts';
import { outbox } from '../src/server/mail.ts';
import { buildApp } from '../src/server/index.ts';
import { LocalGitRepo } from '../src/server/repo/local.ts';
import { GitHubRepo } from '../src/server/repo/github.ts';
import type { RepoStore } from '../src/server/repo/types.ts';
import { cloneRepo, fakeGitHub, manualCommit, readAllFiles } from './helpers.ts';

getDb(':memory:');
const PW = 'rahasia-banget-123';

before(async () => { await createUser('admin@contoh.com', 'Admin Contoh', PW); });

const H = { 'content-type': 'application/json', 'x-cms': '1' };
type App = ReturnType<typeof buildApp>;
const post = (app: App, url: string, body: unknown, cookie = '') => app.request(url, { method: 'POST', headers: { ...H, cookie }, body: JSON.stringify(body) });
const get = (app: App, url: string, cookie = '') => app.request(url, { headers: { cookie } });
const cookiesOf = (res: Response) => res.headers.getSetCookie().map((c) => c.split(';')[0]).join('; ');

async function login(app: App, remember = false) {
  getDb().exec('DELETE FROM attempts');
  const r1 = await post(app, '/api/auth/login', { email: 'admin@contoh.com', password: PW, remember });
  assert.equal(r1.status, 200);
  const j1 = await r1.json() as any;
  if (j1.step === 'done') return cookiesOf(r1);
  assert.equal(j1.step, 'otp');
  const code = /(\d{6})/.exec(outbox.at(-1)!.text)![1];
  const r2 = await post(app, '/api/auth/verify', { code }, cookiesOf(r1));
  assert.equal(r2.status, 200);
  return cookiesOf(r2);
}

test('auth: password salah, kode salah, CSRF, lalu masuk', async () => {
  const app = buildApp(new LocalGitRepo(cloneRepo()));
  assert.equal((await get(app, '/api/tours')).status, 401);
  assert.equal((await post(app, '/api/auth/login', { email: 'admin@contoh.com', password: 'salah-salah-1' })).status, 401);
  assert.equal((await post(app, '/api/auth/login', { email: 'nggak@ada.com', password: 'salah-salah-1' })).status, 401);
  // tanpa header X-CMS ditolak
  const noHeader = await app.request('/api/auth/login', { method: 'POST', headers: { 'content-type': 'application/json' }, body: '{}' });
  assert.equal(noHeader.status, 403);
  // Origin asing ditolak
  const evil = await app.request('/api/auth/login', { method: 'POST', headers: { ...H, origin: 'https://jahat.example' }, body: '{}' });
  assert.equal(evil.status, 403);

  const r1 = await post(app, '/api/auth/login', { email: 'admin@contoh.com', password: PW });
  const pending = cookiesOf(r1);
  assert.equal((await post(app, '/api/auth/verify', { code: '000000' }, pending)).status, 401);
  const code = /(\d{6})/.exec(outbox.at(-1)!.text)![1];
  const ok = await post(app, '/api/auth/verify', { code }, pending);
  assert.equal(ok.status, 200);
  const sid = cookiesOf(ok);
  assert.match(ok.headers.getSetCookie().join('|'), /HttpOnly/);
  assert.match(ok.headers.getSetCookie().join('|'), /SameSite=Strict/);
  assert.equal((await get(app, '/api/tours', sid)).status, 200);
  // kode sekali pakai
  assert.equal((await post(app, '/api/auth/verify', { code }, pending)).status, 400);
});

test('batas admin maksimal 3', async () => {
  await createUser('b@contoh.com', 'B', 'password-aman-1');
  await createUser('c@contoh.com', 'C', 'password-aman-1');
  await assert.rejects(createUser('d@contoh.com', 'D', 'password-aman-1'), /batas 3/);
  await assert.rejects(createUser('x@contoh.com', 'X', 'pendek'), /minimal 10/);
});

type Backend = { name: string; make: () => { repo: RepoStore; external: (p: string, c: string) => void; headMessage: () => Promise<string> } };
const backends: Backend[] = [
  { name: 'git lokal', make: () => { const dir = cloneRepo(); const repo = new LocalGitRepo(dir); return { repo, external: (p, c) => manualCommit(dir, p, c, 'manual'), headMessage: async () => (await repo.history({ limit: 1 }))[0].message }; } },
  { name: 'GitHub (server tiruan)', make: () => {
      const fake = fakeGitHub(readAllFiles(cloneRepo()));
      const repo = new GitHubRepo({ token: 't', repo: 'o/r', branch: 'main', fetchImpl: fake.fetchImpl });
      return { repo, external: (p, c) => fake.externalCommit(p, c), headMessage: async () => (await repo.history({ limit: 1 }))[0].message };
  } },
];

for (const b of backends) {
  test(`publish [${b.name}]: ubah judul -> satu commit rapi, file lain tak tersentuh`, async () => {
    const { repo, headMessage } = b.make();
    const app = buildApp(repo);
    const sid = await login(app);
    const list = await (await get(app, '/api/tours', sid)).json() as any;
    assert.equal(list.tours.length, 3);
    const t = await (await get(app, '/api/tours/bali-active', sid)).json() as any;
    t.data.en.title = 'Bali Active Adventure';
    t.data.id.inclusions.push('Satu inklusi baru');
    const res = await post(app, '/api/publish', { items: [{ kind: 'tour', slug: 'bali-active', data: t.data, baseSha: t.sha }] }, sid);
    assert.equal(res.status, 200, await res.clone().text());
    const out = await res.json() as any;
    assert.deepEqual(out.changed, ['src/content/tours/bali-active.yml']);
    assert.equal(out.subject, 'CMS: update paket bali-active');
    const msg = await headMessage();
    assert.match(msg, /^CMS: update paket bali-active/);
    assert.match(msg, /Diubah oleh: Admin Contoh <admin@contoh.com>/);
    const after = await (await get(app, '/api/tours/bali-active', sid)).json() as any;
    assert.equal(after.data.en.title, 'Bali Active Adventure');
    assert.equal(after.data.id.inclusions.at(-1), 'Satu inklusi baru');
    // tanpa perubahan nyata: tidak ada commit baru
    const again = await post(app, '/api/publish', { items: [{ kind: 'tour', slug: 'bali-active', data: after.data, baseSha: after.sha }] }, sid);
    assert.deepEqual((await again.json() as any).changed, []);
  });

  test(`konflik [${b.name}]: file yang sama diubah orang lain -> 409; file lain -> tetap jalan`, async () => {
    const { repo, external } = b.make();
    const app = buildApp(repo);
    const sid = await login(app);
    const t = await (await get(app, '/api/tours/bali-active', sid)).json() as any;
    const other = await (await get(app, '/api/tours/bali-explorer', sid)).json() as any;

    // orang lain mengubah paket lain -> tidak menghalangi
    external('src/content/tours/bali-essentials.yml', (await repo.read('src/content/tours/bali-essentials.yml'))!.content + '\n# edit manual\n');
    t.data.en.title = 'Judul A';
    let res = await post(app, '/api/publish', { items: [{ kind: 'tour', slug: 'bali-active', data: t.data, baseSha: t.sha }] }, sid);
    assert.equal(res.status, 200, await res.clone().text());

    // orang lain mengubah file yang sedang kita edit -> konflik, tidak menimpa
    external('src/content/tours/bali-explorer.yml', (await repo.read('src/content/tours/bali-explorer.yml'))!.content.replace('Bali Explorer', 'Bali Explorer Manual'));
    other.data.en.title = 'Judul B';
    res = await post(app, '/api/publish', { items: [{ kind: 'tour', slug: 'bali-explorer', data: other.data, baseSha: other.sha }] }, sid);
    assert.equal(res.status, 409);
    const j = await res.json() as any;
    assert.equal(j.conflicts[0].path, 'src/content/tours/bali-explorer.yml');
    assert.match(j.conflicts[0].theirContent, /Bali Explorer Manual/);
    // versi manual tetap utuh
    assert.match((await repo.read('src/content/tours/bali-explorer.yml'))!.content, /Bali Explorer Manual/);
  });
}

test('validasi: itinerary tak sama dengan jumlah hari, slug baru yang sudah ada, destinasi tak ada', async () => {
  const { repo } = backends[0].make();
  const app = buildApp(repo);
  const sid = await login(app);
  const t = await (await get(app, '/api/tours/bali-active', sid)).json() as any;

  const bad = structuredClone(t.data); bad.days = 5;
  let res = await post(app, '/api/publish', { items: [{ kind: 'tour', slug: 'bali-active', data: bad, baseSha: t.sha }] }, sid);
  assert.equal(res.status, 422);
  assert.match(JSON.stringify(await res.json()), /punya 4 hari, padahal paket 5 hari/);

  const dest = structuredClone(t.data); dest.destination = 'atlantis';
  res = await post(app, '/api/publish', { items: [{ kind: 'tour', slug: 'bali-active', data: dest, baseSha: t.sha }] }, sid);
  assert.equal(res.status, 422);
  assert.match(((await res.json()) as any).issues[0].message, /destinasi "atlantis" yang tidak ada/);

  // slug sudah ada tapi baseSha null (dianggap paket baru) -> konflik, bukan menimpa
  const dup = structuredClone(t.data); dup.en.title = 'Beda isi';
  res = await post(app, '/api/publish', { items: [{ kind: 'tour', slug: 'bali-active', data: dup, baseSha: null }] }, sid);
  assert.equal(res.status, 409);
});

test('paket baru dibuat dari nol lolos validasi dan tercatat satu commit', async () => {
  const { repo } = backends[1].make();
  const app = buildApp(repo);
  const sid = await login(app);
  const fresh = {
    code: 'LOM-01', destination: 'lombok', days: 2, nights: 1, order: 9, priceIDR: 2500000, priceIsDraft: true, minPax: 2,
    en: { title: 'Lombok Test (contoh)', summary: 'Ringkasan contoh.', itinerary: [
      { title: 'Hari satu', plan: ['A', 'B'], meals: 'Lunch' }, { title: 'Hari dua', plan: ['C'], meals: '-' }], inclusions: ['Mobil'], exclusions: ['Tiket'] },
    id: {},
  };
  const res = await post(app, '/api/publish', { items: [{ kind: 'tour', slug: 'lombok-test', data: fresh, baseSha: null }] }, sid);
  assert.equal(res.status, 200, await res.clone().text());
  assert.equal((await res.json() as any).subject, 'CMS: tambah paket lombok-test');
  const txt = (await repo.read('src/content/tours/lombok-test.yml'))!.content;
  assert.match(txt, /^slug: lombok-test\ncode: LOM-01\n/);
});

test('perangkat tepercaya melewati OTP tetapi tetap butuh password', async () => {
  const app = buildApp(new LocalGitRepo(cloneRepo()));
  getDb().exec('DELETE FROM attempts');
  const r1 = await post(app, '/api/auth/login', { email: 'admin@contoh.com', password: PW, remember: true });
  const code = /(\d{6})/.exec(outbox.at(-1)!.text)![1];
  const r2 = await post(app, '/api/auth/verify', { code }, cookiesOf(r1));
  const trust = r2.headers.getSetCookie().map((c) => c.split(';')[0]).find((c) => c.startsWith('cms_trust='))!;
  const r3 = await post(app, '/api/auth/login', { email: 'admin@contoh.com', password: PW }, trust);
  assert.equal((await r3.json() as any).step, 'done');
  assert.equal((await post(app, '/api/auth/login', { email: 'admin@contoh.com', password: 'salah-salah-1' }, trust)).status, 401);
});
