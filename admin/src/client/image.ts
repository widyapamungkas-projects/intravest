// Kompres foto di browser sebelum diunggah: sisi terpanjang maks 2000 px, format WebP.
export const MAX_EDGE = 2000;
export const TARGET_BYTES = 900 * 1024;

export const slugifyName = (file: string) => {
  const base = file.replace(/\.[^.]+$/, '').normalize('NFKD').replace(/[̀-ͯ]/g, '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 60);
  return base || 'foto';
};
export const uniqueName = (base: string, ext: string, taken: Set<string>) => {
  let n = `${base}.${ext}`, i = 2;
  while (taken.has(n)) n = `${base}-${i++}.${ext}`;
  return n;
};
export const fmtBytes = (n: number) => (n >= 1048576 ? `${(n / 1048576).toFixed(1)} MB` : `${Math.max(1, Math.round(n / 1024))} KB`);

const toBlob = (c: HTMLCanvasElement, type: string, q: number) => new Promise<Blob | null>((r) => c.toBlob(r, type, q));

export type Compressed = { blob: Blob; ext: 'webp' | 'jpg'; w: number; h: number };

export async function compressImage(file: File): Promise<Compressed> {
  if (!/^image\/(jpeg|png|webp|heic|heif|avif|gif)$/.test(file.type) && !/\.(jpe?g|png|webp|avif)$/i.test(file.name)) throw new Error(`"${file.name}" bukan foto yang didukung (pakai JPG, PNG, atau WebP).`);
  let bmp: ImageBitmap;
  try { bmp = await createImageBitmap(file, { imageOrientation: 'from-image' }); }
  catch { throw new Error(`"${file.name}" tidak bisa dibuka browser. Coba simpan ulang sebagai JPG atau PNG.`); }
  let scale = Math.min(1, MAX_EDGE / Math.max(bmp.width, bmp.height));
  const draw = (sc: number) => {
    const c = document.createElement('canvas');
    c.width = Math.max(1, Math.round(bmp.width * sc)); c.height = Math.max(1, Math.round(bmp.height * sc));
    c.getContext('2d')!.drawImage(bmp, 0, 0, c.width, c.height);
    return c;
  };
  let c = draw(scale);
  let type = 'image/webp';
  let q = 0.82;
  let blob = await toBlob(c, type, q);
  if (!blob || blob.type !== 'image/webp') { type = 'image/jpeg'; blob = await toBlob(c, type, q); } // browser tanpa WebP
  // masih besar: turunkan kualitas dulu, lalu perkecil sedikit
  for (let i = 0; blob && blob.size > TARGET_BYTES && i < 4; i++) {
    if (q > 0.62) q -= 0.1; else { scale *= 0.85; c = draw(scale); }
    blob = await toBlob(c, type, q);
  }
  bmp.close();
  if (!blob) throw new Error(`Gagal memproses "${file.name}".`);
  return { blob, ext: type === 'image/webp' ? 'webp' : 'jpg', w: c.width, h: c.height };
}
