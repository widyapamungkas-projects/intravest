// Logo and favicon picked in the dashboard (Pengaturan > Perusahaan). The value is a file name from src/assets/images.
import { getImage } from 'astro:assets';
import { site } from './site';

const files = import.meta.glob<{ default: ImageMetadata }>('/src/assets/images/*.{png,jpg,jpeg,webp,avif,svg,PNG,JPG,JPEG,SVG}', { eager: true });
const find = (name?: string) => {
  const w = name?.split('/').pop()?.toLowerCase();
  return w ? Object.entries(files).find(([p]) => p.split('/').pop()!.toLowerCase() === w)?.[1].default : undefined;
};

/** Logo for the header/footer, 2x of 28px tall. Undefined = use the built-in mark. */
export async function getLogo() {
  const src = find(site.logo);
  if (!src) return undefined;
  if (src.format === 'svg') return { src: src.src, width: src.width, height: src.height };
  const img = await getImage({ src, height: 112, format: 'png' });
  return { src: img.src, width: img.attributes.width as number, height: img.attributes.height as number };
}

/** Favicon links. Undefined = use /favicon.svg and /favicon.ico from public/. */
export async function getFavicons() {
  const src = find(site.favicon);
  if (!src) return undefined;
  if (src.format === 'svg') return { svg: src.src };
  const [png32, png180] = await Promise.all([
    getImage({ src, width: 48, height: 48, fit: 'contain', format: 'png' }),
    getImage({ src, width: 180, height: 180, fit: 'contain', format: 'png' }),
  ]);
  return { png: png32.src, apple: png180.src };
}
