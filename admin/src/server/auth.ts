import crypto from 'node:crypto';
import { promisify } from 'node:util';
import { Hono, type Context, type MiddlewareHandler } from 'hono';
import { getCookie, setCookie, deleteCookie } from 'hono/cookie';
import { getDb } from './db.ts';
import { config } from './config.ts';
import { sendMail } from './mail.ts';

const scrypt = promisify(crypto.scrypt) as (pw: string, salt: Buffer, len: number, opts: crypto.ScryptOptions) => Promise<Buffer>;
const SCRYPT = { N: 2 ** 15, r: 8, p: 1, maxmem: 128 * 1024 * 1024 };

const now = () => Date.now();
const sha = (s: string) => crypto.createHash('sha256').update(s).digest('hex');
const token = () => crypto.randomBytes(32).toString('base64url');

const MIN = 60_000;
const DAY = 24 * 60 * MIN;
const SESSION_TTL = 7 * DAY; // geser tiap dipakai
const SESSION_MAX = 30 * DAY;
const OTP_TTL = 10 * MIN;
const TRUST_TTL = 30 * DAY;

export type User = { id: number; email: string; name: string };

// ---------- password ----------
export async function hashPassword(pw: string): Promise<string> {
  const salt = crypto.randomBytes(16);
  const key = await scrypt(pw, salt, 64, SCRYPT);
  return `scrypt$${salt.toString('base64')}$${key.toString('base64')}`;
}
export async function verifyPassword(pw: string, stored: string): Promise<boolean> {
  const [alg, s, k] = stored.split('$');
  if (alg !== 'scrypt' || !s || !k) return false;
  const expected = Buffer.from(k, 'base64');
  const key = await scrypt(pw, Buffer.from(s, 'base64'), expected.length, SCRYPT);
  return crypto.timingSafeEqual(key, expected);
}
// Hash palsu supaya waktu respons sama untuk email yang tidak terdaftar.
let dummyHash: Promise<string> | undefined;

export function passwordProblem(pw: string): string | null {
  if (pw.length < 10) return 'Password minimal 10 karakter.';
  if (!/[a-zA-Z]/.test(pw) || !/\d/.test(pw)) return 'Password harus mengandung huruf dan angka.';
  return null;
}

// ---------- admin (dipakai CLI) ----------
export async function createUser(email: string, name: string, password: string): Promise<User> {
  const db = getDb();
  const e = email.trim().toLowerCase();
  if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(e)) throw new Error('Email tidak valid.');
  const problem = passwordProblem(password);
  if (problem) throw new Error(problem);
  const count = (db.prepare('SELECT COUNT(*) AS n FROM users').get() as { n: number }).n;
  if (count >= config.maxAdmins) throw new Error(`Sudah ada ${count} admin (batas ${config.maxAdmins}). Hapus satu dulu atau naikkan MAX_ADMINS.`);
  if (db.prepare('SELECT 1 FROM users WHERE email = ?').get(e)) throw new Error('Email itu sudah terdaftar.');
  const r = db.prepare('INSERT INTO users (email, name, password_hash, created_at) VALUES (?, ?, ?, ?)').run(e, name.trim() || e, await hashPassword(password), now());
  return { id: Number(r.lastInsertRowid), email: e, name: name.trim() || e };
}
export async function setPassword(email: string, password: string) {
  const problem = passwordProblem(password);
  if (problem) throw new Error(problem);
  const db = getDb();
  const u = db.prepare('SELECT id FROM users WHERE email = ?').get(email.trim().toLowerCase()) as { id: number } | undefined;
  if (!u) throw new Error('Admin tidak ditemukan.');
  db.prepare('UPDATE users SET password_hash = ?, failed_count = 0, locked_until = 0 WHERE id = ?').run(await hashPassword(password), u.id);
  db.prepare('DELETE FROM sessions WHERE user_id = ?').run(u.id);
  db.prepare('DELETE FROM trusted_devices WHERE user_id = ?').run(u.id);
}
export function removeUser(email: string) {
  const db = getDb();
  const u = db.prepare('SELECT id FROM users WHERE email = ?').get(email.trim().toLowerCase()) as { id: number } | undefined;
  if (!u) throw new Error('Admin tidak ditemukan.');
  for (const t of ['sessions', 'trusted_devices', 'challenges']) db.prepare(`DELETE FROM ${t} WHERE user_id = ?`).run(u.id);
  db.prepare('DELETE FROM users WHERE id = ?').run(u.id);
}
export function listUsers() {
  return getDb().prepare('SELECT email, name, created_at FROM users ORDER BY id').all() as { email: string; name: string; created_at: number }[];
}

