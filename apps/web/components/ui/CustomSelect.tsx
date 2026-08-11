'use client';

import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

export interface SelectOption {
  value: string;
  label: string;
  disabled?: boolean;
}

interface CustomSelectProps {
  options: SelectOption[];
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  disabled?: boolean;
  className?: string;
  style?: React.CSSProperties;
  name?: string;
}

export function CustomSelect({
  options,
  value,
  onChange,
  placeholder = 'Select an option...',
  disabled = false,
  className = '',
  style,
  name,
}: CustomSelectProps) {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const selectedOption = options.find((opt) => opt.value === value);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  return (
    <div
      ref={containerRef}
      className={`custom-select-container ${className}`}
      style={{
        position: 'relative',
        width: '100%',
        fontFamily: 'inherit',
        ...style,
      }}
    >
      {name && <input type="hidden" name={name} value={value} />}
      <button
        type="button"
        disabled={disabled}
        onClick={() => setIsOpen((prev) => !prev)}
        style={{
          width: '100%',
          padding: '0.85rem 1rem',
          borderRadius: '12px',
          border: '1px solid #D6CFE6',
          backgroundColor: disabled ? '#F5F5F5' : '#FFFFFF',
          color: selectedOption ? '#3A3531' : '#9A9591',
          fontSize: '1rem',
          textAlign: 'left',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          cursor: disabled ? 'not-allowed' : 'pointer',
          transition: 'all 0.2s',
          boxShadow: isOpen ? '0 0 0 3px rgba(95, 113, 97, 0.1)' : 'none',
          borderColor: isOpen ? '#5F7161' : '#D6CFE6',
        }}
      >
        <span style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
          {selectedOption ? selectedOption.label : placeholder}
        </span>
        <svg
          width="12"
          height="12"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          style={{
            transform: isOpen ? 'rotate(180deg)' : 'rotate(0deg)',
            transition: 'transform 0.2s ease',
            flexShrink: 0,
            marginLeft: '0.5rem',
          }}
        >
          <polyline points="6 9 12 15 18 9"></polyline>
        </svg>
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.15 }}
            style={{
              position: 'absolute',
              top: 'calc(100% + 8px)',
              left: 0,
              right: 0,
              backgroundColor: '#FFFFFF',
              border: '1px solid #EAE6DF',
              borderRadius: '12px',
              boxShadow: '0 8px 24px rgba(0, 0, 0, 0.08)',
              maxHeight: '250px',
              overflowY: 'auto',
              zIndex: 50,
              padding: '0.5rem',
            }}
          >
            {options.length === 0 ? (
              <div style={{ padding: '0.75rem 1rem', color: '#9A9591', textAlign: 'center', fontSize: '0.95rem' }}>
                No options available
              </div>
            ) : (
              options.map((opt) => (
                <div
                  key={opt.value}
                  onClick={() => {
                    if (!opt.disabled) {
                      onChange(opt.value);
                      setIsOpen(false);
                    }
                  }}
                  style={{
                    padding: '0.75rem 1rem',
                    borderRadius: '8px',
                    cursor: opt.disabled ? 'not-allowed' : 'pointer',
                    backgroundColor: value === opt.value ? 'rgba(95, 113, 97, 0.08)' : 'transparent',
                    color: opt.disabled ? '#C8C4BB' : value === opt.value ? '#5F7161' : '#3A3531',
                    fontWeight: value === opt.value ? 600 : 400,
                    fontSize: '0.95rem',
                    transition: 'background-color 0.15s',
                  }}
                  onMouseEnter={(e) => {
                    if (!opt.disabled && value !== opt.value) {
                      e.currentTarget.style.backgroundColor = '#FDFBF7';
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (!opt.disabled && value !== opt.value) {
                      e.currentTarget.style.backgroundColor = 'transparent';
                    }
                  }}
                >
                  {opt.label}
                </div>
              ))
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
