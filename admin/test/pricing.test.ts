process.env.TEST = '1';
process.env.DATA_DIR = '/tmp/cms-test-data-pricing';
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
import { checkPricing, csvToGrid, gridToCsv, newHotelId, pasteInto, toAmount, TIERS, type Grid } from '../src/shared/pricing.ts';
import { parseYaml } from '../src/server/content/yaml.ts';
// @ts-expect-error: modul JS milik situs, tanpa tipe
import { parsePricingCsv, validatePricing } from '../../src/pricing-core.mjs';

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

const slugs = ['bali-active', 'bali-essentials', 'bali-explorer'];
const csvOf = (s: string) => fs.readFileSync(path.join(REPO_ROOT, `src/data/pricing/${s}.csv`), 'utf8');
const ymlOf = (s: string) => parseYaml<any>(fs.readFileSync(path.join(REPO_ROOT, `src/content/tours/${s}.yml`), 'utf8'));
const NOW = new Date('2026-11-24');

for (const s of slugs) {
  test(`CSV asli ${s}: grid -> CSV identik byte demi byte`, () => {
    const hotels = ymlOf(s).pricing.hotels as { id: string }[];
    const r = csvToGrid(csvOf(s), hotels.map((h) => h.id));
    assert.deepEqual(r.orphans, []);
    assert.deepEqual(r.problems, []);
    assert.equal(gridToCsv(r.grid, hotels), csvOf(s));
  });

  test(`validasi ${s}: sejalan dengan pricing-core.mjs milik situs`, () => {
    const y = ymlOf(s);
    const hotels = y.pricing.hotels.map((h: any) => ({ ...h, highSeason: h.highSeason ?? 0 }));
    const { grid } = csvToGrid(csvOf(s), hotels.map((h: any) => h.id));
    const mine = checkPricing({ grid, hotels, leadHotel: y.pricing.leadHotel, leadTier: y.pricing.leadTier, validUntil: y.pricing.validUntil, today: NOW });
    const parsed = parsePricingCsv(gridToCsv(grid, hotels));
    const theirs = validatePricing({ rows: parsed.rows, hotels, leadHotel: y.pricing.leadHotel, leadTier: y.pricing.leadTier, validUntil: y.pricing.validUntil, today: NOW });
    assert.deepEqual(mine.errors, []);
    assert.deepEqual(theirs.errors, []);
    assert.equal(mine.warnings.length, theirs.warnings.length, `${mine.warnings} vs ${theirs.warnings}`);
    // sel dikosongkan: dua-duanya menolak
    const bad: Grid = JSON.parse(JSON.stringify(grid));
    bad[hotels[0].id]['4-5'].twin = null;
    const m2 = checkPricing({ grid: bad, hotels, leadHotel: y.pricing.leadHotel, leadTier: y.pricing.leadTier, validUntil: y.pricing.validUntil, today: NOW });
    const t2 = validatePricing({ rows: parsePricingCsv(gridToCsv(bad, hotels)).rows, hotels, leadHotel: y.pricing.leadHotel, leadTier: y.pricing.leadTier, validUntil: y.pricing.validUntil, today: NOW });
    assert.ok(m2.errors.length && t2.errors.length);
    assert.equal(m2.blanks[hotels[0].id], 1);
  });
}

test('angka dari Excel/Sheets: titik, koma, Rp, spasi', () => {
  assert.equal(toAmount('3.500.000'), 3500000);
  assert.equal(toAmount('3,500,000'), 3500000);
  assert.equal(toAmount('Rp 3.500.000'), 3500000);
  assert.equal(toAmount('IDR 3500000'), 3500000);
  assert.equal(toAmount(''), null);
  assert.equal(toAmount('abc'), null);
});

const hotels2 = [{ id: 'hotel-a', name: 'Hotel A' }, { id: 'hotel-b', name: 'Hotel B' }];
const empty = (): Grid => csvToGrid('', hotels2.map((h) => h.id)).grid;

test('tempel: blok polos dari sel aktif mengisi ke kanan dan ke bawah, tidak melewati tepi', () => {
  const block = '1.000\t2.000\t3.000\r\n4.000\t5.000\t6.000\r\n';
  const r = pasteInto(empty(), hotels2, { hotel: 'hotel-a', tier: 0, col: 4 }, block);
  assert.equal(r.grid['hotel-a']['2'].cwb, 1000);
  assert.equal(r.grid['hotel-a']['2'].cnb, 2000);
  assert.equal(r.grid['hotel-a']['3'].cwb, 4000);
  assert.equal(r.grid['hotel-a']['3'].cnb, 5000);
  assert.equal(r.grid['hotel-a']['2'].twin, null);
  assert.ok(r.note);
  assert.equal(r.filled, 4);
});