// ---------- rate limit sederhana (di SQLite) ----------
function tooMany(key: string, max: number, windowMs: number): boolean {
  const db = getDb();
  db.prepare('DELETE FROM attempts WHERE at < ?').run(now() - 24 * 60 * MIN);
  const n = (db.prepare('SELECT COUNT(*) AS n FROM attempts WHERE key = ? AND at > ?').get(key, now() - windowMs) as { n: number }).n;
  return n >= max;
}
const note = (key: string) => getDb().prepare('INSERT INTO attempts (key, at) VALUES (?, ?)').run(key, now());

function clientIp(c: Context): string {
  // Di belakang Cloudflare Tunnel, IP asli ada di CF-Connecting-IP.
  return c.req.header('cf-connecting-ip') ?? c.req.header('x-forwarded-for')?.split(',')[0]?.trim() ?? 'lokal';
}

const cookieOpts = (maxAgeMs: number) => ({
  httpOnly: true,
  secure: config.secureCookies,
  sameSite: 'Strict' as const,
  path: '/',
  maxAge: Math.floor(maxAgeMs / 1000),
});

// ---------- sesi ----------
function startSession(c: Context, userId: number) {
  const db = getDb();
  const t = token();
  const n = now();
  db.prepare('INSERT INTO sessions (id, user_id, created_at, last_seen, expires_at) VALUES (?, ?, ?, ?, ?)').run(sha(t), userId, n, n, n + SESSION_TTL);
  setCookie(c, 'cms_sid', t, cookieOpts(SESSION_TTL));
}

export function userFromRequest(c: Context): User | null {
  const t = getCookie(c, 'cms_sid');
  if (!t) return null;
  const db = getDb();
  const row = db.prepare(`SELECT s.id, s.created_at, s.expires_at, u.id AS uid, u.email, u.name
    FROM sessions s JOIN users u ON u.id = s.user_id WHERE s.id = ?`).get(sha(t)) as
    | { id: string; created_at: number; expires_at: number; uid: number; email: string; name: string }
    | undefined;
  if (!row) return null;
  const n = now();
  if (row.expires_at < n || row.created_at + SESSION_MAX < n) {
    db.prepare('DELETE FROM sessions WHERE id = ?').run(row.id);
    return null;
  }
  db.prepare('UPDATE sessions SET last_seen = ?, expires_at = ? WHERE id = ?').run(n, Math.min(n + SESSION_TTL, row.created_at + SESSION_MAX), row.id);
  return { id: row.uid, email: row.email, name: row.name };
}

export const requireUser: MiddlewareHandler<{ Variables: { user: User } }> = async (c, next) => {
  const u = userFromRequest(c);
  if (!u) return c.json({ error: 'Silakan masuk dulu.' }, 401);
  c.set('user', u);
  await next();
};

/** Tolak permintaan tulis dari situs lain: harus ada header khusus dan Origin yang cocok. */
export const csrfGuard: MiddlewareHandler = async (c, next) => {
  if (!['GET', 'HEAD', 'OPTIONS'].includes(c.req.method)) {
    const origin = c.req.header('origin');
    if (c.req.header('x-cms') !== '1' || (origin && origin !== config.publicUrl)) return c.json({ error: 'Permintaan ditolak.' }, 403);
  }
  await next();
};

// ---------- rute ----------
export const authRoutes = new Hono<{ Variables: { user: User } }>();

const GENERIC_FAIL = 'Email atau password salah.';

