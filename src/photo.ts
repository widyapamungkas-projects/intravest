import { getEntry, type CollectionEntry } from 'astro:content';

type Entry = CollectionEntry<'destinations'> | CollectionEntry<'tours'>;

/**
 * Photo for a destination or tour page. The EN and ID entries share one photo, so if this language has no photo
 * set, use the other language's. Alt text: own, else the other language's when the photo comes from there,
 * else the entry title (never empty).
 */
export async function photoOf(collection: 'destinations' | 'tours', entry: Entry) {
  const [locale, slug] = entry.id.split('/');
  const own = entry.data;
  if (own.image) return { image: own.image, imageAlt: own.imageAlt?.trim() || own.title };
  const other = await getEntry(collection, `${locale === 'en' ? 'id' : 'en'}/${slug}`);
  if (!other?.data.image) return { image: undefined, imageAlt: undefined };
  return { image: other.data.image, imageAlt: other.data.imageAlt?.trim() || own.title };
}