test('tempel: tujuh baris satu hotel, dengan kolom tier di depan, masuk ke hotel aktif', () => {
  const lines = TIERS.map((t, i) => [t.label, ...[6, 5, 5, 4, 4, 3].map((n) => `Rp ${(n * 1000000 - i * 100000).toLocaleString('id-ID')}`)].join('\t')).join('\n');
  const r = pasteInto(empty(), hotels2, { hotel: 'hotel-b', tier: 3, col: 2 }, lines);
  assert.equal(r.filled, 42);
  assert.equal(r.grid['hotel-b']['2'].single, 6000000);
  assert.equal(r.grid['hotel-b']['15+'].cnb, 2400000);
  assert.equal(r.grid['hotel-a']['2'].single, null);
});

test('tempel: tabel lengkap dengan judul, dipetakan per hotel dan tier; hotel asing dilewati', () => {
  const t = 'hotel\ttier\tsingle\ttwin\ttriple\tchild_twin\tcwb\tcnb\n' +
    'hotel-a\t2\t10\t9\t8\t7\t6\t5\nHotel B\t4–5\t20\t19\t18\t17\t16\t15\nhotel-z\t2\t1\t1\t1\t1\t1\t1\n';
  const r = pasteInto(empty(), hotels2, { hotel: 'hotel-a', tier: 0, col: 0 }, t);
  assert.equal(r.grid['hotel-a']['2'].twin, 9);
  assert.equal(r.grid['hotel-b']['4-5'].cnb, 15);
  assert.equal(r.filled, 12);
  assert.match(r.note ?? '', /hotel-z/);
});

test('tempel: kosong atau cuma judul memberi pesan, bukan error diam-diam', () => {
  assert.ok(pasteInto(empty(), hotels2, { hotel: 'hotel-a', tier: 0, col: 0 }, '   ').error);
  assert.ok(pasteInto(empty(), hotels2, { hotel: 'hotel-a', tier: 0, col: 0 }, 'hotel\ttier\tsingle').error);
});

test('id hotel dibuat unik', () => {
  assert.equal(newHotelId('', []), 'hotel-a');
  assert.equal(newHotelId('', ['hotel-a']), 'hotel-b');
  assert.equal(newHotelId('Alaya Resort (contoh)', []), 'alaya-resort');
  assert.equal(newHotelId('Alaya Resort', ['alaya-resort']), 'alaya-resort-2');
});

// ---------------- publish ----------------
type Backend = { name: string; make: () => { repo: RepoStore; external: (p: string, c: string) => void; show: (p: string) => Promise<string | null> } };
const backends: Backend[] = [
  { name: 'git lokal', make: () => { const dir = cloneRepo(); const repo = new LocalGitRepo(dir); return { repo, external: (p, c) => manualCommit(dir, p, c, 'manual'), show: async (p) => (await repo.read(p))?.content ?? null }; } },
  { name: 'GitHub (server tiruan)', make: () => {
    const fake = fakeGitHub(readAllFiles(cloneRepo()));
    const repo = new GitHubRepo({ token: 't', repo: 'o/r', branch: 'main', fetchImpl: fake.fetchImpl });
    return { repo, external: (p, c) => fake.externalCommit(p, c), show: async (p) => (await repo.read(p))?.content ?? null };
  } },
];

