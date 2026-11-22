// Room templates: a = adults, ck = children 4-12, cy = children 1-3.
// items: [priceKey, count] where priceKey in single|twin|triple|childTwin|cwb|cnb.
export const ROOMS = [
  { id: 'SGL',   label: 'Single',                       a: 1, ck: 0, cy: 0, items: [['single', 1]] },
  { id: 'TWN',   label: 'Twin share',                   a: 2, ck: 0, cy: 0, items: [['twin', 2]] },
  { id: 'TRP',   label: 'Triple share',                 a: 3, ck: 0, cy: 0, items: [['triple', 3]] },
  { id: 'CT',    label: 'Child twin',                   a: 1, ck: 1, cy: 0, items: [['twin', 1], ['childTwin', 1]] },
  { id: 'CWB',   label: 'Twin + CWB',                   a: 2, ck: 1, cy: 0, items: [['twin', 2], ['cwb', 1]] },
  { id: 'CNB',   label: 'Twin + CNB',                   a: 2, ck: 0, cy: 1, items: [['twin', 2], ['cnb', 1]] },
  { id: 'SCNB',  label: 'Single + CNB',                 a: 1, ck: 0, cy: 1, items: [['single', 1], ['cnb', 1]] },
  { id: 'CWBNB', label: 'Twin + CWB + CNB',             a: 2, ck: 1, cy: 1, items: [['twin', 2], ['cwb', 1], ['cnb', 1]] },
];
export const ROOM_PRICE_LABELS = { single: 'Single', twin: 'Twin share', triple: 'Triple share', childTwin: 'Child twin', cwb: 'CWB', cnb: 'CNB' };

export function roomPrice(room, price) { return room.items.reduce((s, [k, n]) => s + price[k] * n, 0); }

// Split guests: 13+ counts as adult, 4-12 child (ck), 1-3 young (cy), under 1 not charged here.
export function guestMix(adults, ages) {
  let a = adults, ck = 0, cy = 0, infants = 0;
  ages.forEach((g) => { if (g >= 13) a++; else if (g >= 4) ck++; else if (g >= 1) cy++; else infants++; });
  return { a, ck, cy, infants };
}

// All room combinations (counts per template) that seat exactly a / ck / cy.
export function enumerate(a, ck, cy, limit = 20000) {
  const out = [];
  const counts = new Array(ROOMS.length).fill(0);
  (function rec(i, ra, rk, ry) {
    if (out.length >= limit) return;
    if (i === ROOMS.length) { if (ra === 0 && rk === 0 && ry === 0) out.push(counts.slice()); return; }
    const r = ROOMS[i];
    for (let n = 0; ; n++) {
      if (n * r.a > ra || n * r.ck > rk || n * r.cy > ry) break;
      counts[i] = n;
      rec(i + 1, ra - n * r.a, rk - n * r.ck, ry - n * r.cy);
      if (r.a === 0) break;
    }
    counts[i] = 0;
  })(0, a, ck, cy);
  return out;
}

export const arrTotal = (counts, price) => counts.reduce((s, n, i) => s + n * roomPrice(ROOMS[i], price), 0);
export const arrRooms = (counts) => counts.reduce((s, n) => s + n, 0);

// Two arrangements that charge exactly the same lines (e.g. who shares with the infant) are one choice.
function uniqueBill() {
  const seen = new Set();
  return (x) => {
    const bill = {};
    x.counts.forEach((n, i) => ROOMS[i].items.forEach(([k, c]) => { bill[k] = (bill[k] ?? 0) + n * c; }));
    const key = x.rooms + ':' + Object.keys(bill).sort().map((k) => k + bill[k]).join(',');
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  };
}

// Best arrangements: at most one triple room (adults normally share twin), then fewest rooms, then lowest price. Returns up to `top` distinct ones.
export function suggest(a, ck, cy, price, top = 3) {
  if (a < 1) return [];
  return enumerate(a, ck, cy)
    .map((c) => ({ counts: c, rooms: arrRooms(c), total: arrTotal(c, price) }))
    .sort((x, y) => (x.counts[2] > 1) - (y.counts[2] > 1) || x.rooms - y.rooms || x.total - y.total)
    .filter(uniqueBill())
    .slice(0, top);
}

// Human text, e.g. "1 × Twin share + 1 × Child twin"
export function describe(counts) {
  return counts.map((n, i) => (n ? `${n} × ${ROOMS[i].label}` : '')).filter(Boolean).join(' + ');
}

// Per-room breakdown lines for an arrangement.
export function breakdown(counts, price) {
  const rooms = [];
  counts.forEach((n, i) => { for (let k = 0; k < n; k++) rooms.push(ROOMS[i]); });
  return rooms.map((r, idx) => ({
    no: idx + 1, label: r.label,
    lines: r.items.map(([k, n]) => ({ what: ROOM_PRICE_LABELS[k], n, unit: price[k], sub: price[k] * n })),
    total: roomPrice(r, price),
  }));
}

// Is a hand-made arrangement seating exactly the guests?
export function check(counts, a, ck, cy) {
  let sa = 0, sk = 0, sy = 0;
  counts.forEach((n, i) => { sa += n * ROOMS[i].a; sk += n * ROOMS[i].ck; sy += n * ROOMS[i].cy; });
  return { da: a - sa, dk: ck - sk, dy: cy - sy, ok: a === sa && ck === sk && cy === sy };
}

