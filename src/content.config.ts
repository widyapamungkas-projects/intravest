import { defineCollection } from 'astro:content';
import { glob } from 'astro/loaders';
import { z } from 'astro/zod';
import { bilingualLoader } from './loaders/bilingual';

// Destinations and tours are ONE yml file per item holding both languages (see src/loaders/bilingual.ts).
// Entry ids look like "en/bali" and "id/bali": the folder is the locale, the file name is the URL slug.
const destinations = defineCollection({
  loader: bilingualLoader('./src/content/destinations'),
  schema: z.object({
    title: z.string(),
    tagline: z.string(),
    description: z.string().max(160), // used as meta description
    order: z.number(),
    see: z.array(z.string()).min(1),
    activities: z.array(z.string()).min(1),
    shopping: z.array(z.string()).min(1),
    needsReview: z.boolean().optional(), // true = machine translation not yet checked by a person
    image: z.string().optional(), // file name in src/assets/images (set through the dashboard)
    imageAlt: z.string().optional(),
  }),
});

// Tour packages. Same id scheme as destinations ("en/bali-essentials"), and the EN and ID files for one
// package MUST share the same file name, because hreflang maps the slug 1:1 between locales.
const tours = defineCollection({
  loader: bilingualLoader('./src/content/tours'),
  schema: z
    .object({
      code: z.string(), // e.g. BAL-01
      title: z.string(),
      destination: z.string(), // destination slug, e.g. "bali"
      days: z.number().int().min(1),
      nights: z.number().int().min(0),
      summary: z.string().max(160), // card text + meta description
      order: z.number(),
      priceIDR: z.number().int().positive(), // per person, based on minPax
      priceIsDraft: z.boolean().default(false), // true = price not final yet, shown as such on the page
      minPax: z.number().int().min(1).default(2),
      priceNote: z.string().optional(),
      itinerary: z
        .array(
          z.object({
            title: z.string(),
            plan: z.array(z.string()).min(1),
            meals: z.string(),
            stay: z.string().optional(),
          }),
        )
        .min(1),
      inclusions: z.array(z.string()).min(1),
      exclusions: z.array(z.string()).min(1),
      needsReview: z.boolean().optional(),
      image: z.string().optional(), // file name in src/assets/images (set through the dashboard)
      imageAlt: z.string().optional(),
    })
    .refine((t) => t.itinerary.length === t.days, {
      message: 'itinerary must have one entry per day',
      path: ['itinerary'],
    }),
});

// Travel Stories (blog). Unlike destinations and tours, an article may exist in one locale only,
// so the EN and ID slugs do not have to match. Pages without a translation get no hreflang alternate.
const stories = defineCollection({
  loader: glob({ base: './src/content/stories', pattern: '**/*.{md,mdx}' }),
  schema: z.object({
    title: z.string(),
    description: z.string().max(160), // meta description + card excerpt
    date: z.coerce.date(),
    category: z.string(), // a destination slug (e.g. "bali") or "tips"
    tags: z.array(z.string()).default([]),
    ogImage: z.string().optional(), // placeholder until real photos exist (Step 9)
    image: z.string().optional(), // file name in src/assets/images (set through the dashboard)
    imageAlt: z.string().optional(),
  }),
});

export const collections = { destinations, tours, stories };
