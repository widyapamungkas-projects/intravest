import { Hono } from 'hono';
import { requireUser, type User } from './auth.ts';
import { ConflictError, type FileChange, type RepoStore } from './repo/types.ts';
import { listTours, tourPath, csvPath } from './content/tours.ts';
import { destPath, listDestinations, listStories, parseStory, serializeStory, storyPath } from './content/stories.ts';
import { validateDestination } from '../shared/destination.ts';
import { validateStory } from '../shared/story.ts';
import { DATA_NAMES, IMAGE_NAME_RE, MAX_IMAGE_BYTES, imageKind, tidyData, validateData, type DataName } from '../shared/site-data.ts';
import { orderDestination, orderTour, parseYaml, stringifyYaml } from './content/yaml.ts';
import { cleanTour, validateTour } from '../shared/tour.ts';
import { checkContent, type Overlay } from './content/validate.ts';

type Env = { Variables: { user: User } };

export type PublishItem =
  | { kind: 'tour'; slug: string; data: Record<string, unknown> | null; baseSha: string | null }
  | { kind: 'csv'; slug: string; text: string | null; baseSha: string | null }
  | { kind: 'destination'; slug: string; data: Record<string, unknown> | null; baseSha: string | null }
  | { kind: 'data'; name: DataName; data: Record<string, unknown>; baseSha: string | null }
  | { kind: 'image'; name: string; b64: string }
  | { kind: 'story'; locale: 'en' | 'id'; slug: string; fm: Record<string, unknown> | null; body: string; baseSha: string | null };

