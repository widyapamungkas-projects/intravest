process.env.TEST = '1';
process.env.DATA_DIR = '/tmp/cms-test-data-otp';
process.env.NODE_ENV = 'test';
import { test, before } from 'node:test';
import assert from 'node:assert/strict';
import { getDb } from '../src/server/db.ts';
import { createUser } from '../src/server/auth.ts';
import { config } from '../src/server/config.ts';
import { buildApp } from '../src/server/index.ts';
import { LocalGitRepo } from '../src/server/repo/local.ts';
import { cloneRepo } from './helpers.ts';

getDb(':memory:');
before(async () => { await createUser('admin@contoh.com', 'Admin Contoh', 'rahasia-banget-123'); });
const H = { 'content-type': 'application/json', 'x-cms': '1' };

test('DISABLE_OTP: password benar langsung masuk; password salah tetap ditolak', async () => {
  const app = buildApp(new LocalGitRepo(cloneRepo()));
  const login = (password: string) => app.request('/api/auth/login', { method: 'POST', headers: H, body: JSON.stringify({ email: 'admin@contoh.com', password }) });
  config.disableOtp = false;
  assert.equal(((await (await login('rahasia-banget-123')).json()) as any).step, 'otp', 'default: OTP diminta');
  config.disableOtp = true;
  const ok = await login('rahasia-banget-123');
  assert.equal(((await ok.json()) as any).step, 'done');
  const cookie = ok.headers.getSetCookie().map((c) => c.split(';')[0]).join('; ');
  assert.equal(((await (await app.request('/api/auth/me', { headers: { cookie } })).json()) as any).user.email, 'admin@contoh.com');
  assert.equal((await login('salah-banget-123')).status, 401);
  config.disableOtp = false;
});
