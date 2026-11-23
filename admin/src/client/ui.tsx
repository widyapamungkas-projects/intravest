import { useEffect, useRef, useState, type ReactNode } from 'react';

export function Field({ label, hint, error, children, className = '' }: { label: string; hint?: ReactNode; error?: string; children: ReactNode; className?: string }) {
  return (
    <label className={`block ${className}`}>
      <span className="label">{label}</span>
      {children}
      {error ? <span className="mt-1 block text-[13px] text-bad">{error}</span> : hint ? <span className="hint block">{hint}</span> : null}
    </label>
  );
}

export function Toggle({ checked, onChange, label, hint }: { checked: boolean; onChange: (v: boolean) => void; label: string; hint?: string }) {
  return (
    <div className="flex items-start gap-3">
      <button type="button" role="switch" aria-checked={checked} aria-label={label} onClick={() => onChange(!checked)}
        className={`relative mt-0.5 h-7 w-12 shrink-0 rounded-full transition ${checked ? 'bg-brand' : 'bg-line'}`}>
        <span className={`absolute top-0.5 h-6 w-6 rounded-full bg-white shadow transition-all ${checked ? 'left-[22px]' : 'left-0.5'}`} />
      </button>
      <div><div className="text-sm font-medium">{label}</div>{hint && <div className="hint mt-0">{hint}</div>}</div>
    </div>
  );
}

/** Daftar teks sebagai SATU kotak: satu baris = satu item. Baris kosong diabaikan. */
export function LinesField({ value, onChange, rows = 6, placeholder, id }: { value: string[]; onChange: (v: string[]) => void; rows?: number; placeholder?: string; id?: string }) {
  const [text, setText] = useState(value.join('\n'));
  const last = useRef(value);
  useEffect(() => {
    if (JSON.stringify(last.current) !== JSON.stringify(value)) { setText(value.join('\n')); last.current = value; }
  }, [value]);
  const ref = useRef<HTMLTextAreaElement>(null);
  useEffect(() => { const el = ref.current; if (el) { el.style.height = 'auto'; el.style.height = Math.max(el.scrollHeight, rows * 24 + 20) + 'px'; } }, [text, rows]);
  return (
    <textarea id={id} ref={ref} className="field font-[inherit]" style={{ resize: 'none' }} value={text} placeholder={placeholder} spellCheck
      onChange={(e) => {
        setText(e.target.value);
        const arr = e.target.value.split('\n').map((s) => s.trim()).filter(Boolean);
        last.current = arr;
        onChange(arr);
      }} />
  );
}

export function Chip({ tone = 'gray', children }: { tone?: 'gray' | 'ok' | 'warn' | 'bad' | 'brand'; children: ReactNode }) {
  const t = { gray: 'bg-canvas text-muted border border-line', ok: 'bg-ok/10 text-ok', warn: 'bg-warn/15 text-[oklch(0.45_0.1_70)]', bad: 'bg-bad/10 text-bad', brand: 'bg-brand-soft text-brand-ink' }[tone];
  return <span className={`chip ${t}`}>{children}</span>;
}

export type ToastMsg = { id: number; text: string; tone: 'ok' | 'bad' };
export function Toasts({ items }: { items: ToastMsg[] }) {
  return (
    <div className="pointer-events-none fixed inset-x-0 bottom-20 z-[60] flex flex-col items-center gap-2 px-4 md:bottom-6" aria-live="polite">
      {items.map((t) => (
        <div key={t.id} className={`pointer-events-auto max-w-md rounded-lg px-4 py-3 text-sm text-white shadow-lg ${t.tone === 'ok' ? 'bg-ink' : 'bg-bad'}`}>{t.text}</div>
      ))}
    </div>
  );
}

export function Modal({ title, onClose, children, wide }: { title: string; onClose: () => void; children: ReactNode; wide?: boolean }) {
  useEffect(() => {
    const k = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', k);
    return () => window.removeEventListener('keydown', k);
  }, [onClose]);
  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-ink/40 md:items-center md:p-6" onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
      <div role="dialog" aria-modal="true" aria-label={title} className={`flex max-h-[92dvh] w-full flex-col rounded-t-2xl bg-panel shadow-2xl md:rounded-2xl ${wide ? 'md:max-w-2xl' : 'md:max-w-lg'}`}>
        <div className="flex items-center justify-between border-b border-line px-5 py-4">
          <h2 className="text-lg font-semibold">{title}</h2>
          <button className="btn-ghost !min-h-9 !px-3" onClick={onClose} aria-label="Tutup">✕</button>
        </div>
        <div className="overflow-y-auto p-5">{children}</div>
      </div>
    </div>
  );
}
