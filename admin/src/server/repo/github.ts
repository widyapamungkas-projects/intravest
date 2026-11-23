import { ConflictError, type CommitResult, type ConflictInfo, type FileChange, type HistoryItem, type RepoStore, type TreeEntry, gitBlobSha } from './types.ts';

type Opts = { token: string; repo: string; branch: string; apiBase?: string; fetchImpl?: typeof fetch };

/** Penyimpanan di GitHub lewat Git Data API: banyak file jadi satu commit atomik, ref tidak pernah di-force. */
export class GitHubRepo implements RepoStore {
  private base: string;
  private f: typeof fetch;
  private cache?: { commit: string; files: TreeEntry[]; at: number };
  constructor(private o: Opts) {
    this.base = `${o.apiBase ?? 'https://api.github.com'}/repos/${o.repo}`;
    this.f = o.fetchImpl ?? fetch;
  }

  private async api<T>(path: string, init?: RequestInit & { json?: unknown }): Promise<T> {
    const res = await this.f(this.base + path, {
      method: init?.method ?? (init?.json ? 'POST' : 'GET'),
      headers: {
        Authorization: `Bearer ${this.o.token}`,
        Accept: 'application/vnd.github+json',
        'X-GitHub-Api-Version': '2022-11-28',
        'User-Agent': 'intravest-admin',
        ...(init?.json ? { 'Content-Type': 'application/json' } : {}),
      },
      body: init?.json ? JSON.stringify(init.json) : undefined,
    });
    if (!res.ok) {
      const text = await res.text();
      const err = new Error(`GitHub ${res.status} ${path}: ${text.slice(0, 200)}`) as Error & { status: number };
      err.status = res.status;
      throw err;
    }
    return (await res.json()) as T;
  }

  async snapshot() {
    // Satu panggilan ref + satu panggilan tree. Cache pendek supaya halaman daftar tidak boros kuota.
    const ref = await this.api<{ object: { sha: string } }>(`/git/ref/heads/${this.o.branch}`);
    const commit = ref.object.sha;
    if (this.cache && this.cache.commit === commit) return { commit, files: this.cache.files };
    const c = await this.api<{ tree: { sha: string } }>(`/git/commits/${commit}`);
    const t = await this.api<{ tree: { path: string; type: string; sha: string; size?: number }[]; truncated: boolean }>(`/git/trees/${c.tree.sha}?recursive=1`);
    if (t.truncated) throw new Error('Pohon repo terlalu besar untuk dibaca sekaligus.');
    const files = t.tree.filter((e) => e.type === 'blob').map((e) => ({ path: e.path, sha: e.sha, size: e.size }));
    this.cache = { commit, files, at: Date.now() };
    return { commit, files };
  }

  private async blob(sha: string): Promise<Buffer> {
    const b = await this.api<{ content: string; encoding: string }>(`/git/blobs/${sha}`);
    return Buffer.from(b.content, b.encoding === 'base64' ? 'base64' : 'utf8');
  }
  async readBuffer(path: string) {
    const { files } = await this.snapshot();
    const e = files.find((x) => x.path === path);
    return e ? { content: await this.blob(e.sha), sha: e.sha } : null;
  }
  async read(path: string) {
    const r = await this.readBuffer(path);
    return r ? { content: r.content.toString('utf8'), sha: r.sha } : null;
  }

  async commit({ message, changes }: { message: string; changes: FileChange[] }): Promise<CommitResult> {
    for (let attempt = 0; attempt < 3; attempt++) {
      this.cache = undefined;
      const { commit: head, files } = await this.snapshot();
      const byPath = new Map(files.map((f) => [f.path, f.sha]));

      // Konflik = file yang kita ubah sudah berbeda dari yang dilihat editor. File lain yang bergeser tidak masalah.
      const conflicts: ConflictInfo[] = [];
      for (const ch of changes) {
        const cur = byPath.get(ch.path) ?? null;
        if (cur !== ch.baseSha) {
          const target = ch.content === null ? null : gitBlobSha(ch.content);
          if (cur !== null && cur === target) continue; // hasilnya sudah sama persis
          conflicts.push({ path: ch.path, theirSha: cur, theirContent: cur ? (await this.blob(cur)).toString('utf8') : null });
        }
      }
      if (conflicts.length) throw new ConflictError(conflicts);

      const effective = changes.filter((ch) => (ch.content === null ? byPath.has(ch.path) : byPath.get(ch.path) !== gitBlobSha(ch.content)));
      if (!effective.length) return { commit: head, changed: [] };

      const headCommit = await this.api<{ tree: { sha: string } }>(`/git/commits/${head}`);
      const entries = [] as { path: string; mode: string; type: string; sha: string | null }[];
      for (const ch of effective) {
        if (ch.content === null) { entries.push({ path: ch.path, mode: '100644', type: 'blob', sha: null }); continue; }
        const buf = typeof ch.content === 'string' ? Buffer.from(ch.content, 'utf8') : ch.content;
        const b = await this.api<{ sha: string }>('/git/blobs', { json: { content: buf.toString('base64'), encoding: 'base64' } });
        entries.push({ path: ch.path, mode: '100644', type: 'blob', sha: b.sha });
      }
      const tree = await this.api<{ sha: string }>('/git/trees', { json: { base_tree: headCommit.tree.sha, tree: entries } });
      const created = await this.api<{ sha: string }>('/git/commits', {
        json: { message, tree: tree.sha, parents: [head], author: { name: 'Intravest CMS', email: 'cms@intravest.invalid' } },
      });
      try {
        await this.api(`/git/refs/heads/${this.o.branch}`, { method: 'PATCH', json: { sha: created.sha, force: false } });
      } catch (e) {
        if ((e as { status?: number }).status === 422 || (e as { status?: number }).status === 409) continue; // branch bergeser saat menulis: ulangi dengan head baru
        throw e;
      }
      this.cache = undefined;
      return { commit: created.sha, changed: effective.map((c) => c.path) };
    }
    throw new Error('Repo terus berubah saat menyimpan. Coba lagi sebentar.');
  }

  async history({ path, limit = 30 }: { path?: string; limit?: number }): Promise<HistoryItem[]> {
    const q = new URLSearchParams({ sha: this.o.branch, per_page: String(limit) });
    if (path) q.set('path', path);
    const list = await this.api<{ sha: string; commit: { message: string; author: { name: string; date: string } } }[]>(`/commits?${q}`);
    return list.map((c) => ({ commit: c.sha, message: c.commit.message, author: c.commit.author.name, date: c.commit.author.date }));
  }

  async readAt(path: string, commit: string) {
    const c = await this.api<{ tree: { sha: string } }>(`/git/commits/${commit}`);
    const t = await this.api<{ tree: { path: string; type: string; sha: string }[] }>(`/git/trees/${c.tree.sha}?recursive=1`);
    const e = t.tree.find((x) => x.path === path && x.type === 'blob');
    return e ? (await this.blob(e.sha)).toString('utf8') : null;
  }
}
