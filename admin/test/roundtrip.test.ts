import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { parseYaml, stringifyYaml, orderTour } from '../src/server/content/yaml.ts';
import { validateTour, cleanTour } from '../src/shared/tour.ts';

const repo = path.resolve(import.meta.dirname, '../..');
const dir = path.join(repo, 'src/content/tours');

for (const f of fs.readdirSync(dir).filter((x) => x.endsWith('.yml'))) {
  test(`paket ${f}: lolos skema, round-trip YAML tidak mengubah data`, () => {
    const text = fs.readFileSync(path.join(dir, f), 'utf8');
    const obj = parseYaml(text);
    const v = validateTour(cleanTour(obj));
    assert.ok(v.ok, JSON.stringify(v.ok ? [] : v.issues));
    const out = stringifyYaml(orderTour(obj));
    assert.deepEqual(parseYaml(out), obj);
    // diff teks harus kecil (hanya gaya penulisan), bukan tulis ulang total
    const a = text.split('\n'), b = out.split('\n');
    const changed = b.filter((l, i) => l !== a[i]).length;
    console.log(`${f}: ${changed}/${a.length} baris berbeda gaya`);
  });
}
