import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { api, ApiError } from '../api';
import { tidyData, validateData, type DataName, type Issue } from '../../shared/site-data';
import { Field } from '../ui';
import { PhotoPicker } from '../PhotoPicker';
import { useApp } from '../App';
import { dropDraft, getDraft, saveDraft } from '../drafts';

type Data = Record<string, any>;
const same = (a: unknown, b: unknown) => JSON.stringify(a) === JSON.stringify(b);

function useSiteData(name: DataName) {
  const [data, setData] = useState<Data | null>(null);
  const [orig, setOrig] = useState<{ data: Data; sha: string } | null>(null);
  const [err, setErr] = useState('');
  const loaded = useRef(false);
  useEffect(() => {
    loaded.current = false; setData(null); setErr('');
    api(`/data/${name}`).then((r) => {
      setOrig({ data: r.data, sha: r.sha });
      const d = getDraft('data', name);
      setData(d?.kind === 'data' ? d.data : r.data); loaded.current = true;
    }).catch((e: ApiError) => setErr(e.message));
  }, [name]);
  useEffect(() => {
    if (!data || !orig || !loaded.current) return;
    if (same(tidyData(name, data), orig.data)) dropDraft('data', name);
    else saveDraft({ kind: 'data', slug: name, data, baseSha: orig.sha, updatedAt: Date.now() });
  }, [data]); // eslint-disable-line react-hooks/exhaustive-deps
  const issues: Issue[] = useMemo(() => { if (!data) return []; const v = validateData(name, tidyData(name, data)); return v.ok ? [] : v.issues; }, [data, name]);
  const dirty = !!data && !!orig && !same(tidyData(name, data), orig.data);
  const reset = () => orig && setData(orig.data);
  return { data, setData, issues, err, dirty, reset };
}

function Page({ title, intro, name, children }: { title: string; intro: string; name: DataName; children: (d: Data, set: (p: Data) => void, err: (...p: (string | number)[]) => string | undefined) => ReactNode }) {
  const { openPublish } = useApp();
  const { data, setData, issues, err, dirty, reset } = useSiteData(name);
  if (err) return <div className="card p-8 text-center text-bad">{err}</div>;
  if (!data) return <div className="text-muted">Memuat…</div>;
  const set = (p: Data) => setData((d) => ({ ...d, ...p }));
  const errFor = (...p: (string | number)[]) => issues.find((i) => i.path.join('.') === p.join('.'))?.message;
  return (
    <div className="pb-24">
      <h1 className="text-2xl font-semibold">{title}</h1>
      <p className="mt-1 text-sm text-muted">{intro}</p>
      <div className="mt-5 space-y-6">{children(data, set, errFor)}</div>
      <div className="fixed inset-x-0 bottom-0 z-20 border-t border-line bg-panel/95 px-4 py-3 backdrop-blur md:left-[250px]">
        <div className="mx-auto flex max-w-4xl items-center gap-3">
          <div className="min-w-0 flex-1 text-sm">
            {issues.length ? <span className="text-bad">{issues.length} isian perlu diperbaiki: {issues[0].message}</span> : dirty ? <span className="text-warn">Ada perubahan, belum dipublikasikan.</span> : <span className="text-muted">Tidak ada perubahan.</span>}
          </div>
          {dirty && <button className="btn-ghost" onClick={() => confirm('Buang perubahan di halaman ini?') && reset()}>Batalkan</button>}
          <button className="btn-primary" disabled={!dirty || issues.length > 0} onClick={openPublish}>Publikasikan…</button>
        </div>
      </div>
    </div>
  );
}

const Card = ({ title, children }: { title: string; children: ReactNode }) => <section className="card space-y-5 p-5"><h2 className="font-semibold">{title}</h2>{children}</section>;
const P = '/src/assets/images/';

export function HomePage() {
  return (
    <Page name="home" title="Beranda" intro="Foto besar di bagian atas halaman depan dan foto ajakan di bagian bawah.">
      {(d, set, errFor) => {
        const slides: { image: string; alt: string }[] = d.heroSlides ?? [];
        const upd = (i: number, p: Partial<{ image: string; alt: string }>) => set({ heroSlides: slides.map((s, k) => (k === i ? { ...s, ...p } : s)) });
        return (
          <>
            <Card title={`Foto utama (hero) · ${slides.length} dari 3 slide`}>
              {slides.map((s, i) => (
                <div key={i} className="rounded-lg border border-line p-4">
                  <div className="mb-3 flex items-center justify-between"><b className="text-sm">Slide {i + 1}</b>
                    <button className="text-sm text-bad underline" onClick={() => set({ heroSlides: slides.filter((_, k) => k !== i) })}>Hapus slide</button></div>
                  <PhotoPicker label="Foto" image={s.image} alt={s.alt} onImage={(v) => upd(i, { image: v ?? '' })} onAlt={(v) => upd(i, { alt: v })} />
                  {errFor('heroSlides', i, 'image') && <p className="mt-2 text-[13px] text-bad">{errFor('heroSlides', i, 'image')}</p>}
                </div>
              ))}
              {slides.length < 3 && <button className="btn-ghost" onClick={() => set({ heroSlides: [...slides, { image: '', alt: '' }] })}>+ Tambah slide</button>}
              {errFor('heroSlides') && <p className="text-[13px] text-bad">{errFor('heroSlides')}</p>}
            </Card>
            <Card title="Foto ajakan (di bawah halaman)">
              <PhotoPicker image={d.ctaImage} alt={d.ctaAlt} onImage={(v) => set({ ctaImage: v ?? '' })} onAlt={(v) => set({ ctaAlt: v })} />
            </Card>
          </>
        );
      }}
    </Page>
  );
}

