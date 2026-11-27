import { useSyncExternalStore } from 'react';

// Perubahan belum dipublikasikan disimpan di browser ini (localStorage), BUKAN di repo.
// Satu tombol Publish menggabungkan semuanya jadi satu commit => satu build Netlify.
export type Draft =
  | { kind: 'tour'; slug: string; data: Record<string, any> | null; baseSha: string | null; updatedAt: number }
  | { kind: 'csv'; slug: string; text: string | null; baseSha: string | null; updatedAt: number } // tabel harga; null = hapus berkas
  | { kind: 'destination'; slug: string; data: Record<string, any> | null; baseSha: string | null; updatedAt: number }
  | { kind: 'data'; slug: string; data: Record<string, any>; baseSha: string | null; updatedAt: number } // slug = home | about | settings
  | { kind: 'image'; slug: string; bytes: number; origBytes: number; w: number; h: number; baseSha: null; updatedAt: number } // slug = nama berkas; isi foto ada di IndexedDB
  | { kind: 'story'; slug: string; fm: Record<string, any> | null; body: string; baseSha: string | null; updatedAt: number }; // slug = "en/nama-artikel"

/** Path berkas di repo yang diubah draf ini (dipakai mencocokkan konflik). */
export const draftPath = (d: Pick<Draft, 'kind' | 'slug'>) => ({
  tour: `src/content/tours/${d.slug}.yml`,
  csv: `src/data/pricing/${d.slug}.csv`,
  destination: `src/content/destinations/${d.slug}.yml`,
  story: `src/content/stories/${d.slug}.md`,
  data: `src/data/${d.slug}.json`,
  image: `src/assets/images/${d.slug}`,
})[d.kind];

export const draftHref = (d: Pick<Draft, 'kind' | 'slug'>) => ({ tour: `/paket/${d.slug}`, csv: `/paket/${d.slug}`, destination: `/destinasi/${d.slug}`, story: `/cerita/${d.slug}`, data: `/${({ home: 'beranda', about: 'tentang', settings: 'pengaturan' } as Record<string, string>)[d.slug] ?? 'beranda'}`, image: '/gambar' })[d.kind];
export const draftIsDelete = (d: Draft) => (d.kind === 'tour' || d.kind === 'destination' ? d.data === null : d.kind === 'story' ? d.fm === null : d.kind === 'data' || d.kind === 'image' ? false : d.text === null);
export const draftNoun = (d: Draft) => ({ tour: 'Paket', csv: 'Tabel harga', destination: 'Destinasi', story: 'Cerita', data: 'Halaman', image: 'Foto' })[d.kind];
export const draftLabel = (d: Draft) => (d.kind === 'data' ? ({ home: 'Beranda', about: 'Tentang', settings: 'Pengaturan situs' } as Record<string, string>)[d.slug] ?? d.slug : `${draftNoun(d)} ${d.slug}`);

const KEY = 'cms:drafts:v1';
let cache: Record<string, Draft> | null = null;
const listeners = new Set<() => void>();

function load(): Record<string, Draft> {
  if (cache) return cache;
  try { cache = JSON.parse(localStorage.getItem(KEY) ?? '{}'); } catch { cache = {}; }
  return cache!;
}
function persist() {
  try { localStorage.setItem(KEY, JSON.stringify(cache)); } catch { /* penyimpanan penuh / diblokir: draf hanya hidup selama tab terbuka */ }
  cache = { ...cache! };
  listeners.forEach((l) => l());
}

export const draftKey = (kind: string, slug: string) => `${kind}:${slug}`;
export const getDraft = (kind: string, slug: string) => load()[draftKey(kind, slug)];
export function saveDraft(d: Draft) { load()[draftKey(d.kind, d.slug)] = d; persist(); }
export function dropDraft(kind: string, slug: string) { delete load()[draftKey(kind, slug)]; persist(); }
export function clearDrafts(keys?: string[]) { const m = load(); for (const k of keys ?? Object.keys(m)) delete m[k]; persist(); }

export function useDrafts(): Draft[] {
  const snap = useSyncExternalStore((cb) => { listeners.add(cb); return () => listeners.delete(cb); }, () => load());
  return Object.values(snap).sort((a, b) => b.updatedAt - a.updatedAt);
}
