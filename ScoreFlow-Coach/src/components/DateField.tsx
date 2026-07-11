import { useEffect, useMemo, useRef, useState } from 'react';

type DateFieldProps = { name: string; value?: string; defaultValue?: string; onChange?: (value: string) => void; required?: boolean; ariaLabel?: string };
const weekdays = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];
function parseDate(value?: string) { if (!value) return null; const [year, month, day] = value.split('-').map(Number); return year && month && day ? new Date(year, month - 1, day) : null; }
function toValue(date: Date) { return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`; }
function sameDay(a: Date, b: Date) { return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate(); }

export default function DateField({ name, value, defaultValue, onChange, required, ariaLabel }: DateFieldProps) {
  const rootRef = useRef<HTMLDivElement>(null);
  const initial = parseDate(value ?? defaultValue) ?? new Date();
  const [open, setOpen] = useState(false);
  const [internalValue, setInternalValue] = useState(defaultValue ?? '');
  const selectedValue = value ?? internalValue;
  const selectedDate = parseDate(selectedValue);
  const [visibleMonth, setVisibleMonth] = useState(new Date(initial.getFullYear(), initial.getMonth(), 1));

  useEffect(() => { if (!open) return; const close = (event: PointerEvent) => { if (!rootRef.current?.contains(event.target as Node)) setOpen(false); }; document.addEventListener('pointerdown', close); return () => document.removeEventListener('pointerdown', close); }, [open]);
  const days = useMemo(() => { const first = new Date(visibleMonth.getFullYear(), visibleMonth.getMonth(), 1); const start = new Date(first); start.setDate(1 - first.getDay()); return Array.from({ length: 42 }, (_, index) => { const date = new Date(start); date.setDate(start.getDate() + index); return date; }); }, [visibleMonth]);

  function commit(date: Date) { const next = toValue(date); if (value === undefined) setInternalValue(next); onChange?.(next); setOpen(false); }
  function moveMonth(offset: number) { setVisibleMonth((current) => new Date(current.getFullYear(), current.getMonth() + offset, 1)); }
  const display = selectedDate ? new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric', year: 'numeric' }).format(selectedDate) : 'Select date';

  return <div className={`sf-date ${open ? 'is-open' : ''}`} ref={rootRef}>
    <input className="sf-form-value" name={name} required={required} readOnly tabIndex={-1} value={selectedValue} />
    <button aria-expanded={open} aria-haspopup="dialog" aria-label={ariaLabel} className="sf-date-trigger" onClick={() => setOpen((current) => !current)} type="button"><span>{display}</span><svg aria-hidden="true" viewBox="0 0 20 20"><path d="M5 2v3M15 2v3M3 7h14M4 4h12a1 1 0 0 1 1 1v12H3V5a1 1 0 0 1 1-1Z" /></svg></button>
    {open ? <div className="sf-popover sf-calendar" role="dialog" aria-label="Choose date">
      <div className="sf-calendar-header"><button aria-label="Previous month" onClick={() => moveMonth(-1)} type="button">‹</button><strong>{new Intl.DateTimeFormat('en-US', { month: 'long', year: 'numeric' }).format(visibleMonth)}</strong><button aria-label="Next month" onClick={() => moveMonth(1)} type="button">›</button></div>
      <div className="sf-calendar-weekdays">{weekdays.map((day) => <span key={day}>{day}</span>)}</div>
      <div className="sf-calendar-grid">{days.map((date) => { const outside = date.getMonth() !== visibleMonth.getMonth(); const selected = selectedDate ? sameDay(date, selectedDate) : false; const today = sameDay(date, new Date()); return <button className={`${outside ? 'is-outside' : ''}${selected ? ' is-selected' : ''}${today ? ' is-today' : ''}`} key={toValue(date)} onClick={() => commit(date)} type="button">{date.getDate()}</button>; })}</div>
      <div className="sf-calendar-footer"><button onClick={() => commit(new Date())} type="button">Today</button>{selectedValue ? <button onClick={() => { if (value === undefined) setInternalValue(''); onChange?.(''); setOpen(false); }} type="button">Clear</button> : null}</div>
    </div> : null}
  </div>;
}
