import { useState } from 'react';
import { api, ApiError } from '../api';

export function Login({ onDone }: { onDone: (u: { email: string; name: string }) => void }) {
  const [step, setStep] = useState<'pw' | 'otp'>('pw');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [remember, setRemember] = useState(false);
  const [code, setCode] = useState('');
  const [masked, setMasked] = useState('');
  const [err, setErr] = useState('');
  const [busy, setBusy] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setErr(''); setBusy(true);
    try {
      if (step === 'pw') {
        const r = await api('/auth/login', { body: { email, password, remember } });
        if (r.step === 'done') return onDone(r.user);
        setMasked(r.email); setStep('otp');
      } else {
        const r = await api('/auth/verify', { body: { code } });
        onDone(r.user);
      }
    } catch (x) {
      const m = (x as ApiError).message;
      setErr(m);
      if (step === 'otp' && /mulai lagi/i.test(m)) { setStep('pw'); setCode(''); }
    } finally { setBusy(false); }
  }

  return (
    <div className="grid min-h-dvh place-items-center px-4 py-10">
      <form onSubmit={submit} className="card w-full max-w-sm p-6 shadow-sm">
        <div className="mb-6">
          <div className="mb-3 grid h-11 w-11 place-items-center rounded-xl bg-brand text-lg font-bold text-white">I</div>
          <h1 className="text-xl font-semibold">Dashboard Intravest</h1>
          <p className="mt-1 text-sm text-muted">{step === 'pw' ? 'Masuk untuk mengelola paket, destinasi, dan cerita.' : <>Kode 6 digit sudah dikirim ke <b>{masked}</b>. Berlaku 10 menit.</>}</p>
        </div>
        {step === 'pw' ? (
          <div className="space-y-4">
            <label className="block"><span className="label">Email</span>
              <input className="field" type="email" autoComplete="username" required autoFocus value={email} onChange={(e) => setEmail(e.target.value)} /></label>
            <label className="block"><span className="label">Password</span>
              <input className="field" type="password" autoComplete="current-password" required value={password} onChange={(e) => setPassword(e.target.value)} /></label>
            <label className="flex items-start gap-2.5 text-sm text-muted">
              <input type="checkbox" className="mt-1 h-4 w-4 accent-[var(--color-brand)]" checked={remember} onChange={(e) => setRemember(e.target.checked)} />
              <span>Percayai perangkat ini 30 hari (tidak minta kode lagi, password tetap diminta). Jangan dicentang di komputer umum.</span>
            </label>
          </div>
        ) : (
          <label className="block"><span className="label">Kode masuk</span>
            <input className="field text-center text-2xl tracking-[0.4em]" inputMode="numeric" autoComplete="one-time-code" pattern="\d{6}" maxLength={6} required autoFocus
              value={code} onChange={(e) => setCode(e.target.value.replace(/\D/g, ''))} /></label>
        )}
        {err && <p className="mt-4 rounded-lg bg-bad/10 px-3 py-2 text-sm text-bad" role="alert">{err}</p>}
        <button className="btn-primary mt-5 w-full" disabled={busy}>{busy ? 'Memeriksa…' : step === 'pw' ? 'Lanjut' : 'Masuk'}</button>
        {step === 'otp' && <button type="button" className="mt-2 w-full text-sm text-muted underline" onClick={() => { setStep('pw'); setCode(''); setErr(''); }}>Kembali</button>}
      </form>
    </div>
  );
}
