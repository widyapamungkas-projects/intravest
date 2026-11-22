export interface Tier { id: string; label: string; min: number }
export type PriceKey = 'single' | 'twin' | 'triple' | 'childTwin' | 'cwb' | 'cnb';
export type Prices = Record<PriceKey, number>;
export interface HotelSetting { id: string; name: string; stars?: number; area?: string; highSeason?: number }
export interface PricedHotel extends HotelSetting { prices: Record<string, Prices> }
export const TIERS: Tier[];
export const PRICE_KEYS: PriceKey[];
export const MAX_HOTELS: number;
export function tierForAdults(adults: number): Tier;
export function parsePricingCsv(text: string): { rows: any[]; errors: string[] };
export function validatePricing(p: { rows: any[]; hotels: HotelSetting[]; leadHotel?: string; leadTier?: string; validUntil?: string; today?: Date }): { errors: string[]; warnings: string[] };
export function buildPricing(rows: any[], hotels: HotelSetting[]): PricedHotel[];
