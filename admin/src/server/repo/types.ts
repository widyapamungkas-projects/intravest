export type TreeEntry = { path: string; sha: string; size?: number };

export type FileChange = {
  path: string;
  /** teks utf8, Buffer untuk biner, atau null untuk menghapus */
  content: string | Buffer | null;
  /** SHA blob yang dilihat editor waktu membuka file (null = file baru). Beda dengan kondisi sekarang = konflik. */
  baseSha: string | null;
};

export type ConflictInfo = { path: string; theirSha: string | null; theirContent: string | null };

export class ConflictError extends Error {
  constructor(public conflicts: ConflictInfo[]) {
    super('Ada perubahan lain di repo pada file yang sama.');
  }
}

export type CommitResult = { commit: string; changed: string[] };

export interface RepoStore {
  /** SHA commit ujung branch + daftar semua file (rekursif) pada commit itu. */
  snapshot(): Promise<{ commit: string; files: TreeEntry[] }>;
  read(path: string): Promise<{ content: string; sha: string } | null>;
  readBuffer(path: string): Promise<{ content: Buffer; sha: string } | null>;
  /** Satu commit untuk banyak file. Tidak pernah menimpa perubahan orang lain: konflik -> ConflictError. */
  commit(p: { message: string; changes: FileChange[] }): Promise<CommitResult>;
  history(p: { path?: string; limit?: number }): Promise<HistoryItem[]>;
  /** isi file pada commit tertentu (untuk undo / lihat versi lama) */
  readAt(path: string, commit: string): Promise<string | null>;
}

export type HistoryItem = { commit: string; message: string; author: string; date: string };

/** SHA blob git: sha1("blob <len>\0" + isi). Dipakai untuk membandingkan tanpa mengunduh. */
import crypto from 'node:crypto';
export function gitBlobSha(content: string | Buffer): string {
  const b = typeof content === 'string' ? Buffer.from(content, 'utf8') : content;
  return crypto.createHash('sha1').update(`blob ${b.length}\0`).update(b).digest('hex');
}
