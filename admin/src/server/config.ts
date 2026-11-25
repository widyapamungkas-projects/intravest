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
  // Lewati OTP (password tetap wajib). Hanya untuk uji/lokal. Di production harus dinyalakan sengaja dengan ALLOW_INSECURE_NO_OTP=1.
  disableOtp: env.DISABLE_OTP === '1' && (env.NODE_ENV !== 'production' || env.ALLOW_INSECURE_NO_OTP === '1'),
  disableOtpRefused: env.DISABLE_OTP === '1' && env.NODE_ENV === 'production' && env.ALLOW_INSECURE_NO_OTP !== '1',
  resendKey: env.RESEND_API_KEY ?? '',
  mailFrom: env.MAIL_FROM ?? 'Intravest CMS <onboarding@resend.dev>',
  maxAdmins: Number(env.MAX_ADMINS ?? 3),
};
