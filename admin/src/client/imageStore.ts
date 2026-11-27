import { useSyncExternalStore } from 'react';
import { dropDraft, saveDraft, getDraft } from './drafts';

// Foto yang belum dipublikasikan: isi (blob) di IndexedDB, metadatanya di draf. Kalau IndexedDB
// diblokir, foto tetap tersimpan di memori selama tab terbuka.
const mem = new Map<string, Blob>();
const urls = new Map<string, string>();
const listeners = new Set<() => void>();
let version = 0;
const bump = () => { version++; listeners.forEach((l) => l()); };

function idb(): Promise<IDBDatabase | null> {
  return new Promise((res) => {
    try {
      const r = indexedDB.open('cms-images', 1);
      r.onupgradeneeded = () => r.result.createObjectStore('img');
      r.onsuccess = () => res(r.result);
      r.onerror = () => res(null);
    } catch { res(null); }
  });
}
async function idbDo<T>(mode: IDBTransactionMode, f: (s: IDBObjectStore) => IDBRequest<T>): Promise<T | undefined> {
  const db = await idb();
  if (!db) return undefined;
  return new Promise((res) => {
    try { const r = f(db.transaction('img', mode).objectStore('img')); r.onsuccess = () => res(r.result); r.onerror = () => res(undefined); } catch { res(undefined); }
  });
}

export async function putImage(name: string, blob: Blob, meta: { origBytes: number; w: number; h: number }) {
  mem.set(name, blob);
  const old = urls.get(name); if (old) { URL.revokeObjectURL(old); urls.delete(name); }
  await idbDo('readwrite', (s) => s.put(blob, name));
  saveDraft({ kind: 'image', slug: name, bytes: blob.size, origBytes: meta.origBytes, w: meta.w, h: meta.h, baseSha: null, updatedAt: Date.now() });
  bump();
}
export async function removeImage(name: string) {
  mem.delete(name);
  const u = urls.get(name); if (u) { URL.revokeObjectURL(u); urls.delete(name); }
  await idbDo('readwrite', (s) => s.delete(name));
  dropDraft('image', name);
  bump();
}
export async function getImageBlob(name: string): Promise<Blob | null> {
  if (mem.has(name)) return mem.get(name)!;
  const b = await idbDo<Blob>('readonly', (s) => s.get(name) as IDBRequest<Blob>);
  if (b) mem.set(name, b);
  return b ?? null;
}
/** Muat foto tertunda dari IndexedDB ke memori (dipanggil saat aplikasi dibuka). */
export async function hydrateImages(names: string[]) {
  await Promise.all(names.map((n) => getImageBlob(n)));
  bump();
}
export function previewUrl(name: string): string | null {
  const b = mem.get(name);
  if (!b) return null;
  let u = urls.get(name);
  if (!u) { u = URL.createObjectURL(b); urls.set(name, u); }
  return u;
}
export const hasPending = (name: string) => !!getDraft('image', name);

/** URL pratinjau: foto tertunda (blob lokal) kalau ada, kalau tidak foto di repo. */
export function useImageSrc(name: string | undefined): string | undefined {
  useSyncExternalStore((cb) => { listeners.add(cb); return () => listeners.delete(cb); }, () => version);
  if (!name) return undefined;
  return (hasPending(name) && previewUrl(name)) || `/api/image/${name}`;
}