export function buildApi(repo: RepoStore) {
  const api = new Hono<Env>();
  api.use('*', requireUser);

  api.get('/meta', async (c) => {
    const { commit, files } = await repo.snapshot();
    const destinations = await Promise.all(files.filter((f) => /^src\/content\/destinations\/[^/]+\.yml$/.test(f.path)).map(async (f) => {
      const d = parseYaml<Record<string, any>>((await repo.read(f.path))?.content ?? '');
      return { slug: f.path.split('/').pop()!.slice(0, -4), title: d.en?.title || d.id?.title || '' , order: d.order ?? 0 };
    }));
    const images = files.filter((f) => /^src\/assets\/images\/[^/]+\.(jpe?g|png|webp|avif|svg)$/i.test(f.path)).map((f) => f.path.split('/').pop()!);
    return c.json({ commit, destinations: destinations.sort((a, b) => a.order - b.order), images });
  });

  api.get('/image/:name', async (c) => {
    const name = c.req.param('name');
    if (!/^[\w.-]+\.(jpe?g|png|webp|avif|svg)$/i.test(name)) return c.json({ error: 'Nama berkas tidak valid.' }, 400);
    const f = await repo.readBuffer(`src/assets/images/${name}`);
    if (!f) return c.json({ error: 'Foto tidak ditemukan.' }, 404);
    const type = { jpg: 'image/jpeg', jpeg: 'image/jpeg', png: 'image/png', webp: 'image/webp', avif: 'image/avif', svg: 'image/svg+xml' }[name.split('.').pop()!.toLowerCase()]!;
    return new Response(new Uint8Array(f.content), { headers: { 'Content-Type': type, 'Cache-Control': 'private, max-age=3600', 'Content-Security-Policy': "default-src 'none'; style-src 'unsafe-inline'", 'X-Content-Type-Options': 'nosniff' } });
  });

  api.get('/tours', async (c) => c.json({ tours: await listTours(repo) }));

  api.get('/tours/:slug', async (c) => {
    const slug = c.req.param('slug');
    const f = await repo.read(tourPath(slug));
    if (!f) return c.json({ error: 'Paket tidak ditemukan.' }, 404);
    const csv = await repo.read(csvPath(slug));
    return c.json({ slug, data: parseYaml(f.content), sha: f.sha, csv: csv ? { text: csv.content, sha: csv.sha } : null });
  });

  api.get('/destinations', async (c) => {
    const tours = await listTours(repo);
    const count = new Map<string, number>();
    for (const t of tours) count.set(t.destination, (count.get(t.destination) ?? 0) + 1);
    return c.json({ destinations: await listDestinations(repo, count) });
  });

  api.get('/destinations/:slug', async (c) => {
    const slug = c.req.param('slug');
    const f = await repo.read(destPath(slug));
    if (!f) return c.json({ error: 'Destinasi tidak ditemukan.' }, 404);
    return c.json({ slug, data: parseYaml(f.content), sha: f.sha });
  });

  api.get('/data/:name', async (c) => {
    const name = c.req.param('name') as DataName;
    if (!DATA_NAMES.includes(name)) return c.json({ error: 'Data tidak dikenal.' }, 404);
    const f = await repo.read(`src/data/${name}.json`);
    if (!f) return c.json({ error: 'Berkas tidak ditemukan.' }, 404);
    return c.json({ name, data: JSON.parse(f.content), sha: f.sha });
  });

  api.get('/stories', async (c) => c.json({ stories: await listStories(repo) }));

  api.get('/stories/:locale/:slug', async (c) => {
    const { locale, slug } = c.req.param();
    if (!/^(en|id)$/.test(locale) || !/^[a-z0-9]+(-[a-z0-9]+)*$/.test(slug)) return c.json({ error: 'Alamat tidak valid.' }, 400);
    const f = await repo.read(storyPath(locale, slug));
    if (!f) return c.json({ error: 'Artikel tidak ditemukan.' }, 404);
    return c.json({ locale, slug, ...parseStory(f.content), sha: f.sha });
  });

  api.post('/publish', async (c) => {
    const user = c.get('user');
    const body = (await c.req.json().catch(() => null)) as { items?: PublishItem[]; note?: string } | null;
    const items = body?.items;
    if (!Array.isArray(items) || !items.length) return c.json({ error: 'Tidak ada perubahan untuk dipublikasikan.' }, 400);
    if (items.length > 40) return c.json({ error: 'Terlalu banyak perubahan sekaligus (maks 40).' }, 400);

    const { files } = await repo.snapshot();
    const changes: FileChange[] = [];
    const overlay: Overlay = new Map();
    const issues: { file: string; path: (string | number)[]; message: string }[] = [];
    const labels: string[] = [];

    for (const it of items) {
      if (it.kind !== 'data' && it.kind !== 'image' && !/^[a-z0-9]+(-[a-z0-9]+)*$/.test(String((it as { slug?: string }).slug ?? ''))) return c.json({ error: 'Slug tidak valid.' }, 400);
      if (it.kind === 'tour') {
        const p = tourPath(it.slug);
        if (it.data === null) {
          changes.push({ path: p, content: null, baseSha: it.baseSha });
          overlay.set(p, null);
          labels.push(`hapus paket ${it.slug}`);
          continue;
        }
        const cleaned = cleanTour({ ...it.data, slug: it.slug });
        const v = validateTour(cleaned);
        if (!v.ok) { issues.push(...v.issues.map((i) => ({ file: p, ...i }))); continue; }
        const text = stringifyYaml(orderTour(cleaned));
        changes.push({ path: p, content: text, baseSha: it.baseSha });
        overlay.set(p, text);
        labels.push(`${it.baseSha ? 'update' : 'tambah'} paket ${it.slug}`);
      } else if (it.kind === 'data') {
        if (!DATA_NAMES.includes(it.name)) return c.json({ error: 'Data tidak dikenal.' }, 400);
        const p = `src/data/${it.name}.json`;
        const tidy = tidyData(it.name, it.data);
        const v = validateData(it.name, tidy);
        if (!v.ok) { issues.push(...v.issues.map((i) => ({ file: p, ...i }))); continue; }
        const prev = await repo.read(p); // gaya akhir baris mengikuti berkas lama, supaya diff kecil
        const text = JSON.stringify(tidy, null, 2) + (prev && !prev.content.endsWith('\n') ? '' : '\n');
        changes.push({ path: p, content: text, baseSha: it.baseSha });
        overlay.set(p, text);
        labels.push(`update ${it.name === 'home' ? 'beranda' : it.name === 'about' ? 'halaman tentang' : 'pengaturan'}`);
      } else if (it.kind === 'image') {
        const p = `src/assets/images/${it.name}`;
        if (typeof it.name !== 'string' || !IMAGE_NAME_RE.test(it.name)) return c.json({ error: `Nama foto "${it.name}" tidak valid.` }, 400);
        if (typeof it.b64 !== 'string' || it.b64.length > MAX_IMAGE_BYTES * 1.4) return c.json({ error: `Foto ${it.name} terlalu besar (maksimal 4 MB setelah dikompres).` }, 413);
        const buf = Buffer.from(it.b64, 'base64');
        const kind = imageKind(buf);
        const ext = it.name.split('.').pop()!.replace('jpeg', 'jpg');
        if (!kind || kind !== ext) return c.json({ error: `Isi ${it.name} bukan berkas ${ext.toUpperCase()} yang valid.` }, 400);
        if (buf.length > MAX_IMAGE_BYTES) return c.json({ error: `Foto ${it.name} terlalu besar (maksimal 4 MB setelah dikompres).` }, 413);
        changes.push({ path: p, content: buf, baseSha: null });
        overlay.set(p, '');
        labels.push(`unggah foto ${it.name}`);
      } else if (it.kind === 'destination') {
        const p = destPath(it.slug);
        if (it.data === null) {
          changes.push({ path: p, content: null, baseSha: it.baseSha });
          overlay.set(p, null);
          labels.push(`hapus destinasi ${it.slug}`);
          continue;
        }
        const cleaned = cleanTour({ ...it.data, slug: it.slug });
        const v = validateDestination(cleaned);
        if (!v.ok) { issues.push(...v.issues.map((i) => ({ file: p, ...i }))); continue; }
        const text = stringifyYaml(orderDestination(cleaned));
        changes.push({ path: p, content: text, baseSha: it.baseSha });
        overlay.set(p, text);
        labels.push(`${it.baseSha ? 'update' : 'tambah'} destinasi ${it.slug}`);
      } else if (it.kind === 'story') {
        if (it.locale !== 'en' && it.locale !== 'id') return c.json({ error: 'Bahasa artikel tidak valid.' }, 400);
        const p = storyPath(it.locale, it.slug);
        if (it.fm === null) {
          changes.push({ path: p, content: null, baseSha: it.baseSha });
          overlay.set(p, null);
          labels.push(`hapus cerita ${it.locale}/${it.slug}`);
          continue;
        }
        if (typeof it.body !== 'string' || it.body.length > 200_000) return c.json({ error: 'Isi artikel tidak valid.' }, 400);
        const fm = cleanTour(it.fm);
        const v = validateStory(fm, it.body);
        if (!v.ok) { issues.push(...v.issues.map((i) => ({ file: p, ...i }))); continue; }
        const text = serializeStory(fm, it.body);
        changes.push({ path: p, content: text, baseSha: it.baseSha });
        overlay.set(p, text);
        labels.push(`${it.baseSha ? 'update' : 'tambah'} cerita ${it.locale}/${it.slug}`);
      } else if (it.kind === 'csv') {
        if (it.text !== null && (typeof it.text !== 'string' || it.text.length > 50_000)) return c.json({ error: 'Isi tabel harga tidak valid.' }, 400);
        const p = csvPath(it.slug);
        changes.push({ path: p, content: it.text, baseSha: it.baseSha });
        overlay.set(p, it.text);
        labels.push(`${it.text === null ? 'hapus' : 'update'} harga ${it.slug}`);
      } else return c.json({ error: 'Jenis perubahan tidak dikenal.' }, 400);
    }
    if (issues.length) return c.json({ error: 'Ada isian yang belum benar.', issues }, 422);

    const check = await checkContent(repo, files, overlay);
    if (check.errors.length) return c.json({ error: 'Konten tidak lolos pemeriksaan situs.', issues: check.errors.map((m) => ({ file: '', path: [], message: m })) }, 422);

    const subject = `CMS: ${summarize(labels)}`;
    const message = `${subject}\n\n${labels.map((l) => `- ${l}`).join('\n')}\n\nDiubah oleh: ${user.name} <${user.email}>${body?.note ? `\nCatatan: ${body.note.slice(0, 200)}` : ''}`;
    try {
      const res = await repo.commit({ message, changes });
      return c.json({ commit: res.commit, changed: res.changed, subject, warnings: check.warnings });
    } catch (e) {
      if (e instanceof ConflictError) return c.json({ error: 'Ada yang mengubah file yang sama di repo sejak kamu membukanya.', conflicts: e.conflicts }, 409);
      throw e;
    }
  });

  return api;
}

/** "CMS: update paket bali-active" untuk satu perubahan; ringkasan jumlah untuk banyak. */
export function summarize(labels: string[]): string {
  if (labels.length === 1) return labels[0];
  // paket + tabel harganya: satu judul ("update paket + harga bali-active")
  const parts = labels.map((l) => l.split(' '));
  if (parts.length === 2 && parts[0][2] === parts[1][2] && parts[0][1] !== parts[1][1]) {
    const verb = parts[0][0] === parts[1][0] ? parts[0][0] : 'update';
    return `${verb} ${parts[0][1]} + ${parts[1][1]} ${parts[0][2]}`;
  }
  // sedikit perubahan: sebut satuannya satu per satu ("tambah cerita en/x, update destinasi lombok")
  if (labels.length <= 3) return labels.join(', ');
  const kinds = new Map<string, number>();
  for (const l of labels) kinds.set(l.split(' ')[0] + ' ' + l.split(' ')[1], (kinds.get(l.split(' ')[0] + ' ' + l.split(' ')[1]) ?? 0) + 1);
  return [...kinds].map(([k, n]) => `${k} ×${n}`).join(', ');
}
