import { useRef, useState } from 'react';
import { renderMarkdown } from './md';

type Act = { label: string; title: string; run: (ta: HTMLTextAreaElement) => [string, number, number] };

/** Bungkus pilihan dengan penanda (**tebal**). Tanpa pilihan: sisipkan contoh dan sorot supaya langsung bisa diganti. */
const wrap = (a: string, b: string, ph: string) => (ta: HTMLTextAreaElement): [string, number, number] => {
  const { value, selectionStart: s, selectionEnd: e } = ta;
  const sel = value.slice(s, e) || ph;
  return [value.slice(0, s) + a + sel + b + value.slice(e), s + a.length, s + a.length + sel.length];
};
/** Awali setiap baris terpilih dengan penanda daftar/judul. */
const linePrefix = (prefix: string | ((n: number) => string)) => (ta: HTMLTextAreaElement): [string, number, number] => {
  const { value, selectionStart: s, selectionEnd: e } = ta;
  const from = value.lastIndexOf('\n', s - 1) + 1;
  const toRaw = value.indexOf('\n', e);
  const to = toRaw === -1 ? value.length : toRaw;
  const block = value.slice(from, to).split('\n').map((l, i) => (typeof prefix === 'function' ? prefix(i) : prefix) + l.replace(/^(#{1,4}\s+|[-*]\s+|\d+[.)]\s+|>\s?)/, '')).join('\n');
  return [value.slice(0, from) + block + value.slice(to), from, from + block.length];
};

const ACTIONS: Act[] = [
  { label: 'B', title: 'Tebal', run: wrap('**', '**', 'teks tebal') },
  { label: 'I', title: 'Miring', run: wrap('*', '*', 'teks miring') },
  { label: 'H2', title: 'Judul bagian', run: linePrefix('## ') },
  { label: 'H3', title: 'Sub-judul', run: linePrefix('### ') },
  { label: '•', title: 'Daftar poin', run: linePrefix('- ') },
  { label: '1.', title: 'Daftar bernomor', run: linePrefix((n) => `${n + 1}. `) },
  { label: '❝', title: 'Kutipan', run: linePrefix('> ') },
  { label: '🔗', title: 'Tautan', run: (ta) => {
    const { value, selectionStart: s, selectionEnd: e } = ta;
    const sel = value.slice(s, e) || 'teks tautan';
    const ins = `[${sel}](https://)`;
    const urlStart = s + sel.length + 3;
    return [value.slice(0, s) + ins + value.slice(e), urlStart, urlStart + 8];
  } },
];

export function MarkdownEditor({ value, onChange, rows = 16, error }: { value: string; onChange: (v: string) => void; rows?: number; error?: string }) {
  const ref = useRef<HTMLTextAreaElement>(null);
  const [preview, setPreview] = useState(false);
  function apply(a: Act) {
    const ta = ref.current; if (!ta) return;
    const [text, s, e] = a.run(ta);
    onChange(text);
    requestAnimationFrame(() => { ta.focus(); ta.setSelectionRange(s, e); });
  }
  const words = value.trim() ? value.trim().split(/\s+/).length : 0;
  return (
    <div>
      <div className="flex flex-wrap items-center gap-1 rounded-t-lg border border-b-0 border-line bg-canvas p-1.5">
        {ACTIONS.map((a) => (
          <button key={a.title} type="button" title={a.title} aria-label={a.title} disabled={preview} onClick={() => apply(a)}
            className="grid h-10 min-w-10 place-items-center rounded-md px-2 text-sm font-semibold text-ink transition hover:bg-panel disabled:opacity-40">{a.label}</button>
        ))}
        <div className="ml-auto flex rounded-md border border-line bg-panel p-0.5 text-sm" role="tablist">
          {([false, true] as const).map((p) => (
            <button key={String(p)} type="button" role="tab" aria-selected={preview === p} onClick={() => setPreview(p)}
              className={`min-h-9 rounded px-3 ${preview === p ? 'bg-brand-soft text-brand-ink' : 'text-muted'}`}>{p ? 'Pratinjau' : 'Tulis'}</button>
          ))}
        </div>
      </div>
      {preview ? (
        <div className="md min-h-[200px] rounded-b-lg border border-line bg-panel p-4" dangerouslySetInnerHTML={{ __html: renderMarkdown(value) || '<p class="text-muted">Belum ada isi.</p>' }} />
      ) : (
        <textarea ref={ref} className="field !rounded-t-none font-[inherit] leading-relaxed" style={{ minHeight: rows * 24 }} value={value} onChange={(e) => onChange(e.target.value)} spellCheck />
      )}
      <div className="mt-1 flex justify-between text-[13px]"><span className="text-bad">{error}</span><span className="text-muted">{words} kata</span></div>
    </div>
  );
}
