'use client';

import { useEffect, useId, useRef, useState, type CSSProperties, type KeyboardEvent, type ReactNode } from 'react';

export interface SelectOption { value: string; label: string; disabled?: boolean; image?: string | null; icon?: ReactNode }
interface CustomSelectProps {
  options: SelectOption[]; value: string; onChange: (value: string) => void; placeholder?: string;
  disabled?: boolean; className?: string; style?: CSSProperties; name?: string; label?: string; searchable?: boolean;
}

export function CustomSelect({ options, value, onChange, placeholder = 'Select an option…', disabled = false,
  className = '', style, name, label, searchable = false }: CustomSelectProps) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [active, setActive] = useState(0);
  const root = useRef<HTMLDivElement>(null);
  const trigger = useRef<HTMLButtonElement>(null);
  const search = useRef<HTMLInputElement>(null);
  const id = useId();
  const selected = options.find(option => option.value === value);
  const filtered = options.filter(option => option.label.toLowerCase().includes(query.toLowerCase()));

  useEffect(() => {
    const outside = (event: PointerEvent) => { if (!root.current?.contains(event.target as Node)) setOpen(false); };
    document.addEventListener('pointerdown', outside);
    return () => document.removeEventListener('pointerdown', outside);
  }, []);
  useEffect(() => { if (open && searchable) search.current?.focus(); }, [open, searchable]);
  useEffect(() => { if (open) document.getElementById(`${id}-option-${active}`)?.scrollIntoView({ block: 'nearest' }); }, [open, active, id]);

  const choose = (option: SelectOption) => {
    if (option.disabled) return;
    onChange(option.value); setOpen(false); setQuery(''); trigger.current?.focus();
  };
  const show = () => { setQuery(''); setActive(Math.max(0, options.findIndex(option => option.value === value))); setOpen(true); };
  const keyDown = (event: KeyboardEvent) => {
    if (event.key === 'Escape') { event.preventDefault(); setOpen(false); trigger.current?.focus(); }
    if (event.key === 'Tab') setOpen(false);
    if (['ArrowDown', 'ArrowUp', 'Home', 'End'].includes(event.key)) {
      event.preventDefault();
      if (!open) { show(); return; }
      const direction = event.key === 'ArrowUp' ? -1 : 1;
      let next = event.key === 'Home' ? 0 : event.key === 'End' ? filtered.length - 1 : active + direction;
      next = Math.max(0, Math.min(filtered.length - 1, next));
      while (filtered[next]?.disabled && next + direction >= 0 && next + direction < filtered.length) next += direction;
      setActive(next);
    }
    if (event.key === 'Enter' || (event.key === ' ' && event.target === trigger.current)) {
      event.preventDefault(); if (!open) show(); else if (filtered[active]) choose(filtered[active]);
    }
  };
  return <div ref={root} className={className} style={{ position: 'relative', width: '100%', ...style }} onKeyDown={keyDown}>
    {name && <input type="hidden" name={name} value={value} />}
    <button ref={trigger} type="button" role="combobox" aria-label={label || name || placeholder} aria-expanded={open}
      aria-controls={`${id}-list`} aria-haspopup="listbox" aria-activedescendant={open && filtered[active] ? `${id}-option-${active}` : undefined}
      disabled={disabled} onClick={() => open ? setOpen(false) : show()}
      style={{ width: '100%', minHeight: 44, padding: '0.75rem 1rem', border: '1px solid #D6CFE6', borderRadius: 10,
        background: disabled ? '#F5F5F5' : '#fff', color: '#3A3531', font: 'inherit', textAlign: 'left', cursor: 'pointer', display: 'flex', justifyContent: 'space-between', gap: 8 }}>
      <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{selected?.label || placeholder}</span><span aria-hidden="true">{open ? '▴' : '▾'}</span>
    </button>
    {open && <div style={{ position: 'absolute', top: 'calc(100% + 4px)', left: 0, right: 0, zIndex: 100, background: '#fff', border: '1px solid #D6CFE6', borderRadius: 10, boxShadow: '0 8px 24px #0002', padding: 4 }}>
      {searchable && <input ref={search} aria-label={`Search ${label || 'options'}`} aria-controls={`${id}-list`}
        aria-activedescendant={filtered[active] ? `${id}-option-${active}` : undefined} role="combobox" aria-expanded="true" aria-autocomplete="list"
        placeholder="Search…" value={query} onChange={event => { setQuery(event.target.value); setActive(0); }}
        style={{ width: '100%', minHeight: 44, padding: '0.5rem', boxSizing: 'border-box', border: '1px solid #D6CFE6', borderRadius: 6 }} />}
      <div id={`${id}-list`} role="listbox" aria-label={label || placeholder} style={{ maxHeight: 240, overflowY: 'auto' }}>
        {filtered.length === 0 && <p role="status" style={{ padding: 8 }}>No matching options</p>}
        {filtered.map((option, index) => <button key={option.value} id={`${id}-option-${index}`} type="button" role="option"
          aria-selected={option.value === value} aria-disabled={option.disabled} tabIndex={-1} disabled={option.disabled}
          onMouseDown={event => event.preventDefault()} onClick={() => choose(option)} onMouseEnter={() => setActive(index)}
          style={{ width: '100%', minHeight: 44, padding: '0.65rem', textAlign: 'left', border: 0, borderRadius: 6,
            background: index === active ? '#EEF2E8' : '#fff', color: '#3A3531', font: 'inherit', cursor: 'pointer', display: 'flex', gap: 8, alignItems: 'center' }}>
          {option.image && <img src={option.image} alt="" width={28} height={28} style={{ objectFit: 'cover', borderRadius: 4 }} />}
          {option.icon}<span>{option.label}</span>
        </button>)}
      </div>
    </div>}
  </div>;
}
