import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { gitBlobSha, type RepoStore } from '../src/server/repo/types.ts';

export const REPO_ROOT = path.resolve(import.meta.dirname, '../..');

/** Salinan repo situs di folder sementara (hanya riwayat HEAD) supaya tes boleh commit sungguhan tanpa menyentuh repo asli. */
export function cloneRepo(): string {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'cms-repo-'));
  execFileSync('git', ['clone', '-q', '--local', '--no-hardlinks', '-b', 'main', REPO_ROOT, dir], { stdio: 'pipe' });
  // Isi kerja saat ini (cabang cms-admin) tidak perlu: kita pakai main apa adanya.
  execFileSync('git', ['config', 'user.email', 'tes@example.com'], { cwd: dir });
  execFileSync('git', ['config', 'user.name', 'Tes'], { cwd: dir });
  return dir;
}

export function manualCommit(dir: string, file: string, content: string, msg: string) {
  fs.writeFileSync(path.join(dir, file), content);
  execFileSync('git', ['add', file], { cwd: dir });
  execFileSync('git', ['commit', '-q', '-m', msg], { cwd: dir });
}

/** Server GitHub tiruan di memori: cukup untuk endpoint Git Data API yang dipakai GitHubRepo. */
export function fakeGitHub(initial: Map<string, Buffer>) {
  const blobs = new Map<string, Buffer>();
  const trees = new Map<string, Map<string, string>>(); // treeSha -> path->blobSha
  const commits = new Map<string, { tree: string; parents: string[]; message: string; author: string; date: string }>();
  const refs = new Map<string, string>();
  let n = 0;
  const addBlob = (b: Buffer) => { const s = gitBlobSha(b); blobs.set(s, b); return s; };
  const addTree = (m: Map<string, string>) => { const s = `tree${++n}`; trees.set(s, m); return s; };
  const t0 = new Map<string, string>();
  for (const [p, b] of initial) t0.set(p, addBlob(b));
  const c0 = `commit${++n}`;
  commits.set(c0, { tree: addTree(t0), parents: [], message: 'init', author: 'x', date: new Date().toISOString() });
  refs.set('main', c0);
  const calls: string[] = [];
  const json = (o: unknown, status = 200) => new Response(JSON.stringify(o), { status });

  const fetchImpl = (async (url: string, init?: RequestInit) => {
    const u = new URL(url);
    const p = u.pathname.replace(/^\/repos\/[^/]+\/[^/]+/, '');
    const method = init?.method ?? 'GET';
    calls.push(`${method} ${p}`);
    const body = init?.body ? JSON.parse(String(init.body)) : undefined;
    let m: RegExpExecArray | null;
    if ((m = /^\/git\/ref\/heads\/(.+)$/.exec(p))) return refs.has(m[1]) ? json({ object: { sha: refs.get(m[1]) } }) : json({}, 404);
    if ((m = /^\/git\/commits\/(.+)$/.exec(p)) && method === 'GET') return commits.has(m[1]) ? json({ tree: { sha: commits.get(m[1])!.tree } }) : json({}, 404);
    if ((m = /^\/git\/trees\/(.+)$/.exec(p)) && method === 'GET') {
      const t = trees.get(m[1]); if (!t) return json({}, 404);
      return json({ truncated: false, tree: [...t].map(([path, sha]) => ({ path, type: 'blob', sha, size: blobs.get(sha)!.length })) });
    }
    if ((m = /^\/git\/blobs\/(.+)$/.exec(p)) && method === 'GET') return blobs.has(m[1]) ? json({ encoding: 'base64', content: blobs.get(m[1])!.toString('base64') }) : json({}, 404);
    if (p === '/git/blobs' && method === 'POST') return json({ sha: addBlob(Buffer.from(body.content, body.encoding === 'base64' ? 'base64' : 'utf8')) }, 201);
    if (p === '/git/trees' && method === 'POST') {
      const t = new Map(trees.get(body.base_tree)!);
      for (const e of body.tree) { if (e.sha === null) t.delete(e.path); else t.set(e.path, e.sha); }
      return json({ sha: addTree(t) }, 201);
    }
    if (p === '/git/commits' && method === 'POST') {
      const s = `commit${++n}`;
      commits.set(s, { tree: body.tree, parents: body.parents, message: body.message, author: body.author?.name ?? '', date: new Date().toISOString() });
      return json({ sha: s }, 201);
    }
    if ((m = /^\/git\/refs\/heads\/(.+)$/.exec(p)) && method === 'PATCH') {
      const cur = refs.get(m[1])!;
      if (body.force !== true && !commits.get(body.sha)!.parents.includes(cur)) return json({ message: 'Update is not a fast forward' }, 422);
      refs.set(m[1], body.sha); return json({ ok: true });
    }
    if (p === '/commits') {
      const out = []; let c: string | undefined = refs.get('main');
      while (c) { const k = commits.get(c)!; out.push({ sha: c, commit: { message: k.message, author: { name: k.author, date: k.date } } }); c = k.parents[0]; }
      return json(out);
    }
    return json({ message: `fake: tidak dikenal ${method} ${p}` }, 404);
  }) as unknown as typeof fetch;

  return {
    fetchImpl, calls, refs, commits, trees, blobs,
    /** simulasikan orang lain yang commit ke main di sela-sela */
    externalCommit(path: string, content: string) {
      const head = commits.get(refs.get('main')!)!;
      const t = new Map(trees.get(head.tree)!); t.set(path, addBlob(Buffer.from(content)));
      const s = `commit${++n}`;
      commits.set(s, { tree: addTree(t), parents: [refs.get('main')!], message: 'manual', author: 'orang', date: new Date().toISOString() });
      refs.set('main', s);
    },
    /** dipanggil tepat sebelum PATCH ref, untuk menguji balapan */
    headSha: () => refs.get('main')!,
  };
}

export function readAllFiles(dir: string): Map<string, Buffer> {
  const out = new Map<string, Buffer>();
  const files = execFileSync('git', ['ls-files', '-z'], { cwd: dir }).toString().split('\0').filter(Boolean);
  for (const f of files) out.set(f, fs.readFileSync(path.join(dir, f)));
  return out;
}
export type { RepoStore };
