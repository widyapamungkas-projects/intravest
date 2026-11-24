// Uji berat (opsional): hasil publish dashboard harus lolos `npm run build` situs yang asli.
//   RUN_SITE_BUILD=1 npm run test:build        (butuh `npm ci` di root repo)
process.env.TEST = '1';
process.env.DATA_DIR = '/tmp/cms-test-data-build';
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
import { cloneRepo, REPO_ROOT } from './helpers.ts';
import { csvToGrid, gridToCsv } from '../src/shared/pricing.ts';

getDb(':memory:');
const PW = 'rahasia-banget-123';
before(async () => { await createUser('admin@contoh.com', 'Admin Contoh', PW); });
const H = { 'content-type': 'application/json', 'x-cms': '1' };
type App = ReturnType<typeof buildApp>;
const post = (app: App, url: string, body: unknown, cookie = '') => app.request(url, { method: 'POST', headers: { ...H, cookie }, body: JSON.stringify(body) });
const cookiesOf = (res: Response) => res.headers.getSetCookie().map((c) => c.split(';')[0]).join('; ');
async function login(app: App) {
  const r1 = await post(app, '/api/auth/login', { email: 'admin@contoh.com', password: PW });
  const j1 = await r1.json() as any;
  if (j1.step === 'done') return cookiesOf(r1);
  const code = /(\d{6})/.exec(outbox.at(-1)!.text)![1];
  return cookiesOf(await post(app, '/api/auth/verify', { code }, cookiesOf(r1)));
}

test('publish harga dari dashboard -> npm run build situs lolos dan harga baru tampil', { skip: !process.env.RUN_SITE_BUILD, timeout: 600_000 }, async () => {
  const dir = cloneRepo();
  fs.symlinkSync(path.join(REPO_ROOT, 'node_modules'), path.join(dir, 'node_modules'), 'dir');
  const repo = new LocalGitRepo(dir);
  const app = buildApp(repo); const sid = await login(app);
  const t = await (await app.request('/api/tours/bali-active', { headers: { cookie: sid } })).json() as any;
  const hotels = t.data.pricing.hotels;
  const { grid } = csvToGrid(t.csv.text, hotels.map((h: any) => h.id));
  grid['hotel-a']['4-5'].twin = 4_321_000; // hotel-a tier 4-5 = lead-in paket ini
  hotels[0].highSeason = 275_000;
  const res = await post(app, '/api/publish', { items: [
    { kind: 'tour', slug: 'bali-active', data: t.data, baseSha: t.sha },
    { kind: 'csv', slug: 'bali-active', text: gridToCsv(grid, hotels), baseSha: t.csv.sha },
  ] }, sid);
  assert.equal(res.status, 200, await res.clone().text());
  assert.equal(execFileSync('git', ['status', '--porcelain'], { cwd: dir }).toString().split('\n').filter((l) => l && !l.includes('node_modules')).join(''), '', 'commit bersih, tidak ada sisa');
  execFileSync('npm', ['run', 'build'], { cwd: dir, stdio: 'pipe', timeout: 540_000 });
  const html = fs.readFileSync(path.join(dir, 'dist/en/tours/bali-active/index.html'), 'utf8');
  assert.match(html, /4[.,]321[.,]000/, 'harga baru tampil di halaman paket');
});
