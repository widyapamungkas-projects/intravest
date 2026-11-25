import { fileURLToPath } from 'node:url';
import { Hono } from 'hono';
import { serve } from '@hono/node-server';
import { serveStatic } from '@hono/node-server/serve-static';
import fs from 'node:fs';
import path from 'node:path';
import { config } from './config.ts';
import { authRoutes, csrfGuard } from './auth.ts';
import { buildApi } from './api.ts';
import { GitHubRepo } from './repo/github.ts';
import { LocalGitRepo } from './repo/local.ts';
import type { RepoStore } from './repo/types.ts';

export function buildApp(repo: RepoStore) {
  const app = new Hono();
  app.use('*', async (c, next) => {
    await next();
    c.header('X-Frame-Options', 'DENY');
    c.header('X-Content-Type-Options', 'nosniff');
    c.header('Referrer-Policy', 'same-origin');
    c.header('Content-Security-Policy', "default-src 'self'; img-src 'self' data: blob:; style-src 'self' 'unsafe-inline'; script-src 'self'; frame-ancestors 'none'");
    if (c.req.path.startsWith('/api/')) c.header('Cache-Control', 'no-store');
  });
  app.use('/api/*', csrfGuard);
  app.route('/api/auth', authRoutes);
  app.route('/api', buildApi(repo));
  app.onError((e, c) => {
    console.error(e);
    return c.json({ error: 'Terjadi kesalahan di server. Coba lagi, atau lihat log.' }, 500);
  });

  const dist = path.resolve(import.meta.dirname, config.production ? '../client' : '../../dist/client');
  if (fs.existsSync(dist)) {
    app.use('/*', serveStatic({ root: path.relative(process.cwd(), dist) }));
    app.get('*', (c) => c.html(fs.readFileSync(path.join(dist, 'index.html'), 'utf8')));
  }
  return app;
}

export function makeRepo(): RepoStore {
  if (config.localRepo) return new LocalGitRepo(config.localRepo, config.github.branch === 'main' ? 'HEAD' : config.github.branch);
  if (!config.github.token) throw new Error('GITHUB_TOKEN belum diisi (atau set LOCAL_REPO untuk mode lokal).');
  return new GitHubRepo({ token: config.github.token, repo: config.github.repo, branch: config.github.branch });
}

// Penentu "dijalankan langsung": harus benar di Windows juga (argv memakai backslash, import.meta.url memakai file:///C:/...).
const entry = process.argv[1] ? path.resolve(process.argv[1]) : '';
if (entry === fileURLToPath(import.meta.url) || /server[\\/]index\.(ts|js)$/.test(entry)) {
  const app = buildApp(makeRepo());
  serve({ fetch: app.fetch, port: config.port }, (i) => console.log(`Dashboard Intravest di http://localhost:${i.port} (${config.localRepo ? 'repo lokal' : config.github.repo + '@' + config.github.branch})`));
}