for (const b of backends) {
  test(`harga [${b.name}]: ubah satu harga + surcharge -> SATU commit berisi csv dan yml`, async () => {
    const { repo, show } = b.make();
    const app = buildApp(repo); const sid = await login(app);
    const t = await (await get(app, '/api/tours/bali-active', sid)).json() as any;
    const hotels = t.data.pricing.hotels;
    const { grid } = csvToGrid(t.csv.text, hotels.map((h: any) => h.id));
    grid['hotel-b']['4-5'].twin = 5_400_000;
    hotels[1].highSeason = 375_000;
    const before = (await repo.history({ limit: 50 })).length;
    const res = await post(app, '/api/publish', { items: [
      { kind: 'tour', slug: 'bali-active', data: t.data, baseSha: t.sha },
      { kind: 'csv', slug: 'bali-active', text: gridToCsv(grid, hotels), baseSha: t.csv.sha },
    ] }, sid);
    assert.equal(res.status, 200, await res.clone().text());
    const out = await res.json() as any;
    assert.deepEqual(out.changed.sort(), ['src/content/tours/bali-active.yml', 'src/data/pricing/bali-active.csv']);
    assert.equal(out.subject, 'CMS: update paket + harga bali-active');
    assert.equal((await repo.history({ limit: 50 })).length, before + 1, 'tepat satu commit baru');
    const csv = (await show('src/data/pricing/bali-active.csv'))!;
    assert.match(csv, /hotel-b,4-5,\d+,5400000,/);
    // hanya satu baris CSV yang berubah
    const a = t.csv.text.split('\n'), c = csv.split('\n');
    assert.equal(c.filter((l, i) => l !== a[i]).length, 1);
    assert.match((await show('src/content/tours/bali-active.yml'))!, /highSeason: 375000/);
  });

  test(`harga [${b.name}]: sel kosong ditolak 422 dan tidak ada commit`, async () => {
    const { repo } = b.make();
    const app = buildApp(repo); const sid = await login(app);
    const t = await (await get(app, '/api/tours/bali-active', sid)).json() as any;
    const hotels = t.data.pricing.hotels;
    const { grid } = csvToGrid(t.csv.text, hotels.map((h: any) => h.id));
    grid['hotel-a']['2'].single = null;
    const head = (await repo.history({ limit: 1 }))[0].commit;
    const res = await post(app, '/api/publish', { items: [{ kind: 'csv', slug: 'bali-active', text: gridToCsv(grid, hotels), baseSha: t.csv.sha }] }, sid);
    assert.equal(res.status, 422);
    assert.match(JSON.stringify(await res.json()), /single/);
    assert.equal((await repo.history({ limit: 1 }))[0].commit, head);
  });

  test(`harga [${b.name}]: hotel dihapus di yml tapi CSV lama dipertahankan -> ditolak; hotel baru + CSV -> lolos`, async () => {
    const { repo } = b.make();
    const app = buildApp(repo); const sid = await login(app);
    const t = await (await get(app, '/api/tours/bali-active', sid)).json() as any;
    // yml punya hotel baru, CSV belum -> tolak (tier hotel baru belum ada harganya)
    const withNew = structuredClone(t.data);
    withNew.pricing.hotels.push({ id: 'hotel-d', name: 'Hotel D (contoh)', stars: 4, area: 'Ubud', highSeason: 0 });
    let res = await post(app, '/api/publish', { items: [{ kind: 'tour', slug: 'bali-active', data: withNew, baseSha: t.sha }] }, sid);
    assert.equal(res.status, 422);
    // yml + CSV lengkap -> lolos
    const ids = withNew.pricing.hotels.map((h: any) => h.id);
    const { grid } = csvToGrid(t.csv.text, ids);
    for (const tier of TIERS) grid['hotel-d'][tier.id] = { single: 7e6, twin: 6e6, triple: 5.9e6, childTwin: 4.5e6, cwb: 4.2e6, cnb: 3.2e6 };
    res = await post(app, '/api/publish', { items: [
      { kind: 'tour', slug: 'bali-active', data: withNew, baseSha: t.sha },
      { kind: 'csv', slug: 'bali-active', text: gridToCsv(grid, withNew.pricing.hotels), baseSha: t.csv.sha },
    ] }, sid);
    assert.equal(res.status, 200, await res.clone().text());
  });

  test(`harga [${b.name}]: orang lain mengubah CSV yang sama -> 409, tidak menimpa`, async () => {
    const { repo, external, show } = b.make();
    const app = buildApp(repo); const sid = await login(app);
    const t = await (await get(app, '/api/tours/bali-active', sid)).json() as any;
    const hotels = t.data.pricing.hotels;
    const { grid } = csvToGrid(t.csv.text, hotels.map((h: any) => h.id));
    grid['hotel-a']['2'].twin = 5_000_000;
    // orang lain mengubah satu harga di CSV yang sama sementara kita menyunting
    external('src/data/pricing/bali-active.csv', t.csv.text.replace('hotel-a,2,6775000', 'hotel-a,2,6800000'));
    const res = await post(app, '/api/publish', { items: [{ kind: 'csv', slug: 'bali-active', text: gridToCsv(grid, hotels), baseSha: t.csv.sha }] }, sid);
    assert.equal(res.status, 409);
    const j = await res.json() as any;
    assert.equal(j.conflicts[0].path, 'src/data/pricing/bali-active.csv');
    assert.match((await show('src/data/pricing/bali-active.csv'))!, /hotel-a,2,6800000/);
  });

  test(`harga [${b.name}]: hapus tabel harga -> yml tanpa pricing + CSV terhapus dalam satu commit`, async () => {
    const { repo, show } = b.make();
    const app = buildApp(repo); const sid = await login(app);
    const t = await (await get(app, '/api/tours/bali-active', sid)).json() as any;
    const data = structuredClone(t.data); delete data.pricing; data.priceIDR = 4_900_000;
    const res = await post(app, '/api/publish', { items: [
      { kind: 'tour', slug: 'bali-active', data, baseSha: t.sha },
      { kind: 'csv', slug: 'bali-active', text: null, baseSha: t.csv.sha },
    ] }, sid);
    assert.equal(res.status, 200, await res.clone().text());
    assert.equal(await show('src/data/pricing/bali-active.csv'), null);
    assert.doesNotMatch((await show('src/content/tours/bali-active.yml'))!, /pricing:/);
    assert.match((await show('src/content/tours/bali-active.yml'))!, /priceIDR: 4900000/);
  });
}
