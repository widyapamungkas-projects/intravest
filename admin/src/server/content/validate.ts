import { execFile } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { promisify } from 'node:util';
import type { RepoStore, TreeEntry } from '../repo/types.ts';

const run = promisify(execFile);
const blobCache = new Map<string, string>(); // sha -> isi (blob tidak pernah berubah, aman di-cache)

const NEED = (p: string) =>
  p === 'scripts/check-content.mjs' || p === 'src/pricing-core.mjs' ||
  /^src\/content\/(tours|destinations)\/[^/]+\.yml$/.test(p) ||
  /^src\/content\/stories\/(en|id)\/[^/]+\.mdx?$/.test(p) ||
  /^src\/data\/[^/]+\.json$/.test(p) || /^src\/data\/pricing\/[^/]+\.csv$/.test(p);

export type Overlay = Map<string, string | null>; // path -> isi baru, null = dihapus

export type CheckResult = { errors: string[]; warnings: string[] };

/**
 * Jalankan scripts/check-content.mjs ASLI dari repo terhadap keadaan "setelah perubahan".
 * Aturan tidak pernah menyimpang dari situs: kalau skrip di repo berubah, dashboard ikut berubah.
 * Foto cukup berupa berkas kosong bernama sama (skrip hanya mengecek keberadaan dan lebar).
 */
export async function checkContent(repo: RepoStore, files: TreeEntry[], overlay: Overlay): Promise<CheckResult> {
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'cms-check-'));
  try {
    const put = (p: string, content: string) => {
      const f = path.join(tmp, p);
      fs.mkdirSync(path.dirname(f), { recursive: true });
      fs.writeFileSync(f, content);
    };
    const paths = new Map(files.map((f) => [f.path, f]));
    for (const [p, v] of overlay) { if (v === null) paths.delete(p); else paths.set(p, { path: p, sha: '' }); }
    await Promise.all([...paths.values()].map(async (e) => {
      if (overlay.has(e.path)) { put(e.path, overlay.get(e.path)!); return; }
      if (/^src\/assets\/images\/[^/]+$/.test(e.path)) { put(e.path, ''); return; }
      if (!NEED(e.path)) return;
      let text = blobCache.get(e.sha);
      if (text === undefined) {
        text = (await repo.read(e.path))?.content ?? '';
        blobCache.set(e.sha, text);
      }
      put(e.path, text);
    }));
    for (const [p, v] of overlay) if (v !== null && /^src\/assets\/images\//.test(p)) put(p, '');
    fs.mkdirSync(path.join(tmp, 'src/assets/images'), { recursive: true });
    fs.symlinkSync(path.resolve(import.meta.dirname, '../../../node_modules'), path.join(tmp, 'node_modules'), 'dir');
    if (!fs.existsSync(path.join(tmp, 'scripts/check-content.mjs'))) return { errors: [], warnings: ['scripts/check-content.mjs tidak ada di repo, pemeriksaan tambahan dilewati.'] };
    let stdout = '', stderr = '';
    try {
      ({ stdout, stderr } = await run('node', ['scripts/check-content.mjs'], { cwd: tmp, timeout: 30_000 }));
    } catch (e) {
      const err = e as { stdout?: string; stderr?: string };
      stdout = err.stdout ?? ''; stderr = err.stderr ?? '';
      const errors = stderr.split('\n').filter((l) => l.trim().startsWith('- ')).map((l) => l.trim().slice(2));
      const warnings = [...stdout.split('\n'), ...stderr.split('\n')].filter((l) => l.startsWith('PERINGATAN ')).map((l) => l.slice(11));
      return { errors: errors.length ? errors : [stderr.trim() || 'check-content gagal'], warnings };
    }
    return { errors: [], warnings: [...stdout.split('\n'), ...stderr.split('\n')].filter((l) => l.startsWith('PERINGATAN ')).map((l) => l.slice(11)) };
  } finally {
    fs.rmSync(tmp, { recursive: true, force: true });
  }
}
