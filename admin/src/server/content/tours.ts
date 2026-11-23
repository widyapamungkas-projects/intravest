import { parseYaml } from './yaml.ts';
import type { RepoStore } from '../repo/types.ts';

export const TOUR_DIR = 'src/content/tours/';
export const tourPath = (slug: string) => `${TOUR_DIR}${slug}.yml`;
export const csvPath = (slug: string) => `src/data/pricing/${slug}.csv`;

export type TourSummary = {
  slug: string; code: string; title: string; destination: string; days: number; nights: number; order: number;
  priceIDR?: number; priceIsDraft: boolean; hasPricing: boolean; needsReview: boolean; missingLocale: string[]; image?: string; sha: string;
};

export async function listTours(repo: RepoStore): Promise<TourSummary[]> {
  const { files } = await repo.snapshot();
  const entries = files.filter((f) => f.path.startsWith(TOUR_DIR) && f.path.endsWith('.yml'));
  const out = await Promise.all(entries.map(async (e) => {
    const file = await repo.read(e.path);
    const d = parseYaml<Record<string, any>>(file?.content ?? '');
    const slug = e.path.slice(TOUR_DIR.length, -4);
    const has = (l: string) => typeof d[l]?.title === 'string' && d[l].title.trim() !== '';
    return {
      slug, code: d.code ?? '', title: d.en?.title || d.id?.title || slug, destination: d.destination ?? '',
      days: d.days ?? 0, nights: d.nights ?? 0, order: d.order ?? 0, priceIDR: d.priceIDR, priceIsDraft: !!d.priceIsDraft,
      hasPricing: !!d.pricing, needsReview: !!(d.en?.needsReview || d.id?.needsReview),
      missingLocale: ['en', 'id'].filter((l) => !has(l)), image: d.image, sha: e.sha,
    } satisfies TourSummary;
  }));
  return out.sort((a, b) => a.order - b.order || a.slug.localeCompare(b.slug));
}
