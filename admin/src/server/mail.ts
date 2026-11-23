import { config } from './config.ts';

/** Kotak surat dev/tes: email yang "terkirim" tanpa RESEND_API_KEY dan bukan production. */
export const outbox: { to: string; subject: string; text: string }[] = [];

/** Kirim email lewat Resend. Tanpa RESEND_API_KEY (dev), isi email dicetak ke konsol, hanya kalau bukan production. */
export async function sendMail(to: string, subject: string, text: string): Promise<void> {
  if (!config.resendKey) {
    if (config.production) throw new Error('RESEND_API_KEY belum diisi.');
    outbox.push({ to, subject, text });
    if (!process.env.TEST) console.log(`\n[email dev] ke ${to}\n  ${subject}\n  ${text.replace(/\n/g, '\n  ')}\n`);
    return;
  }
  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: { Authorization: `Bearer ${config.resendKey}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ from: config.mailFrom, to: [to], subject, text }),
  });
  if (!res.ok) throw new Error(`Resend menolak pengiriman (${res.status}): ${(await res.text()).slice(0, 200)}`);
}
