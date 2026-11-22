import type { CollectionEntry } from 'astro:content';
import { TIERS, buildPricing, parsePricingCsv, type PricedHotel } from './pricing-core.mjs';
import type { Locale } from './i18n';

// Price tables live in src/data/pricing/<package-slug>.csv (see pricing-core.mjs for the format).
const csvFiles = import.meta.glob('./data/pricing/*.csv', { query: '?raw', import: 'default', eager: true }) as Record<string, string>;

export interface TourPricing {
  hotels: PricedHotel[];
  validUntil?: string;
  leadHotel: PricedHotel;
  leadTierId: string;
  leadMinPax: number;
  /** Twin-share price per person at the lead-in hotel and tier: the "from" price. */
  leadAmount: number;
  highSeasonNote?: string;
}

type TourData = CollectionEntry<'tours'>['data'];

/** Price table of a package, or null when it has none (the page then falls back to priceIDR). */
export function getPricing(slug: string, d: TourData): TourPricing | null {
  const cfg = d.pricing;
  const csv = csvFiles[`./data/pricing/${slug}.csv`];
  if (!cfg || !csv) return null;
  const { rows } = parsePricingCsv(csv);
  const hotels = buildPricing(rows, cfg.hotels);
  const leadHotel = hotels.find((h) => h.id === cfg.leadHotel);
  const tier = TIERS.find((t) => t.id === cfg.leadTier);
  const leadAmount = leadHotel && tier ? leadHotel.prices[tier.id]?.twin : undefined;
  if (!leadHotel || !tier || !leadAmount) return null;
  return { hotels, validUntil: cfg.validUntil, leadHotel, leadTierId: tier.id, leadMinPax: tier.min, leadAmount, highSeasonNote: d.highSeasonNote };
}

/** The "from" price shown on cards and headers: the lead-in cell, else the old single price. */
export function fromAmount(slug: string, d: TourData): { amount: number; pricing: TourPricing | null } {
  const pricing = getPricing(slug, d);
  return { amount: pricing?.leadAmount ?? d.priceIDR ?? 0, pricing };
}

export const formatValidUntil = (locale: Locale, iso: string) =>
  new Intl.DateTimeFormat(locale === 'id' ? 'id-ID' : 'en-GB', { day: 'numeric', month: 'long', year: 'numeric' }).format(new Date(`${iso}T00:00:00`));
