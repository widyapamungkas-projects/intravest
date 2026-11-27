import { useCallback, useEffect, useState } from 'react';
import { Link, Route, Switch, useLocation } from 'wouter';
import { api } from './api';
import { Login } from './pages/Login';
import { Tours } from './pages/Tours';
import { TourEditor } from './pages/TourEditor';
import { Destinations } from './pages/Destinations';
import { DestinationEditor } from './pages/DestinationEditor';
import { Stories } from './pages/Stories';
import { StoryEditor } from './pages/StoryEditor';
import { Gallery } from './pages/Gallery';
import { AboutPage, HomePage, SettingsPage } from './pages/SiteData';
import { PublishDialog } from './pages/PublishDialog';
import { useDrafts } from './drafts';
import { hydrateImages } from './imageStore';
import { Toasts, type ToastMsg } from './ui';

type User = { email: string; name: string };
export type Ctx = { toast: (text: string, tone?: 'ok' | 'bad') => void; meta: Meta | null; reloadMeta: () => void; openPublish: () => void };
export type Meta = { commit: string; destinations: { slug: string; title: string }[]; images: string[] };

import { createContext, useContext } from 'react';
export const AppCtx = createContext<Ctx>(null as unknown as Ctx);
export const useApp = () => useContext(AppCtx);

const NAV = [
  { href: '/paket', label: 'Paket Wisata', icon: '🧳', on: true },
  { href: '/destinasi', label: 'Destinasi', icon: '📍', on: true },
  { href: '/cerita', label: 'Cerita Perjalanan', icon: '✍️', on: true },
  { href: '/gambar', label: 'Gambar', icon: '🖼️', on: true },
  { href: '/beranda', label: 'Beranda', icon: '🏠', on: true },
  { href: '/tentang', label: 'Tentang', icon: 'ℹ️', on: true },
  { href: '/pengaturan', label: 'Pengaturan Situs', icon: '⚙️', on: true },
];

export function App() {
  const [user, setUser] = useState<User | null | undefined>(undefined);
  useEffect(() => { api('/auth/me').then((r) => setUser(r.user)).catch(() => setUser(null)); }, []);
  useEffect(() => { const f = () => setUser(null); window.addEventListener('cms:unauthorized', f); return () => window.removeEventListener('cms:unauthorized', f); }, []);
  if (user === undefined) return <div className="grid min-h-dvh place-items-center text-muted">Memuat…</div>;
  if (!user) return <Login onDone={setUser} />;
  return <Shell user={user} onLogout={async () => { await api('/auth/logout', { method: 'POST', body: {} }); setUser(null); }} />;
}