authRoutes.post('/login', async (c) => {
  const body = await c.req.json().catch(() => ({}) as Record<string, unknown>);
  const email = String(body.email ?? '').trim().toLowerCase();
  const password = String(body.password ?? '');
  const remember = body.remember === true;
  const ip = clientIp(c);
  if (!email || !password || email.length > 200 || password.length > 500) return c.json({ error: GENERIC_FAIL }, 400);
  if (tooMany(`ip:${ip}`, 20, 15 * MIN) || tooMany(`em:${email}`, 10, 15 * MIN)) return c.json({ error: 'Terlalu banyak percobaan. Coba lagi 15 menit lagi.' }, 429);
  note(`ip:${ip}`);
  note(`em:${email}`);

  const db = getDb();
  const user = db.prepare('SELECT * FROM users WHERE email = ?').get(email) as
    | { id: number; email: string; name: string; password_hash: string; failed_count: number; locked_until: number }
    | undefined;
  dummyHash ??= hashPassword('tidak-dipakai-' + token());
  const ok = await verifyPassword(password, user?.password_hash ?? (await dummyHash));
  if (!user || !ok) {
    if (user) {
      const failed = user.failed_count + 1;
      db.prepare('UPDATE users SET failed_count = ?, locked_until = ? WHERE id = ?').run(failed >= 5 ? 0 : failed, failed >= 5 ? now() + 15 * MIN : user.locked_until, user.id);
    }
    return c.json({ error: GENERIC_FAIL }, 401);
  }
  if (user.locked_until > now()) return c.json({ error: 'Akun dikunci sementara karena terlalu banyak salah password. Coba lagi nanti.' }, 429);
  db.prepare('UPDATE users SET failed_count = 0 WHERE id = ?').run(user.id);

  // Perangkat tepercaya: lewati OTP (password tetap wajib).
  const trusted = getCookie(c, 'cms_trust');
  if (trusted) {
    const row = db.prepare('SELECT user_id, expires_at FROM trusted_devices WHERE id = ?').get(sha(trusted)) as { user_id: number; expires_at: number } | undefined;
    if (row && row.user_id === user.id && row.expires_at > now()) {
      startSession(c, user.id);
      return c.json({ step: 'done', user: { email: user.email, name: user.name } });
    }
  }

  const code = String(crypto.randomInt(0, 1_000_000)).padStart(6, '0');
  const ch = token();
  db.prepare('DELETE FROM challenges WHERE user_id = ?').run(user.id);
  db.prepare('INSERT INTO challenges (id, user_id, code_hash, remember, expires_at) VALUES (?, ?, ?, ?, ?)').run(sha(ch), user.id, sha(`${ch}:${code}`), remember ? 1 : 0, now() + OTP_TTL);
  try {
    await sendMail(user.email, `Kode masuk dashboard Intravest: ${code}`, `Kode masuk kamu: ${code}\n\nBerlaku 10 menit. Kalau bukan kamu yang mencoba masuk, abaikan email ini dan ganti password-mu.`);
  } catch (e) {
    console.error('Gagal kirim OTP:', e);
    db.prepare('DELETE FROM challenges WHERE user_id = ?').run(user.id);
    return c.json({ error: 'Kode masuk gagal dikirim. Coba lagi sebentar, atau hubungi pengelola.' }, 502);
  }
  setCookie(c, 'cms_pending', ch, cookieOpts(OTP_TTL));
  return c.json({ step: 'otp', email: user.email.replace(/^(.).*(@.*)$/, '$1***$2') });
});

authRoutes.post('/verify', async (c) => {
  const body = await c.req.json().catch(() => ({}) as Record<string, unknown>);
  const code = String(body.code ?? '').replace(/\D/g, '');
  const ch = getCookie(c, 'cms_pending');
  if (!ch) return c.json({ error: 'Sesi masuk sudah habis. Mulai lagi dari awal.' }, 400);
  const db = getDb();
  const row = db.prepare('SELECT * FROM challenges WHERE id = ?').get(sha(ch)) as
    | { id: string; user_id: number; code_hash: string; attempts: number; remember: number; expires_at: number }
    | undefined;
  if (!row || row.expires_at < now()) return c.json({ error: 'Kode sudah kedaluwarsa. Mulai lagi dari awal.' }, 400);
  if (row.attempts >= 5) {
    db.prepare('DELETE FROM challenges WHERE id = ?').run(row.id);
    return c.json({ error: 'Terlalu banyak salah kode. Mulai lagi dari awal.' }, 429);
  }
  const good = code.length === 6 && crypto.timingSafeEqual(Buffer.from(sha(`${ch}:${code}`)), Buffer.from(row.code_hash));
  if (!good) {
    db.prepare('UPDATE challenges SET attempts = attempts + 1 WHERE id = ?').run(row.id);
    return c.json({ error: 'Kode salah.' }, 401);
  }
  db.prepare('DELETE FROM challenges WHERE id = ?').run(row.id);
  deleteCookie(c, 'cms_pending', { path: '/' });
  if (row.remember) {
    const t = token();
    db.prepare('INSERT INTO trusted_devices (id, user_id, expires_at) VALUES (?, ?, ?)').run(sha(t), row.user_id, now() + TRUST_TTL);
    setCookie(c, 'cms_trust', t, cookieOpts(TRUST_TTL));
  }
  startSession(c, row.user_id);
  const u = db.prepare('SELECT email, name FROM users WHERE id = ?').get(row.user_id) as { email: string; name: string };
  return c.json({ step: 'done', user: u });
});

authRoutes.post('/logout', (c) => {
  const t = getCookie(c, 'cms_sid');
  if (t) getDb().prepare('DELETE FROM sessions WHERE id = ?').run(sha(t));
  deleteCookie(c, 'cms_sid', { path: '/' });
  return c.json({ ok: true });
});

authRoutes.get('/me', (c) => {
  const u = userFromRequest(c);
  return u ? c.json({ user: { email: u.email, name: u.name } }) : c.json({ user: null });
});
