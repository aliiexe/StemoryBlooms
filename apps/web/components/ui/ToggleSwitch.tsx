'use client';

import React from 'react';
import { motion } from 'framer-motion';

interface ToggleSwitchProps {
  checked: boolean;
  onChange: (checked: boolean) => void;
  name?: string;
  label?: string;
}

export function ToggleSwitch({ checked, onChange, name, label }: ToggleSwitchProps) {
  return (
    <label style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', cursor: 'pointer', userSelect: 'none' }}>
      {name && <input type="hidden" name={name} value={checked ? 'on' : 'off'} />}
      
      <div
        onClick={() => onChange(!checked)}
        style={{
          width: '44px',
          height: '24px',
          backgroundColor: checked ? 'var(--brand-primary)' : '#EAE6DF',
          borderRadius: '50px',
          position: 'relative',
          transition: 'background-color 0.3s',
          display: 'flex',
          alignItems: 'center',
          padding: '2px'
        }}
      >
        <motion.div
          layout
          initial={false}
          animate={{ x: checked ? 20 : 0 }}
          transition={{ type: 'spring', stiffness: 500, damping: 30 }}
          style={{
            width: '20px',
            height: '20px',
            backgroundColor: '#FFFFFF',
            borderRadius: '50%',
            boxShadow: '0 2px 5px rgba(0,0,0,0.2)'
          }}
        />
      </div>
      
      {label && <span style={{ fontSize: '0.95rem', color: '#3A3531', fontWeight: 500 }}>{label}</span>}
    </label>
  );
}
