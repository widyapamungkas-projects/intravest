import YAML from 'yaml';
import { DEST_KEY_ORDER, DEST_LOCALE_KEY_ORDER } from '../../shared/destination.ts';
import { DAY_KEY_ORDER, LOCALE_KEY_ORDER, TOUR_KEY_ORDER } from '../../shared/tour.ts';

function order(obj: Record<string, unknown>, known: string[]): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  for (const k of known) if (k in obj) out[k] = obj[k];
  for (const k of Object.keys(obj)) if (!(k in out)) out[k] = obj[k]; // kunci tak dikenal (mis. srcDigest) dipertahankan
  return out;
}

/** Urutkan kunci supaya diff git kecil dan konsisten dengan file buatan tangan / Pages CMS. */
export function orderTour(t: Record<string, unknown>): Record<string, unknown> {
  const out = order(t, TOUR_KEY_ORDER);
  for (const l of ['en', 'id']) {
    const loc = out[l] as Record<string, unknown> | undefined;
    if (loc && typeof loc === 'object') {
      const o = order(loc, LOCALE_KEY_ORDER);
      if (Array.isArray(o.itinerary)) o.itinerary = (o.itinerary as Record<string, unknown>[]).map((d) => order(d, DAY_KEY_ORDER));
      out[l] = o;
    }
  }
  return out;
}

export function parseYaml<T = Record<string, unknown>>(text: string): T {
  return (YAML.parse(text) ?? {}) as T;
}

/** lineWidth 0: tidak melipat baris panjang. Teks multi-baris (body) memakai blok `|-` seperti file yang ada. */
export function stringifyYaml(obj: unknown): string {
  return YAML.stringify(obj, { lineWidth: 0, blockQuote: 'literal', defaultStringType: 'PLAIN', defaultKeyType: 'PLAIN' });
}

export function orderDestination(t: Record<string, unknown>): Record<string, unknown> {
  const out = order(t, DEST_KEY_ORDER);
  for (const l of ['en', 'id']) {
    const loc = out[l] as Record<string, unknown> | undefined;
    if (loc && typeof loc === 'object') out[l] = order(loc, DEST_LOCALE_KEY_ORDER);
  }
  return out;
}