export function AboutPage() {
  return (
    <Page name="about" title="Tentang" intro="Dua foto di halaman Tentang Kami.">
      {(d, set) => (
        <>
          <Card title="Foto bagian atas"><PhotoPicker image={d.heroImage} alt={d.heroAlt} onImage={(v) => set({ heroImage: v ?? '' })} onAlt={(v) => set({ heroAlt: v })} /></Card>
          <Card title="Foto bagian cerita"><PhotoPicker image={d.storyImage} alt={d.storyAlt} onImage={(v) => set({ storyImage: v ?? '' })} onAlt={(v) => set({ storyAlt: v })} /></Card>
        </>
      )}
    </Page>
  );
}

export function SettingsPage() {
  return (
    <Page name="settings" title="Pengaturan Situs" intro="Identitas perusahaan, kontak, dan media sosial yang tampil di seluruh situs.">
      {(d, set, errFor) => {
        const co = d.company ?? {}, ct = d.contact ?? {}, so = d.social ?? {};
        const setCo = (p: Data) => set({ company: { ...co, ...p } });
        const setCt = (p: Data) => set({ contact: { ...ct, ...p } });
        const setSo = (p: Data) => set({ social: { ...so, ...p } });
        return (
          <>
            <Card title="Perusahaan">
              <div className="grid gap-4 sm:grid-cols-2">
                <Field label="Nama" error={errFor('company', 'name')}><input className="field" value={co.name ?? ''} onChange={(e) => setCo({ name: e.target.value })} /></Field>
                <Field label="Nama lengkap"><input className="field" value={co.fullName ?? ''} onChange={(e) => setCo({ fullName: e.target.value })} /></Field>
              </div>
              <Field label="Tagline"><input className="field" value={co.tagline ?? ''} onChange={(e) => setCo({ tagline: e.target.value })} /></Field>
              <Field label="Alamat" hint="Satu baris per baris alamat."><textarea className="field" rows={3} value={co.address ?? ''} onChange={(e) => setCo({ address: e.target.value })} /></Field>
              <Field label="Deskripsi (English)"><textarea className="field" rows={3} value={co.descriptionEn ?? ''} onChange={(e) => setCo({ descriptionEn: e.target.value })} /></Field>
              <Field label="Deskripsi (Indonesia)"><textarea className="field" rows={3} value={co.descriptionId ?? ''} onChange={(e) => setCo({ descriptionId: e.target.value })} /></Field>
            </Card>
            <Card title="Logo dan ikon tab browser">
              <PhotoPicker label="Logo" image={co.logo} onImage={(v) => setCo({ logo: v ?? '' })} />
              <PhotoPicker label="Favicon" image={co.favicon} onImage={(v) => setCo({ favicon: v ?? '' })} />
            </Card>
            <Card title="Kontak">
              <div className="grid gap-4 sm:grid-cols-2">
                <Field label="WhatsApp (untuk tautan)" hint="Angka saja dengan kode negara, mis. 6281234567890." error={errFor('contact', 'whatsapp')}><input className="field" inputMode="numeric" value={ct.whatsapp ?? ''} onChange={(e) => setCt({ whatsapp: e.target.value })} /></Field>
                <Field label="WhatsApp (tampilan)" hint="Cara nomor ditulis di situs, mis. +62 812-3456-7890."><input className="field" value={ct.whatsappDisplay ?? ''} onChange={(e) => setCt({ whatsappDisplay: e.target.value })} /></Field>
              </div>
              <Field label="Email" error={errFor('contact', 'email')}><input className="field" type="email" value={ct.email ?? ''} onChange={(e) => setCt({ email: e.target.value })} /></Field>
            </Card>
            <Card title="Media sosial">
              <div className="grid gap-4 sm:grid-cols-2">
                <Field label="Instagram" hint="Alamat lengkap profil."><input className="field" value={so.instagram ?? ''} onChange={(e) => setSo({ instagram: e.target.value })} /></Field>
                <Field label="Threads" hint="Alamat lengkap profil."><input className="field" value={so.threads ?? ''} onChange={(e) => setSo({ threads: e.target.value })} /></Field>
              </div>
            </Card>
          </>
        );
      }}
    </Page>
  );
}
