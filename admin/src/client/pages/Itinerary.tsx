import { DndContext, KeyboardSensor, PointerSensor, TouchSensor, closestCenter, useSensor, useSensors, type DragEndEvent } from '@dnd-kit/core';
import { SortableContext, arrayMove, sortableKeyboardCoordinates, useSortable, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { LinesField } from '../ui';

export type Day = { title?: string; plan?: string[]; meals?: string; stay?: string; [k: string]: unknown };

export function Itinerary({ days, onEditDay, onMove, onAdd, onRemove, errors }: {
  days: Day[];
  onEditDay: (i: number, patch: Partial<Day>) => void;
  onMove: (from: number, to: number) => void;
  onAdd: () => void;
  onRemove: (i: number) => void;
  errors?: string[];
}) {
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 150, tolerance: 8 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );
  const ids = days.map((_, i) => `hari-${i}`);
  function end(e: DragEndEvent) {
    if (!e.over || e.active.id === e.over.id) return;
    onMove(ids.indexOf(String(e.active.id)), ids.indexOf(String(e.over.id)));
  }
  return (
    <div>
      <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={end}>
        <SortableContext items={ids} strategy={verticalListSortingStrategy}>
          <div className="space-y-3">
            {days.map((d, i) => (
              <DayBlock key={ids[i]} id={ids[i]} n={i + 1} day={d} last={i === days.length - 1} canRemove={days.length > 1}
                onEdit={(p) => onEditDay(i, p)} onUp={() => i > 0 && onMove(i, i - 1)} onDown={() => i < days.length - 1 && onMove(i, i + 1)} onRemove={() => onRemove(i)} />
            ))}
          </div>
        </SortableContext>
      </DndContext>
      {errors?.map((e) => <p key={e} className="mt-2 text-[13px] text-bad">{e}</p>)}
      <button type="button" className="btn-ghost mt-3 w-full border-dashed" onClick={onAdd}>+ Tambah hari</button>
    </div>
  );
}

function DayBlock({ id, n, day, onEdit, onUp, onDown, onRemove, last, canRemove }: { id: string; n: number; day: Day; onEdit: (p: Partial<Day>) => void; onUp: () => void; onDown: () => void; onRemove: () => void; last: boolean; canRemove: boolean }) {
  const { attributes, listeners, setNodeRef, setActivatorNodeRef, transform, transition, isDragging } = useSortable({ id });
  return (
    <div ref={setNodeRef} style={{ transform: CSS.Transform.toString(transform), transition }} className={`card ${isDragging ? 'z-10 shadow-xl ring-2 ring-brand/40' : ''}`}>
      <div className="flex items-center gap-1 border-b border-line px-2 py-1.5">
        <button type="button" ref={setActivatorNodeRef} {...attributes} {...listeners} className="btn !min-h-10 cursor-grab touch-none !px-2.5 text-lg text-muted active:cursor-grabbing" aria-label={`Geser Hari ${n}`}>⠿</button>
        <div className="flex-1 text-sm font-semibold">Hari {n}</div>
        <button type="button" className="btn !min-h-10 !px-2.5 text-muted disabled:opacity-30" onClick={onUp} disabled={n === 1} aria-label="Naikkan">↑</button>
        <button type="button" className="btn !min-h-10 !px-2.5 text-muted disabled:opacity-30" onClick={onDown} disabled={last} aria-label="Turunkan">↓</button>
        <button type="button" className="btn !min-h-10 !px-2.5 text-bad disabled:opacity-30" onClick={() => confirm(`Hapus Hari ${n}? (juga dihapus di bahasa lain yang berpasangan)`) && onRemove()} disabled={!canRemove} aria-label={`Hapus Hari ${n}`}>🗑</button>
      </div>
      <div className="space-y-4 p-4">
        <label className="block"><span className="label">Judul hari</span>
          <input className="field" value={day.title ?? ''} onChange={(e) => onEdit({ title: e.target.value })} /></label>
        <label className="block"><span className="label">Kegiatan <span className="font-normal text-muted">· satu baris per kegiatan</span></span>
          <LinesField value={day.plan ?? []} onChange={(v) => onEdit({ plan: v })} rows={4} /></label>
        <div className="grid gap-4 sm:grid-cols-2">
          <label className="block"><span className="label">Makan</span>
            <input className="field" value={day.meals ?? ''} placeholder="Sarapan dan makan malam" onChange={(e) => onEdit({ meals: e.target.value })} /></label>
          <label className="block"><span className="label">Menginap <span className="font-normal text-muted">· opsional</span></span>
            <input className="field" value={day.stay ?? ''} placeholder="Ubud" onChange={(e) => onEdit({ stay: e.target.value })} /></label>
        </div>
      </div>
    </div>
  );
}
