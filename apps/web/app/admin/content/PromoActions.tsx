'use client';

import React from 'react';
import { togglePromoCode, deletePromoCode } from './actions';

export function PromoActions({ id, isActive }: { id: string, isActive: boolean }) {
  return (
    <div style={{ display: 'flex', gap: '0.5rem' }}>
      <button 
        onClick={() => togglePromoCode(id, !isActive)}
        style={{
          padding: '4px 8px', borderRadius: '4px', border: '1px solid #D6CFE6',
          backgroundColor: '#FDFBF7', cursor: 'pointer', fontSize: '0.8rem'
        }}
      >
        {isActive ? 'Disable' : 'Enable'}
      </button>
      <button 
        onClick={() => {
          if (confirm('Are you sure you want to delete this promo code?')) {
            deletePromoCode(id);
          }
        }}
        style={{
          padding: '4px 8px', borderRadius: '4px', border: 'none',
          backgroundColor: '#FFEBEE', color: '#C62828', cursor: 'pointer', fontSize: '0.8rem'
        }}
      >
        Delete
      </button>
    </div>
  );
}
