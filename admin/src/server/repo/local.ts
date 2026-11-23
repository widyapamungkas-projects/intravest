import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { ConflictError, type CommitResult, type ConflictInfo, type FileChange, type HistoryItem, type RepoStore, type TreeEntry, gitBlobSha } from './types.ts';

/** Checkout git lokal, untuk dev dan tes. Memakai plumbing git (indeks sementara + update-ref dengan nilai lama), jadi atomik seperti jalur GitHub. */
export class LocalGitRepo implements RepoStore {
  constructor(private dir: string, private branch = 'HEAD') {}

  private git(args: string[], env: Record<string, string> = {}, input?: Buffer): Buffer {
    return execFileSync('git', args, { cwd: this.dir, env: { ...process.env, ...env }, input, maxBuffer: 256 * 1024 * 1024 });
  }
  private ref() { return this.branch === 'HEAD' ? 'HEAD' : `refs/heads/${this.branch}`; }

  async snapshot() {
    const commit = this.git(['rev-parse', this.ref()]).toString().trim();
    const out = this.git(['ls-tree', '-r', '-z', '--long', commit]).toString('utf8');
    const files: TreeEntry[] = out.split('\0').filter(Boolean).map((l) => {
      const m = /^\d+ blob ([0-9a-f]+)\s+(\d+|-)\t(.*)$/.exec(l)!;
      return { sha: m[1], size: m[2] === '-' ? undefined : Number(m[2]), path: m[3] };
    });
    return { commit, files };
  }
  async readBuffer(p: string) {
    const { commit, files } = await this.snapshot();
    const e = files.find((f) => f.path === p);
    return e ? { content: this.git(['cat-file', 'blob', e.sha]), sha: e.sha } : (void commit, null);
  }
  async read(p: string) {
    const r = await this.readBuffer(p);
    return r ? { content: r.content.toString('utf8'), sha: r.sha } : null;
  }

  async commit({ message, changes }: { message: string; changes: FileChange[] }): Promise<CommitResult> {
    const { commit: head, files } = await this.snapshot();
    const byPath = new Map(files.map((f) => [f.path, f.sha]));
    const conflicts: ConflictInfo[] = [];
    for (const ch of changes) {
      const cur = byPath.get(ch.path) ?? null;
      if (cur !== ch.baseSha) {
        const target = ch.content === null ? null : gitBlobSha(ch.content);
        if (cur !== null && cur === target) continue;
        conflicts.push({ path: ch.path, theirSha: cur, theirContent: cur ? this.git(['cat-file', 'blob', cur]).toString('utf8') : null });
      }
    }
    if (conflicts.length) throw new ConflictError(conflicts);
    const effective = changes.filter((ch) => (ch.content === null ? byPath.has(ch.path) : byPath.get(ch.path) !== gitBlobSha(ch.content)));
    if (!effective.length) return { commit: head, changed: [] };

    const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'cms-idx-'));
    const env = { GIT_INDEX_FILE: path.join(tmp, 'index') };
    try {
      this.git(['read-tree', head], env);
      for (const ch of effective) {
        if (ch.content === null) { this.git(['update-index', '--force-remove', ch.path], env); continue; }
        const buf = typeof ch.content === 'string' ? Buffer.from(ch.content, 'utf8') : ch.content;
        const sha = this.git(['hash-object', '-w', '--stdin'], {}, buf).toString().trim();
        this.git(['update-index', '--add', '--cacheinfo', `100644,${sha},${ch.path}`], env);
      }
      const tree = this.git(['write-tree'], env).toString().trim();
      const commit = this.git(['commit-tree', tree, '-p', head, '-m', message], {
        GIT_AUTHOR_NAME: 'Intravest CMS', GIT_AUTHOR_EMAIL: 'cms@intravest.invalid', GIT_COMMITTER_NAME: 'Intravest CMS', GIT_COMMITTER_EMAIL: 'cms@intravest.invalid',
      }).toString().trim();
      this.git(['update-ref', this.ref(), commit, head]); // gagal kalau ref sudah bergeser
      // Checkout kerja ikut diperbarui supaya `git status` bersih.
      try { this.git(['reset', '--hard', '-q', commit]); } catch { /* bare / branch lain */ }
      return { commit, changed: effective.map((c) => c.path) };
    } finally {
      fs.rmSync(tmp, { recursive: true, force: true });
    }
  }

  async history({ path: p, limit = 30 }: { path?: string; limit?: number }): Promise<HistoryItem[]> {
    const args = ['log', `-n${limit}`, '--format=%H%x1f%B%x1f%an%x1f%aI%x1e', this.ref()];
    if (p) args.push('--', p);
    return this.git(args).toString().split('\x1e').map((s) => s.trim()).filter(Boolean).map((l) => {
      const [commit, message, author, date] = l.split('\x1f');
      return { commit, message: message.trim(), author, date };
    });
  }
  async readAt(p: string, commit: string) {
    try { return this.git(['show', `${commit}:${p}`]).toString('utf8'); } catch { return null; }
  }
}
