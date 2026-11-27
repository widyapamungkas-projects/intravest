import { compressImage, slugifyName, uniqueName } from './image';
import { putImage } from './imageStore';
import { getDraft } from './drafts';

/** Kompres lalu simpan sebagai foto tertunda. Mengembalikan nama berkas yang dipakai di repo. */
export async function addPhoto(file: File, existing: string[]): Promise<string> {
  const c = await compressImage(file);
  const taken = new Set(existing);
  const base = slugifyName(file.name);
  let name = uniqueName(base, c.ext, taken);
  while (getDraft('image', name)) name = uniqueName(base, c.ext, new Set([...taken, name]));
  await putImage(name, c.blob, { origBytes: file.size, w: c.w, h: c.h });
  return name;
}
