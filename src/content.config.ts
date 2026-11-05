import { defineCollection } from 'astro:content';
import { glob } from 'astro/loaders';
import { z } from 'astro/zod';

// Entry ids look like "en/bali" and "id/bali": the folder is the locale, the file name is the URL slug.
const destinations = defineCollection({
  loader: glob({ base: './src/content/destinations', pattern: '**/*.mdx' }),
  schema: z.object({
    title: z.string(),
    tagline: z.string(),
    description: z.string().max(160), // used as meta description
    order: z.number(),
    see: z.array(z.string()).min(1),
    activities: z.array(z.string()).min(1),
    shopping: z.array(z.string()).min(1),
  }),
});

export const collections = { destinations };