function Shell({ user, onLogout }: { user: User; onLogout: () => void }) {
  const [toasts, setToasts] = useState<ToastMsg[]>([]);
  const [meta, setMeta] = useState<Meta | null>(null);
  const [publishing, setPublishing] = useState(false);
  const [menu, setMenu] = useState(false);
  const [loc] = useLocation();
  const drafts = useDrafts();

  const toast = useCallback((text: string, tone: 'ok' | 'bad' = 'ok') => {
    const id = Date.now() + Math.random();
    setToasts((t) => [...t, { id, text, tone }]);
    setTimeout(() => setToasts((t) => t.filter((x) => x.id !== id)), 4500);
  }, []);
  const reloadMeta = useCallback(() => { api<Meta>('/meta').then(setMeta).catch((e) => toast(e.message, 'bad')); }, [toast]);
  useEffect(reloadMeta, [reloadMeta]);
  useEffect(() => { hydrateImages(drafts.filter((d) => d.kind === 'image').map((d) => d.slug)); }, []); // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => setMenu(false), [loc]);

  return (
    <AppCtx.Provider value={{ toast, meta, reloadMeta, openPublish: () => setPublishing(true) }}>
      <div className="min-h-dvh md:grid md:grid-cols-[250px_1fr]">
        <header className="sticky top-0 z-30 flex items-center justify-between bg-side px-4 py-2.5 text-white md:hidden">
          <button className="btn !min-h-10 !px-2 text-xl text-white" aria-label="Menu" onClick={() => setMenu(!menu)}>☰</button>
          <span className="font-semibold">Intravest</span>
          <PublishPill count={drafts.length} onClick={() => setPublishing(true)} />
        </header>
        <aside className={`${menu ? 'block' : 'hidden'} fixed inset-x-0 top-[58px] z-20 bg-side text-side-ink md:static md:block md:min-h-dvh`}>
          <div className="hidden items-center gap-2.5 px-5 py-5 md:flex">
            <div className="grid h-9 w-9 place-items-center rounded-lg bg-brand font-bold text-white">I</div>
            <div className="leading-tight"><div className="font-semibold text-white">Intravest</div><div className="text-xs opacity-70">Dashboard konten</div></div>
          </div>
          <nav className="space-y-0.5 px-3 pb-3 pt-2 md:pt-0">
            {NAV.map((n) => n.on ? (
              <Link key={n.label} href={n.href} className={`flex min-h-11 items-center gap-3 rounded-lg px-3 text-[15px] ${loc.startsWith(n.href) ? 'bg-white/10 text-white' : 'hover:bg-white/5'}`}><span>{n.icon}</span>{n.label}</Link>
            ) : (
              <div key={n.label} className="flex min-h-11 items-center gap-3 rounded-lg px-3 text-[15px] opacity-40"><span>{n.icon}</span>{n.label}<span className="ml-auto text-[11px]">segera</span></div>
            ))}
          </nav>
          <div className="border-t border-white/10 px-5 py-4 text-sm md:absolute md:bottom-0 md:w-[250px]">
            <div className="truncate text-white">{user.name}</div>
            <div className="truncate text-xs opacity-60">{user.email}</div>
            <button className="mt-2 text-xs underline opacity-80" onClick={onLogout}>Keluar</button>
          </div>
        </aside>
        <main className="min-w-0 pb-28 md:pb-10">
          <div className="sticky top-0 z-20 hidden items-center justify-end gap-3 border-b border-line bg-canvas/90 px-8 py-3 backdrop-blur md:flex">
            <PublishPill count={drafts.length} onClick={() => setPublishing(true)} />
          </div>
          <div className="mx-auto max-w-5xl px-4 py-5 md:px-8 md:py-7">
            <Switch>
              <Route path="/paket/baru"><TourEditor slug={null} /></Route>
              <Route path="/paket/:slug">{(p) => <TourEditor slug={p.slug} />}</Route>
              <Route path="/paket"><Tours /></Route>
              <Route path="/destinasi/baru"><DestinationEditor slug={null} /></Route>
              <Route path="/destinasi/:slug">{(p) => <DestinationEditor slug={p.slug} />}</Route>
              <Route path="/destinasi"><Destinations /></Route>
              <Route path="/cerita/baru"><StoryEditor ref={null} /></Route>
              <Route path="/cerita/:locale/:slug">{(p) => <StoryEditor ref={{ locale: p.locale, slug: p.slug }} />}</Route>
              <Route path="/cerita"><Stories /></Route>
              <Route path="/gambar"><Gallery /></Route>
              <Route path="/beranda"><HomePage /></Route>
              <Route path="/tentang"><AboutPage /></Route>
              <Route path="/pengaturan"><SettingsPage /></Route>
              <Route><Tours /></Route>
            </Switch>
          </div>
        </main>
      </div>
      {publishing && <PublishDialog onClose={() => setPublishing(false)} />}
      <Toasts items={toasts} />
    </AppCtx.Provider>
  );
}

function PublishPill({ count, onClick }: { count: number; onClick: () => void }) {
  return (
    <button onClick={onClick} disabled={!count} className={`btn !min-h-10 ${count ? 'bg-brand text-white hover:bg-brand-ink' : 'border border-line bg-panel text-muted md:border-line'} disabled:opacity-60`}>
      {count ? <>Publikasikan <span className="rounded-full bg-white/25 px-2 text-xs">{count}</span></> : 'Tidak ada perubahan'}
    </button>
  );
}
