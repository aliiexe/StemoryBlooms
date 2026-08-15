"use client";

import React, { useState, useRef, useEffect } from 'react';
import { ChevronDown, Image as ImageIcon } from 'lucide-react';

interface DropdownOption {
  value: string;
  label: string;
  image?: string | null;
  icon?: React.ReactNode;
}

interface CustomDropdownProps {
  options: DropdownOption[];
  value: string;
  onChange: (val: string) => void;
  placeholder?: string;
  className?: string;
  style?: React.CSSProperties;
  name?: string;
}

export default function CustomDropdown({
  options, value, onChange, placeholder = 'Select...', className, style, name
}: CustomDropdownProps) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  const selectedOption = options.find(o => o.value === value);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  return (
    <div ref={ref} style={{ position: 'relative', width: '100%', ...style }}>
      {name && <input type="hidden" name={name} value={value} />}
      <div 
        onClick={() => setOpen(!open)}
        className={className}
        style={{ 
          display: 'flex', justifyContent: 'space-between', alignItems: 'center', 
          cursor: 'pointer', background: 'white', userSelect: 'none', padding: '0.65rem 1rem',
          border: '1px solid var(--border-subtle, #E5E7EB)', borderRadius: '8px',
          width: '100%',
          ...(!className ? { minHeight: '42px', fontSize: '0.9rem' } : {})
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          {selectedOption?.image ? (
            <img src={selectedOption.image} alt="" style={{ width: '24px', height: '24px', objectFit: 'cover', borderRadius: '4px', border: '1px solid #E5E7EB' }} />
          ) : selectedOption?.icon ? (
            <div style={{ width: '24px', height: '24px', background: '#F3F4F6', borderRadius: '4px', border: '1px solid #E5E7EB', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              {selectedOption.icon}
            </div>
          ) : selectedOption && selectedOption.value !== 'CUSTOM' && selectedOption.value !== 'INSTAGRAM' && selectedOption.value !== 'TIKTOK' && selectedOption.value !== 'PHONE' && selectedOption.value !== 'IN_PERSON' ? (
            <div style={{ width: '24px', height: '24px', background: '#F3F4F6', borderRadius: '4px', border: '1px solid #E5E7EB', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <ImageIcon size={14} color="#9CA3AF" />
            </div>
          ) : null}
          <span style={{ color: selectedOption ? '#111827' : '#9CA3AF' }}>
            {selectedOption ? selectedOption.label : placeholder}
          </span>
        </div>
        <ChevronDown size={16} color="#9CA3AF" style={{ transform: open ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }} />
      </div>

      {open && (
        <div style={{
          position: 'absolute', top: '100%', left: 0, right: 0, background: '#fff',
          border: '1px solid #E5E7EB', borderRadius: '8px', marginTop: '4px',
          maxHeight: '250px', overflowY: 'auto', zIndex: 9999, boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.1)'
        }}>
          {options.length === 0 ? (
             <div style={{ padding: '0.75rem 1rem', color: '#6B7280', fontSize: '0.85rem' }}>No options available</div>
          ) : (
            options.map(opt => (
              <div
                key={opt.value}
                onClick={() => { onChange(opt.value); setOpen(false); }}
                style={{
                  display: 'flex', alignItems: 'center', gap: '0.75rem',
                  padding: '0.65rem 1rem', cursor: 'pointer', borderBottom: '1px solid #F3F4F6',
                  color: opt.value === value ? '#1B5E20' : '#374151',
                  fontWeight: opt.value === value ? 600 : 400,
                  fontSize: '0.9rem'
                }}
                onMouseEnter={e => e.currentTarget.style.backgroundColor = '#F9FAFB'}
                onMouseLeave={e => e.currentTarget.style.backgroundColor = 'transparent'}
              >
                {opt.image ? (
                  <img src={opt.image} alt="" style={{ width: '28px', height: '28px', objectFit: 'cover', borderRadius: '4px', border: '1px solid #E5E7EB' }} />
                ) : opt.icon ? (
                  <div style={{ width: '28px', height: '28px', background: '#F3F4F6', borderRadius: '4px', border: '1px solid #E5E7EB', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    {opt.icon}
                  </div>
                ) : opt.value !== 'CUSTOM' && opt.value !== 'INSTAGRAM' && opt.value !== 'TIKTOK' && opt.value !== 'PHONE' && opt.value !== 'IN_PERSON' ? (
                  <div style={{ width: '28px', height: '28px', background: '#F3F4F6', borderRadius: '4px', border: '1px solid #E5E7EB', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <ImageIcon size={14} color="#9CA3AF" />
                  </div>
                ) : null}
                <span>{opt.label}</span>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}
