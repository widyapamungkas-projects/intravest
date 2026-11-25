import YAML from 'yaml';
import { STORY_KEY_ORDER } from '../../shared/story.ts';
import type { RepoStore } from '../repo/types.ts';
import { parseYaml } from './yaml.ts';

export const STORY_DIR = 'src/content/stories/';
export const storyPath = (locale: string, slug: string) => `${STORY_DIR}${locale}/${slug}.md`;
export const destPath = (slug: string) => `src/content/destinations/${slug}.yml`;

/** Pisahkan frontmatter dan isi. Tahan CRLF dan BOM. Tanpa frontmatter: semua dianggap isi. */
export function parseStory(text: string): { fm: Record<string, any>; body: string } {
  const t = text.replace(/^﻿/, '').replace(/\r\n/g, '\n');
  const m = /^---\n([\s\S]*?)\n---\n?([\s\S]*)$/.exec(t);
  if (!m) return { fm: {}, body: t.replace(/^\n+/, '') };
  const fm = parseYaml<Record<string, any>>(m[1]);
  // tanggal yang terbaca sebagai Date (YAML 1.1) -> string YYYY-MM-DD
  if (fm.date instanceof Date) fm.date = fm.date.toISOString().slice(0, 10);
  if (Array.isArray(fm.tags)) fm.tags = fm.tags.join(', ');
  return { fm, body: m[2].replace(/^\n+/, '') };
}

export function serializeStory(fm: Record<string, unknown>, body: string): string {
  const ordered: Record<string, unknown> = {};
  for (const k of STORY_KEY_ORDER) if (k in fm && fm[k] !== undefined) ordered[k] = fm[k];
  for (const k of Object.keys(fm)) if (!(k in ordered) && fm[k] !== undefined) ordered[k] = fm[k];
  if (ordered.postToThreads === false && !('postToThreads' in fm)) delete ordered.postToThreads;
  const yaml = YAML.stringify(ordered, { lineWidth: 0, defaultStringType: 'PLAIN', defaultKeyType: 'PLAIN' });
  return `---\n${yaml}---\n\n${body.replace(/\s+$/g, '')}\n`;
}

export type StorySummary = { locale: 'en' | 'id'; slug: string; title: string; date: string; category: string; tags: string; image?: string; threads: 'tidak' | 'menunggu' | 'terkirim'; sha: string };

export async function listStories(repo: RepoStore): Promise<StorySummary[]> {
  const { files } = await repo.snapshot();
  const entries = files.filter((f) => /^src\/content\/stories\/(en|id)\/[^/]+\.mdx?$/.test(f.path));
  const out = await Promise.all(entries.map(async (e) => {
    const [, locale, slug] = /^src\/content\/stories\/(en|id)\/(.+)\.mdx?$/.exec(e.path)!;
    const { fm } = parseStory((await repo.read(e.path))?.content ?? '');
    return {
      locale: locale as 'en' | 'id', slug, title: fm.title ?? slug, date: String(fm.date ?? ''), category: fm.category ?? '', tags: fm.tags ?? '',
      image: fm.image, threads: fm.postToThreads ? (fm.threadsPostedAt ? 'terkirim' : 'menunggu') : 'tidak', sha: e.sha,
    } satisfies StorySummary;
  }));
  return out.sort((a, b) => b.date.localeCompare(a.date) || a.slug.localeCompare(b.slug));
}

export type DestSummary = { slug: string; title: string; tagline: string; order: number; image?: string; needsReview: boolean; missingLocale: string[]; tours: number; sha: string };

export async function listDestinations(repo: RepoStore, tourDest: Map<string, number>): Promise<DestSummary[]> {
  const { files } = await repo.snapshot();
  const entries = files.filter((f) => /^src\/content\/destinations\/[^/]+\.yml$/.test(f.path));
  const out = await Promise.all(entries.map(async (e) => {
    const d = parseYaml<Record<string, any>>((await repo.read(e.path))?.content ?? '');
    const slug = e.path.split('/').pop()!.slice(0, -4);
    const has = (l: string) => typeof d[l]?.title === 'string' && d[l].title.trim() !== '';
    return { slug, title: d.en?.title || d.id?.title || slug, tagline: d.en?.tagline || d.id?.tagline || '', order: d.order ?? 0, image: d.image,
      needsReview: !!(d.en?.needsReview || d.id?.needsReview), missingLocale: ['en', 'id'].filter((l) => !has(l)), tours: tourDest.get(slug) ?? 0, sha: e.sha } satisfies DestSummary;
  }));
  return out.sort((a, b) => a.order - b.order || a.slug.localeCompare(b.slug));
}
