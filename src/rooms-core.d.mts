import type { Prices } from './pricing-core.mjs';
export interface RoomType { id: string; label: string; a: number; ck: number; cy: number; items: [keyof Prices, number][] }
export interface Arrangement { counts: number[]; rooms: number; total: number }
export interface RoomBreakdown { no: number; label: string; lines: { what: string; n: number; unit: number; sub: number }[]; total: number }
export const ROOMS: RoomType[];
export const ROOM_PRICE_LABELS: Record<string, string>;
export function roomPrice(room: RoomType, price: Prices): number;
export function guestMix(adults: number, ages: number[]): { a: number; ck: number; cy: number; infants: number };
export function suggest(a: number, ck: number, cy: number, price: Prices, top?: number): Arrangement[];
export function describe(counts: number[]): string;
export function breakdown(counts: number[], price: Prices): RoomBreakdown[];
export function check(counts: number[], a: number, ck: number, cy: number): { da: number; dk: number; dy: number; ok: boolean };
export const arrTotal: (counts: number[], price: Prices) => number;
export const arrRooms: (counts: number[]) => number;
