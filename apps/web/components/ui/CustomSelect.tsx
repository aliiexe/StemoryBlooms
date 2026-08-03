'use client';

import React, { useState, useRef, useEffect } from 'react';
import { ChevronDown } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface Option {
  label: string;
  value: string;
}

interface CustomSelectProps {
  options: Option[];
  value: string;
  onChange: (val: string) => void;
  placeholder?: string;
  name?: string;
}

export function CustomSelect({ options, value, onChange, placeholder = 'Select an option', name }: CustomSelectProps) {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const selectedOption = options.find(o => o.value === value);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div ref={containerRef} style={{ position: 'relative', width: '100%' }}>
      {name && <input type="hidden" name={name} value={value} />}
      
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        style={{
          width: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '0.75rem 1rem',
          backgroundColor: '#FFFFFF',
          border: '1px solid #D6CFE6',
          borderRadius: '12px',
          cursor: 'pointer',
          textAlign: 'left',
          fontSize: '0.95rem',
          color: selectedOption ? '#3A3531' : '#9A9591',
          transition: 'all 0.2s ease',
          boxShadow: isOpen ? '0 0 0 3px rgba(95, 113, 97, 0.1)' : 'none',
          borderColor: isOpen ? 'var(--brand-primary)' : '#D6CFE6'
        }}
      >
        <span>{selectedOption ? selectedOption.label : placeholder}</span>
        <motion.div animate={{ rotate: isOpen ? 180 : 0 }} transition={{ duration: 0.2 }}>
          <ChevronDown size={18} color="#7A7571" />
        </motion.div>
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
              top: '100%',
              left: 0,
              right: 0,
              marginTop: '0.5rem',
              backgroundColor: '#FFFFFF',
              border: '1px solid #EAE6DF',
              borderRadius: '12px',
              boxShadow: '0 10px 30px rgba(0,0,0,0.05)',
              zIndex: 50,
              maxHeight: '250px',
              overflowY: 'auto'
            }}
          >
            {options.map((option) => (
              <button
                key={option.value}
                type="button"
                onClick={() => {
                  onChange(option.value);
                  setIsOpen(false);
                }}
                style={{
                  width: '100%',
                  textAlign: 'left',
                  padding: '0.75rem 1rem',
                  backgroundColor: value === option.value ? '#FDFBF7' : 'transparent',
                  border: 'none',
                  borderBottom: '1px solid #F5F5F5',
                  cursor: 'pointer',
                  color: value === option.value ? 'var(--brand-primary)' : '#5A5551',
                  fontWeight: value === option.value ? 500 : 400,
                  transition: 'background-color 0.2s'
                }}
                onMouseOver={(e) => (e.currentTarget.style.backgroundColor = '#FDFBF7')}
                onMouseOut={(e) => (e.currentTarget.style.backgroundColor = value === option.value ? '#FDFBF7' : 'transparent')}
              >
                {option.label}
              </button>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
