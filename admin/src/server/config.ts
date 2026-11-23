import path from 'node:path';

const env = process.env;
const publicUrl = (env.PUBLIC_URL ?? 'http://localhost:8787').replace(/\/$/, '');

export const config = {
  port: Number(env.PORT ?? 8787),
  publicUrl,
  secureCookies: publicUrl.startsWith('https://'),
  production: env.NODE_ENV === 'production',
  dataDir: path.resolve(env.DATA_DIR ?? './data'),
  github: {
    token: env.GITHUB_TOKEN ?? '',
    repo: env.GITHUB_REPO ?? 'widyapamungkas-projects/intravest',
    branch: env.GITHUB_BRANCH ?? 'main',
  },
  // Mode lokal untuk dev/tes: baca-tulis ke checkout git lokal, tanpa GitHub.
  localRepo: env.LOCAL_REPO ? path.resolve(env.LOCAL_REPO) : '',
  resendKey: env.RESEND_API_KEY ?? '',
  mailFrom: env.MAIL_FROM ?? 'Intravest CMS <onboarding@resend.dev>',
  maxAdmins: Number(env.MAX_ADMINS ?? 3),
};
